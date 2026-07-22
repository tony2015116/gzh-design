import { describe, expect, it } from 'vitest';
import { generateSessionToken, hashPassword } from '../src/lib/auth';
import { getBearerToken } from '../src/lib/http';

describe('hashPassword', () => {
  it('对同一密码产生稳定哈希（round-trip：登录时重新哈希可与注册时存储值匹配）', async () => {
    const stored = await hashPassword('password123');
    const loginAttempt = await hashPassword('password123');
    expect(loginAttempt).toBe(stored);
  });

  it('匹配已知向量（sha256(password + 固定盐)）', async () => {
    expect(await hashPassword('password123')).toBe(
      '4a1a86f7f13d2f4448dc412ec574ea29480577a69f0acbe0d509d6cd77f1318c',
    );
  });

  it('错误密码得到不同哈希（校验拒绝）', async () => {
    const stored = await hashPassword('password123');
    expect(await hashPassword('password124')).not.toBe(stored);
    expect(await hashPassword('')).not.toBe(stored);
    expect(await hashPassword('PASSWORD123')).not.toBe(stored);
  });

  it('输出为 64 位小写十六进制字符串', async () => {
    const hash = await hashPassword('任意密码😀');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('generateSessionToken', () => {
  it('每次生成唯一 token', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateSessionToken()));
    expect(tokens.size).toBe(200);
  });

  it('输出为标准 UUID 格式', () => {
    expect(generateSessionToken()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe('getBearerToken', () => {
  it('解析 Bearer 头', () => {
    const request = new Request('https://example.com', {
      headers: { Authorization: 'Bearer abc.def.ghi' },
    });
    expect(getBearerToken(request)).toBe('abc.def.ghi');
  });

  it('非 Bearer 头或缺失时返回空字符串', () => {
    expect(getBearerToken(new Request('https://example.com'))).toBe('');
    expect(
      getBearerToken(new Request('https://example.com', { headers: { Authorization: 'Basic xyz' } })),
    ).toBe('');
  });
});
