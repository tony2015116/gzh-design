import type { Env, IllustrationAnchor, IllustrationEngine, IllustrationJobRequest, IllustrationJobResponse, IllustrationPlanRequest, IllustrationType, RenderedIllustrationItem } from '../types';
import { buildErrorResponse, createTraceId, jsonResponse } from '../lib/http';
import { authenticateUser } from '../lib/auth';
import { isRoleAllowed } from '../lib/permissions';
import { getFormatPreviewChars, logIllustrationEvent, truncateForLog } from '../lib/logging';
import { loadTextArtifact, saveIllustrationArtifact, saveTextArtifact } from '../lib/storage';
import { clampNumber, normalizeHeadingLabel } from '../lib/text';
import { buildHeuristicIllustrationPlan, requestIllustrationPlanFromModel, sanitizeIllustrationPlan } from '../illustration/plan';
import { buildIllustrationArtifactId, inferJobSource, normalizeIllustrationJobStatus } from '../illustration/jobs';

export async function handleIllustrationPlan(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const traceId = createTraceId(request);
  const user = await authenticateUser(request, env);

  if (!user) {
    return buildErrorResponse('智能配图需要先登录', 401, cors);
  }

  if (!isRoleAllowed(user, ['vip', 'admin'])) {
    return buildErrorResponse('智能配图仅对 VIP 用户开放', 403, cors);
  }

  let body: IllustrationPlanRequest;
  try {
    body = await request.json() as IllustrationPlanRequest;
  } catch {
    return buildErrorResponse('请求体必须是 JSON', 400, cors);
  }

  if (!body?.markdown || typeof body.markdown !== 'string') {
    return buildErrorResponse('缺少 markdown 字段', 400, cors);
  }

  const normalizedRequest: IllustrationPlanRequest = {
    markdown: body.markdown,
    density: body.density === 'minimal' || body.density === 'balanced' || body.density === 'rich'
      ? body.density
      : 'balanced',
    preferredStyle: typeof body.preferredStyle === 'string' && body.preferredStyle.trim()
      ? body.preferredStyle.trim()
      : 'auto',
    maxImages: clampNumber(Number(body.maxImages || 3), 1, 6),
    layoutStyleId: body.layoutStyleId,
    themeId: body.themeId,
  };

  logIllustrationEvent(env, traceId, 'plan.request.received', {
    userId: user.id,
    role: user.role,
    density: normalizedRequest.density,
    preferredStyle: normalizedRequest.preferredStyle,
    maxImages: normalizedRequest.maxImages,
    markdownChars: normalizedRequest.markdown.length,
    markdownPreview: truncateForLog(normalizedRequest.markdown, getFormatPreviewChars(env)),
  });

  const heuristicPlan = buildHeuristicIllustrationPlan(normalizedRequest);
  logIllustrationEvent(env, traceId, 'plan.heuristic.generated', {
    recommendedCount: heuristicPlan.recommendedCount,
    shouldIllustrate: heuristicPlan.shouldIllustrate,
    items: heuristicPlan.items.slice(0, 4).map((item) => ({
      anchorLabel: item.anchorLabel,
      type: item.type,
      engine: item.engine,
      reason: item.reason,
    })),
  }, 'verbose');

  try {
    const modelPlan = await requestIllustrationPlanFromModel(env, normalizedRequest, heuristicPlan);
    const result = modelPlan
      ? { ...modelPlan, source: 'model' as const }
      : { ...heuristicPlan, source: 'model_fallback' as const };

    logIllustrationEvent(env, traceId, 'plan.request.completed', {
      source: result.source,
      recommendedCount: result.recommendedCount,
      shouldIllustrate: result.shouldIllustrate,
      existingImageCount: result.existingImageCount,
      items: result.items.slice(0, 4).map((item) => ({
        anchorLabel: item.anchorLabel,
        type: item.type,
        engine: item.engine,
        style: item.style,
      })),
    });

    return jsonResponse({ success: true, plan: result }, 200, cors);
  } catch (error: any) {
    logIllustrationEvent(env, traceId, 'plan.model.error', {
      error: error?.message || 'unknown',
    });
    const fallback = { ...heuristicPlan, source: 'model_fallback' as const };
    return jsonResponse({ success: true, plan: fallback }, 200, cors);
  }
}

export async function handleIllustrationJobCreate(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const traceId = createTraceId(request);
  const user = await authenticateUser(request, env);

  if (!user) {
    return buildErrorResponse('Login required for illustration jobs.', 401, cors);
  }

  if (!isRoleAllowed(user, ['vip', 'admin'])) {
    return buildErrorResponse('Illustration jobs require VIP access.', 403, cors);
  }

  let body: IllustrationJobRequest;
  try {
    body = await request.json() as IllustrationJobRequest;
  } catch {
    return buildErrorResponse('Request body must be valid JSON.', 400, cors);
  }

  if (!body?.markdown || typeof body.markdown !== 'string') {
    return buildErrorResponse('Missing markdown field.', 400, cors);
  }

  const selectedIds = Array.isArray(body.selectedIds)
    ? Array.from(new Set(body.selectedIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)))
    : [];

  if (selectedIds.length === 0) {
    return buildErrorResponse('Select at least one illustration suggestion first.', 400, cors);
  }

  const fallbackPlan = buildHeuristicIllustrationPlan({
    markdown: body.markdown,
    density: body.plan?.density || 'balanced',
    preferredStyle: body.plan?.preferredStyle || 'auto',
    maxImages: body.plan?.items?.length || selectedIds.length,
  });

  const normalizedPlan = body.plan
    ? sanitizeIllustrationPlan(body.plan, fallbackPlan) ?? fallbackPlan
    : fallbackPlan;

  const selectedItems = normalizedPlan.items
    .filter((item) => selectedIds.includes(item.id))
    .sort((left, right) => left.priority - right.priority)
    .slice(0, 6);

  if (selectedItems.length === 0) {
    return buildErrorResponse('No valid illustration suggestions were selected.', 400, cors);
  }

  const jobId = crypto.randomUUID();
  const baseKey = `illustration-jobs/${jobId}`;
  const requestOrigin = new URL(request.url).origin;
  const sourceMarkdownKey = `${baseKey}/source.md`;
  const planKey = `${baseKey}/plan.json`;
  const resultMarkdownKey = `${baseKey}/result.md`;
  const createdAt = new Date().toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO illustration_jobs (
        id,
        user_id,
        status,
        source_markdown_key,
        settings_json,
        plan_summary_json
      )
      VALUES (?, ?, 'queued', ?, ?, ?)
    `).bind(
      jobId,
      user.id,
      sourceMarkdownKey,
      JSON.stringify({
        density: normalizedPlan.density,
        preferredStyle: normalizedPlan.preferredStyle,
        selectedCount: selectedItems.length,
      }),
      JSON.stringify({
        summary: normalizedPlan.summary,
        recommendedCount: normalizedPlan.recommendedCount,
        existingImageCount: normalizedPlan.existingImageCount,
        selectedIds,
      }),
    ).run();

    await saveTextArtifact(env, sourceMarkdownKey, body.markdown, 'text/markdown; charset=utf-8');
    await saveIllustrationArtifact(
      env,
      jobId,
      'source_markdown',
      sourceMarkdownKey,
      { markdownChars: body.markdown.length },
      buildIllustrationArtifactId(jobId, 'source_markdown', 'source'),
    );

    await saveTextArtifact(env, planKey, JSON.stringify({
      ...normalizedPlan,
      items: selectedItems,
    }, null, 2), 'application/json; charset=utf-8');
    await saveIllustrationArtifact(
      env,
      jobId,
      'plan_json',
      planKey,
      {
        itemCount: selectedItems.length,
        density: normalizedPlan.density,
      },
      buildIllustrationArtifactId(jobId, 'plan_json', 'selected-plan'),
    );

    const instance = await env.ILLUSTRATION_WORKFLOW.create({
      id: jobId,
      params: {
        jobId,
        traceId,
        requestOrigin,
        sourceMarkdownKey,
        planKey,
        resultMarkdownKey,
      },
    });
    const instanceStatus = await instance.status();
    const normalizedStatus = normalizeIllustrationJobStatus(instanceStatus.status);

    await env.DB.prepare(`
      UPDATE illustration_jobs
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(normalizedStatus, jobId).run();

    logIllustrationEvent(env, traceId, 'job.queued', {
      jobId,
      userId: user.id,
      role: user.role,
      selectedCount: selectedItems.length,
      workflowStatus: instanceStatus.status,
      selectedItems: selectedItems.map((item) => ({
        anchorLabel: item.anchorLabel,
        type: item.type,
        engine: item.engine,
      })),
    });

    const response: IllustrationJobResponse = {
      id: jobId,
      status: normalizedStatus,
      source: 'pending',
      insertedCount: 0,
      resultMarkdown: '',
      items: [],
      createdAt,
      updatedAt: createdAt,
      error: null,
      settings: {
        density: normalizedPlan.density,
        preferredStyle: normalizedPlan.preferredStyle,
        selectedCount: selectedItems.length,
      },
      summary: {
        summary: normalizedPlan.summary,
        recommendedCount: normalizedPlan.recommendedCount,
        existingImageCount: normalizedPlan.existingImageCount,
        selectedIds,
      },
    };

    return jsonResponse({ success: true, job: response }, 202, cors);
  } catch (error: any) {
    logIllustrationEvent(env, traceId, 'job.create.failed', {
      jobId,
      error: error?.message || 'unknown',
    });

    await env.DB.prepare(`
      UPDATE illustration_jobs
      SET status = 'failed',
          error = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(error?.message || 'unknown_error', jobId).run().catch(() => undefined);

    return buildErrorResponse(error?.message || 'Failed to create illustration job.', 500, cors);
  }
}

export async function handleIllustrationJobGet(
  jobId: string,
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const user = await authenticateUser(request, env);

  if (!user) {
    return buildErrorResponse('Login required for illustration jobs.', 401, cors);
  }

  const job = await env.DB.prepare(`
    SELECT id, user_id, status, source_markdown_key, result_markdown_key, settings_json, plan_summary_json, error, created_at, updated_at
    FROM illustration_jobs
    WHERE id = ? AND user_id = ?
  `).bind(jobId, user.id).first<{
    id: string;
    user_id: string;
    status: string;
    source_markdown_key: string | null;
    result_markdown_key: string | null;
    settings_json: string | null;
    plan_summary_json: string | null;
    error: string | null;
    created_at: string;
    updated_at: string;
  }>();

  if (!job) {
    return buildErrorResponse('Illustration job not found.', 404, cors);
  }

  const itemsResult = await env.DB.prepare(`
    SELECT id, sort_order, anchor_json, purpose, type, style, alt, image_key, image_url, engine, status, provider_meta_json
    FROM illustration_items
    WHERE job_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `).bind(jobId).all<{
    id: string;
    sort_order: number;
    anchor_json: string | null;
    purpose: string | null;
    type: IllustrationType;
    style: string | null;
    alt: string | null;
    image_key: string | null;
    image_url: string | null;
    engine: IllustrationEngine;
    status: 'completed';
    provider_meta_json: string | null;
  }>();

  let resolvedStatus = normalizeIllustrationJobStatus(job.status);
  let jobError = job.error;

  if (resolvedStatus !== 'completed' && resolvedStatus !== 'failed') {
    try {
      const instance = await env.ILLUSTRATION_WORKFLOW.get(jobId);
      const workflowStatus = await instance.status();
      resolvedStatus = normalizeIllustrationJobStatus(workflowStatus.status);
      if (workflowStatus.error?.message) {
        jobError = workflowStatus.error.message;
      }
    } catch {
      // Ignore missing workflow status and fall back to DB state.
    }
  }

  const resultMarkdown = job.result_markdown_key
    ? await loadTextArtifact(env, job.result_markdown_key).catch(() => '')
    : '';

  const items: RenderedIllustrationItem[] = (itemsResult.results || []).map((item, index) => {
    const anchor = item.anchor_json ? JSON.parse(item.anchor_json) as IllustrationAnchor : { kind: 'heading' as const, index };

    return {
      id: item.id,
      anchor,
      anchorLabel: normalizeHeadingLabel(anchor.heading || `Section ${index + 1}`),
      reason: '',
      purpose: item.purpose || '',
      type: item.type,
      engine: item.engine,
      style: item.style || 'auto',
      alt: item.alt || '',
      priority: index + 1,
      imageKey: item.image_key || '',
      imageUrl: item.image_url || '',
      status: item.status,
    };
  });

  const itemSources = (itemsResult.results || []).map((item) => {
    if (!item.provider_meta_json) return 'placeholder';
    try {
      const meta = JSON.parse(item.provider_meta_json) as { source?: 'placeholder' | 'generated' };
      return meta.source === 'generated' ? 'generated' : 'placeholder';
    } catch {
      return 'placeholder';
    }
  });
  const source = resolvedStatus === 'queued' || resolvedStatus === 'running' || resolvedStatus === 'waiting'
    ? 'pending'
    : inferJobSource(itemSources.map((itemSource, index) => ({
      imageKey: items[index]?.imageKey || '',
      imageUrl: items[index]?.imageUrl || '',
      promptKey: null,
      mimeType: '',
      mode: itemSource === 'generated' ? 'gemini_image' : 'placeholder_svg',
      source: itemSource,
    })));

  return jsonResponse({
    success: true,
    job: {
      id: job.id,
      status: resolvedStatus,
      source,
      insertedCount: items.length,
      resultMarkdown,
      items,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      error: jobError,
      settings: job.settings_json ? JSON.parse(job.settings_json) : null,
      summary: job.plan_summary_json ? JSON.parse(job.plan_summary_json) : null,
    },
  }, 200, cors);
}
