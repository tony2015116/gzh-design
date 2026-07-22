type OssAiDebugLevel = 'off' | 'basic' | 'verbose';

const LOG_ENDPOINT = '/__debug/ai-log';

function getLogLevel(): OssAiDebugLevel {
  const raw = (import.meta.env.VITE_OSS_AI_LOG_LEVEL || 'verbose').toLowerCase();
  if (raw === 'off' || raw === 'basic' || raw === 'verbose') return raw;
  return 'verbose';
}

function getPreviewChars(): number {
  const raw = Number.parseInt(import.meta.env.VITE_OSS_AI_LOG_PREVIEW_CHARS || '200', 10);
  if (Number.isNaN(raw) || raw <= 0) return 200;
  return raw;
}

function truncateForLog(value: string, limit = getPreviewChars()): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}

function shouldLog(mode: 'basic' | 'verbose'): boolean {
  if (!import.meta.env.DEV) return false;
  if (import.meta.env.VITE_APP_MODE !== 'oss') return false;

  const level = getLogLevel();
  if (level === 'off') return false;
  if (mode === 'verbose' && level !== 'verbose') return false;
  return true;
}

export function createOssAiTraceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 12);
  }

  return Math.random().toString(36).slice(2, 14);
}

export function getOssAiLogPreview(value: string): string {
  return truncateForLog(value, getPreviewChars());
}

export async function logOssAiEvent(
  traceId: string,
  stage: string,
  payload: Record<string, unknown>,
  mode: 'basic' | 'verbose' = 'basic',
): Promise<void> {
  if (!shouldLog(mode)) return;

  const record = {
    traceId,
    stage,
    at: new Date().toISOString(),
    ...payload,
  };

  const body = JSON.stringify(record);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(LOG_ENDPOINT, blob)) return;
    }

    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // Debug logging should never break the formatting flow.
  }
}
