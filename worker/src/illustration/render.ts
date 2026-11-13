import type { Env, IllustrationAssetResult, IllustrationPlanItem } from '../types';
import { getFormatPreviewChars, logIllustrationEvent, truncateForLog } from '../lib/logging';
import { buildPublicFileUrl, extFromMime, sanitizeFileSegment, saveTextArtifact } from '../lib/storage';
import { buildStructuredSpec, extractIllustrationSectionContext, shouldUseStructuredSpec } from './structured';
import { buildHttpIllustrationPrompt, buildInfographicHtml, buildInfographicSvg, buildPlaceholderSvg } from './templates';

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function generateGeminiImage(
  env: Env,
  prompt: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('missing_gemini_api_key');
  }

  const model = env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`gemini_image_${response.status}:${truncateForLog(errorText, 180)}`);
  }

  const data: any = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const imagePart = Array.isArray(parts)
    ? parts.find((part) => part?.inlineData?.data && part?.inlineData?.mimeType)
    : null;

  if (!imagePart?.inlineData?.data || !imagePart?.inlineData?.mimeType) {
    throw new Error('gemini_image_missing_inline_data');
  }

  return {
    bytes: base64ToBytes(imagePart.inlineData.data),
    mimeType: imagePart.inlineData.mimeType,
  };
}

export async function renderHtmlToPng(
  env: Env,
  html: string,
): Promise<Uint8Array> {
  if (env.RENDER_HTML) return env.RENDER_HTML(html);
  if (!env.BROWSER) {
    throw new Error('missing_browser_binding');
  }

  const { default: puppeteer } = await import('@cloudflare/puppeteer');
  const browser = await puppeteer.launch(env.BROWSER);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 675, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 675 },
    });
    return screenshot as Uint8Array;
  } finally {
    await browser.close();
  }
}

export async function renderIllustrationAsset(
  requestOrigin: string,
  env: Env,
  markdown: string,
  baseKey: string,
  item: IllustrationPlanItem,
  index: number,
  traceId: string,
): Promise<IllustrationAssetResult> {
  const slug = sanitizeFileSegment(item.anchorLabel);
  const promptKey = `${baseKey}/prompts/${String(index + 1).padStart(2, '0')}-${slug}.json`;
  const context = extractIllustrationSectionContext(markdown, item);
  logIllustrationEvent(env, traceId, 'asset.render.started', {
    index,
    type: item.type,
    engine: item.engine,
    style: item.style,
    anchorLabel: item.anchorLabel,
    contentPreview: truncateForLog(context.content, getFormatPreviewChars(env)),
  }, 'verbose');
  const structuredSpec = shouldUseStructuredSpec(item)
    ? await buildStructuredSpec(env, item, context, traceId)
    : null;
  const shouldUseInfographicFallback = item.engine === 'html_infographic' || item.engine === 'http_image';

  if (item.engine === 'http_image' && env.GEMINI_API_KEY) {
    const prompt = buildHttpIllustrationPrompt(item, context);

    await saveTextArtifact(env, promptKey, JSON.stringify({
      provider: 'gemini',
      model: env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
      prompt,
      context,
    }, null, 2), 'application/json; charset=utf-8');

    try {
      const result = await generateGeminiImage(env, prompt);
      const extension = extFromMime(result.mimeType);
      const imageKey = `${baseKey}/images/${String(index + 1).padStart(2, '0')}-${slug}.${extension}`;
      await env.IMAGES_BUCKET.put(imageKey, result.bytes, {
        httpMetadata: { contentType: result.mimeType },
      });

      const assetResult: IllustrationAssetResult = {
        imageKey,
        imageUrl: buildPublicFileUrl(requestOrigin, imageKey),
        promptKey,
        mimeType: result.mimeType,
        mode: 'gemini_image',
        source: 'generated',
      };
      logIllustrationEvent(env, traceId, 'asset.render.completed', {
        index,
        type: item.type,
        mode: assetResult.mode,
        source: assetResult.source,
        imageKey: assetResult.imageKey,
      }, 'verbose');
      return assetResult;
    } catch (error: any) {
      logIllustrationEvent(env, traceId, 'asset.gemini.fallback', {
        index,
        type: item.type,
        engine: item.engine,
        reason: error?.message || 'unknown',
      });
    }
  }

  const spec = {
    mode: shouldUseInfographicFallback
      ? (env.BROWSER || env.RENDER_HTML ? 'browser_rendered_html' : 'svg_infographic')
      : 'placeholder_svg',
    context,
    structuredSpec,
    item,
    fallbackFrom: item.engine === 'http_image' ? 'http_image' : null,
  };
  await saveTextArtifact(env, promptKey, JSON.stringify(spec, null, 2), 'application/json; charset=utf-8');

  if (shouldUseInfographicFallback && (env.BROWSER || env.RENDER_HTML)) {
    const html = buildInfographicHtml(item, context, structuredSpec || undefined);
    const htmlKey = `${baseKey}/html/${String(index + 1).padStart(2, '0')}-${slug}.html`;
    await saveTextArtifact(env, htmlKey, html, 'text/html; charset=utf-8');

    try {
      const png = await renderHtmlToPng(env, html);
      const imageKey = `${baseKey}/images/${String(index + 1).padStart(2, '0')}-${slug}.png`;
      await env.IMAGES_BUCKET.put(imageKey, png, {
        httpMetadata: { contentType: 'image/png' },
      });

      const result: IllustrationAssetResult = {
        imageKey,
        imageUrl: buildPublicFileUrl(requestOrigin, imageKey),
        promptKey,
        htmlKey,
        mimeType: 'image/png',
        mode: 'browser_rendered_html',
        source: 'generated',
      };
      logIllustrationEvent(env, traceId, 'asset.render.completed', {
        index,
        type: item.type,
        mode: result.mode,
        source: result.source,
        imageKey: result.imageKey,
      }, 'verbose');
      return result;
    } catch (error: any) {
      logIllustrationEvent(env, traceId, 'asset.browser_render.fallback', {
        index,
        type: item.type,
        reason: error?.message || 'unknown',
      });
    }
  }

  const svg = item.engine === 'html_infographic'
    ? buildInfographicSvg(item, context, structuredSpec || undefined)
    : buildPlaceholderSvg(item);
  const imageKey = `${baseKey}/images/${String(index + 1).padStart(2, '0')}-${slug}.svg`;
  await env.IMAGES_BUCKET.put(imageKey, svg, {
    httpMetadata: { contentType: 'image/svg+xml; charset=utf-8' },
  });

  const result: IllustrationAssetResult = {
    imageKey,
    imageUrl: buildPublicFileUrl(requestOrigin, imageKey),
    promptKey,
    htmlKey: null,
    mimeType: 'image/svg+xml',
    mode: shouldUseInfographicFallback ? 'svg_infographic' : 'placeholder_svg',
    source: shouldUseInfographicFallback ? 'generated' : 'placeholder',
  };
  logIllustrationEvent(env, traceId, 'asset.render.completed', {
    index,
    type: item.type,
    mode: result.mode,
    source: result.source,
    imageKey: result.imageKey,
  }, 'verbose');
  return result;
}
