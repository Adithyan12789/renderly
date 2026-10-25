export type ProjectType = 'architecture' | 'interior' | 'product'

export interface User {
  id: string
  name: string
  email: string
  plan: 'starter' | 'studio' | 'enterprise'
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

export type RenderAspectRatio = '16:9' | '4:3' | '1:1' | '9:16'

export interface Render {
  id: string
  userId: string
  projectId: string | null
  prompt: string
  enhancedPrompt: string
  style: RenderStyle
  aspectRatio: RenderAspectRatio
  imageUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  provider: string
  createdAt: string
  updatedAt: string
}

export interface GenerateRenderPayload {
  prompt: string
  style: RenderStyle
  aspectRatio?: RenderAspectRatio
  projectId?: string | null
  setAsThumbnail?: boolean
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

