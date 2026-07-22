import type { Env } from '../types';
import { requireAdminUser } from '../lib/auth';
import { jsonResponse } from '../lib/http';
import { getFormatLogLevel, getFormatPreviewChars } from '../lib/logging';
import { getAiFormatAuthMode } from '../lib/permissions';

export async function handleAdminDiagnostics(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const admin = await requireAdminUser(request, env, cors);
  if (admin instanceof Response) return admin;

  const requiredTables = [
    'users',
    'sessions',
    'presets',
    'illustration_jobs',
    'illustration_items',
    'illustration_artifacts',
  ];

  let tables: string[] = [];
  let counts = {
    users: 0,
    sessions: 0,
    presets: 0,
    illustrationJobs: 0,
    runningIllustrationJobs: 0,
  };
  let recentJobs: Array<{ id: string; status: string; createdAt: string; updatedAt: string }> = [];
  let databaseError: string | null = null;

  try {
    const tableResult = await env.DB.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name ASC
    `).all<{ name: string }>();
    tables = (tableResult.results || []).map((row) => row.name);

    const countRow = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM sessions) AS sessions,
        (SELECT COUNT(*) FROM presets) AS presets,
        (SELECT COUNT(*) FROM illustration_jobs) AS illustrationJobs,
        (SELECT COUNT(*) FROM illustration_jobs WHERE status IN ('queued', 'running', 'waiting')) AS runningIllustrationJobs
    `).first<{
      users: number;
      sessions: number;
      presets: number;
      illustrationJobs: number;
      runningIllustrationJobs: number;
    }>();

    counts = {
      users: Number(countRow?.users || 0),
      sessions: Number(countRow?.sessions || 0),
      presets: Number(countRow?.presets || 0),
      illustrationJobs: Number(countRow?.illustrationJobs || 0),
      runningIllustrationJobs: Number(countRow?.runningIllustrationJobs || 0),
    };

    const recentJobRows = await env.DB.prepare(`
      SELECT id, status, created_at AS createdAt, updated_at AS updatedAt
      FROM illustration_jobs
      ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
      LIMIT 5
    `).all<{ id: string; status: string; createdAt: string; updatedAt: string }>();

    recentJobs = (recentJobRows.results || []).map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    databaseError = error instanceof Error ? error.message : 'unknown_database_error';
  }

  return jsonResponse({
    success: true,
    diagnostics: {
      checkedAt: new Date().toISOString(),
      viewer: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      runtime: {
        authMode: getAiFormatAuthMode(env),
        logLevel: getFormatLogLevel(env),
        previewChars: getFormatPreviewChars(env),
        allowedOrigins: env.ALLOWED_ORIGINS || '',
      },
      bindings: {
        db: Boolean(env.DB),
        imagesBucket: Boolean(env.IMAGES_BUCKET),
        workflow: Boolean(env.ILLUSTRATION_WORKFLOW),
        browser: Boolean(env.BROWSER),
      },
      secrets: {
        openAiConfigured: Boolean(env.OPENAI_API_KEY),
        openAiBaseConfigured: Boolean(env.OPENAI_API_BASE),
        openAiModel: env.OPENAI_MODEL || 'gpt-4o',
        geminiConfigured: Boolean(env.GEMINI_API_KEY),
        geminiImageModel: env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
        uploadSecretConfigured: Boolean(env.UPLOAD_SECRET),
      },
      database: {
        ok: !databaseError,
        error: databaseError,
        schema: Object.fromEntries(requiredTables.map((table) => [table, tables.includes(table)])),
        counts,
        recentJobs,
      },
    },
  }, 200, cors);
}
