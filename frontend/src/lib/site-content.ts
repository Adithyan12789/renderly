import type { ProjectType, RenderEngine, RenderLighting, RenderStyle } from '@/types'

export const BRAND = {
  name: 'Renderly',
  contactEmail: 'hello@renderly.ai',
}

export const MARKETING_NAV = [
  { label: 'Features', hash: 'features' },
  { label: 'Workflow', hash: 'workflow' },
  { label: 'Gallery', hash: 'gallery' },
  { label: 'Pricing', hash: 'pricing' },
  { label: 'FAQ', hash: 'faq' },
] as const

export interface StyleOption {
  value: RenderStyle
  label: string
  tagline: string
  description: string
  thumbnailUrl: string
  samplePrompts: string[]
}

export const ARCHITECTURAL_STYLES: StyleOption[] = [
  {
    value: 'modern-luxury',
    label: 'Modern Luxury',
    tagline: 'Travertine, bronze & dusk light',
    description: 'Cantilevered volumes, honed limestone, expansive floor-to-ceiling glass, and warm cove lighting.',
    thumbnailUrl: '/images/hero-villa.png',
    samplePrompts: [
      'Cantilevered cliffside villa overlooking the Mediterranean with infinity pool at dusk',
      'Double-height penthouse living salon with honed travertine fireplace and bronze mullions',
      'Modernist pavilion residence with submerged conversation pit and serene reflection pond',
    ],
  },
  {
    value: 'scandinavian',
    label: 'Scandinavian',
    tagline: 'Nordic timber, hygge & soft daylight',
    description: 'Pale vertical pine cladding, crisp lime-wash plaster, massive skylights, and quiet forest vistas.',
    thumbnailUrl: '/images/gallery-loft.png',
    samplePrompts: [
      'Minimalist timber cabin nestled in a snowy pine forest with warm glowing windows',
      'Nordic lakeside retreat with pale ash slatted ceilings and soft morning fog',
      'Spacious Copenhagen loft apartment with white lime-wash walls and chevron oak flooring',
    ],
  },
  {
    value: 'tropical',
    label: 'Tropical Modern',
    tagline: 'Teak louvers, palms & ocean breeze',
    description: 'Open-air pavilions, board-formed concrete, reclaimed teak screens, and lush cascading greenery.',
    thumbnailUrl: '/images/gallery-pavilion.png',
    samplePrompts: [
      'Open-concept tropical pavilion villa with teak brise-soleil and cascading monstera gardens',
      'Oceanfront Bali retreat with thatched pavilion roofs, board-formed concrete, and black lava stone pool',
      'Rainforest canopy treehouse studio with floor-to-ceiling glass and private plunge pool',
    ],
  },
  {
    value: 'minimal',
    label: 'Minimalist',
    tagline: 'Pure geometry, poured concrete & silence',
    description: 'Monolithic volumes, shadow gaps, frameless structural glazing, and meditative stone courtyards.',
    thumbnailUrl: '/images/gallery-tower.png',
    samplePrompts: [
      'Monolithic poured concrete gallery house with single ancient olive tree in gravel courtyard',
      'Sculptural desert house with pure cubic forms and knife-edge shadow lines under clear blue sky',
      'Minimalist water pavilion with seamless glass walls floating over tranquil dark water',
    ],
  },
  {
    value: 'japanese',
    label: 'Japanese Contemporary',
    tagline: 'Shou sugi ban, gravel & quiet balance',
    description: 'Charred timber siding, blackened steel accents, private stone zen gardens, and diffused paper light.',
    thumbnailUrl: '/images/gallery-pavilion.png',
    samplePrompts: [
      'Contemporary Kyoto residence with charred cedar facade, moss rock garden, and bamboo grove',
      'Zen tea house pavilion with sliding shoji-inspired glass panels beside a tranquil koi pond',
      'Modern courtyard home with central maple tree, river pebble paths, and dark slate walkways',
    ],
  },
  {
    value: 'industrial',
    label: 'Luxury Industrial',
    tagline: 'Dark brick, steel I-beams & crittall glass',
    description: 'Exposed dark masonry, oversized factory windows, double-height ceilings, and polished concrete.',
    thumbnailUrl: '/images/gallery-kitchen.png',
    samplePrompts: [
      'Converted brick warehouse residence with blackened steel staircase and soaring multi-pane windows',
      'Industrial studio atelier with polished concrete floors, exposed ductwork, and warm ambient spotlights',
    ],
  },
  {
    value: 'warm-cozy',
    label: 'Warm Organic',
    tagline: 'Stacked fieldstone, heavy timber & hearth',
    description: 'Alpine modern architecture with dry-stacked stone, massive hearth, and intimate warm glow.',
    thumbnailUrl: '/images/gallery-bedroom.png',
    samplePrompts: [
      'Alpine ski chalet with rugged dry-stacked stone walls, roaring fire, and snow-dusted pines outside',
      'Organic modern retreat with curved plaster walls, raw oak timbers, and shearling textures',
    ],
  },
  {
    value: 'futuristic',
    label: 'Futuristic Parametric',
    tagline: 'Biomorphic curves & luminous ribbons',
    description: 'Fluid computational contours, ultra-smooth composite facades, and embedded linear fiber illumination.',
    thumbnailUrl: '/images/gallery-tower.png',
    samplePrompts: [
      'Parametric hillside villa with flowing white curvilinear roofline and illuminated ribbon terraces',
      'Biomorphic observatory residence overlooking futuristic city skyline at twilight',
    ],
  },
]

export const RENDER_STYLES = ARCHITECTURAL_STYLES.map((s) => s.label)

export interface RenderEngineOption {
  value: RenderEngine
  label: string
  tagline: string
  description: string
  badge: string
}

export const RENDER_ENGINES: RenderEngineOption[] = [
  {
    value: 'hyperreal',
    label: 'HyperReal Engine',
    tagline: 'Presentation & Portfolio Grade',
    description: 'Ultra-high resolution ray-traced reflections, fine material texture detail, and photorealistic architectural magazine quality.',
    badge: 'Flagship',
  },
  {
    value: 'lumen',
    label: 'Lumen Engine',
    tagline: 'Balanced Lighting & Atmosphere',
    description: 'Physically based rendering, natural daylighting, soft shadows, and clean material finishes.',
    badge: 'Production',
  },
  {
    value: 'fidelity',
    label: 'Fidelity Engine',
    tagline: 'Strict Geometry & Structure',
    description: 'Maximum preservation of building lines, openings, massing, and geometric edges from your 3D model.',
    badge: 'Structure',
  },
]

export interface LightingOption {
  value: RenderLighting
  label: string
  tagline: string
}

export const LIGHTING_PRESETS: LightingOption[] = [
  { value: 'golden-hour', label: 'Golden Hour Dusk', tagline: 'Warm dusk amber light & soft shadows' },
  { value: 'daylight', label: 'Natural Daylight', tagline: 'Crisp morning sun & vivid dynamic range' },
  { value: 'dusk', label: 'Blue Hour Dusk', tagline: 'Twilight sky with glowing cove LEDs' },
  { value: 'overcast', label: 'Overcast Studio', tagline: 'Soft diffused shadowless editorial daylight' },
  { value: 'night', label: 'Dramatic Night', tagline: 'Moody architectural spotlights & starlit pool' },
]

export const INTERIOR_LIGHTING_PRESETS: LightingOption[] = [
  { value: 'golden-hour', label: 'Sunset Window Glow', tagline: 'Warm rays pouring through large glazing' },
  { value: 'daylight', label: 'Natural Window Daylight', tagline: 'Bright balanced daylight & airy ambiance' },
  { value: 'dusk', label: 'Evening Cove & Lamps', tagline: 'Warm 2700K indirect cove LEDs & designer lamps' },
  { value: 'overcast', label: 'Diffused Soft Daylight', tagline: 'Gentle shadowless architectural editorial light' },
  { value: 'night', label: 'Intimate Night Mood', tagline: 'Moody accent spotlights & warm chandelier glow' },
]

export interface EnvironmentOption {
  value: string
  label: string
  tagline: string
}

export const EXTERIOR_ENVIRONMENT_PRESETS: EnvironmentOption[] = [
  { value: 'landscaped-gardens', label: 'Lush Gardens & Pool', tagline: 'Manicured lawns, exotic palms & reflection water' },
  { value: 'pine-forest', label: 'Misty Pine Forest', tagline: 'Atmospheric alpine conifers & mountain fog' },
  { value: 'coastal', label: 'Coastal Oceanfront', tagline: 'Azure horizon, gentle sea spray & reflection' },
  { value: 'urban', label: 'Modern Urban Street', tagline: 'Metropolitan sidewalk, wet asphalt & streetlamps' },
  { value: 'zen', label: 'Zen Rock Courtyard', tagline: 'Raked gravel, sculptural Japanese maple & stone' },
  { value: 'desert', label: 'Desert Horizon & Cacti', tagline: 'Warm earth tones, rock formations & desert sands' },
]

export const INTERIOR_ENVIRONMENT_PRESETS: EnvironmentOption[] = [
  { value: 'interior-living', label: 'Double-Height Living Salon', tagline: 'Spacious open-concept living area with bespoke furniture' },
  { value: 'interior-kitchen', label: 'Designer Chef Kitchen', tagline: 'Monolithic marble island & custom minimalist cabinetry' },
  { value: 'interior-bedroom', label: 'Master Suite Sanctuary', tagline: 'Upholstered platform bed, sheer drapes & warm woods' },
  { value: 'interior-bathroom', label: 'Minimalist Spa Bathroom', tagline: 'Freestanding tub, stone slabs & brushed brass' },
  { value: 'interior-lounge', label: 'Penthouse Lounge & Bar', tagline: 'Moody velvet seating, bronze glass & ambient display' },
  { value: 'interior-office', label: 'Executive Sunlit Studio', tagline: 'Acoustic slatted wood, walnut desk & city views' },
]

export const ENVIRONMENT_PRESETS: EnvironmentOption[] = EXTERIOR_ENVIRONMENT_PRESETS

export interface Sample3DModel {
  id: string
  title: string
  category: string
  thumbnailUrl: string
  description: string
  aspectRatio: '16:9' | '4:3' | '1:1'
}

export const EXTERIOR_SAMPLE_MODELS: Sample3DModel[] = [
  {
    id: 'villa-clay',
    title: 'Modern Villa Clay Model',
    category: 'SketchUp 3D Viewport',
    thumbnailUrl: '/images/samples/villa-model.jpg',
    description: 'Untextured clay massing study with cantilevered roofline and pool deck.',
    aspectRatio: '16:9',
  },
  {
    id: 'pavilion-model',
    title: 'Minimalist Pavilion Model',
    category: 'Rhino / Revit Viewport',
    thumbnailUrl: '/images/samples/pavilion-model.jpg',
    description: 'Surface model of a glass and concrete garden pavilion.',
    aspectRatio: '16:9',
  },
]

export const INTERIOR_SAMPLE_MODELS: Sample3DModel[] = [
  {
    id: 'living-room-blockout',
    title: 'Interior Salon Blockout',
    category: 'Blender White Model',
    thumbnailUrl: '/images/samples/living-room-model.png',
    description: 'Double-height living space geometry with floor-to-ceiling openings.',
    aspectRatio: '16:9',
  },
]

export const SAMPLE_3D_MODELS: Sample3DModel[] = [
  ...EXTERIOR_SAMPLE_MODELS,
  ...INTERIOR_SAMPLE_MODELS,
]

export const EXTERIOR_MATERIAL_TAGS = [
  'Travertine stone facade',
  'Floor-to-ceiling low-iron glass',
  'Charred shou sugi ban cedar',
  'Board-formed architectural concrete',
  'Brushed bronze mullions',
  'Cantilevered roof overhang',
  'Infinity reflection pool with ripples',
  'Lush cascading monstera landscaping',
]

export const INTERIOR_MATERIAL_TAGS = [
  'Herringbone French oak floor',
  'Honed Calacatta marble island',
  'Fluted walnut wall panels',
  'Warm 3000K recessed cove lighting',
  'Custom bouclé sofa & brushed brass',
  'Floor-to-ceiling sheer linen drapes',
  'Smooth microcement plaster walls',
  'Acoustic slatted timber ceiling',
]

export const QUICK_MATERIAL_TAGS = EXTERIOR_MATERIAL_TAGS

export const PROJECT_TYPES: { value: ProjectType; label: string; description: string }[] = [
  { value: 'architecture', label: 'Architecture', description: 'Exteriors, facades, and site context' },
  { value: 'interior', label: 'Interior Design', description: 'Rooms, materials, and lighting moods' },
  { value: 'product', label: 'Product Design', description: 'Studio renders for objects and furniture' },
]

export const PLAN_LIMITS = {
  starter: { label: 'Starter', storageGb: 2, aiRenders: 25 },
  studio: { label: 'Studio', storageGb: 50, aiRenders: 500 },
  enterprise: { label: 'Enterprise', storageGb: 1000, aiRenders: 5000 },
} as const
