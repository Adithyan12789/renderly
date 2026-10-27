// ==========================================
// EXTERIOR RENDERING CONFIGURATION (exterior.txt)
// ==========================================

export const EXTERIOR_BUILDING_TYPES = [
  'Modern Villa',
  'Luxury Villa',
  'Tropical Villa',
  'Contemporary House',
  'Minimal House',
  'Traditional Kerala House',
  'Courtyard House',
  'Farmhouse',
  'Hill House',
  'Cliff House',
  'Lake House',
  'Beach House',
  'Forest Cabin',
  'Eco Resort Villa',
  'Heritage Bungalow',
  'Row House',
  'Duplex House',
  'Townhouse Mansion',
  'Palace Style Residence',
  'Smart Home',
  'Futuristic House',
  'Container House',
  'Tiny House',
] as const

export const EXTERIOR_ARCHITECTURAL_STYLES = [
  'Tropical Modern',
  'Kerala Traditional',
  'Brutalist',
  'Minimalist',
  'Japandi',
  'Mediterranean',
  'Contemporary',
  'Vernacular',
  'Colonial',
  'Scandinavian',
  'Mughal-Inspired Parametric',
  'Modern Luxury',
  'Industrial Loft',
  'Warm Organic',
  'Futuristic Biomorphic',
] as const

export const PROMPT_STYLES = [
  { value: 'Concise', label: 'Concise', description: 'Clean, direct architectural prompt' },
  { value: 'Detailed', label: 'Detailed', description: 'Comprehensive material and environmental specs' },
  { value: 'Conceptual', label: 'Conceptual', description: 'Artistic vision, mood, and spatial expression' },
  { value: 'Cinematic', label: 'Cinematic', description: 'Photographic optics, color grade, and atmosphere' },
] as const

export const EXTERIOR_TIMES_OF_DAY = [
  'Midday',
  'Golden Hour',
  'Blue Hour',
  'Dusk',
  'Dawn',
  'Night',
  'Overcast Day',
  'Sunset',
] as const

export const EXTERIOR_PRIMARY_MOODS = [
  'Ultra Photorealistic',
  'Cinematic Realm',
  'Editorial Photography',
  'Luxury Brochure Style',
  'Real Estate Photography',
  'Architectural Digest Style',
  'Magazine Cover Look',
  'Documentary Realism',
  'Drone Aerial View',
  'Minimal Clean Style',
  'Resort Lifestyle',
  'Premium Lifestyle',
  'Moody Atmosphere',
  'High Contrast Drama',
  'Natural Camera Look',
  'Sony Full Frame Look',
  'Hasselblad Look',
  'Leica Editorial Look',
  'Golden Hour Mood',
  'Blue Hour Mood',
  'Monsoon Mood',
  'Tropical Daylight',
  'Overcast Soft Light',
  'Sunset Drama',
  'Night Luxury',
  'Joyful',
  'Serene',
  'Romantic',
  'Dramatic',
  'Mysterious',
  'Melancholic',
  'Energetic',
  'Minimal',
  'Luxurious',
] as const

export const CINEMATIC_SCHOOLS = [
  'None',
  'Lubezki-natural light',
  'Deakins-shadow contrast',
  'Muller-cool tones',
  'Storaro-warm palette',
  'Nykvist-minimalist',
  'Doyle vivid colour',
] as const

export const SEASONS = ['All Season / Dry', 'Monsoon', 'Summer', 'Autumn', 'Winter'] as const

export const WEATHER_CONDITIONS = [
  'Clear Sky',
  'Overcast',
  'Rain',
  'Fog',
  'Stormy',
  'Hazy',
  'Snow',
  'Partly Cloudy',
] as const

export const HUMAN_PRESENCE_OPTIONS = [
  'None',
  'Subtle Distant Silhouettes',
  'Few People Naturally Present',
  'Single Person',
  'Couple',
  'Family',
  'Kids Playing',
  'Elderly Couple',
  'Friends Gathering',
  'Party Scene',
  'Wedding Scene',
  'Festival Crowd',
  'Staff/Security',
  'Gardener at Work',
  'Kerala Street Life',
  'Resort Beach Lifestyle',
] as const

export const VEHICLE_OPTIONS = [
  'None',
  'Region-Appropriate Luxury Auto',
  'Premium SUV',
  'Executive Sedan',
  'Sports Car',
  'Electric Flagship',
  'Vintage Classic Car',
  'Family Premium SUV',
  'Range Rover',
  'Mercedes G-Class',
  'Bentley',
  'Rolls-Royce',
  'Lamborghini',
  'Ferrari',
  'Tesla',
  'Porsche',
  'Aston Martin',
  'Maserati',
  'Scooters',
  'Tuk-tuks / Autorickshaws',
  'Land Rover Defender',
] as const

export const BOUNDARY_WALL_OPTIONS = [
  'Auto',
  'No Boundary Wall',
  'Tall Privacy Wall',
  'Glass Boundary',
  'Stone Boundary Wall',
  'Hedge Boundary',
  'Metal Gate with Wall',
  'Kerala Laterite Wall',
  'Dubai Luxury Compound Wall',
] as const

export const CAMERA_BODIES = [
  'Hasselblad X2D 100C',
  'Hasselblad H6D-100c',
  'Hasselblad 907X CFV 100C',
  'Phase One 104 150MP',
  'Fujifilm GFX 100 II',
  'Sony A7R V',
  'Canon EOS RS',
  'Nikon 29',
  'Leica M11',
  'ARRI Alexa 65',
] as const

export const CAMERA_LENSES = [
  '35mm Wide',
  '24mm Tilt-Shift Architectural',
  '50mm Standard Prime',
  '16mm Ultra-Wide',
  '85mm Compressed Perspective',
] as const

export const CAMERA_ANGLES = [
  'Eye Level',
  'Low Road Level',
  'Elevated Architectural View',
  'Aerial Oblique 45°',
  'Worm\'s Eye Dynamic',
] as const

export interface StoryboardShotOption {
  id: string
  code: string
  title: string
  description: string
}

export const STORYBOARD_SHOTS: StoryboardShotOption[] = [
  { id: 'shot-01', code: 'SHOT 01', title: 'HERO FRONT WIDE', description: 'Primary monumental front elevation with complete context' },
  { id: 'shot-02', code: 'SHOT 02', title: 'CORNER THREE-QUARTER VIEW', description: 'Dynamic isometric corner perspective revealing depth and volume' },
  { id: 'shot-03', code: 'SHOT 03', title: 'LOW ROAD LEVEL ACTION SHOT', description: 'Low perspective looking up from foreground road/driveway' },
  { id: 'shot-04', code: 'SHOT 04', title: 'WIDE NEIGHBOURHOOD ESTABLISHING SHOT', description: 'Broad architectural context showing streetscape and vegetation' },
  { id: 'shot-05', code: 'SHOT 05', title: 'NIGHT LUXURY ARRIVAL SHOT', description: 'Dramatic illuminated arrival with warm interior glow and landscape lights' },
  { id: 'shot-06', code: 'SHOT 06', title: 'FOREGROUND LIFESTYLE SHOT', description: 'Framed through lush foreground foliage, water, or courtyard' },
  { id: 'shot-07', code: 'SHOT 07', title: 'BLUE HOUR STREET CROSSING SHOT', description: 'Deep twilight sky, illuminated facade lights, and wet street reflections' },
  { id: 'shot-08', code: 'SHOT 08', title: 'REAR WALKING FOLLOW SHOT', description: 'Cinematic over-the-shoulder pathway view toward the entrance' },
  { id: 'shot-09', code: 'SHOT 09', title: 'FRONTAL ARCHITECTURE + HUMAN SCALE', description: 'Perfect eye-level elevation showing true scale with natural human silhouettes' },
  { id: 'shot-10', code: 'SHOT 10', title: 'MOTION BLUR PASSING VEHICLE SHOT', description: 'Crisp architectural facade with subtle foreground speed motion streaks' },
  { id: 'shot-11', code: 'SHOT 11', title: 'FOOTPATH EDGE CHARACTER SHOT', description: 'Urban pedestrian perspective along curb, stone pavers, and boundary' },
  { id: 'shot-12', code: 'SHOT 12', title: 'LOCAL LIFE ESTABLISHING SHOT', description: 'Rich cultural context, regional flora, and authentic neighborhood atmosphere' },
  { id: 'shot-13', code: 'SHOT 13', title: 'DETAIL MATERIAL MACRO SHOT', description: 'Tight architectural focus on tactile textures: concrete joints, teak louvers, bronze' },
  { id: 'shot-14', code: 'SHOT 14', title: 'DRONE OBLIQUE CONTEXT SHOT', description: 'High-altitude panoramic birds-eye view connecting building to topography' },
  { id: 'shot-15', code: 'SHOT 15', title: 'FAMILY/CELEBRATION PORTRAIT SHOT', description: 'Warm lifestyle scene capturing welcoming architectural hospitality' },
]

// ==========================================
// INTERIOR RENDERING CONFIGURATION (interior.txt)
// ==========================================

export const INTERIOR_ROOM_TYPES = [
  'Living Room & Salon',
  'Master Bedroom Suite',
  'Luxury Kitchen & Dining',
  'Spa Bathroom / Powder Room',
  'Home Office / Library',
  'Penthouse Cocktail Lounge',
  'Walk-in Dressing Suite',
  'Private Home Theater',
  'Grand Entrance Foyer',
  'Sunroom / Covered Terrace',
] as const

export const INTERIOR_FLOORING_MATERIALS = [
  'Original Model Flooring',
  'Herringbone French Oak Hardwood',
  'Honed Calacatta Marble Slabs',
  'Seamless Microcement / Polished Concrete',
  'Large-Format Terrazzo Tiles',
  'Dark Flamed Granite / Slate',
  'Wide-Plank Scandinavian Ash',
] as const

export const INTERIOR_WALL_MATERIALS = [
  'Original Model Wall Finishes',
  'Smooth Lime-Wash Plaster',
  'Vertical Fluted Walnut Slats',
  'Textured Botanical Wallpaper',
  'Tactile Board-Formed Concrete',
  'Bookmatched Marble Accent Wall',
  'Minimalist Matte Off-White Plaster',
] as const

export const INTERIOR_ACCENT_MATERIALS = [
  'Brushed Warm Brass / Bronze',
  'Blackened Architectural Steel',
  'Smoked Bronze Tinted Glass',
  'Ultra-Clear Low-Iron Fluted Glass',
  'Natural Travertine & Teak',
  'Custom Textured Bouclé & Linen',
] as const

export const INTERIOR_LIGHTING_MOODS = [
  'Soft Natural Daylight',
  'Neutral Daylight with Subtle Warm Accents',
  'Warm 3000K Ambient Cove & Recessed LEDs',
  'Golden Hour Sunset Window Streams',
  'Evening Lamp Glow & Subtle Chandelier',
  'Diffused Overcast Gallery Illumination',
] as const

export const INTERIOR_CAMERA_HEIGHTS = [
  'Eye Level (approx 1.5m / 5ft)',
  'Seated Living Level (approx 1.1m / 3.6ft)',
  'Countertop Level (approx 1.2m / 4ft)',
  'Low Architectural One-Point Perspective',
] as const

export const INTERIOR_PERSPECTIVE_TYPES = [
  'Preserve Original Viewpoint',
  'One-Point Central Perspective',
  'Two-Point Dynamic Corner Perspective',
  'Wide Lens View (without distortion)',
] as const
