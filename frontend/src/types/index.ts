export type ProjectType = 'architecture' | 'interior' | 'product'

export interface User {
  id: string
  name: string
  email: string
  plan: 'starter' | 'studio' | 'enterprise'
  subscriptionStatus?: 'active' | 'inactive' | 'trialing' | 'canceled'
  subscriptionPeriodEnd?: string | null
  billingCycle?: 'monthly' | 'annual' | null
  rendersLimit?: number
  projectsLimit?: number
}

export interface SubscriptionPlan {
  id: 'starter' | 'studio' | 'enterprise'
  name: string
  tagline: string
  priceInr: { monthly: number; annual: number }
  rendersLimit: number
  projectsLimit: number
  maxQuality: '1080p' | '4k'
  canFlythrough: boolean
  canRelight: boolean
  recommended?: boolean
  features: string[]
}

export interface UsageData {
  plan: 'starter' | 'studio' | 'enterprise'
  planName: string
  subscriptionStatus: string
  subscriptionPeriodEnd: string | null
  billingCycle: 'monthly' | 'annual'
  usage: {
    rendersCount: number
    rendersLimit: number
    rendersRemaining: number | string
    projectsCount: number
    projectsLimit: number
    projectsRemaining: number | string
  }
  features: {
    maxQuality: '1080p' | '4k'
    canFlythrough: boolean
    canRelight: boolean
  }
  razorpayKeyId: string
}

export interface RazorpayOrderData {
  orderId: string
  amount: number
  currency: string
  keyId: string
  plan: 'studio' | 'enterprise'
  planName: string
  billingCycle: 'monthly' | 'annual'
}

export interface Project {
  id: string
  name: string
  description: string
  type: ProjectType
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export type RenderStyle =
  | 'modern-luxury'
  | 'scandinavian'
  | 'tropical'
  | 'minimal'
  | 'japanese'
  | 'industrial'
  | 'warm-cozy'
  | 'futuristic'

export type RenderEngine = 'hyperreal' | 'lumen' | 'fidelity'
export type RenderLighting = 'golden-hour' | 'daylight' | 'dusk' | 'overcast' | 'night'
export type RenderAspectRatio = '16:9' | '4:3' | '1:1' | '9:16'
export type RenderingMode = 'preserve-structure' | 'realistic-enhancement' | 'creative-redesign'

export type RenderVersionType =
  | 'original'
  | 'render'
  | 'enhanced'
  | 'relight'
  | 'edit'
  | 'closeup'
  | 'flythrough'

export type RenderCategory = 'exterior' | 'interior'

export interface Render {
  id: string
  userId: string
  projectId: string | null
  parentRenderId?: string | null
  versionType?: RenderVersionType
  versionLabel?: string | null
  prompt: string
  enhancedPrompt: string
  sourceImageUrl: string | null
  style: RenderStyle
  engine: RenderEngine
  lighting: RenderLighting
  renderingMode?: RenderingMode
  geometryStrength: number
  environment: string
  aspectRatio: RenderAspectRatio
  imageUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  provider: string
  metadata?: {
    category?: RenderCategory
    [key: string]: unknown
  }
  createdAt: string
  updatedAt: string
}

export interface RelightPayload {
  timeOfDay: 'morning' | 'golden-hour' | 'evening' | 'night'
  naturalIntensity?: number
  colorTemp?: 'warm' | 'neutral' | 'cool'
  directLights?: boolean
  indirectLights?: boolean
  exteriorLights?: boolean
}

export interface CloseupTarget {
  x: number
  y: number
  width?: number
  height?: number
  label: string
  note?: string
}

export interface GenerateRenderPayload {
  image?: string
  prompt?: string
  refinementPrompt?: string
  style: RenderStyle
  engine?: RenderEngine
  lighting?: RenderLighting
  renderingMode?: RenderingMode
  environment?: string
  geometryStrength?: number
  aspectRatio?: RenderAspectRatio
  projectId?: string | null
  setAsThumbnail?: boolean
  category?: RenderCategory
}

export interface ApiSuccess<T> {
  success: true
  data: T
}
