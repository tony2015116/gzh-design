import type { IllustrationAssetResult, IllustrationJobStatus } from '../types';
import { sanitizeFileSegment } from '../lib/storage';

export function inferJobSource(items: IllustrationAssetResult[]): 'placeholder' | 'generated' | 'hybrid' {
  const generatedCount = items.filter((item) => item.source === 'generated').length;
  if (generatedCount === 0) return 'placeholder';
  if (generatedCount === items.length) return 'generated';
  return 'hybrid';
}

export function buildIllustrationArtifactId(jobId: string, kind: string, scope: string): string {
  return `${jobId}:${kind}:${sanitizeFileSegment(scope).slice(0, 48) || 'artifact'}`;
}

export function normalizeIllustrationJobStatus(
  status: string | null | undefined,
): IllustrationJobStatus {
  switch (status) {
    case 'completed':
    case 'complete':
      return 'completed';
    case 'failed':
    case 'errored':
    case 'terminated':
      return 'failed';
    case 'waiting':
    case 'paused':
    case 'waitingForPause':
      return 'waiting';
    case 'running':
      return 'running';
    case 'queued':
    case 'draft':
    default:
      return 'queued';
  }
}
