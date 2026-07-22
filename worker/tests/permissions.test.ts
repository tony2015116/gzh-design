import { describe, expect, it } from 'vitest';
import { requireAdminUser } from '../src/lib/auth';
import { isRoleAllowed } from '../src/lib/permissions';
import type { AuthenticatedUser } from '../src/types';

const guest = null;
const free: AuthenticatedUser = { id: 'u-free', email: 'free@example.com', role: 'free' };
const vip: AuthenticatedUser = { id: 'u-vip', email: 'vip@example.com', role: 'vip' };
const admin: AuthenticatedUser = { id: 'u-admin', email: 'admin@example.com', role: 'admin' };

// 与 src/routes 中实际使用的角色清单保持一致：
// - 配图建议 /api/illustration/plan、配图生成 /api/illustration/jobs: isRoleAllowed(user, ['vip', 'admin'])
// - admin 诊断 /api/admin/diagnostics: requireAdminUser（等价于角色必须是 admin）
// - AI 排版（authMode=user）、云端预设 /api/user/presets: 只要求登录，不限制具体角色
const ILLUSTRATION_ROLES = ['vip', 'admin'];
const ANY_AUTHENTICATED_ROLES = ['free', 'vip', 'admin'];
const ADMIN_ONLY_ROLES = ['admin'];

describe('角色权限矩阵', () => {
  const cases: Array<[string, AuthenticatedUser | null]> = [
    ['guest', guest],
    ['free', free],
    ['vip', vip],
    ['admin', admin],
  ];

  it.each(cases)('配图建议/生成（vip+admin）- %s', (_label, user) => {
    expect(isRoleAllowed(user, ILLUSTRATION_ROLES)).toBe(user === vip || user === admin);
  });

  it.each(cases)('AI 排版（登录即可）与云端预设 - %s', (_label, user) => {
    expect(isRoleAllowed(user, ANY_AUTHENTICATED_ROLES)).toBe(user !== null);
  });

  it.each(cases)('admin 诊断（仅 admin）- %s', (_label, user) => {
    expect(isRoleAllowed(user, ADMIN_ONLY_ROLES)).toBe(user === admin);
  });

  it('未登录（null）在任何角色清单下都被拒绝', () => {
    expect(isRoleAllowed(null, ILLUSTRATION_ROLES)).toBe(false);
    expect(isRoleAllowed(null, ANY_AUTHENTICATED_ROLES)).toBe(false);
    expect(isRoleAllowed(null, ADMIN_ONLY_ROLES)).toBe(false);
    expect(isRoleAllowed(null, [])).toBe(false);
  });

  it('未知角色不被任何清单接受', () => {
    const weird: AuthenticatedUser = { id: 'u-x', email: 'x@example.com', role: 'superadmin' };
    expect(isRoleAllowed(weird, ILLUSTRATION_ROLES)).toBe(false);
    expect(isRoleAllowed(weird, ADMIN_ONLY_ROLES)).toBe(false);
  });
});

// 用假 D1 驱动真实的 requireAdminUser，覆盖 admin 诊断入口的实际判断逻辑
function fakeEnvReturning(user: AuthenticatedUser | null) {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => user,
        }),
      }),
    },
  } as any;
}

function authedRequest(token = 'tok') {
  return new Request('https://example.com/api/admin/diagnostics', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe('requireAdminUser（admin 诊断入口）', () => {
  it('admin 用户放行并返回用户对象', async () => {
    const result = await requireAdminUser(authedRequest(), fakeEnvReturning(admin), {});
    expect(result).toEqual(admin);
  });

  it('vip/free 用户返回 403', async () => {
    for (const user of [vip, free]) {
      const result = await requireAdminUser(authedRequest(), fakeEnvReturning(user), {});
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    }
  });

  it('未登录返回 401', async () => {
    const result = await requireAdminUser(authedRequest(), fakeEnvReturning(null), {});
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('缺少 Authorization 头返回 401', async () => {
    const result = await requireAdminUser(
      new Request('https://example.com/api/admin/diagnostics'),
      fakeEnvReturning(admin),
      {},
    );
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });
});
