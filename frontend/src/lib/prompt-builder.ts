import type { ExteriorRenderingSettings, InteriorRenderingSettings } from '@/types'

export type ExteriorSettings = ExteriorRenderingSettings
export type InteriorSettings = InteriorRenderingSettings

export interface ResolvedExteriorSettings extends ExteriorSettings {
  _lightingPhrase?: string
  _shotCues?: string[]
  _viewpointShots?: string[]
  _lockViewpoint?: boolean
}

// ---------------------------------------------------------------------------
// Visible-effect phrase tables. Each selected value maps to concrete visual language
// so the model has something to render instead of a bare label.
// ---------------------------------------------------------------------------

export const TIME_PHRASES: Record<string, string> = {
  Midday: 'high midday sun, short crisp shadows, neutral 5500K daylight, deep blue sky',
  'Golden Hour': 'warm low-angle golden-hour sunlight (about 3500K), long soft shadows raking across the facade, warm glowing highlights',
  'Blue Hour': 'blue-hour twilight, deep blue sky, warm interior light glowing through the glazing, soft exterior uplighting',
  Dusk: 'dusk twilight, darkening blue-violet sky, warm interior light glowing through the glazing, soft exterior uplighting',
  Dawn: 'soft dawn light, pink-peach horizon, low contrast, gentle morning haze',
  Night: 'night scene with a dark sky, no sunlight, warm interior light glowing through the glazing, discreet architectural exterior lighting, soft pools of light on the ground',
  'Overcast Day': 'soft overcast daylight, shadowless even illumination',
  Sunset: 'sun near the horizon, orange-magenta sky, warm side light with long shadows',
}

export const WEATHER_PHRASES: Record<string, string> = {
  'Clear Sky': 'clear sky',
  Overcast: 'continuous grey cloud cover, diffuse light',
  Rain: 'visible falling rain, wet reflective paving and roof surfaces, puddle reflections, darker saturated materials, heavy cloud, diffuse light without hard sun shadows',
  Fog: 'dense fog reducing visibility with layered atmospheric depth, soft diffused light',
  Stormy: 'dramatic dark storm clouds, wind-swept vegetation, moody low-key light',
  Hazy: 'warm atmospheric haze softening distant contrast',
  Snow: 'snow-covered ground and roof surfaces, cold diffuse light',
  'Partly Cloudy': 'scattered cumulus clouds with patches of direct sun',
}

export const DIFFUSE_WEATHER = ['Rain', 'Fog', 'Stormy', 'Snow', 'Overcast']
export const SUN_TIMES = ['Midday', 'Golden Hour', 'Sunset', 'Dawn']

export const SEASON_PHRASES: Record<string, string> = {
  Monsoon: 'lush saturated green vegetation and damp surfaces',
  Summer: 'bright dry summer vegetation',
  Autumn: 'autumn foliage in warm tones',
  Winter: 'bare winter vegetation and low sun angle',
}

export const WALL_PHRASES: Record<string, string> = {
  'Tall Privacy Wall': 'tall solid rendered privacy wall around the plot',
  'Glass Boundary': 'frameless glass boundary panels on slim steel posts',
  'Stone Boundary Wall': 'natural dry-stacked stone boundary wall',
  'Hedge Boundary': 'dense clipped green hedge forming the boundary',
  'Metal Gate with Wall': 'low rendered boundary wall with a black metal entrance gate',
  'Kerala Laterite Wall': 'rough-cut red-brown Kerala laterite stone boundary wall with visible block joints and patches of moss',
  'Dubai Luxury Compound Wall': 'tall cream limestone compound wall with a decorative metal gate and recessed lighting',
}

export const MOOD_PHRASES: Record<string, string> = {
  'Cinematic Realm': 'cinematic grading with rich tonal contrast',
  'Editorial Photography': 'editorial architectural photography composition',
  'Luxury Brochure Style': 'polished luxury-brochure photography',
  'Real Estate Photography': 'bright balanced real-estate photography with even exposure',
  'Architectural Digest Style': 'refined Architectural Digest style photography',
  'Documentary Realism': 'unstyled documentary realism, natural colours',
  'Drone Aerial View': 'high aerial drone photograph look',
  'Minimal Clean Style': 'clean minimal composition with restrained colours',
  'Moody Atmosphere': 'moody low-key atmosphere',
  'High Contrast Drama': 'high-contrast dramatic light',
  'Natural Camera Look': 'neutral natural camera rendering',
  'Golden Hour Mood': 'warm golden-hour mood',
  'Blue Hour Mood': 'cool blue-hour mood',
  'Monsoon Mood': 'monsoon atmosphere',
  'Tropical Daylight': 'bright tropical daylight',
  'Overcast Soft Light': 'soft overcast light',
  'Sunset Drama': 'dramatic sunset sky',
  'Night Luxury': 'luxurious night atmosphere with warm glowing interiors',
}

export const LENS_PHRASES: Record<string, string> = {
  '24mm Tilt-Shift Architectural': 'shift-lens perspective correction with perfectly vertical lines',
  '16mm Ultra-Wide': 'ultra-wide perspective',
  '85mm Compressed Perspective': 'compressed telephoto perspective',
}

export const FLOOR_PHRASES: Record<string, string> = {
  'Herringbone French Oak Hardwood': 'herringbone-pattern French oak parquet with clearly visible interlocking plank rows at 45 degrees, warm natural oak grain, satin finish',
  'Honed Calacatta Marble Slabs': 'honed Calacatta marble slabs with white ground and bold grey-gold veining, soft satin reflection, thin joints',
  'Seamless Microcement / Polished Concrete': 'seamless microcement floor with subtle trowel cloudiness and a soft sheen, no joints',
  'Large-Format Terrazzo Tiles': 'large-format terrazzo tiles with mixed marble chips and fine grout lines',
  'Dark Flamed Granite / Slate': 'dark flamed granite slate floor with a textured non-reflective surface',
  'Wide-Plank Scandinavian Ash': 'wide-plank pale Scandinavian ash flooring with light matte grain',
}

export const WALL_FINISH_PHRASES: Record<string, string> = {
  'Smooth Lime-Wash Plaster': 'smooth lime-wash plaster walls with soft cloudy tonal variation',
  'Vertical Fluted Walnut Slats': 'vertical fluted walnut slat panelling with rich dark grain and a regular slat rhythm',
  'Textured Botanical Wallpaper': 'textured botanical-pattern wallpaper with a leaf motif on the main feature wall',
  'Tactile Board-Formed Concrete': 'board-formed concrete walls showing horizontal timber-board grain impressions',
  'Bookmatched Marble Accent Wall': 'bookmatched marble slab accent wall with mirrored veining',
  'Minimalist Matte Off-White Plaster': 'matte off-white plaster walls with a clean uniform finish',
}

export const INTERIOR_LIGHT_PHRASES: Record<string, string> = {
  'Soft Natural Daylight': 'soft natural daylight entering through the existing windows with gentle indirect bounce, neutral 5000K white balance',
  'Neutral Daylight with Subtle Warm Accents': 'neutral daylight through the existing windows plus subtle warm 2700K lamp accents',
  'Warm 3000K Ambient Cove & Recessed LEDs': 'warm 3000K cove lighting and recessed LED downlights as the main light source, glowing ceiling coves and warm pools of light on surfaces',
  'Golden Hour Sunset Window Streams': 'low golden sunset beams streaming through the existing windows, long warm light patches on the floor, warm shadows',
  'Evening Lamp Glow & Subtle Chandelier': 'evening scene lit by warm table and floor lamps and a subtle chandelier glow, dark windows',
  'Diffused Overcast Gallery Illumination': 'soft diffused overcast window light with gallery-like even illumination, very soft shadows, cool-neutral white balance',
}

export const ORIGINAL_ACCENT = 'Original Model Hardware & Accents'

export interface ShotMeta {
  viewpoint: boolean
  cue?: string
  needsPeople?: boolean
  needsVehicle?: boolean
  impliesTime?: string[]
}

export const SHOT_META: Record<number, ShotMeta> = {
  1: { viewpoint: true },
  2: { viewpoint: true },
  3: { viewpoint: true },
  4: { viewpoint: true },
  5: { viewpoint: true, impliesTime: ['Night'] },
  6: { viewpoint: false, cue: 'lush foreground foliage softly framing the view' },
  7: { viewpoint: false, impliesTime: ['Blue Hour', 'Dusk'], cue: 'wet street reflections under the twilight sky' },
  8: { viewpoint: true, needsPeople: true, cue: 'a person walking along the path toward the entrance, seen from behind' },
  9: { viewpoint: true, needsPeople: true, cue: 'a few natural human figures giving true scale' },
  10: { viewpoint: false, needsVehicle: true, cue: 'a subtly motion-blurred passing vehicle in the foreground' },
  11: { viewpoint: true },
  12: { viewpoint: false, cue: 'authentic regional neighbourhood atmosphere and local flora' },
  13: { viewpoint: true },
  14: { viewpoint: true },
  15: { viewpoint: false, needsPeople: true, cue: 'a welcoming family scene near the entrance' },
}

export function parseShotNumber(shot: string): number | null {
  const m = /SHOT\s*(\d+)/i.exec(shot)
  return m ? Number(m[1]) : null
}

const isSet = (v: string | undefined, ...empty: string[]): v is string =>
  Boolean(v && v.trim().length > 0 && !empty.includes(v))

/**
 * Exterior prompt. Every section is built only from selected values.
 */
export function buildExteriorPrompt(
  rawSettings?: ExteriorRenderingSettings,
  basePrompt?: string,
): string {
  const settings = (rawSettings || {}) as ResolvedExteriorSettings
  const buildingType = settings.buildingType || 'Contemporary House'
  const archStyle = settings.architecturalStyle || 'Tropical Modern'
  const locked = settings._lockViewpoint !== false

  const subject = `Professional architectural photograph of the exact ${buildingType} shown in the reference image, ${archStyle} design language. Keep the identical massing, floor count, roofline, facade composition, window and door positions, balconies and proportions`
  const realism =
    'Convert flat SketchUp surfaces into real physically based materials (natural stone, concrete, timber, plaster, metal, clear glass with real reflections and transparency), realistic contact shadows and ambient occlusion, natural sky, no black outline strokes or viewport lines'

  const structure = isSet(settings.structuralNotes) ? `Structural details to respect: ${settings.structuralNotes!.trim()}` : ''

  const loc = [settings.districtPlace, settings.areaCommunity, settings.countryRegion].filter((v) => isSet(v)).map((v) => v!.trim())
  const location = loc.length ? `Site context: ${loc.join(', ')}, with regionally appropriate vegetation, terrain and climate` : ''
  const locationNotes = isSet(settings.locationNotes) ? `Surroundings: ${settings.locationNotes!.trim()}` : ''

  let wall = ''
  if (isSet(settings.boundaryWall, 'Auto')) {
    wall =
      settings.boundaryWall === 'No Boundary Wall'
        ? 'Open perimeter with no boundary wall'
        : `Boundary: ${WALL_PHRASES[settings.boundaryWall!] || settings.boundaryWall}`
  }

  const time = settings.timeOfDay || 'Golden Hour'
  const weather = settings.weather || 'Clear Sky'
  const lighting =
    settings._lightingPhrase ||
    [TIME_PHRASES[time] || `${time} lighting`, WEATHER_PHRASES[weather] || weather, SEASON_PHRASES[settings.season || ''] || '']
      .filter(Boolean)
      .join(', ')

  const moodParts: string[] = []
  if (isSet(settings.primaryMood, 'Ultra Photorealistic')) {
    moodParts.push(MOOD_PHRASES[settings.primaryMood!] || `${settings.primaryMood} mood`)
  }
  if (isSet(settings.cinematicSchool, 'None')) {
    moodParts.push(`colour grade in the style of ${settings.cinematicSchool} cinematography`)
  }
  const mood = moodParts.join(', ')

  let shots = ''
  if (settings._shotCues) {
    const cues = [...settings._shotCues]
    if (settings._viewpointShots && settings._viewpointShots.length) cues.push(`preferred viewpoint: ${settings._viewpointShots.join('; ')}`)
    shots = cues.length ? `Composition cues: ${cues.join('; ')}` : ''
  } else if (settings.storyboardShots && settings.storyboardShots.length) {
    shots = `Storyboard composition: ${settings.storyboardShots.join('; ')}`
  }

  const camera = isSet(settings.cameraBody) ? settings.cameraBody : 'medium-format camera'
  const lens = isSet(settings.cameraLens) ? settings.cameraLens : '35mm Wide'
  const lensLook = LENS_PHRASES[lens] || `${lens} lens perspective`
  const angle = isSet(settings.cameraAngle, 'Eye Level') ? `, ${settings.cameraAngle} camera angle` : ''
  const optics = locked
    ? `Photographic look of a ${camera} with ${lensLook}; keep the reference camera viewpoint`
    : `Photographic look of a ${camera} with ${lensLook}${angle}`

  const people = isSet(settings.humanPresence, 'None') ? `People: ${settings.humanPresence}` : ''
  const vehicles = isSet(settings.vehicles, 'None') ? `Vehicle: ${settings.vehicles}` : ''

  const refinement = basePrompt && basePrompt.trim().length > 0 ? basePrompt.trim() : ''
  const special =
    settings.specialInstructions?.trim() ||
    'Keep architecture 100% locked. Do not change geometry, materials, roofline, openings or facade design.'
  const constraints = `Constraints: ${special}`

  const style = settings.promptStyle || 'Detailed'
  if (style === 'Concise') {
    return [subject, lighting, wall, people, vehicles, constraints].filter(Boolean).join('. ')
  }

  const parts = [subject, realism, structure, location, locationNotes, wall, `Lighting and atmosphere: ${lighting}`, mood, shots, optics, people, vehicles, refinement, constraints]
  if (style === 'Cinematic') {
    parts.push('subtle film grain, natural depth of field, wide dynamic range without HDR look')
  } else if (style === 'Conceptual') {
    parts.push('sculptural volume emphasis, calm negative space, restrained editorial composition')
  }
  return parts.filter(Boolean).join('. ')
}

/**
 * Interior prompt. Distinguishes preserving an original finish from replacing it.
 */
export function buildInteriorPrompt(settings?: InteriorRenderingSettings, basePrompt?: string): string {
  const parts: string[] = []
  const roomType = settings?.roomType || 'Living Room & Salon'

  parts.push(`Professional interior photograph of the exact ${roomType} shown in the reference image`)

  const preservation = isSet(settings?.structuralPreservation)
    ? settings!.structuralPreservation!.trim()
    : 'Keep the identical room layout, wall boundaries, ceiling height, windows, doors, fixtures, furniture positions and camera composition'
  parts.push(preservation)

  const floor = settings?.flooringMaterial
  if (isSet(floor, 'Original Model Flooring')) {
    parts.push(`Replace only the floor finish with ${FLOOR_PHRASES[floor!] || floor} (keep floor boundaries and perspective)`)
  } else {
    parts.push('Keep the existing floor finish and colour unchanged, only make it physically realistic')
  }

  const wall = settings?.wallMaterial
  if (isSet(wall, 'Original Model Wall Finishes')) {
    parts.push(`Replace only the wall finish with ${WALL_FINISH_PHRASES[wall!] || wall} (keep wall geometry unchanged)`)
  } else {
    parts.push('Keep the existing wall finishes and colours unchanged, only make them physically realistic')
  }

  const accent = settings?.accentMaterial
  if (isSet(accent, ORIGINAL_ACCENT)) {
    parts.push(`Hardware, fixtures and accents in ${accent}`)
  }

  const mood = settings?.lightingMood || 'Soft Natural Daylight'
  parts.push(
    `Lighting: ${INTERIOR_LIGHT_PHRASES[mood] || mood}, realistic global illumination with soft indirect bounce, natural shadows under furniture, no blown-out highlights`,
  )

  const cameraHeight = settings?.cameraHeight || 'Eye Level (approx 1.5m / 5ft)'
  const perspective = settings?.perspectiveType || 'Preserve Original Viewpoint'
  if (perspective === 'Preserve Original Viewpoint') {
    parts.push('Keep the reference camera position, height and perspective exactly; straight vertical lines')
  } else {
    parts.push(`Camera: ${cameraHeight}, ${perspective}, straight vertical lines`)
  }

  if (settings?.removeSketchupOutlines !== false) {
    parts.push('Remove SketchUp viewport outlines and polygon edges while keeping real material seams, tile grout lines and architectural reveals')
  }

  if (basePrompt && basePrompt.trim().length > 0) parts.push(basePrompt.trim())
  if (settings?.specialInstructions && settings.specialInstructions.trim().length > 0) {
    parts.push(`Constraints: ${settings.specialInstructions.trim()}`)
  }

  return parts.join('. ')
}

/**
 * Builds negative prompt constraints based on category and settings.
 */
export function buildNegativePrompt(category: 'exterior' | 'interior', settings?: ExteriorRenderingSettings | InteriorRenderingSettings): string {
  if (category === 'exterior') {
    const ext = settings as ExteriorRenderingSettings | undefined
    const negs = [
      'altered building geometry',
      'changed window positions',
      'changed roofline',
      'extra or missing floors',
      'distorted facade proportions',
      'black outline strokes',
      'wireframe overlay',
      'sketch lines',
      'CGI look',
      'cartoon',
      'video game graphics',
      'oversaturated neon colours',
      'plastic textures',
      'excessive HDR',
      'artificial glow',
      'crooked architectural lines',
      'blurry',
      'low resolution',
      'watermark',
      'text',
    ]
    if (ext?.humanPresence === 'None') negs.push('people', 'crowd', 'pedestrians', 'human figures')
    if (ext?.vehicles === 'None') negs.push('cars', 'vehicles', 'automobiles', 'traffic')
    if (ext?.boundaryWall === 'No Boundary Wall') negs.push('boundary wall', 'fence')
    return negs.join(', ')
  }
  return [
    'altered room layout',
    'moved walls',
    'changed ceiling height',
    'warped perspective',
    'furniture blocking doorways',
    'SketchUp black outlines',
    'wireframe',
    'clay model',
    'cartoon',
    'blown-out highlights',
    'crushed black shadows',
    'colour cast',
    'fake reflections',
    'plastic textures',
    'low quality',
    'blurry',
    'watermark',
    'text',
  ].join(', ')
}
