import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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

export default defineConfig({
  plugins: [react(), tailwindcss(), ossAiLogPlugin()],
})
