import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError, z } from 'zod'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route ${req.method} ${req.path} was not found.`, 'NOT_FOUND'))
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request.', details: z.flattenError(error).fieldErrors },
    })
    return
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    })
    return
  }

  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, error: { code: 'INVALID_JSON', message: 'Malformed JSON body.' } })
    return
  }

  console.error(error)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProduction ? 'Something went wrong.' : String(error?.message ?? error),
    },
  })
}
