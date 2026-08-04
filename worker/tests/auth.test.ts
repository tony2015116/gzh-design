import { describe, expect, it } from 'vitest';
import { generateSessionToken, hashPassword, verifyPassword } from '../src/lib/auth';
import { getBearerToken } from '../src/lib/http';

const LEGACY_KNOWN_HASH = '4a1a86f7f13d2f4448dc412ec574ea29480577a69f0acbe0d509d6cd77f1318c'; // password123 + 旧盐

describe('hashPassword（PBKDF2 新格式）', () => {
  it('输出 pbkdf2:<iterations>:<saltHex>:<hashHex> 格式', async () => {
    const hash = await hashPassword('password123');
    const [scheme, iterations, saltHex, hashHex] = hash.split(':');
    expect(scheme).toBe('pbkdf2');
    expect(iterations).toBe('100000');
    expect(saltHex).toMatch(/^[0-9a-f]{32}$/);
    expect(hashHex).toMatch(/^[0-9a-f]{64}$/);
  });

  it('同一密码两次哈希结果不同（随机盐）', async () => {
    const first = await hashPassword('password123');
    const second = await hashPassword('password123');
    expect(first).not.toBe(second);
  });

  it('round-trip：hashPassword 后 verifyPassword 通过且不需要重哈希', async () => {
    const stored = await hashPassword('password123');
    const result = await verifyPassword('password123', stored);
    expect(result).toEqual({ ok: true, needsRehash: false });
  });

  it('错误密码被拒绝', async () => {
    const stored = await hashPassword('password123');
    expect(await verifyPassword('password124', stored)).toEqual({ ok: false, needsRehash: false });
    expect(await verifyPassword('', stored)).toEqual({ ok: false, needsRehash: false });
  });
});

describe('verifyPassword（旧 SHA-256 格式兼容）', () => {
  it('旧格式已知向量验证通过且标记 needsRehash', async () => {
    const result = await verifyPassword('password123', LEGACY_KNOWN_HASH);
    expect(result).toEqual({ ok: true, needsRehash: true });
  });

  it('旧格式错误密码被拒绝且不触发重哈希', async () => {
    const result = await verifyPassword('wrong-password', LEGACY_KNOWN_HASH);
    expect(result).toEqual({ ok: false, needsRehash: false });
  });

  it('无法识别的哈希格式直接拒绝', async () => {
    expect(await verifyPassword('password123', 'not-a-hash')).toEqual({ ok: false, needsRehash: false });
    expect(await verifyPassword('password123', 'pbkdf2:abc::')).toEqual({ ok: false, needsRehash: false });
    expect(await verifyPassword('password123', '')).toEqual({ ok: false, needsRehash: false });
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
