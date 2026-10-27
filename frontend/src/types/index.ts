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

export type RenderEngine = 'hyperreal' | 'lumen' | 'fidelity'
export type RenderLighting = 'golden-hour' | 'daylight' | 'dusk' | 'overcast' | 'night'
export type RenderAspectRatio = '16:9' | '4:3' | '1:1' | '9:16'

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
