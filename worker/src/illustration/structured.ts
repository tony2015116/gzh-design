import type { Env, IllustrationBridgeSpec, IllustrationHighlight, IllustrationLayout, IllustrationPlanItem, IllustrationSectionContext, IllustrationStructuredSpec } from '../types';
import { shortenText, stripMarkdown } from '../lib/text';
import { getFormatPreviewChars, logIllustrationEvent, truncateForLog } from '../lib/logging';
import { extractSections } from './markdown';
import { extractJsonObject } from './plan';

export function splitPointLabelAndDetail(point: string): IllustrationHighlight {
  const normalized = stripMarkdown(point).replace(/\s+/g, ' ').trim();
  const segments = normalized.split(/[：:，,、]/).map((part) => part.trim()).filter(Boolean);

  if (segments.length >= 2) {
    return {
      label: shortenText(segments[0], 12),
      detail: shortenText(segments.slice(1).join('，'), 30),
    };
  }

  const label = shortenText(normalized, normalized.length <= 14 ? normalized.length : 12);
  const detail = normalized.length > label.length
    ? shortenText(normalized.slice(label.length).trim(), 30)
    : shortenText(normalized, 30);

  return {
    label,
    detail,
  };
}

export function normalizeIllustrationTitle(value: string, fallback: string): string {
  const normalized = stripMarkdown(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return fallback;

  if (/^(正文概览|正文概述|概览|摘要|overview|summary)$/i.test(normalized)) {
    return fallback;
  }

  return shortenText(normalized, 18);
}

export function sanitizeStructuredSpec(
  candidate: Partial<IllustrationStructuredSpec> | null | undefined,
  fallback: IllustrationStructuredSpec,
  item: IllustrationPlanItem,
): IllustrationStructuredSpec {
  if (!candidate) return fallback;

  const layout = candidate.layout === 'overview'
    || candidate.layout === 'linear-progression'
    || candidate.layout === 'binary-comparison'
    || candidate.layout === 'hub-spoke'
    || candidate.layout === 'bridge'
    ? candidate.layout
    : fallback.layout;

  const highlights = Array.isArray(candidate.highlights)
    ? candidate.highlights
        .map((entry) => ({
          label: shortenText(String(entry?.label || '').trim(), 16),
          detail: shortenText(String(entry?.detail || '').trim(), 34),
        }))
        .filter((entry) => entry.label && entry.detail)
        .slice(0, 4)
    : fallback.highlights;

  const comparison = candidate.comparison
    ? {
        left: {
          title: shortenText(String(candidate.comparison.left?.title || fallback.comparison?.left.title || '重点 A').trim(), 16),
          points: Array.isArray(candidate.comparison.left?.points)
            ? candidate.comparison.left.points.map((point) => shortenText(String(point).trim(), 28)).filter(Boolean).slice(0, 3)
            : (fallback.comparison?.left.points || []).slice(0, 3),
        },
        right: {
          title: shortenText(String(candidate.comparison.right?.title || fallback.comparison?.right.title || '重点 B').trim(), 16),
          points: Array.isArray(candidate.comparison.right?.points)
            ? candidate.comparison.right.points.map((point) => shortenText(String(point).trim(), 28)).filter(Boolean).slice(0, 3)
            : (fallback.comparison?.right.points || []).slice(0, 3),
        },
        conclusion: shortenText(String(candidate.comparison.conclusion || fallback.comparison?.conclusion || item.purpose).trim(), 40),
      }
    : fallback.comparison;

  const flow = candidate.flow
    ? {
        steps: Array.isArray(candidate.flow.steps)
          ? candidate.flow.steps.map((step) => shortenText(String(step).trim(), 22)).filter(Boolean).slice(0, 4)
          : (fallback.flow?.steps || []).slice(0, 4),
      }
    : fallback.flow;

  const framework = candidate.framework
    ? {
        core: shortenText(String(candidate.framework.core || fallback.framework?.core || item.anchorLabel).trim(), 16),
        pillars: Array.isArray(candidate.framework.pillars)
          ? candidate.framework.pillars.map((pillar) => shortenText(String(pillar).trim(), 20)).filter(Boolean).slice(0, 4)
          : (fallback.framework?.pillars || []).slice(0, 4),
      }
    : fallback.framework;

  const timeline = Array.isArray(candidate.timeline)
    ? candidate.timeline
        .map((stage) => ({
          label: shortenText(String(stage?.label || '').trim(), 12),
          note: shortenText(String(stage?.note || '').trim(), 18),
        }))
        .filter((stage) => stage.label && stage.note)
        .slice(0, 4)
    : fallback.timeline;

  const bridge = candidate.bridge
    ? {
        problem: shortenText(String(candidate.bridge.problem || fallback.bridge?.problem || item.anchorLabel).trim(), 22),
        tension: shortenText(String(candidate.bridge.tension || fallback.bridge?.tension || item.purpose).trim(), 22),
        decision: shortenText(String(candidate.bridge.decision || fallback.bridge?.decision || item.reason).trim(), 22),
        outcome: shortenText(String(candidate.bridge.outcome || fallback.bridge?.outcome || item.reason).trim(), 24),
      }
    : fallback.bridge;

  return {
    layout,
    title: normalizeIllustrationTitle(String(candidate.title || fallback.title || item.anchorLabel), fallback.title),
    subtitle: shortenText(String(candidate.subtitle || fallback.subtitle || item.purpose).trim(), 34),
    takeaway: shortenText(String(candidate.takeaway || fallback.takeaway || item.reason || item.purpose).trim(), 42),
    highlights: highlights.length > 0 ? highlights : fallback.highlights,
    comparison,
    flow: flow && flow.steps.length > 0 ? flow : fallback.flow,
    framework: framework && framework.pillars.length > 0 ? framework : fallback.framework,
    timeline: timeline.length > 0 ? timeline : fallback.timeline,
    bridge,
  };
}

const STRUCTURED_META_PATTERNS = [
  /infographic/i,
  /visual/i,
  /readability/i,
  /scan/i,
  /summary/i,
  /overview/i,
  /\u4fe1\u606f\u56fe/,
  /\u53ef\u89c6\u5316/,
  /\u626b\u8bfb/,
  /\u9605\u8bfb\u6548\u7387/,
  /\u56fe\u8868\u5316/,
  /\u63d0\u70bc/,
  /\u7ed3\u6784\u5316/,
  /\u5448\u73b0\u65b9\u5f0f/,
  /\u6982\u89c8/,
  /\u6458\u8981/,
];

const STRUCTURED_GENERIC_PATTERNS = [
  /^overview$/i,
  /^summary$/i,
  /^highlight/i,
  /^key point/i,
  /^\u6b63\u6587$/,
  /^\u6b63\u6587\u6982\u89c8$/,
  /^\u6982\u89c8$/,
  /^\u6458\u8981$/,
  /^\u91cd\u70b9$/,
];

const STRUCTURED_KEYWORD_STOPWORDS = new Set([
  'article',
  'section',
  'content',
  'method',
  'thing',
  '方式',
  '内容',
  '部分',
  '问题',
  '重点',
  '概览',
  '摘要',
  '信息图',
]);

export function containsStructuredMetaLanguage(value: string): boolean {
  const normalized = stripMarkdown(value).toLowerCase();
  return STRUCTURED_META_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isGenericStructuredTitle(value: string): boolean {
  const normalized = stripMarkdown(value).trim();
  return STRUCTURED_GENERIC_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function extractStructuredContentKeywords(context: IllustrationSectionContext): string[] {
  const source = [context.content, ...context.bulletPoints, ...context.sentencePoints].join(' ');
  const matches = source.match(/[A-Za-z][A-Za-z0-9.+-]{2,}|[\u4e00-\u9fff]{2,8}/g) || [];
  const counts = new Map<string, number>();

  matches.forEach((raw) => {
    const token = stripMarkdown(raw).replace(/\s+/g, ' ').trim();
    if (!token || token.length < 2) return;
    if (STRUCTURED_KEYWORD_STOPWORDS.has(token.toLowerCase()) || STRUCTURED_KEYWORD_STOPWORDS.has(token)) return;
    if (containsStructuredMetaLanguage(token)) return;
    counts.set(token, (counts.get(token) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => (right[1] - left[1]) || (right[0].length - left[0].length))
    .map(([token]) => token)
    .slice(0, 10);
}

export function collectStructuredSpecText(spec: IllustrationStructuredSpec): string {
  const fragments = [
    spec.layout,
    spec.title,
    spec.subtitle,
    spec.takeaway,
    ...spec.highlights.flatMap((entry) => [entry.label, entry.detail]),
    ...(spec.comparison ? [
      spec.comparison.left.title,
      ...spec.comparison.left.points,
      spec.comparison.right.title,
      ...spec.comparison.right.points,
      spec.comparison.conclusion,
    ] : []),
    ...(spec.flow?.steps || []),
    ...(spec.framework ? [spec.framework.core, ...spec.framework.pillars] : []),
    ...spec.timeline.flatMap((stage) => [stage.label, stage.note]),
    ...(spec.bridge ? [spec.bridge.problem, spec.bridge.tension, spec.bridge.decision, spec.bridge.outcome] : []),
  ];

  return fragments.filter(Boolean).join(' ');
}

export function assessStructuredSpecQuality(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  spec: IllustrationStructuredSpec,
): { accepted: boolean; score: number; reasons: string[]; keywords: string[]; matchedKeywords: string[] } {
  const keywords = extractStructuredContentKeywords(context);
  const combinedText = collectStructuredSpecText(spec);
  const matchedKeywords = keywords.filter((keyword) => combinedText.includes(keyword)).slice(0, 6);
  const reasons: string[] = [];
  let score = 0;

  if (matchedKeywords.length >= 2) {
    score += 3;
  } else if (matchedKeywords.length === 1) {
    score += 1;
  } else {
    reasons.push('no_content_keywords');
    score -= 2;
  }

  if (containsStructuredMetaLanguage(spec.title)) {
    reasons.push('meta_title');
    score -= 3;
  }

  if (isGenericStructuredTitle(spec.title)) {
    reasons.push('generic_title');
    score -= 2;
  }

  const metaHighlightCount = spec.highlights
    .filter((entry) => containsStructuredMetaLanguage(entry.label) || containsStructuredMetaLanguage(entry.detail))
    .length;
  if (metaHighlightCount > 0) {
    reasons.push('meta_highlights');
    score -= Math.min(metaHighlightCount, 2);
  }

  if (item.type === 'infographic' && spec.highlights.length < 3) {
    reasons.push('too_few_highlights');
    score -= 1;
  }

  if (item.type === 'timeline' && spec.timeline.length < 3) {
    reasons.push('too_few_timeline_stages');
    score -= 1;
  }

  if (item.type === 'infographic' && spec.layout === 'overview' && matchedKeywords.length < 2) {
    reasons.push('weak_overview_grounding');
    score -= 2;
  }

  if (spec.layout === 'bridge' && !spec.bridge) {
    reasons.push('missing_bridge_spec');
    score -= 2;
  }

  return {
    accepted: score >= 1 && !(containsStructuredMetaLanguage(spec.title) && matchedKeywords.length === 0),
    score,
    reasons,
    keywords,
    matchedKeywords,
  };
}

export function deriveStructuredTitle(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  sourcePoints: string[],
): string {
  const headingTitle = normalizeIllustrationTitle(
    context.heading || item.anchorLabel,
    shortenText(item.anchorLabel, 18),
  );
  if (!isGenericStructuredTitle(headingTitle) && !containsStructuredMetaLanguage(headingTitle)) {
    return headingTitle;
  }

  const primary = splitPointLabelAndDetail(sourcePoints[0] || context.sentencePoints[0] || item.anchorLabel);
  const candidate = primary.label || context.sentencePoints[0] || item.anchorLabel;
  return normalizeIllustrationTitle(candidate, shortenText(item.anchorLabel, 18));
}

export function inferStructuredLayout(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  sourcePoints: string[],
): IllustrationLayout {
  if (item.type === 'comparison') return 'binary-comparison';
  if (item.type === 'flowchart') return 'linear-progression';
  if (item.type === 'framework') return 'hub-spoke';
  if (item.type === 'timeline') return 'linear-progression';

  const content = [context.heading, context.content, ...sourcePoints].join(' ');
  if (/(?:避免|不要|不是|而是|风险|成本|方案|策略|选择|建议|渠道|代理|订阅|稳定|低价|替代|过渡|because|instead|avoid|risk|cost|strategy|choose|solution|stable|proxy|channel)/i.test(content)) {
    return 'bridge';
  }

  if (/(?:第[一二三四0-9]+|步骤|路径|流程|阶段|先|再|然后|最后|first|then|next|finally|step|path|process|sequence)/i.test(content)) {
    return 'linear-progression';
  }

  return 'overview';
}

export function buildBridgeSpec(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  sourcePoints: string[],
): IllustrationBridgeSpec {
  const points = sourcePoints.length > 0 ? sourcePoints : context.sentencePoints;
  const first = shortenText(points[0] || context.heading || item.anchorLabel, 20);
  const second = shortenText(points[1] || points[0] || item.purpose, 22);
  const third = shortenText(points[2] || points[1] || item.reason, 22);
  const fourth = shortenText(points[3] || context.sentencePoints[context.sentencePoints.length - 1] || item.reason, 24);

  return {
    problem: first,
    tension: second,
    decision: third,
    outcome: fourth,
  };
}

export function extractIllustrationSectionContext(
  markdown: string,
  item: IllustrationPlanItem,
): IllustrationSectionContext {
  const sections = extractSections(markdown);
  const matched = sections.find((section) => (
    section.index === item.anchor.index
    || (item.anchor.heading && section.heading === item.anchor.heading)
  ));

  const fallbackContent = item.anchor.excerpt || item.purpose || item.reason;
  const content = matched?.content || fallbackContent || '';
  const heading = matched?.heading || item.anchor.heading || item.anchorLabel;
  const bulletPoints = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^([-*+]|\d+\.)\s+/.test(line))
    .map((line) => stripMarkdown(line.replace(/^([-*+]|\d+\.)\s+/, '')))
    .filter(Boolean);

  const sentencePoints = stripMarkdown(content)
    .split(/[。！？!?；;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const points = (bulletPoints.length > 0 ? bulletPoints : sentencePoints)
    .slice(0, 4)
    .map((point) => shortenText(point, 24));

  if (points.length === 0) {
    points.push(shortenText(item.purpose, 24));
  }

  return {
    heading,
    content,
    points,
    bulletPoints,
    sentencePoints,
  };
}

export function buildHeuristicStructuredSpec(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
): IllustrationStructuredSpec {
  const sourcePoints = (context.bulletPoints.length > 0 ? context.bulletPoints : context.sentencePoints)
    .filter(Boolean)
    .slice(0, 6);
  const layout = inferStructuredLayout(item, context, sourcePoints);
  const bridge = layout === 'bridge' ? buildBridgeSpec(item, context, sourcePoints) : null;
  const fallbackTitle = deriveStructuredTitle(item, context, sourcePoints);
  const summarySentence = context.sentencePoints[0] || item.purpose;
  const takeaway = context.sentencePoints[context.sentencePoints.length - 1] || item.reason || item.purpose;
  const highlights = (sourcePoints.length > 0 ? sourcePoints : [item.purpose, item.reason])
    .map(splitPointLabelAndDetail)
    .filter((entry) => entry.label && entry.detail)
    .slice(0, 4);

  if (item.type === 'comparison') {
    const leftSeed = sourcePoints.slice(0, 2);
    const rightSeed = sourcePoints.slice(2, 4);
    const leftTitle = splitPointLabelAndDetail(leftSeed[0] || item.anchorLabel).label || '重点 A';
    const rightTitle = splitPointLabelAndDetail(rightSeed[0] || item.purpose).label || '重点 B';

    return {
      layout,
      title: fallbackTitle,
      subtitle: shortenText(highlights[0]?.detail || summarySentence, 30),
      takeaway: shortenText(takeaway, 40),
      highlights: highlights.slice(0, 3),
      comparison: {
        left: {
          title: leftTitle,
          points: leftSeed.length > 0 ? leftSeed.map((point) => shortenText(point, 26)) : [shortenText(item.reason, 26)],
        },
        right: {
          title: rightTitle,
          points: rightSeed.length > 0 ? rightSeed.map((point) => shortenText(point, 26)) : [shortenText(item.purpose, 26)],
        },
        conclusion: shortenText(takeaway, 40),
      },
      flow: null,
      framework: null,
      timeline: [],
      bridge: null,
    };
  }

  if (item.type === 'flowchart') {
    return {
      layout,
      title: fallbackTitle,
      subtitle: shortenText(highlights[0]?.detail || summarySentence, 32),
      takeaway: shortenText(takeaway, 40),
      highlights,
      comparison: null,
      flow: {
        steps: sourcePoints.slice(0, 4).map((point) => shortenText(point, 20)),
      },
      framework: null,
      timeline: [],
      bridge: null,
    };
  }

  if (item.type === 'framework') {
    const core = splitPointLabelAndDetail(sourcePoints[0] || item.anchorLabel).label || shortenText(item.anchorLabel, 14);
    return {
      layout,
      title: fallbackTitle,
      subtitle: shortenText(highlights[0]?.detail || summarySentence, 32),
      takeaway: shortenText(takeaway, 40),
      highlights,
      comparison: null,
      flow: null,
      framework: {
        core,
        pillars: sourcePoints.slice(1, 5).map((point) => shortenText(point, 18)),
      },
      timeline: [],
      bridge: null,
    };
  }

  if (item.type === 'timeline') {
    return {
      layout,
      title: fallbackTitle,
      subtitle: shortenText(highlights[0]?.detail || summarySentence, 32),
      takeaway: shortenText(takeaway, 40),
      highlights,
      comparison: null,
      flow: null,
      framework: null,
      timeline: sourcePoints.slice(0, 4).map((point, index) => {
        const split = splitPointLabelAndDetail(point);
        return {
          label: split.label || `阶段 ${index + 1}`,
          note: split.detail || shortenText(point, 18),
        };
      }),
      bridge: null,
    };
  }

  return {
    layout,
    title: fallbackTitle,
    subtitle: shortenText(highlights[0]?.detail || summarySentence, 34),
    takeaway: shortenText(takeaway, 40),
    highlights: highlights.length > 0
      ? highlights
      : [{ label: shortenText(item.anchorLabel, 14), detail: shortenText(item.purpose, 30) }],
    comparison: null,
    flow: null,
    framework: null,
    timeline: [],
    bridge,
  };
}

export async function requestStructuredSpecFromModel(
  env: Env,
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  fallback: IllustrationStructuredSpec,
  traceId?: string,
): Promise<IllustrationStructuredSpec | null> {
  if (!env.OPENAI_API_KEY) return null;
  if (item.type === 'scene' || item.type === 'cover') return null;

  const baseUrl = env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const modelName = env.OPENAI_MODEL || 'gpt-4o';
  let endpoint = baseUrl;
  if (!endpoint.endsWith('chat/completions')) {
    endpoint = endpoint.endsWith('/') ? `${endpoint}chat/completions` : `${endpoint}/chat/completions`;
  }

  const systemPrompt = `
You are designing structured content for a WeChat article infographic.
Return one JSON object only.

Schema:
{
  "layout": "overview" | "linear-progression" | "binary-comparison" | "hub-spoke" | "bridge",
  "title": string,
  "subtitle": string,
  "takeaway": string,
  "highlights": [
    { "label": string, "detail": string }
  ],
  "comparison": null | {
    "left": { "title": string, "points": string[] },
    "right": { "title": string, "points": string[] },
    "conclusion": string
  },
  "flow": null | { "steps": string[] },
  "framework": null | { "core": string, "pillars": string[] },
  "timeline": [{ "label": string, "note": string }],
  "bridge": null | {
    "problem": string,
    "tension": string,
    "decision": string,
    "outcome": string
  }
}

Rules:
- Preserve concrete entities, claims, risks, tradeoffs, and recommendations from the section. Do not talk about visuals, readability, scanning, or infographic design itself.
- Rewrite and compress; do not copy long raw sentences.
- Never use generic titles like "正文概览", "概览", "重点", or "摘要".
- The "purpose" and "reason" fields are rendering metadata only. Do not paraphrase them into the output.
- Base title, subtitle, and points on the section content itself, especially concrete entities, claims, risks, steps, contrasts, or timeline signals.
- title should feel like the main takeaway, not the original heading.
- subtitle should explain why this section matters.
- Choose layout:
  - "bridge" for problem -> tension/risk -> decision -> outcome sections.
  - "linear-progression" for stepwise, staged, or evolving logic.
  - "overview" only when the section truly has several parallel key points.
- highlight label should be short and punchy.
- highlight detail should be concise and readable on a card.
- For infographic, produce 3-4 punchy highlights.
- For comparison, fill both left and right columns with 2-3 points each.
- For flowchart, produce 3-4 short steps.
- For framework, produce one core concept and 2-4 supporting pillars.
- For timeline, produce 3-4 chronological stages.
- For bridge, fill all four bridge fields with short concrete phrases.
- Keep unused schema fields null or [].
- Ground everything in the provided section content only.
`;

  if (traceId) {
    logIllustrationEvent(env, traceId, 'structured_spec.request.started', {
      type: item.type,
      engine: item.engine,
      heading: context.heading,
      contentPreview: truncateForLog(context.content, getFormatPreviewChars(env)),
      bulletPoints: context.bulletPoints.slice(0, 4),
      sentencePoints: context.sentencePoints.slice(0, 4),
    }, 'verbose');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: JSON.stringify({
            type: item.type,
            anchorLabel: item.anchorLabel,
            heading: context.heading,
            content: context.content,
            bulletPoints: context.bulletPoints,
            sentencePoints: context.sentencePoints,
            fallback,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`illustration_spec_upstream_${response.status}`);
  }

  const data: any = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    if (traceId) {
      logIllustrationEvent(env, traceId, 'structured_spec.request.empty', {
        type: item.type,
        outputPreview: truncateForLog(text, getFormatPreviewChars(env)),
      }, 'verbose');
    }
    return null;
  }

  try {
    const result = sanitizeStructuredSpec(JSON.parse(jsonText), fallback, item);
    const quality = assessStructuredSpecQuality(item, context, result);
    if (!quality.accepted) {
      if (traceId) {
        logIllustrationEvent(env, traceId, 'structured_spec.request.rejected', {
          type: item.type,
          score: quality.score,
          reasons: quality.reasons,
          keywords: quality.keywords,
          matchedKeywords: quality.matchedKeywords,
          title: result.title,
        }, 'verbose');
      }
      return null;
    }
    if (traceId) {
      logIllustrationEvent(env, traceId, 'structured_spec.request.succeeded', {
        type: item.type,
        score: quality.score,
        matchedKeywords: quality.matchedKeywords,
        title: result.title,
        subtitle: result.subtitle,
        takeaway: result.takeaway,
        highlights: result.highlights.slice(0, 3),
        layout: result.layout,
        comparison: result.comparison ? {
          left: result.comparison.left.title,
          right: result.comparison.right.title,
        } : null,
        bridge: result.bridge,
        flowSteps: result.flow?.steps?.slice(0, 4) || [],
        framework: result.framework ? {
          core: result.framework.core,
          pillars: result.framework.pillars.slice(0, 4),
        } : null,
        timeline: result.timeline.slice(0, 4),
      }, 'verbose');
    }
    return result;
  } catch {
    if (traceId) {
      logIllustrationEvent(env, traceId, 'structured_spec.request.invalid_json', {
        type: item.type,
        jsonPreview: truncateForLog(jsonText, getFormatPreviewChars(env)),
      }, 'verbose');
    }
    return null;
  }
}

export async function buildStructuredSpec(
  env: Env,
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  traceId?: string,
): Promise<IllustrationStructuredSpec> {
  const fallback = buildHeuristicStructuredSpec(item, context);

  try {
    const fromModel = await requestStructuredSpecFromModel(env, item, context, fallback, traceId);
    const result = fromModel ? sanitizeStructuredSpec(fromModel, fallback, item) : fallback;
    if (traceId && !fromModel) {
      logIllustrationEvent(env, traceId, 'structured_spec.fallback.heuristic', {
        type: item.type,
        layout: result.layout,
        title: result.title,
        subtitle: result.subtitle,
        takeaway: result.takeaway,
      }, 'verbose');
    }
    return result;
  } catch {
    if (traceId) {
      logIllustrationEvent(env, traceId, 'structured_spec.fallback.error', {
        type: item.type,
      }, 'verbose');
    }
    return fallback;
  }
}

export function shouldUseStructuredSpec(item: IllustrationPlanItem): boolean {
  return item.type === 'infographic'
    || item.type === 'comparison'
    || item.type === 'flowchart'
    || item.type === 'framework'
    || item.type === 'timeline';
}
