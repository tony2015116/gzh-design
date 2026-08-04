import { describe, expect, it } from 'vitest';
import {
  clearLoginAttempts,
  isLoginRateLimited,
  normalizeEmail,
  recordLoginFailure,
  validatePasswordStrength,
} from '../src/lib/auth';

describe('validatePasswordStrength', () => {
  it('合格密码返回 null', () => {
    expect(validatePasswordStrength('abcd1234')).toBeNull();
    expect(validatePasswordStrength('a1b2c3d4e5')).toBeNull();
  });

  it('少于 8 位被拒绝', () => {
    expect(validatePasswordStrength('abc123')).toBe('密码长度至少 8 位');
    expect(validatePasswordStrength('a1')).toBe('密码长度至少 8 位');
    expect(validatePasswordStrength('')).toBe('密码长度至少 8 位');
  });

  it('纯字母或纯数字被拒绝', () => {
    expect(validatePasswordStrength('abcdefgh')).toBe('密码需同时包含字母和数字');
    expect(validatePasswordStrength('12345678')).toBe('密码需同时包含字母和数字');
  });
});

describe('normalizeEmail', () => {
  it('trim 并转小写', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
    expect(normalizeEmail('admin@test.com')).toBe('admin@test.com');
  });
});

// 用内存 Map 模拟 D1 的 login_attempts 表
function createFakeAttemptsEnv(store = new Map<string, { failures: number; window_start: string | null }>()) {
  const env = {
    DB: {
      prepare(sql: string) {
        return {
          bind(...args: unknown[]) {
            const email = String(args[0]);
            return {
              first: async () => {
                const row = store.get(email);
                return row ? { email, ...row } : null;
              },
              run: async () => {
                if (sql.startsWith('INSERT OR REPLACE')) {
                  store.set(email, { failures: 1, window_start: String(args[1]) });
                } else if (sql.startsWith('UPDATE')) {
                  const row = store.get(email);
                  if (row) store.set(email, { ...row, failures: row.failures + 1 });
                } else if (sql.startsWith('DELETE')) {
                  store.delete(email);
                }
              },
            };
          },
        };
      },
    },
  } as any;
  return { env, store };
}

describe('登录限流（10 分钟窗口内失败 >= 5 次触发）', () => {
  it('无记录时不限流', async () => {
    const { env } = createFakeAttemptsEnv();
    expect(await isLoginRateLimited(env, 'a@b.com')).toBe(false);
  });

  it('5 次失败内放行，第 5 次失败后触发限流', async () => {
    const { env } = createFakeAttemptsEnv();
    for (let i = 0; i < 4; i += 1) {
      await recordLoginFailure(env, 'a@b.com');
      expect(await isLoginRateLimited(env, 'a@b.com')).toBe(false);
    }
    await recordLoginFailure(env, 'a@b.com');
    expect(await isLoginRateLimited(env, 'a@b.com')).toBe(true);
  });

  it('窗口过期后重置：旧窗口的失败不再计数，新失败从 1 开始', async () => {
    const store = new Map([
      ['a@b.com', { failures: 5, window_start: new Date(Date.now() - 11 * 60 * 1000).toISOString() }],
    ]);
    const { env } = createFakeAttemptsEnv(store);
    expect(await isLoginRateLimited(env, 'a@b.com')).toBe(false);

    await recordLoginFailure(env, 'a@b.com');
    expect(store.get('a@b.com')?.failures).toBe(1);
    expect(await isLoginRateLimited(env, 'a@b.com')).toBe(false);
  });

  it('window_start 缺失/非法时按不限流处理', async () => {
    const { env } = createFakeAttemptsEnv(new Map([['a@b.com', { failures: 9, window_start: null }]]));
    expect(await isLoginRateLimited(env, 'a@b.com')).toBe(false);
  });

  it('clearLoginAttempts 删除记录（登录成功清除）', async () => {
    const { env, store } = createFakeAttemptsEnv();
    for (let i = 0; i < 5; i += 1) await recordLoginFailure(env, 'a@b.com');
    expect(await isLoginRateLimited(env, 'a@b.com')).toBe(true);

    await clearLoginAttempts(env, 'a@b.com');
    expect(store.has('a@b.com')).toBe(false);
    expect(await isLoginRateLimited(env, 'a@b.com')).toBe(false);
  });

  it('限流按邮箱隔离', async () => {
    const { env } = createFakeAttemptsEnv();
    for (let i = 0; i < 5; i += 1) await recordLoginFailure(env, 'a@b.com');
    expect(await isLoginRateLimited(env, 'other@b.com')).toBe(false);
  });
});
