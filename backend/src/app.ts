import path from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error-handler.js'
import { apiRouter } from './routes/index.js'
import { rendersRouter } from './routes/renders.routes.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true)

        const isAllowed =
          env.clientOrigins.includes(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

        if (isAllowed) {
          return callback(null, true)
        }
        return callback(null, false)
      },
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  )
  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
  )
  app.use(express.json({ limit: '25mb' }))
  app.use(express.urlencoded({ limit: '25mb', extended: true }))
  app.use(cookieParser())

  // Serve static render uploads
  const uploadsDir = path.resolve(process.cwd(), 'uploads')
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      next()
    },
    express.static(uploadsDir),
  )

  app.use('/renders', rendersRouter)
  app.use('/api', apiRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
