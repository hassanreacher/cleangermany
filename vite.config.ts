import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * Local dev shim for the Vercel serverless functions in /api/*.ts.
 * On Vercel the file is deployed automatically; here we mount the same
 * handler on the Vite dev server so `npm run dev` works end-to-end.
 */
function localApi(): Plugin {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      // make server-side variables (SUPABASE_*, SMTP_*, GROQ_*) available to the handlers in dev
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use('/api', async (req, res) => {
        try {
          const name = (req.url ?? '/').split('?')[0].replace(/^\//, '').split('/')[0]
          if (!/^[a-z]+$/.test(name)) { res.statusCode = 404; res.end('not found'); return }
          const mod = await server.ssrLoadModule(`/api/${name}.ts`)
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : {}
          const vreq = { method: req.method, body, headers: req.headers }
          const vres = {
            statusCode: 200,
            status(code: number) { this.statusCode = code; return this },
            json(data: unknown) {
              res.statusCode = this.statusCode
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(data))
            },
          }
          await mod.default(vreq, vres)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: String(e) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          charts: ['recharts'],
        },
      },
    },
  },
})
