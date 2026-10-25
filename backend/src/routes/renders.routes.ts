import { Router } from 'express'
import { z } from 'zod'
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { ProjectModel } from '../models/project.model.js'
import { RenderModel } from '../models/render.model.js'
import { ImageGenerationService } from '../services/image-generation.service.js'
import { HttpError } from '../utils/http-error.js'
import { sendSuccess } from '../utils/respond.js'

export const rendersRouter = Router()

const generateRenderSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'Prompt must be at least 3 characters')
    .max(1000, 'Prompt must be 1000 characters or fewer'),
  style: z
    .enum([
      'modern-luxury',
      'scandinavian',
      'tropical',
      'minimal',
      'japanese',
      'industrial',
      'warm-cozy',
      'futuristic',
    ])
    .default('modern-luxury'),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16']).default('16:9'),
  projectId: z.string().trim().optional().nullable(),
  setAsThumbnail: z.boolean().default(false),
})

// List user renders
rendersRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query: Record<string, unknown> = { userId: req.user!._id }
    if (req.query.projectId && typeof req.query.projectId === 'string') {
      query.projectId = req.query.projectId
    }

    const renders = await RenderModel.find(query).sort({ createdAt: -1 })
    return sendSuccess(res, {
      renders: renders.map((r) => r.toRenderJSON()),
    })
  } catch (error) {
    next(error)
  }
})

// Generate new architectural render
rendersRouter.post('/generate', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = generateRenderSchema.parse(req.body)

    let verifiedProjectId: string | null = null
    if (payload.projectId) {
      const project = await ProjectModel.findOne({
        _id: payload.projectId,
        userId: req.user!._id,
      })
      if (project) {
        verifiedProjectId = project._id.toString()
      }
    }

    // Call backend AI generation service
    const genResult = await ImageGenerationService.generateRender({
      prompt: payload.prompt,
      style: payload.style,
      aspectRatio: payload.aspectRatio,
    })

    const render = await RenderModel.create({
      userId: req.user!._id,
      projectId: verifiedProjectId,
      prompt: payload.prompt,
      enhancedPrompt: genResult.enhancedPrompt,
      style: payload.style,
      aspectRatio: payload.aspectRatio,
      imageUrl: genResult.imageUrl,
      status: 'completed',
      provider: genResult.provider,
    })

    // If setAsThumbnail was requested or project has no thumbnail, update project
    if (verifiedProjectId && payload.setAsThumbnail) {
      await ProjectModel.updateOne(
        { _id: verifiedProjectId, userId: req.user!._id },
        { thumbnailUrl: genResult.imageUrl },
      )
    }

    return sendSuccess(res, { render: render.toRenderJSON() }, 201)
  } catch (error) {
    next(error)
  }
})

// Set render as project thumbnail
rendersRouter.patch('/:id/set-thumbnail', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const render = await RenderModel.findOne({ _id: req.params.id, userId: req.user!._id })
    if (!render) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }

    const projectId = req.body.projectId || render.projectId
    if (!projectId) {
      throw new HttpError(400, 'Project ID is required', 'PROJECT_REQUIRED')
    }

    const project = await ProjectModel.findOneAndUpdate(
      { _id: projectId, userId: req.user!._id },
      { thumbnailUrl: render.imageUrl },
      { new: true },
    )

    if (!project) {
      throw new HttpError(404, 'Project not found', 'PROJECT_NOT_FOUND')
    }

    return sendSuccess(res, { project: project.toProjectJSON() })
  } catch (error) {
    next(error)
  }
})

// Delete render
rendersRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const render = await RenderModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    })
    if (!render) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }
    return sendSuccess(res, null)
  } catch (error) {
    next(error)
  }
})
