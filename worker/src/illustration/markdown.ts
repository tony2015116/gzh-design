import type { IllustrationDensity, IllustrationPlanItem } from '../types';
import { clampNumber, stripMarkdown } from '../lib/text';

export function countMarkdownImages(markdown: string): number {
  const matches = markdown.match(/!\[[^\]]*]\([^)]+\)/g);
  return matches ? matches.length : 0;
}

export function extractSections(markdown: string): Array<{
  heading: string;
  level: number;
  index: number;
  content: string;
}> {
  const lines = markdown.split(/\r?\n/);
  const sections: Array<{ heading: string; level: number; index: number; content: string }> = [];

  let current: { heading: string; level: number; index: number; content: string[] } | null = null;

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,3})\s+(.*)$/);
    if (match) {
      if (current) {
        sections.push({
          heading: current.heading,
          level: current.level,
          index: current.index,
          content: current.content.join('\n').trim(),
        });
      }

      current = {
        heading: match[2].trim(),
        level: match[1].length,
        index,
        content: [],
      };
      return;
    }

    if (!current) {
      current = {
        heading: '正文概览',
        level: 1,
        index: 0,
        content: [],
      };
    }

    current.content.push(line);
  });

  const trailing = current as { heading: string; level: number; index: number; content: string[] } | null;
  if (trailing) {
    sections.push({
      heading: trailing.heading,
      level: trailing.level,
      index: trailing.index,
      content: trailing.content.join('\n').trim(),
    });
  }

  return sections.filter((section) => section.heading || section.content);
}

export function estimateIllustrationCount(
  markdown: string,
  sections: Array<{ heading: string; level: number; index: number; content: string }>,
  density: IllustrationDensity,
  existingImageCount: number,
  maxImages: number,
): number {
  const textLength = stripMarkdown(markdown).length;
  if (textLength < 280) return 0;

  let score = 0;
  if (textLength > 400) score += 1;
  if (textLength > 900) score += 1;
  if (textLength > 1600) score += 1;
  if (sections.length >= 3) score += 1;
  if (sections.length >= 6) score += 1;

  const densityBoost = density === 'rich' ? 1 : density === 'minimal' ? -1 : 0;
  score += densityBoost;
  score -= existingImageCount;

  return clampNumber(score, 0, maxImages);
}

export function insertIllustrationsIntoMarkdown(
  markdown: string,
  items: Array<Pick<IllustrationPlanItem, 'alt' | 'anchor' | 'priority'> & { imageUrl: string }>,
): string {
  const lines = markdown.split(/\r?\n/);
  const groups = new Map<number, Array<Pick<IllustrationPlanItem, 'alt' | 'anchor' | 'priority'> & { imageUrl: string }>>();

  items
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .forEach((item) => {
      const requestedIndex = Number.isFinite(item.anchor.index) ? item.anchor.index + 1 : lines.length;
      const targetIndex = clampNumber(requestedIndex, 0, lines.length);
      const group = groups.get(targetIndex) ?? [];
      group.push(item);
      groups.set(targetIndex, group);
    });

  Array.from(groups.keys())
    .sort((left, right) => right - left)
    .forEach((targetIndex) => {
      const block: string[] = [];
      const group = groups.get(targetIndex) ?? [];

      group.forEach((item) => {
        if (block.length === 0 || block[block.length - 1] !== '') {
          block.push('');
        }
        block.push(`![${item.alt}](${item.imageUrl})`);
        block.push('');
      });

      lines.splice(targetIndex, 0, ...block);
    });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
