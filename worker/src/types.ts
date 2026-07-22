import type { BrowserWorker } from '@cloudflare/puppeteer';

export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  BROWSER?: BrowserWorker;
  ILLUSTRATION_WORKFLOW: Workflow<IllustrationWorkflowParams>;
  UPLOAD_SECRET: string;
  ALLOWED_ORIGINS: string;
  OPENAI_API_KEY: string;
  OPENAI_API_BASE?: string;
  OPENAI_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_IMAGE_MODEL?: string;
  AI_FORMAT_AUTH_MODE?: string;
  AI_FORMAT_LOG_LEVEL?: string;
  AI_FORMAT_LOG_PREVIEW_CHARS?: string;
}

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

export type FormatLogLevel = 'off' | 'basic' | 'verbose';
export type AiFormatAuthMode = 'secret' | 'user' | 'either' | 'off';
export type IllustrationDensity = 'minimal' | 'balanced' | 'rich';
export type IllustrationType = 'scene' | 'cover' | 'infographic' | 'flowchart' | 'comparison' | 'framework' | 'timeline';
export type IllustrationEngine = 'http_image' | 'html_infographic';

export type IllustrationPlanRequest = {
  markdown: string;
  density?: IllustrationDensity;
  preferredStyle?: string;
  maxImages?: number;
  layoutStyleId?: string;
  themeId?: string;
};

export type IllustrationAnchor = {
  kind: 'heading' | 'paragraph';
  heading?: string;
  index: number;
  excerpt?: string;
};

export type IllustrationPlanItem = {
  id: string;
  anchor: IllustrationAnchor;
  anchorLabel: string;
  reason: string;
  purpose: string;
  type: IllustrationType;
  engine: IllustrationEngine;
  style: string;
  alt: string;
  priority: number;
};

export type IllustrationPlanResult = {
  shouldIllustrate: boolean;
  summary: string;
  recommendedCount: number;
  density: IllustrationDensity;
  preferredStyle: string;
  existingImageCount: number;
  source: 'heuristic' | 'model' | 'model_fallback';
  items: IllustrationPlanItem[];
};

export type IllustrationJobRequest = {
  markdown: string;
  plan?: IllustrationPlanResult;
  selectedIds?: string[];
};

export type IllustrationWorkflowParams = {
  jobId: string;
  traceId: string;
  requestOrigin: string;
  sourceMarkdownKey: string;
  planKey: string;
  resultMarkdownKey: string;
};

export type IllustrationJobStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'failed';

export type RenderedIllustrationItem = IllustrationPlanItem & {
  imageKey: string;
  imageUrl: string;
  status: 'completed';
};

export type IllustrationJobResponse = {
  id: string;
  status: IllustrationJobStatus;
  source: 'pending' | 'placeholder' | 'generated' | 'hybrid';
  insertedCount: number;
  resultMarkdown: string;
  items: RenderedIllustrationItem[];
  createdAt: string;
  updatedAt?: string;
  error?: string | null;
  settings?: unknown;
  summary?: unknown;
};

export type IllustrationSectionContext = {
  heading: string;
  content: string;
  points: string[];
  bulletPoints: string[];
  sentencePoints: string[];
};

export type IllustrationHighlight = {
  label: string;
  detail: string;
};

export type IllustrationComparisonColumn = {
  title: string;
  points: string[];
};

export type IllustrationFlowSpec = {
  steps: string[];
};

export type IllustrationFrameworkSpec = {
  core: string;
  pillars: string[];
};

export type IllustrationTimelineStage = {
  label: string;
  note: string;
};

export type IllustrationLayout = 'overview' | 'linear-progression' | 'binary-comparison' | 'hub-spoke' | 'bridge';

export type IllustrationBridgeSpec = {
  problem: string;
  tension: string;
  decision: string;
  outcome: string;
};

export type IllustrationStructuredSpec = {
  layout: IllustrationLayout;
  title: string;
  subtitle: string;
  takeaway: string;
  highlights: IllustrationHighlight[];
  comparison: {
    left: IllustrationComparisonColumn;
    right: IllustrationComparisonColumn;
    conclusion: string;
  } | null;
  flow: IllustrationFlowSpec | null;
  framework: IllustrationFrameworkSpec | null;
  timeline: IllustrationTimelineStage[];
  bridge: IllustrationBridgeSpec | null;
};

export type IllustrationAssetResult = {
  imageKey: string;
  imageUrl: string;
  promptKey: string | null;
  htmlKey?: string | null;
  mimeType: string;
  mode: 'gemini_image' | 'browser_rendered_html' | 'svg_infographic' | 'placeholder_svg';
  source: 'placeholder' | 'generated';
};
