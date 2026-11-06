import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { existsSync } from 'node:fs'

// Local development: serve the Vercel Functions in /api from `npm run dev` too, so checkout, live shipping rates
// and payments can be tested without the Vercel CLI. (On Vercel these files run as real serverless functions.)
function localApi() {
  return {
    name: 'kridhya-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const path = req.url.split('?')[0].replace(/\/+$/, '')
        const file = fileURLToPath(new URL(`.${path}.js`, import.meta.url))
        if (!existsSync(file)) return next()
        try {
          const mod = await server.ssrLoadModule(file)
          const handler = mod[req.method]
          if (!handler) {
            res.statusCode = 405
            return res.end('Method not allowed')
          }
          const chunks = []
          for await (const c of req) chunks.push(c)
          const body = chunks.length ? Buffer.concat(chunks) : undefined
          const request = new Request(`http://localhost${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body })
          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          console.error('[local api]', path, e)
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // make .env / .env.local values (including server-only secrets) available to the local API routes
  Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ''), ...process.env })
  return {
    plugins: [react(), localApi()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      rollupOptions: {
        output: { manualChunks: { motion: ['framer-motion'], react: ['react', 'react-dom', 'react-router-dom'] } },
      },
    },
  }
})
