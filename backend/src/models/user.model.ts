import mongoose, { Schema, type Document, type Model } from 'mongoose'

export type UserPlan = 'starter' | 'studio' | 'enterprise'
export type SubscriptionStatus = 'active' | 'inactive' | 'trialing' | 'canceled'
export type BillingCycle = 'monthly' | 'annual'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  plan: UserPlan
  subscriptionStatus: SubscriptionStatus
  subscriptionPeriodEnd?: Date | null
  billingCycle?: BillingCycle | null
  rendersLimit: number
  projectsLimit: number
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
  createdAt: Date
  updatedAt: Date
  toUserJSON(): {
    id: string
    name: string
    email: string
    plan: UserPlan
    subscriptionStatus: SubscriptionStatus
    subscriptionPeriodEnd: Date | null
    billingCycle: BillingCycle | null
    rendersLimit: number
    projectsLimit: number
  }
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ['starter', 'studio', 'enterprise'], default: 'starter' },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'trialing', 'canceled'],
      default: 'active',
    },
    subscriptionPeriodEnd: { type: Date, default: null },
    billingCycle: { type: String, enum: ['monthly', 'annual'], default: null },
    rendersLimit: { type: Number, default: 5 },
    projectsLimit: { type: Number, default: 1 },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: true },
)

userSchema.methods.toUserJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    plan: this.plan,
    subscriptionStatus: this.subscriptionStatus || 'active',
    subscriptionPeriodEnd: this.subscriptionPeriodEnd || null,
    billingCycle: this.billingCycle || null,
    rendersLimit: this.rendersLimit ?? (this.plan === 'studio' ? 100 : this.plan === 'enterprise' ? -1 : 5),
    projectsLimit: this.projectsLimit ?? (this.plan === 'studio' ? 15 : this.plan === 'enterprise' ? -1 : 1),
  }
}

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema)
