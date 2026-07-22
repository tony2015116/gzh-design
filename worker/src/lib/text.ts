export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\[[^\]]*]\(([^)]+)\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeHeadingLabel(raw: string): string {
  const normalized = raw.split('|').map((part) => stripMarkdown(part)).filter(Boolean);
  return normalized[1] || normalized[0] || '段落';
}

export function shortenText(value: string, limit: number): string {
  const normalized = stripMarkdown(value).replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}

export function splitIntoSentences(value: string): string[] {
  return stripMarkdown(value)
    .split(/[。！？!?；;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
