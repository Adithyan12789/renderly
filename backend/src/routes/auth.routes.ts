import { Router, type Response } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { UserModel } from '../models/user.model.js'
import { HttpError } from '../utils/http-error.js'
import { sendSuccess } from '../utils/respond.js'
import { createToken, hashPassword, verifyPassword } from '../utils/security.js'

export const authRouter = Router()

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
})

function setAuthCookie(res: Response, token: string) {
  res.cookie('renderly_session', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)

    const existing = await UserModel.findOne({ email })
    if (existing) {
      throw new HttpError(409, 'An account with this email already exists.', 'EMAIL_EXISTS')
    }

    const passwordHash = hashPassword(password)
    const user = await UserModel.create({
      name,
      email,
      passwordHash,
      plan: 'starter',
    })

    const token = createToken(user._id.toString())
    setAuthCookie(res, token)

    return sendSuccess(res, { user: user.toUserJSON(), token }, 201)
  } catch (error) {
    next(error)
  }
})

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await UserModel.findOne({ email })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
    }

    const token = createToken(user._id.toString())
    setAuthCookie(res, token)

    return sendSuccess(res, { user: user.toUserJSON(), token })
  } catch (error) {
    next(error)
  }
})

// Logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('renderly_session', { path: '/' })
  res.clearCookie('lucent_session', { path: '/' })
  return sendSuccess(res, null)
})

// Current user profile
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return sendSuccess(res, { user: req.user!.toUserJSON() })
})

// Forgot Password
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    // We confirm request received without leaking user existence
    console.log(`Password reset requested for email: ${email}`)
    return sendSuccess(res, null)
  } catch (error) {
    next(error)
  }
})
