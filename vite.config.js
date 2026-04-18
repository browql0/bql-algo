/* global Buffer, process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function applyLocalEnv(mode) {
  const env = loadEnv(mode, process.cwd(), '')

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, body, headers = {}) {
  res.statusCode = status

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value)
  }

  if (!res.hasHeader('Content-Type')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  res.end(JSON.stringify(body))
}

function localValidationApiPlugin() {
  return {
    name: 'local-validation-api',
    configureServer(server) {
      server.middlewares.use('/api/submit', async (req, res) => {
        try {
          const rawBody = await readRequestBody(req)
          const { handleSubmitRequest } = await import('./server/submitHandler.js')
          const result = await handleSubmitRequest({
            method: req.method,
            headers: req.headers,
            body: rawBody || undefined,
          })

          sendJson(res, result.status, result.body, result.headers)
        } catch (error) {
          console.error('[local-validation-api] uncaught exception', error)
          sendJson(res, 500, {
            success: false,
            passed: 0,
            total: 0,
            message: 'Erreur interne du serveur de validation local.',
            errorCode: 'LOCAL_SERVER_EXCEPTION',
            details: error?.message || null,
            validationMode: null,
            exerciseId: null,
            cases: [],
            constraints: null,
            diagnostics: [],
            feedbackReport: null,
          })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  applyLocalEnv(mode)

  return {
    plugins: [react(), localValidationApiPlugin()],
  }
})
