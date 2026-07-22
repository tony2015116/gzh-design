import { describe, expect, it } from 'vitest';
import { inferJobSource, normalizeIllustrationJobStatus } from '../src/illustration/jobs';
import type { IllustrationAssetResult } from '../src/types';

describe('normalizeIllustrationJobStatus（workflow 原始状态 → 内部状态）', () => {
  it.each([
    ['completed', 'completed'],
    ['complete', 'completed'],
    ['failed', 'failed'],
    ['errored', 'failed'],
    ['terminated', 'failed'],
    ['waiting', 'waiting'],
    ['paused', 'waiting'],
    ['waitingForPause', 'waiting'],
    ['running', 'running'],
    ['queued', 'queued'],
    ['draft', 'queued'],
  ] as const)('%s → %s', (raw, expected) => {
    expect(normalizeIllustrationJobStatus(raw)).toBe(expected);
  });

  it.each([null, undefined, '', 'unknown', 'CANCELLED', 'Completed'] as const)(
    '非法/缺失状态 %j 一律归为 queued',
    (raw) => {
      expect(normalizeIllustrationJobStatus(raw)).toBe('queued');
    },
  );
});

describe('inferJobSource', () => {
  function asset(source: 'placeholder' | 'generated'): IllustrationAssetResult {
    return {
      imageKey: 'k',
      imageUrl: 'u',
      promptKey: null,
      mimeType: 'image/png',
      mode: source === 'generated' ? 'gemini_image' : 'placeholder_svg',
      source,
    };
  }

  it('全部 generated → generated', () => {
    expect(inferJobSource([asset('generated'), asset('generated')])).toBe('generated');
  });

  it('全部 placeholder → placeholder', () => {
    expect(inferJobSource([asset('placeholder'), asset('placeholder')])).toBe('placeholder');
  });

  it('混合 → hybrid', () => {
    expect(inferJobSource([asset('generated'), asset('placeholder')])).toBe('hybrid');
  });

  it('空列表 → placeholder', () => {
    expect(inferJobSource([])).toBe('placeholder');
  });
});
