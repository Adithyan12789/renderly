import { Router } from 'express'
import { z } from 'zod'
import { type AuthenticatedRequest, optionalAuth, requireAuth } from '../middleware/auth.js'
import { ProjectModel } from '../models/project.model.js'
import { UserModel } from '../models/user.model.js'
import { HttpError } from '../utils/http-error.js'
import { sendSuccess } from '../utils/respond.js'

export const projectsRouter = Router()

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120, 'Name must be 120 characters or fewer'),
  description: z.string().trim().max(1000).default(''),
  type: z.enum(['architecture', 'interior', 'product']),
  thumbnailUrl: z.string().trim().optional().nullable(),
})

const DEFAULT_THUMBNAILS: Record<string, string> = {
  architecture: '/images/hero-villa.png',
  interior: '/images/gallery-loft.png',
  product: '/images/gallery-pavilion.png',
}

// List user projects
projectsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const projects = await ProjectModel.find({ userId: req.user!._id }).sort({ updatedAt: -1 })
    return sendSuccess(res, {
      projects: projects.map((p) => p.toProjectJSON()),
    })
  } catch (error) {
    next(error)
  }
})

// Create new project
projectsRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = createProjectSchema.parse(req.body)

    // Check user plan project limit
    const user = await UserModel.findById(req.user!._id)
    if (user) {
      const projectCount = await ProjectModel.countDocuments({ userId: user._id })
      const limit = user.projectsLimit ?? (user.plan === 'studio' ? 15 : user.plan === 'enterprise' ? -1 : 1)
      if (limit !== -1 && projectCount >= limit) {
        throw new HttpError(
          403,
          `You have reached the project limit (${limit} active project) for your ${user.plan.toUpperCase()} plan. Please upgrade to Studio to create up to 15 projects.`,
          'PLAN_PROJECT_LIMIT_REACHED',
        )
      }
    }

    const project = await ProjectModel.create({
      userId: req.user!._id,
      name: payload.name,
      description: payload.description,
      type: payload.type,
      thumbnailUrl: payload.thumbnailUrl || DEFAULT_THUMBNAILS[payload.type] || null,
    })

    return sendSuccess(res, { project: project.toProjectJSON() }, 201)
  } catch (error) {
    next(error)
  }
})

// Get single project
projectsRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await ProjectModel.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    })
    if (!project) {
      throw new HttpError(404, 'Project not found.', 'PROJECT_NOT_FOUND')
    }
    return sendSuccess(res, { project: project.toProjectJSON() })
  } catch (error) {
    next(error)
  }
})

// Update project
const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(['architecture', 'interior', 'product']).optional(),
  thumbnailUrl: z.string().trim().optional().nullable(),
})

projectsRouter.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = updateProjectSchema.parse(req.body)
    const project = await ProjectModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { $set: payload },
      { new: true },
    )
    if (!project) {
      throw new HttpError(404, 'Project not found.', 'PROJECT_NOT_FOUND')
    }
    return sendSuccess(res, { project: project.toProjectJSON() })
  } catch (error) {
    next(error)
  }
})

// Delete project
projectsRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await ProjectModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    })
    if (!project) {
      throw new HttpError(404, 'Project not found or not owned by you.', 'PROJECT_NOT_FOUND')
    }
    return sendSuccess(res, null)
  } catch (error) {
    next(error)
  }
})
