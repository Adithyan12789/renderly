import path from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error-handler.js'
import { apiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({ origin: env.clientOrigins, credentials: true }))
  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
  )
  app.use(express.json({ limit: '10mb' }))
  app.use(cookieParser())

  // Serve static render uploads
  const uploadsDir = path.resolve(process.cwd(), 'uploads')
  app.use('/uploads', express.static(uploadsDir))

  app.use('/api', apiRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
