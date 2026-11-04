// AI 排版结果的落地前检查：去掉多余代码围栏、识别截断/删改、生成逐行对比。
// 纯函数，不依赖 DOM 和 React。

export interface AiOutputWarning {
  level: 'danger' | 'warning';
  message: string;
}

export interface AiOutputAnalysis {
  cleaned: string;
  originalChars: number;
  outputChars: number;
  /** 输出正文字数 / 原文正文字数 */
  ratio: number;
  warnings: AiOutputWarning[];
}

/** 模型偶尔会把整篇包进 ```markdown ... ```，这里只剥最外层那一对 */
export function stripOuterCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[\w-]*\s*\n([\s\S]*?)\n```$/);
  return match ? match[1] : trimmed;
}

/**
 * 只保留"正文字符"：汉字、字母、数字。
 * 排版标记（# * > | --- 卡片标签）不计入，这样加标题加粗不会干扰比较。
 */
export function toContentChars(markdown: string): string {
  return markdown
    .replace(/<\/?(SummaryCard|InfoCard|ScrollCard|LongImageCard|CoverCard|TocCard|AuthorCard)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function lastMeaningfulLine(markdown: string): string {
  const lines = markdown.split(/\r?\n/).map((line) => toContentChars(line)).filter((line) => line.length >= 4);
  return lines[lines.length - 1] || '';
}

export function analyzeAiTypesetOutput(original: string, rawOutput: string): AiOutputAnalysis {
  const cleaned = stripOuterCodeFence(rawOutput);
  const originalContent = toContentChars(original);
  const outputContent = toContentChars(cleaned);
  const originalChars = originalContent.length;
  const outputChars = outputContent.length;
  const ratio = originalChars > 0 ? outputChars / originalChars : 1;
  const warnings: AiOutputWarning[] = [];

  if (!cleaned.trim()) {
    warnings.push({ level: 'danger', message: 'AI 返回了空内容。' });
    return { cleaned, originalChars, outputChars, ratio: 0, warnings };
  }

  // 原文最后一句没出现在输出里，基本可以断定被截断了
  const tail = lastMeaningfulLine(original).slice(-20);
  if (tail && !outputContent.includes(tail)) {
    warnings.push({
      level: 'danger',
      message: '原文结尾的内容没有出现在结果中，输出很可能被截断了（文章过长超出模型输出上限）。建议放弃，或把文章分段后再排版。',
    });
  }

  if (ratio < 0.9) {
    warnings.push({
      level: ratio < 0.7 ? 'danger' : 'warning',
      message: `结果的正文字数只有原文的 ${Math.round(ratio * 100)}%，AI 可能删减了部分内容，请在对比中检查标红的行。`,
    });
  } else if (ratio > 1.3) {
    warnings.push({
      level: 'warning',
      message: `结果的正文字数是原文的 ${Math.round(ratio * 100)}%，AI 可能新增或改写了较多内容。`,
    });
  }

  return { cleaned, originalChars, outputChars, ratio, warnings };
}

export type DiffLine = { kind: 'same' | 'added' | 'removed'; text: string };

const MAX_DIFF_CELLS = 4_000_000;

/** 基于 LCS 的逐行 diff；文章过长时返回 null，由调用方退化为只显示结果 */
export function diffLines(before: string, after: string): DiffLine[] | null {
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  if (a.length * b.length > MAX_DIFF_CELLS) return null;

  const cols = b.length + 1;
  const table = new Uint32Array((a.length + 1) * cols);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * cols + j] = a[i] === b[j]
        ? table[(i + 1) * cols + j + 1] + 1
        : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ kind: 'same', text: a[i] });
      i++;
      j++;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      result.push({ kind: 'removed', text: a[i++] });
    } else {
      result.push({ kind: 'added', text: b[j++] });
    }
  }
  while (i < a.length) result.push({ kind: 'removed', text: a[i++] });
  while (j < b.length) result.push({ kind: 'added', text: b[j++] });
  return result;
}
