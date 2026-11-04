import type { AuthenticatedUser, Env } from '../types';

// AI 路由（排版 / 封面文案 / 图文拆条）共用的上游配置、输入长度与每日额度控制。

const DEFAULT_MAX_INPUT_CHARS = 30000;
const DEFAULT_DAILY_QUOTA: Record<string, number> = {
  anonymous: 5,
  free: 20,
  vip: 200,
};

/**
 * 上游地址与模型只读服务端配置。
 * 绝不能接受客户端传入的 baseUrl：Worker 会带着 OPENAI_API_KEY 请求该地址，等于把 Key 交给对方。
 */
export function resolveUpstreamConfig(env: Env): { endpoint: string; model: string } {
  const baseUrl = env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const endpoint = baseUrl.endsWith('chat/completions')
    ? baseUrl
    : baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
  return { endpoint, model: env.OPENAI_MODEL || 'gpt-4o' };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getMaxInputChars(env: Env): number {
  return parsePositiveInt(env.AI_MAX_INPUT_CHARS, DEFAULT_MAX_INPUT_CHARS);
}

/** 输入超长时返回错误文案，否则返回 null */
export function checkInputLength(env: Env, markdown: string): string | null {
  const max = getMaxInputChars(env);
  return markdown.length > max
    ? `文章过长（${markdown.length} 字符），单次最多处理 ${max} 字符，请分段处理`
    : null;
}

/** 返回该角色的每日额度；null 表示不限 */
export function getDailyQuota(env: Env, role: string): number | null {
  if (role === 'admin') return null;
  if (role === 'vip') return parsePositiveInt(env.AI_DAILY_QUOTA_VIP, DEFAULT_DAILY_QUOTA.vip);
  if (role === 'free') return parsePositiveInt(env.AI_DAILY_QUOTA_FREE, DEFAULT_DAILY_QUOTA.free);
  return parsePositiveInt(env.AI_DAILY_QUOTA_ANONYMOUS, DEFAULT_DAILY_QUOTA.anonymous);
}

export type AiQuotaSubject = { key: string; role: string };

/**
 * 计额主体：登录用户按用户 ID；持有 Upload Secret 的调用方视为自部署管理员，不计额；
 * 其余（鉴权关闭时的匿名请求）按 IP 计。
 */
export function resolveQuotaSubject(
  request: Request,
  user: AuthenticatedUser | null,
  usedSecret: boolean,
): AiQuotaSubject | null {
  if (user) return { key: `user:${user.id}`, role: user.role };
  if (usedSecret) return null;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  return { key: `ip:${ip}`, role: 'anonymous' };
}

function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export type QuotaResult =
  | { ok: true; used: number; limit: number | null }
  | { ok: false; used: number; limit: number };

/** 原子地把今日计数 +1；超额时回滚这次计数并返回 ok: false */
export async function consumeDailyQuota(env: Env, subject: AiQuotaSubject | null): Promise<QuotaResult> {
  if (!subject) return { ok: true, used: 0, limit: null };
  const limit = getDailyQuota(env, subject.role);
  if (limit === null) return { ok: true, used: 0, limit: null };

  const day = todayKey();
  const row = await env.DB.prepare(`
    INSERT INTO ai_usage (subject_key, day, count) VALUES (?, ?, 1)
    ON CONFLICT(subject_key, day) DO UPDATE SET count = count + 1
    RETURNING count
  `).bind(subject.key, day).first<{ count: number }>();

  const used = row?.count ?? 1;
  if (used > limit) {
    await refundDailyQuota(env, subject);
    return { ok: false, used: limit, limit };
  }
  return { ok: true, used, limit };
}

/** 上游调用失败时退回本次计数，避免用户为服务端故障买单 */
export async function refundDailyQuota(env: Env, subject: AiQuotaSubject | null): Promise<void> {
  if (!subject || getDailyQuota(env, subject.role) === null) return;
  await env.DB.prepare('UPDATE ai_usage SET count = count - 1 WHERE subject_key = ? AND day = ? AND count > 0')
    .bind(subject.key, todayKey())
    .run()
    .catch(() => undefined);
}
