import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { type IUser, UserModel } from '../models/user.model.js'
import { HttpError } from '../utils/http-error.js'
import { verifyToken } from '../utils/security.js'

export interface AuthenticatedRequest extends Request {
  user?: IUser
}

export function extractToken(req: Request): string | null {
  if (req.cookies) {
    if (typeof req.cookies.renderly_session === 'string') return req.cookies.renderly_session
    if (typeof req.cookies.lucent_session === 'string') return req.cookies.lucent_session
  }
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  return null
}

export const requireAuth: RequestHandler = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    if (!token) {
      throw new HttpError(401, 'Authentication required. Please log in.', 'UNAUTHORIZED')
    }

    const payload = verifyToken(token)
    if (!payload) {
      throw new HttpError(401, 'Session expired or invalid. Please log in again.', 'UNAUTHORIZED')
    }

    const user = await UserModel.findById(payload.userId)
    if (!user) {
      throw new HttpError(401, 'User account no longer exists.', 'UNAUTHORIZED')
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export const optionalAuth: RequestHandler = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        const user = await UserModel.findById(payload.userId)
        if (user) {
          req.user = user
        }
      }
    }
    next()
  } catch {
    next()
  }
}
