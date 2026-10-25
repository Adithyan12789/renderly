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

export interface IRender extends Document {
  userId: Types.ObjectId
  projectId?: Types.ObjectId | null
  prompt: string
  enhancedPrompt: string
  style: RenderStyle
  aspectRatio: RenderAspectRatio
  imageUrl: string
  status: RenderStatus
  provider: string
  createdAt: Date
  updatedAt: Date
  toRenderJSON(): {
    id: string
    userId: string
    projectId: string | null
    prompt: string
    enhancedPrompt: string
    style: RenderStyle
    aspectRatio: RenderAspectRatio
    imageUrl: string
    status: RenderStatus
    provider: string
    createdAt: string
    updatedAt: string
  }
}

const renderSchema = new Schema<IRender>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    prompt: { type: String, required: true, trim: true, maxlength: 1000 },
    enhancedPrompt: { type: String, required: true, trim: true },
    style: {
      type: String,
      enum: ['modern-luxury', 'scandinavian', 'tropical', 'minimal', 'japanese', 'industrial', 'warm-cozy', 'futuristic'],
      default: 'modern-luxury',
    },
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
  },
  { timestamps: true },
)

renderSchema.methods.toRenderJSON = function () {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    projectId: this.projectId ? this.projectId.toString() : null,
    prompt: this.prompt,
    enhancedPrompt: this.enhancedPrompt,
    style: this.style,
    aspectRatio: this.aspectRatio,
    imageUrl: this.imageUrl,
    status: this.status,
    provider: this.provider,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  }
}

export const RenderModel: Model<IRender> =
  mongoose.models.Render || mongoose.model<IRender>('Render', renderSchema)
