# GZH Typesetter Worker

Cloudflare Worker backend for auth, presets, image upload, AI typesetting, and smart illustration jobs.

## Required bindings

- `DB`: D1 database
- `IMAGES_BUCKET`: R2 bucket
- `ILLUSTRATION_WORKFLOW`: Cloudflare Workflow binding for async illustration jobs
- `BROWSER`: Browser Rendering binding if you want HTML/CSS infographics rendered as PNG

## Required secrets

- `OPENAI_API_KEY`: used by `/api/format`, `/api/cover-copy`, `/api/xhs-cards` and optional illustration planning refinement

## Optional secrets

- `UPLOAD_SECRET`: legacy secret-based auth for upload or mixed AI proxy mode
- `GEMINI_API_KEY`: enables real image generation for `http_image` illustration items

## Optional vars

- `ALLOWED_ORIGINS`
- `AI_FORMAT_AUTH_MODE`
- `AI_FORMAT_LOG_LEVEL`
- `AI_FORMAT_LOG_PREVIEW_CHARS`
- `GEMINI_IMAGE_MODEL`

## Smart Illustration Behavior

- `POST /api/illustration/plan`
  - requires logged-in `vip/admin`
  - returns illustration suggestions only

- `POST /api/illustration/jobs`
  - requires logged-in `vip/admin`
  - persists source markdown and selected plan, then enqueues a Workflow instance
  - returns `202 Accepted`; the client should poll `GET /api/illustration/jobs/:id`

- `GET /api/illustration/jobs/:id`
  - returns async job status: `queued | running | waiting | completed | failed`
  - includes generated assets and final markdown once the Workflow completes

- `GET /api/admin/diagnostics`
  - requires logged-in `admin`
  - returns Worker runtime config, binding/secrets presence, schema readiness, and recent illustration jobs

Current engine behavior:

- `http_image`
  - if `GEMINI_API_KEY` is configured, the Worker calls Gemini image generation with `GEMINI_IMAGE_MODEL`
  - if Gemini is unavailable or fails, it falls back to `html_infographic` rendering

- `html_infographic`
  - if `BROWSER` is configured, rendered as HTML/CSS templates and screenshotted to PNG
  - otherwise falls back to structured SVG infographic templates
  - `infographic / comparison / flowchart / framework / timeline` now use structured-content rendering instead of directly laying raw sentences into cards
  - when `OPENAI_API_KEY` is configured, the Worker first asks the model to compress section content into structured infographic data before rendering
  - low-quality structured summaries are now rejected and fall back to more content-grounded heuristics
  - `infographic` now chooses an internal layout (`bridge / linear-progression / overview`) before rendering, so strategy sections are no longer forced into a generic overview card layout

## Setup

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GEMINI_API_KEY
```

Apply the latest schema before using illustration jobs:

```bash
npx wrangler d1 execute gzh-typesetter-db --file=./schema.sql
```
