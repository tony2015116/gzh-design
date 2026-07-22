import type { Env, FormatLogLevel } from '../types';

export function getFormatLogLevel(env: Env): FormatLogLevel {
  const raw = (env.AI_FORMAT_LOG_LEVEL || 'basic').toLowerCase();
  return raw === 'off' || raw === 'basic' || raw === 'verbose' ? raw : 'basic';
}

export function getFormatPreviewChars(env: Env): number {
  const raw = Number.parseInt(env.AI_FORMAT_LOG_PREVIEW_CHARS || '180', 10);
  return Number.isNaN(raw) || raw <= 0 ? 180 : raw;
}

export function truncateForLog(value: string, limit: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}

export function logFormatEvent(
  env: Env,
  traceId: string,
  stage: string,
  payload: Record<string, unknown>,
  mode: 'basic' | 'verbose' = 'basic',
): void {
  const level = getFormatLogLevel(env);
  if (level === 'off') return;
  if (mode === 'verbose' && level !== 'verbose') return;

  const record = {
    traceId,
    stage,
    at: new Date().toISOString(),
    ...payload,
  };

  console.log(`[ai-format][${traceId}] ${stage} ${JSON.stringify(record)}`);
}

export function logIllustrationEvent(
  env: Env,
  traceId: string,
  stage: string,
  payload: Record<string, unknown>,
  mode: 'basic' | 'verbose' = 'basic',
): void {
  const level = getFormatLogLevel(env);
  if (level === 'off') return;
  if (mode === 'verbose' && level !== 'verbose') return;

  const record = {
    traceId,
    stage,
    at: new Date().toISOString(),
    ...payload,
  };

  console.log(`[illustration][${traceId}] ${stage} ${JSON.stringify(record)}`);
}
