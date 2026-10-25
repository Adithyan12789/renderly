import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose'

export type ProjectType = 'architecture' | 'interior' | 'product'

export interface IProject extends Document {
  userId: Types.ObjectId
  name: string
  description: string
  type: ProjectType
  thumbnailUrl: string | null
  createdAt: Date
  updatedAt: Date
  toProjectJSON(): {
    id: string
    name: string
    description: string
    type: ProjectType
    thumbnailUrl: string | null
    createdAt: string
    updatedAt: string
  }
}

const projectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    type: { type: String, enum: ['architecture', 'interior', 'product'], default: 'architecture' },
    thumbnailUrl: { type: String, default: null },
  },
  { timestamps: true },
)

projectSchema.methods.toProjectJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    type: this.type,
    thumbnailUrl: this.thumbnailUrl,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  }
}

export const ProjectModel: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema)
