import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

function truncateForTerminal(value: string, limit = 220) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit)}...`
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function ossAiLogPlugin() {
  return {
    name: 'oss-ai-log-plugin',
    apply: 'serve' as const,
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void | Promise<void>,
        ) => void
      }
    }) {
      server.middlewares.use('/__debug/ai-log', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const raw = await readBody(req)
          const payload = raw ? JSON.parse(raw) : {}
          const traceId = payload.traceId || 'unknown'
          const stage = payload.stage || 'unknown'
          const at = payload.at || new Date().toISOString()
          const sanitized = {
            ...payload,
            markdownPreview: typeof payload.markdownPreview === 'string' ? truncateForTerminal(payload.markdownPreview) : payload.markdownPreview,
            outputPreview: typeof payload.outputPreview === 'string' ? truncateForTerminal(payload.outputPreview) : payload.outputPreview,
            errorPreview: typeof payload.errorPreview === 'string' ? truncateForTerminal(payload.errorPreview) : payload.errorPreview,
          }

          console.log(`[oss-ai][${traceId}] ${stage} ${at} ${JSON.stringify(sanitized)}`)
          res.statusCode = 204
          res.end()
        } catch (error) {
          console.error('[oss-ai] failed to print debug log', error)
          res.statusCode = 500
          res.end()
        }
      })

      server.middlewares.use('/__debug/illustration-log', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const raw = await readBody(req)
          const payload = raw ? JSON.parse(raw) : {}
          const traceId = payload.traceId || 'unknown'
          const stage = payload.stage || 'unknown'
          const at = payload.at || new Date().toISOString()
          const sanitized = {
            ...payload,
            markdownPreview: typeof payload.markdownPreview === 'string' ? truncateForTerminal(payload.markdownPreview) : payload.markdownPreview,
            contentPreview: typeof payload.contentPreview === 'string' ? truncateForTerminal(payload.contentPreview) : payload.contentPreview,
            outputPreview: typeof payload.outputPreview === 'string' ? truncateForTerminal(payload.outputPreview) : payload.outputPreview,
            specPreview: typeof payload.specPreview === 'string' ? truncateForTerminal(payload.specPreview) : payload.specPreview,
            errorPreview: typeof payload.errorPreview === 'string' ? truncateForTerminal(payload.errorPreview) : payload.errorPreview,
          }

          console.log(`[oss-illustration][${traceId}] ${stage} ${at} ${JSON.stringify(sanitized)}`)
          res.statusCode = 204
          res.end()
        } catch (error) {
          console.error('[oss-illustration] failed to print debug log', error)
          res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

// OSS 模式下浏览器直连 OpenAI 兼容接口时，部分第三方中转没有返回 CORS 头，
// 会被浏览器拦截。dev server 提供同源代理 /__ai-proxy，由 Node 端转发以绕开跨域。
function aiProxyPlugin() {
  return {
    name: 'ai-proxy-plugin',
    apply: 'serve' as const,
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void | Promise<void>,
        ) => void
      }
    }) {
      server.middlewares.use('/__ai-proxy', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }

        try {
          const raw = await readBody(req)
          const { endpoint, headers, payload } = JSON.parse(raw || '{}')

          if (typeof endpoint !== 'string' || !/^https?:\/\//.test(endpoint)) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: { message: 'invalid endpoint' } }))
            return
          }

          const upstream = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(headers || {}) },
            body: JSON.stringify(payload),
          })
          const text = await upstream.text()

          res.statusCode = upstream.status
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
          res.end(text)
        } catch (error) {
          console.error('[ai-proxy] forward failed', error)
          res.statusCode = 502
          res.end(JSON.stringify({ error: { message: String(error) } }))
        }
      })
    },
  }
}

export default defineConfig(({ command, mode }) => ({
  // cloudflare() 只在 build 时启用：它只是为 Cloudflare 静态资产部署服务，
  // dev 时启用会额外拉起 miniflare 并联网拉取 Request.cf 占位数据，
  // 网络不通时会在启动阶段刷 TimeoutError（非致命但很吵）。
  plugins: [react(), tailwindcss(), ossAiLogPlugin(), aiProxyPlugin(), ...(command === 'build' && mode !== 'server' ? [cloudflare()] : [])],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
}))
