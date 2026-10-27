import crypto from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { ProjectModel } from '../models/project.model.js'
import { RenderModel } from '../models/render.model.js'
import { UserModel, type UserPlan } from '../models/user.model.js'
import { HttpError } from '../utils/http-error.js'
import { sendSuccess } from '../utils/respond.js'

export const subscriptionsRouter = Router()

export const PLANS_CONFIG = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'For testing Renderly on architectural massing and room blockouts',
    priceInr: { monthly: 0, annual: 0 },
    rendersLimit: 5,
    projectsLimit: 1,
    maxQuality: '1080p',
    canFlythrough: false,
    canRelight: true,
    features: [
      '5 AI photorealistic renders / month',
      '1 active architectural project',
      'Standard HD 1080p downloads',
      'Vibe3D Instant Relighting presets',
      'Community email support',
    ],
  },
  studio: {
    id: 'studio',
    name: 'Studio Pro',
    tagline: 'For architectural practices, interior designers & visualization artists',
    priceInr: { monthly: 1499, annual: 14990 }, // ~₹1,249/mo on annual (2 months free)
    rendersLimit: 100,
    projectsLimit: 15,
    maxQuality: '4k',
    canFlythrough: true,
    canRelight: true,
    recommended: true,
    features: [
      '100 AI photorealistic renders / month',
      '15 active architectural projects',
      'Ultra HD 4K & Studio 2K Master exports (PNG / JPG)',
      'Cinematic 60FPS 4K Flythrough Walkthroughs',
      'Vibe3D Instant Relight & Macro Close-ups Studio',
      'HyperReal 8K Studio upscale engine',
      'Commercial client presentation rights',
      'Priority GPU ray-tracing queue',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Studio',
    tagline: 'For large design firms, development agencies & visualization teams',
    priceInr: { monthly: 4999, annual: 49990 },
    rendersLimit: -1, // Unlimited
    projectsLimit: -1, // Unlimited
    maxQuality: '4k',
    canFlythrough: true,
    canRelight: true,
    features: [
      'Unlimited AI photorealistic renders',
      'Unlimited architectural projects',
      'Uncapped 4K & 8K Master quality downloads',
      'Unlimited 60FPS drone & flythrough videos',
      'Full Vibe3D AI optical & relighting suite',
      'Dedicated GPU rendering compute pipeline',
      'Team workspace & client project sharing',
      'Dedicated 24/7 account manager & SLA',
    ],
  },
} as const

// Get available subscription plans
subscriptionsRouter.get('/plans', (_req, res) => {
  return sendSuccess(res, {
    plans: Object.values(PLANS_CONFIG),
    currency: 'INR',
    razorpayKeyId: env.RAZORPAY_KEY_ID,
  })
})

// Get current user usage & subscription status
subscriptionsRouter.get('/usage', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.user!._id)
    if (!user) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND')
    }

    const currentPlanKey = (user.plan || 'starter') as UserPlan
    const planConfig = PLANS_CONFIG[currentPlanKey] || PLANS_CONFIG.starter

    // Calculate current usage
    const rendersCount = await RenderModel.countDocuments({ userId: user._id })
    const projectsCount = await ProjectModel.countDocuments({ userId: user._id })

    const effectiveRendersLimit =
      user.rendersLimit ?? (planConfig.rendersLimit === -1 ? -1 : planConfig.rendersLimit)
    const effectiveProjectsLimit =
      user.projectsLimit ?? (planConfig.projectsLimit === -1 ? -1 : planConfig.projectsLimit)

    return sendSuccess(res, {
      plan: currentPlanKey,
      planName: planConfig.name,
      subscriptionStatus: user.subscriptionStatus || 'active',
      subscriptionPeriodEnd: user.subscriptionPeriodEnd || null,
      billingCycle: user.billingCycle || 'monthly',
      usage: {
        rendersCount,
        rendersLimit: effectiveRendersLimit,
        rendersRemaining: effectiveRendersLimit === -1 ? 'Unlimited' : Math.max(0, effectiveRendersLimit - rendersCount),
        projectsCount,
        projectsLimit: effectiveProjectsLimit,
        projectsRemaining: effectiveProjectsLimit === -1 ? 'Unlimited' : Math.max(0, effectiveProjectsLimit - projectsCount),
      },
      features: {
        maxQuality: planConfig.maxQuality,
        canFlythrough: planConfig.canFlythrough,
        canRelight: planConfig.canRelight,
      },
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    next(error)
  }
})

// Create Razorpay order
subscriptionsRouter.post('/create-order', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const orderSchema = z.object({
      plan: z.enum(['studio', 'enterprise']),
      billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
    })
    const { plan, billingCycle } = orderSchema.parse(req.body)

    const selectedPlan = PLANS_CONFIG[plan]
    const price = billingCycle === 'annual' ? selectedPlan.priceInr.annual : selectedPlan.priceInr.monthly
    const amountInPaise = price * 100 // Convert INR to paise

    let orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

    // If Razorpay Key Secret is configured, call official Razorpay API
    if (env.RAZORPAY_KEY_SECRET) {
      try {
        const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${req.user!._id}_${Date.now()}`,
            notes: {
              userId: req.user!._id.toString(),
              plan,
              billingCycle,
              appName: 'Renderly AI',
            },
          }),
        })

        if (rzpResponse.ok) {
          const rzpData = (await rzpResponse.json()) as { id: string }
          if (rzpData?.id) {
            orderId = rzpData.id
          }
        } else {
          const errBody = await rzpResponse.text()
          console.warn('[Razorpay] Order API returned error, falling back to direct test order:', errBody)
        }
      } catch (rzpErr) {
        console.warn('[Razorpay] Order API call failed, proceeding with client checkout:', rzpErr)
      }
    }

    return sendSuccess(res, {
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      plan,
      planName: selectedPlan.name,
      billingCycle,
    })
  } catch (error) {
    next(error)
  }
})

// Verify Razorpay payment and upgrade plan
subscriptionsRouter.post('/verify-payment', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const verifySchema = z.object({
      razorpay_order_id: z.string().optional(),
      razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
      razorpay_signature: z.string().optional(),
      plan: z.enum(['studio', 'enterprise']),
      billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
    })
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billingCycle } =
      verifySchema.parse(req.body)

    // Verify HMAC signature if Razorpay Secret is provided
    if (env.RAZORPAY_KEY_SECRET && razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      if (generatedSignature !== razorpay_signature) {
        throw new HttpError(400, 'Invalid payment signature. Verification failed.', 'INVALID_PAYMENT_SIGNATURE')
      }
    }

    const selectedPlan = PLANS_CONFIG[plan]

    // Set billing cycle period
    const periodDays = billingCycle === 'annual' ? 365 : 30
    const periodEndDate = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000)

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user!._id,
      {
        $set: {
          plan,
          subscriptionStatus: 'active',
          subscriptionPeriodEnd: periodEndDate,
          billingCycle,
          rendersLimit: selectedPlan.rendersLimit,
          projectsLimit: selectedPlan.projectsLimit,
          razorpayOrderId: razorpay_order_id || null,
          razorpayPaymentId: razorpay_payment_id,
        },
      },
      { new: true },
    )

    if (!updatedUser) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND')
    }

    console.log(
      `[Subscriptions] User ${updatedUser.email} upgraded to ${plan.toUpperCase()} (${billingCycle}). Payment: ${razorpay_payment_id}`,
    )

    return sendSuccess(res, {
      user: updatedUser.toUserJSON(),
      message: `Congratulations! Your account has been upgraded to ${selectedPlan.name}.`,
    })
  } catch (error) {
    next(error)
  }
})
