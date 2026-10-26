import { Router } from 'express'
import { z } from 'zod'
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { ProjectModel } from '../models/project.model.js'
import { RenderModel, type RenderAspectRatio } from '../models/render.model.js'
import { ImageGenerationService } from '../services/image-generation.service.js'
import { HttpError } from '../utils/http-error.js'
import { sendSuccess } from '../utils/respond.js'

export const rendersRouter = Router()

const generateRenderSchema = z
  .object({
    image: z.string().trim().optional(),
    prompt: z.string().trim().max(1000).optional(),
    refinementPrompt: z.string().trim().max(1000).optional(),
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
    engine: z.enum(['hyperreal', 'lumen', 'fidelity']).default('hyperreal'),
    lighting: z.enum(['golden-hour', 'daylight', 'dusk', 'overcast', 'night']).default('golden-hour'),
    environment: z.string().trim().default('landscaped-gardens'),
    geometryStrength: z.coerce.number().min(0.1).max(0.9).default(0.42),
    aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16']).optional(),
    projectId: z.string().trim().optional().nullable(),
    setAsThumbnail: z.boolean().default(false),
  })
  .refine((data) => Boolean(data.image || data.prompt), {
    message: 'Please upload an image (3D model screenshot / photo) or enter an architectural description.',
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

// Helper to find a render by ID (checks user ownership, falls back to ID for demo/shared scenes)
async function findRenderForUser(renderId: string, userId?: unknown) {
  let render = null
  if (userId) {
    render = await RenderModel.findOne({ _id: renderId, userId })
  }
  if (!render) {
    render = await RenderModel.findById(renderId)
  }
  return render
}

// Get single render
rendersRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const render = await findRenderForUser(req.params.id, req.user!._id)
    if (!render) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }
    return sendSuccess(res, { render: render.toRenderJSON() })
  } catch (error) {
    next(error)
  }
})

// Update render details (prompt, project association, etc.)
rendersRouter.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const updateSchema = z.object({
      prompt: z.string().trim().max(1000).optional(),
      projectId: z.string().trim().nullable().optional(),
      style: z.string().trim().optional(),
      lighting: z.string().trim().optional(),
    })
    const payload = updateSchema.parse(req.body)
    const updateData: Record<string, unknown> = {}
    if (payload.prompt !== undefined) updateData.prompt = payload.prompt
    if (payload.projectId !== undefined) updateData.projectId = payload.projectId || null
    if (payload.style !== undefined) updateData.style = payload.style
    if (payload.lighting !== undefined) updateData.lighting = payload.lighting

    let render = await RenderModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { $set: updateData },
      { new: true },
    )
    if (!render) {
      render = await RenderModel.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true },
      )
    }
    if (!render) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }
    return sendSuccess(res, { render: render.toRenderJSON() })
  } catch (error) {
    next(error)
  }
})

// Generate new architectural render (Image-to-photorealistic or prompt)
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

    let genResult: {
      imageUrl: string
      sourceImageUrl?: string | null
      enhancedPrompt: string
      provider: string
      aspectRatio?: RenderAspectRatio
    }

    let finalPrompt = payload.prompt?.trim() || ''

    if (payload.image) {
      // 1. Vibe3D Image-to-Photorealistic Render Pipeline
      genResult = await ImageGenerationService.generateRenderFromImage({
        image: payload.image,
        style: payload.style,
        engine: payload.engine,
        lighting: payload.lighting,
        environment: payload.environment,
        geometryStrength: payload.geometryStrength,
        refinementPrompt: payload.refinementPrompt || payload.prompt,
        aspectRatio: payload.aspectRatio,
      })

      if (!finalPrompt) {
        const styleName = payload.style.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        const lightingName = payload.lighting.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        const engineName = payload.engine.replace(/\b\w/g, (c) => c.toUpperCase())
        finalPrompt = `${engineName} ${styleName} Architecture · ${lightingName}`
      }
    } else {
      // 2. Legacy prompt-only generation
      const chosenAspect = payload.aspectRatio || '16:9'
      genResult = await ImageGenerationService.generateRender({
        prompt: finalPrompt,
        style: payload.style,
        aspectRatio: chosenAspect,
      })
    }

    const render = await RenderModel.create({
      userId: req.user!._id,
      projectId: verifiedProjectId,
      prompt: finalPrompt,
      enhancedPrompt: genResult.enhancedPrompt,
      sourceImageUrl: genResult.sourceImageUrl || null,
      style: payload.style,
      engine: payload.engine,
      lighting: payload.lighting,
      geometryStrength: payload.geometryStrength,
      environment: payload.environment,
      aspectRatio: genResult.aspectRatio || payload.aspectRatio || '16:9',
      imageUrl: genResult.imageUrl,
      status: 'completed',
      provider: genResult.provider,
    })

    // If setAsThumbnail was requested, update project thumbnail
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

// AI Targeted Edit / Inpainting on an existing render
rendersRouter.post('/:id/edit', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const editSchema = z.object({
      editPrompt: z.string().trim().min(2, 'Edit instruction is required').max(1000),
      strength: z.coerce.number().min(0.15).max(0.6).default(0.32),
    })
    const payload = editSchema.parse(req.body)

    const originalRender = await findRenderForUser(req.params.id, req.user!._id)
    if (!originalRender) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }

    const editResult = await ImageGenerationService.editRender({
      image: originalRender.imageUrl,
      editPrompt: payload.editPrompt,
      strength: payload.strength,
      style: originalRender.style,
      engine: originalRender.engine,
      lighting: originalRender.lighting,
      aspectRatio: originalRender.aspectRatio,
    })

    const newRender = await RenderModel.create({
      userId: req.user!._id,
      projectId: originalRender.projectId,
      prompt: `${originalRender.prompt} [Edit: ${payload.editPrompt}]`,
      enhancedPrompt: editResult.enhancedPrompt,
      sourceImageUrl: originalRender.imageUrl, // Link back to original render for before/after comparison
      style: originalRender.style,
      engine: originalRender.engine,
      lighting: originalRender.lighting,
      geometryStrength: originalRender.geometryStrength,
      environment: originalRender.environment,
      aspectRatio: originalRender.aspectRatio,
      imageUrl: editResult.imageUrl,
      status: 'completed',
      provider: editResult.provider,
    })

    return sendSuccess(res, { render: newRender.toRenderJSON() }, 201)
  } catch (error) {
    next(error)
  }
})

// Save client-side adjusted / color-graded render version
rendersRouter.post('/:id/save-adjustment', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const bodySchema = z.object({
      dataUrl: z.string().trim().startsWith('data:image/'),
      label: z.string().trim().default('Color Graded'),
    })
    const payload = bodySchema.parse(req.body)

    const originalRender = await findRenderForUser(req.params.id, req.user!._id)
    if (!originalRender) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }

    const savedUrl = await ImageGenerationService.saveAdjustedImage(payload.dataUrl)

    const newRender = await RenderModel.create({
      userId: req.user!._id,
      projectId: originalRender.projectId,
      prompt: `${originalRender.prompt} [${payload.label}]`,
      enhancedPrompt: originalRender.enhancedPrompt,
      sourceImageUrl: originalRender.imageUrl,
      style: originalRender.style,
      engine: originalRender.engine,
      lighting: originalRender.lighting,
      geometryStrength: originalRender.geometryStrength,
      environment: originalRender.environment,
      aspectRatio: originalRender.aspectRatio,
      imageUrl: savedUrl,
      status: 'completed',
      provider: 'color-grading-studio',
    })

    return sendSuccess(res, { render: newRender.toRenderJSON() }, 201)
  } catch (error) {
    next(error)
  }
})

// Vibe3D Instant Relight
rendersRouter.post('/:id/relight', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const relightSchema = z.object({
      timeOfDay: z.enum(['morning', 'golden-hour', 'evening', 'night']).default('golden-hour'),
      naturalIntensity: z.coerce.number().min(0.1).max(2.5).default(1.0),
      colorTemp: z.enum(['warm', 'neutral', 'cool']).default('warm'),
      directLights: z.boolean().default(true),
      indirectLights: z.boolean().default(true),
      exteriorLights: z.boolean().default(true),
    })
    const payload = relightSchema.parse(req.body)

    const originalRender = await findRenderForUser(req.params.id, req.user!._id)
    if (!originalRender) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }

    const relightResult = await ImageGenerationService.relightRender({
      image: originalRender.imageUrl,
      timeOfDay: payload.timeOfDay,
      naturalIntensity: payload.naturalIntensity,
      colorTemp: payload.colorTemp,
      directLights: payload.directLights,
      indirectLights: payload.indirectLights,
      exteriorLights: payload.exteriorLights,
      style: originalRender.style,
      aspectRatio: originalRender.aspectRatio,
    })

    const rootParentId = originalRender.parentRenderId || originalRender._id
    const timeLabel = payload.timeOfDay.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    const newRender = await RenderModel.create({
      userId: req.user!._id,
      projectId: originalRender.projectId,
      parentRenderId: rootParentId,
      versionType: 'relight',
      versionLabel: `Relight · ${timeLabel} (${payload.colorTemp})`,
      prompt: `${originalRender.prompt} [Relit: ${timeLabel}]`,
      enhancedPrompt: relightResult.enhancedPrompt,
      sourceImageUrl: originalRender.imageUrl,
      style: originalRender.style,
      engine: originalRender.engine,
      lighting: originalRender.lighting,
      geometryStrength: originalRender.geometryStrength,
      environment: originalRender.environment,
      aspectRatio: originalRender.aspectRatio,
      imageUrl: relightResult.imageUrl,
      status: 'completed',
      provider: relightResult.provider,
      metadata: payload,
    })

    return sendSuccess(res, { render: newRender.toRenderJSON() }, 201)
  } catch (error) {
    next(error)
  }
})

// Vibe3D HyperReal Studio Enhance
rendersRouter.post('/:id/enhance', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const originalRender = await findRenderForUser(req.params.id, req.user!._id)
    if (!originalRender) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }

    const enhanceResult = await ImageGenerationService.enhanceToHyperReal({
      image: originalRender.imageUrl,
      style: originalRender.style,
      aspectRatio: originalRender.aspectRatio,
    })

    const rootParentId = originalRender.parentRenderId || originalRender._id

    const newRender = await RenderModel.create({
      userId: req.user!._id,
      projectId: originalRender.projectId,
      parentRenderId: rootParentId,
      versionType: 'enhanced',
      versionLabel: 'HyperReal 8K Master',
      prompt: `${originalRender.prompt} [HyperReal 8K Enhance]`,
      enhancedPrompt: enhanceResult.enhancedPrompt,
      sourceImageUrl: originalRender.imageUrl,
      style: originalRender.style,
      engine: 'hyperreal',
      lighting: originalRender.lighting,
      geometryStrength: originalRender.geometryStrength,
      environment: originalRender.environment,
      aspectRatio: originalRender.aspectRatio,
      imageUrl: enhanceResult.imageUrl,
      status: 'completed',
      provider: enhanceResult.provider,
    })

    return sendSuccess(res, { render: newRender.toRenderJSON() }, 201)
  } catch (error) {
    next(error)
  }
})

// Vibe3D Close-Ups Generation
rendersRouter.post('/:id/closeups', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const closeupSchema = z.object({
      targets: z
        .array(
          z.object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            width: z.number().min(0.05).max(1).optional(),
            height: z.number().min(0.05).max(1).optional(),
            label: z.string().trim().default('Architectural Detail'),
            note: z.string().trim().optional(),
          }),
        )
        .min(1, 'Please select at least 1 detail target')
        .max(4, 'Maximum of 4 close-up targets allowed'),
    })
    const payload = closeupSchema.parse(req.body)

    const originalRender = await findRenderForUser(req.params.id, req.user!._id)
    if (!originalRender) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }

    const result = await ImageGenerationService.generateCloseups({
      image: originalRender.imageUrl,
      targets: payload.targets,
      style: originalRender.style,
    })

    const rootParentId = originalRender.parentRenderId || originalRender._id

    const newRender = await RenderModel.create({
      userId: req.user!._id,
      projectId: originalRender.projectId,
      parentRenderId: rootParentId,
      versionType: 'closeup',
      versionLabel: `Close-Ups (${result.closeups.length} details)`,
      prompt: `${originalRender.prompt} [Close-Ups: ${result.closeups.map((c) => c.label).join(', ')}]`,
      enhancedPrompt: `Macro architectural detail compilation`,
      sourceImageUrl: originalRender.imageUrl,
      style: originalRender.style,
      engine: originalRender.engine,
      lighting: originalRender.lighting,
      geometryStrength: originalRender.geometryStrength,
      environment: originalRender.environment,
      aspectRatio: originalRender.aspectRatio,
      imageUrl: result.collageUrl,
      status: 'completed',
      provider: result.provider,
      metadata: { closeups: result.closeups },
    })

    return sendSuccess(
      res,
      {
        render: newRender.toRenderJSON(),
        closeups: result.closeups,
      },
      201,
    )
  } catch (error) {
    next(error)
  }
})

// Get all versions of a scene
rendersRouter.get('/:id/versions', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const current = await findRenderForUser(req.params.id, req.user!._id)
    if (!current) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }

    const rootParentId = current.parentRenderId || current._id
    const versions = await RenderModel.find({
      $or: [{ _id: rootParentId }, { parentRenderId: rootParentId }],
    }).sort({ createdAt: 1 })

    return sendSuccess(res, {
      versions: versions.map((v) => v.toRenderJSON()),
    })
  } catch (error) {
    next(error)
  }
})

// Delete render
rendersRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    let render = await RenderModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    })
    if (!render) {
      render = await RenderModel.findByIdAndDelete(req.params.id)
    }
    if (!render) {
      throw new HttpError(404, 'Render not found', 'RENDER_NOT_FOUND')
    }
    return sendSuccess(res, null)
  } catch (error) {
    next(error)
  }
})
