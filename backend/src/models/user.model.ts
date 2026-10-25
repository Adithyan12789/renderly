import mongoose, { Schema, type Document, type Model } from 'mongoose'

export type UserPlan = 'starter' | 'studio' | 'enterprise'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  plan: UserPlan
  createdAt: Date
  updatedAt: Date
  toUserJSON(): { id: string; name: string; email: string; plan: UserPlan }
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ['starter', 'studio', 'enterprise'], default: 'starter' },
  },
  { timestamps: true },
)

userSchema.methods.toUserJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    plan: this.plan,
  }
}

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema)
