import type { Env, IllustrationPlanItem, IllustrationPlanRequest, IllustrationPlanResult } from '../types';
import { clampNumber, normalizeHeadingLabel, stripMarkdown } from '../lib/text';
import { truncateForLog } from '../lib/logging';
import { countMarkdownImages, estimateIllustrationCount, extractSections } from './markdown';
import { buildAltText, buildPurpose, defaultStyleForType, detectIllustrationType, engineForType } from './classify';

export function buildHeuristicIllustrationPlan(request: IllustrationPlanRequest): IllustrationPlanResult {
  const density = request.density || 'balanced';
  const preferredStyle = request.preferredStyle || 'auto';
  const maxImages = clampNumber(request.maxImages || 3, 1, 6);
  const existingImageCount = countMarkdownImages(request.markdown);
  const sections = extractSections(request.markdown);
  const recommendedCount = estimateIllustrationCount(
    request.markdown,
    sections,
    density,
    existingImageCount,
    maxImages,
  );

  const candidateSections = sections.filter((section) => !/!\[[^\]]*]\([^)]+\)/.test(section.content || ''));
  const items: IllustrationPlanItem[] = candidateSections
    .slice(0, Math.max(recommendedCount, 0))
    .map((section, index) => {
      const sectionLabel = normalizeHeadingLabel(section.heading);
      const combinedText = `${section.heading}\n${section.content}`;
      const type = detectIllustrationType(combinedText);
      const engine = engineForType(type);

      return {
        id: `plan-${section.index}-${index + 1}`,
        anchor: {
          kind: 'heading',
          heading: section.heading,
          index: section.index,
          excerpt: truncateForLog(stripMarkdown(section.content), 120),
        },
        anchorLabel: sectionLabel,
        reason: existingImageCount === 0
          ? '文章当前缺少插图，这个位置适合加入一张说明型配图。'
          : '该段信息密度较高，插图有助于降低阅读疲劳。',
        purpose: buildPurpose(type),
        type,
        engine,
        style: defaultStyleForType(type, preferredStyle),
        alt: buildAltText(sectionLabel, type),
        priority: index + 1,
      };
    });

  return {
    shouldIllustrate: items.length > 0,
    summary: items.length > 0
      ? `建议补充 ${items.length} 张配图，优先覆盖信息密度高且当前缺图的段落。`
      : '当前文章已有足够图片，或篇幅较短，暂不建议自动补图。',
    recommendedCount: items.length,
    density,
    preferredStyle,
    existingImageCount,
    source: 'heuristic',
    items,
  };
}

export function extractJsonObject(value: string): string | null {
  const fencedMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : value.trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

export function sanitizeIllustrationPlan(
  candidate: any,
  fallback: IllustrationPlanResult,
): IllustrationPlanResult | null {
  if (!candidate || typeof candidate !== 'object') return null;
  if (!Array.isArray(candidate.items)) return null;

  const items = candidate.items
    .map((item: any, index: number): IllustrationPlanItem | null => {
      if (!item || typeof item !== 'object') return null;

      const type = detectIllustrationType(String(item.type || item.purpose || ''));
      const anchorLabel = String(item.anchorLabel || item.heading || item.title || '').trim() || `段落 ${index + 1}`;
      const reason = String(item.reason || fallback.items[index]?.reason || '').trim();
      const purpose = String(item.purpose || buildPurpose(type)).trim();
      const style = String(item.style || defaultStyleForType(type, fallback.preferredStyle)).trim();
      const engine = item.engine === 'http_image' || item.engine === 'html_infographic'
        ? item.engine
        : engineForType(type);
      const priority = Number.isFinite(Number(item.priority)) ? Number(item.priority) : index + 1;

      return {
        id: String(item.id || `plan-${index + 1}`),
        anchor: {
          kind: item.anchor?.kind === 'paragraph' ? 'paragraph' : 'heading',
          heading: String(item.anchor?.heading || item.heading || anchorLabel || ''),
          index: Number.isFinite(Number(item.anchor?.index)) ? Number(item.anchor.index) : index,
          excerpt: String(item.anchor?.excerpt || '').trim() || undefined,
        },
        anchorLabel,
        reason: reason || '该段信息密度较高，适合加入插图。',
        purpose,
        type,
        engine,
        style,
        alt: String(item.alt || buildAltText(anchorLabel, type)).trim(),
        priority,
      };
    })
    .filter(Boolean) as IllustrationPlanItem[];

  return {
    shouldIllustrate: Boolean(candidate.shouldIllustrate ?? items.length > 0),
    summary: String(candidate.summary || fallback.summary || '').trim(),
    recommendedCount: clampNumber(
      Number.isFinite(Number(candidate.recommendedCount)) ? Number(candidate.recommendedCount) : items.length,
      0,
      Math.max(items.length, fallback.recommendedCount, 1),
    ),
    density: candidate.density === 'minimal' || candidate.density === 'balanced' || candidate.density === 'rich'
      ? candidate.density
      : fallback.density,
    preferredStyle: String(candidate.preferredStyle || fallback.preferredStyle || 'auto'),
    existingImageCount: fallback.existingImageCount,
    source: 'model',
    items: items.slice(0, Math.max(fallback.recommendedCount, items.length)),
  };
}

export async function requestIllustrationPlanFromModel(
  env: Env,
  request: IllustrationPlanRequest,
  fallback: IllustrationPlanResult,
): Promise<IllustrationPlanResult | null> {
  if (!env.OPENAI_API_KEY) return null;

  const baseUrl = env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const modelName = env.OPENAI_MODEL || 'gpt-4o';
  let endpoint = baseUrl;
  if (!endpoint.endsWith('chat/completions')) {
    endpoint = endpoint.endsWith('/') ? `${endpoint}chat/completions` : `${endpoint}/chat/completions`;
  }

  const systemPrompt = `
You are planning illustration suggestions for a WeChat article.
Return one JSON object only.

Schema:
{
  "shouldIllustrate": boolean,
  "summary": string,
  "recommendedCount": number,
  "density": "minimal" | "balanced" | "rich",
  "preferredStyle": string,
  "items": [
    {
      "id": string,
      "anchorLabel": string,
      "heading": string,
      "reason": string,
      "purpose": string,
      "type": "scene" | "cover" | "infographic" | "flowchart" | "comparison" | "framework" | "timeline",
      "engine": "http_image" | "html_infographic",
      "style": string,
      "alt": string,
      "priority": number,
      "anchor": { "kind": "heading" | "paragraph", "index": number, "heading": string, "excerpt": string }
    }
  ]
}

Rules:
- Prefer no more than the fallback recommended count.
- Use html_infographic for flowchart/comparison/framework/timeline.
- Use http_image for scene/cover.
- Suggest only images that materially improve readability.
`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: JSON.stringify({
            request,
            fallback,
            markdown: request.markdown,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`illustration_plan_upstream_${response.status}`);
  }

  const data: any = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const jsonText = extractJsonObject(text);
  if (!jsonText) return null;

  try {
    return sanitizeIllustrationPlan(JSON.parse(jsonText), fallback);
  } catch {
    return null;
  }
}

export function parseSelectedIllustrationPlan(
  markdown: string,
  rawPlan: string,
): IllustrationPlanResult {
  const fallbackPlan = buildHeuristicIllustrationPlan({
    markdown,
    density: 'balanced',
    preferredStyle: 'auto',
    maxImages: 6,
  });

  try {
    const parsed = JSON.parse(rawPlan) as IllustrationPlanResult;
    return sanitizeIllustrationPlan(parsed, fallbackPlan) ?? fallbackPlan;
  } catch {
    return fallbackPlan;
  }
}
