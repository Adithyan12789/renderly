import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose'

export type RenderStyle =
  | 'modern-luxury'
  | 'scandinavian'
  | 'tropical'
  | 'minimal'
  | 'japanese'
  | 'industrial'
  | 'warm-cozy'
  | 'futuristic'

export type RenderAspectRatio = '16:9' | '4:3' | '1:1' | '9:16'
export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type RenderEngine = 'hyperreal' | 'lumen' | 'fidelity'
export type RenderLighting = 'golden-hour' | 'daylight' | 'dusk' | 'overcast' | 'night'

export type RenderVersionType =
  | 'original'
  | 'render'
  | 'enhanced'
  | 'relight'
  | 'edit'
  | 'closeup'
  | 'flythrough'

export interface IRender extends Document {
  userId: Types.ObjectId
  projectId?: Types.ObjectId | null
  parentRenderId?: Types.ObjectId | null
  versionType?: RenderVersionType
  versionLabel?: string | null
  prompt: string
  enhancedPrompt: string
  sourceImageUrl?: string | null
  style: RenderStyle
  engine: RenderEngine
  lighting: RenderLighting
  geometryStrength?: number
  environment?: string
  aspectRatio: RenderAspectRatio
  imageUrl: string
  status: RenderStatus
  provider: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  toRenderJSON(): {
    id: string
    userId: string
    projectId: string | null
    parentRenderId: string | null
    versionType: RenderVersionType
    versionLabel: string | null
    prompt: string
    enhancedPrompt: string
    sourceImageUrl: string | null
    style: RenderStyle
    engine: RenderEngine
    lighting: RenderLighting
    geometryStrength: number
    environment: string
    aspectRatio: RenderAspectRatio
    imageUrl: string
    status: RenderStatus
    provider: string
    metadata?: Record<string, unknown>
    createdAt: string
    updatedAt: string
  }
}

const renderSchema = new Schema<IRender>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    parentRenderId: { type: Schema.Types.ObjectId, ref: 'Render', default: null, index: true },
    versionType: {
      type: String,
      enum: ['original', 'render', 'enhanced', 'relight', 'edit', 'closeup', 'flythrough'],
      default: 'render',
      index: true,
    },
    versionLabel: { type: String, default: null },
    prompt: { type: String, required: true, trim: true, maxlength: 1000 },
    enhancedPrompt: { type: String, required: true, trim: true },
    sourceImageUrl: { type: String, default: null },
    style: {
      type: String,
      enum: ['modern-luxury', 'scandinavian', 'tropical', 'minimal', 'japanese', 'industrial', 'warm-cozy', 'futuristic'],
      default: 'modern-luxury',
    },
    engine: {
      type: String,
      enum: ['hyperreal', 'lumen', 'fidelity'],
      default: 'hyperreal',
    },
    lighting: {
      type: String,
      enum: ['golden-hour', 'daylight', 'dusk', 'overcast', 'night'],
      default: 'golden-hour',
    },
    geometryStrength: { type: Number, default: 0.42 },
    environment: { type: String, default: 'landscaped-gardens' },
    aspectRatio: {
      type: String,
      enum: ['16:9', '4:3', '1:1', '9:16'],
      default: '16:9',
    },
    imageUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    provider: { type: String, default: 'ai-engine' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

renderSchema.methods.toRenderJSON = function () {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    projectId: this.projectId ? this.projectId.toString() : null,
    parentRenderId: this.parentRenderId ? this.parentRenderId.toString() : null,
    versionType: this.versionType || 'render',
    versionLabel: this.versionLabel || null,
    prompt: this.prompt,
    enhancedPrompt: this.enhancedPrompt,
    sourceImageUrl: this.sourceImageUrl || null,
    style: this.style,
    engine: this.engine || 'hyperreal',
    lighting: this.lighting || 'golden-hour',
    geometryStrength: this.geometryStrength ?? 0.42,
    environment: this.environment || 'landscaped-gardens',
    aspectRatio: this.aspectRatio,
    imageUrl: this.imageUrl,
    status: this.status,
    provider: this.provider,
    metadata: this.metadata || {},
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  }
}

export const RenderModel: Model<IRender> =
  mongoose.models.Render || mongoose.model<IRender>('Render', renderSchema)
