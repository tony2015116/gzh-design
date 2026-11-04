import { describe, expect, it } from 'vitest';
import {
  checkInputLength,
  consumeDailyQuota,
  getDailyQuota,
  refundDailyQuota,
  resolveQuotaSubject,
  resolveUpstreamConfig,
} from '../src/lib/aiGuard';
import type { Env } from '../src/types';

// 用内存 Map 模拟 D1 的 ai_usage 表（只覆盖 aiGuard 用到的两条语句）
function createFakeUsageEnv(overrides: Partial<Env> = {}, store = new Map<string, number>()) {
  const env = {
    DB: {
      prepare(sql: string) {
        return {
          bind(...args: unknown[]) {
            const key = `${args[0]}|${args[1]}`;
            return {
              first: async () => {
                const next = (store.get(key) ?? 0) + 1;
                store.set(key, next);
                return { count: next };
              },
              run: async () => {
                if (sql.startsWith('UPDATE')) {
                  const current = store.get(key) ?? 0;
                  if (current > 0) store.set(key, current - 1);
                }
              },
            };
          },
        };
      },
    },
    ...overrides,
  } as unknown as Env;
  return { env, store };
}

describe('resolveUpstreamConfig', () => {
  it('只使用服务端配置，补全 chat/completions 路径', () => {
    const env = { OPENAI_API_BASE: 'https://relay.example.com/v1/', OPENAI_MODEL: 'gpt-x' } as Env;
    expect(resolveUpstreamConfig(env)).toEqual({
      endpoint: 'https://relay.example.com/v1/chat/completions',
      model: 'gpt-x',
    });
  });

  it('未配置时回落到 OpenAI 默认值', () => {
    expect(resolveUpstreamConfig({} as Env)).toEqual({
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o',
    });
  });
});

describe('checkInputLength', () => {
  it('默认上限 30000 字符', () => {
    expect(checkInputLength({} as Env, 'a'.repeat(30000))).toBeNull();
    expect(checkInputLength({} as Env, 'a'.repeat(30001))).toContain('单次最多处理 30000 字符');
  });

  it('可通过 AI_MAX_INPUT_CHARS 调整', () => {
    expect(checkInputLength({ AI_MAX_INPUT_CHARS: '10' } as Env, 'a'.repeat(11))).not.toBeNull();
  });
});

describe('getDailyQuota / resolveQuotaSubject', () => {
  it('admin 不限，其余角色有默认额度且可覆盖', () => {
    expect(getDailyQuota({} as Env, 'admin')).toBeNull();
    expect(getDailyQuota({} as Env, 'free')).toBe(20);
    expect(getDailyQuota({} as Env, 'vip')).toBe(200);
    expect(getDailyQuota({} as Env, 'anonymous')).toBe(5);
    expect(getDailyQuota({ AI_DAILY_QUOTA_FREE: '3' } as Env, 'free')).toBe(3);
  });

  it('登录用户按 ID 计额，Secret 调用方不计额，匿名按 IP 计额', () => {
    const request = new Request('https://w.example.com', { headers: { 'CF-Connecting-IP': '1.2.3.4' } });
    expect(resolveQuotaSubject(request, { id: 'u1', email: 'a@b.c', role: 'free' }, false))
      .toEqual({ key: 'user:u1', role: 'free' });
    expect(resolveQuotaSubject(request, null, true)).toBeNull();
    expect(resolveQuotaSubject(request, null, false)).toEqual({ key: 'ip:1.2.3.4', role: 'anonymous' });
  });
});

describe('consumeDailyQuota', () => {
  it('额度内放行，超额拒绝且不多记次数', async () => {
    const { env, store } = createFakeUsageEnv({ AI_DAILY_QUOTA_FREE: '2' });
    const subject = { key: 'user:u1', role: 'free' };

    expect((await consumeDailyQuota(env, subject)).ok).toBe(true);
    expect((await consumeDailyQuota(env, subject)).ok).toBe(true);
    const third = await consumeDailyQuota(env, subject);
    expect(third).toEqual({ ok: false, used: 2, limit: 2 });
    expect([...store.values()][0]).toBe(2);
  });

  it('上游失败时退回计数', async () => {
    const { env, store } = createFakeUsageEnv();
    const subject = { key: 'user:u1', role: 'free' };
    await consumeDailyQuota(env, subject);
    await refundDailyQuota(env, subject);
    expect([...store.values()][0]).toBe(0);
  });

  it('admin 与 Secret 调用方不访问数据库', async () => {
    const env = { DB: { prepare: () => { throw new Error('should not touch DB'); } } } as unknown as Env;
    expect((await consumeDailyQuota(env, { key: 'user:a', role: 'admin' })).ok).toBe(true);
    expect((await consumeDailyQuota(env, null)).ok).toBe(true);
  });
});
