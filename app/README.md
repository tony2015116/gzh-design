# GZH Typesetter Frontend

React + TypeScript + Vite frontend for the markdown-based WeChat article typesetter.

## Modes

The frontend supports two build modes controlled by Vite env files:

- `oss`: local development / open-source mode. AI calls go directly from the browser.
- `online`: hosted mode. AI calls and auth go through the Cloudflare Worker.

Tracked env files:

- `.env`: shared public defaults
- `.env.oss`: defaults for the OSS build
- `.env.online`: defaults for the hosted build
- `.env.example`: example values for deployment

Public frontend env vars:

- `VITE_APP_MODE`: `oss` or `online`
- `VITE_AUTH_MODE`: `mock`, `real`, or `off`
- `VITE_ACCESS_MODE`: `mock`, `real`, or `off`
- `VITE_DEV_USER_ROLE`: `guest`, `free`, `vip`, or `admin`
- `VITE_WORKER_URL`: public Worker base URL used by auth, image upload, and hosted AI proxy
- `VITE_WORKER_UPLOAD_SECRET`: optional public token if the Worker is configured to require one
- `VITE_DEFAULT_UPLOAD_MODE`: `base64`, `r2`, or `custom`
- `VITE_OSS_AI_LOG_LEVEL`: `off`, `basic`, or `verbose` for terminal logging in `oss` dev mode
- `VITE_OSS_AI_LOG_PREVIEW_CHARS`: max preview characters printed for OSS AI request/response logs

## Commands

```bash
npm run dev:oss
npm run dev:online
npm run build:oss
npm run build:online
```

`npm run dev` and `npm run build` default to `oss`.

## Notes

- In `oss` mode, users can configure the API key and model in the browser.
- In `oss` mode, auth defaults to `mock`, and the homepage exposes a local identity switcher for `guest / free / vip / admin`.
- In `oss` mode, AI debug logs are printed to the terminal running `npm run dev:oss`.
- In `oss` mode, smart illustration generation uses local structured SVG templates and rasterizes them to PNG before insertion, so the full confirm/apply flow stays testable without Worker secrets.
- In `oss` mode, smart illustration assets are rasterized locally to PNG before insertion, and scene images fall back to infographic-style rendering when no real image model is available.
- In `online` mode, auth and access should both be `real`, and `/api/format` should run with `AI_FORMAT_AUTH_MODE=user` on the Worker.
- In `online` mode, smart illustration plans require a logged-in `vip/admin`; real scene images additionally require `GEMINI_API_KEY`, and HTML infographic screenshots require the Worker `BROWSER` binding.
- In `online` mode, the Worker URL should come from env so end users do not need local setup.
- Image upload defaults to `base64` in `oss` mode and `r2` in `online` mode.
- The admin page now includes a local diagnostics card in every mode and, in `online` mode, an admin-only Worker diagnostics panel.
- The main editor now supports one source Markdown with multiple export targets: WeChat HTML, X Thread, and X Article. Exporting one platform does not overwrite the others.
- X Article export now includes a styled rich-text preview and writes both `text/html` and `text/plain` to the clipboard so headings, lists, code blocks, and image presentation survive paste more reliably.
- When Markdown contains fenced code blocks, the X Article panel also exposes each code block as a separate copy target for X's native code insertion flow.
