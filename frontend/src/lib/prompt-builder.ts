import type { ExteriorRenderingSettings, InteriorRenderingSettings } from '@/types'

/**
 * Constructs an architectural prompt for exterior rendering from exterior.txt configuration.
 */
export function buildExteriorPrompt(settings?: ExteriorRenderingSettings, basePrompt?: string): string {
  const parts: string[] = []

  // 1. Building Type & Architectural Style
  const buildingType = settings?.buildingType || 'Contemporary House'
  const archStyle = settings?.architecturalStyle || 'Tropical Modern'
  parts.push(`Award-winning architectural photography of a ${buildingType} designed in ${archStyle} architectural style`)

  // 2. Structural Notes (Massing, Facade, Proportions)
  if (settings?.structuralNotes && settings.structuralNotes.trim().length > 0) {
    parts.push(`Structural details: ${settings.structuralNotes.trim()}`)
  }

  // 3. Location & Geographical Context
  const locationParts: string[] = []
  if (settings?.districtPlace) locationParts.push(settings.districtPlace.trim())
  if (settings?.areaCommunity) locationParts.push(settings.areaCommunity.trim())
  if (settings?.countryRegion) locationParts.push(settings.countryRegion.trim())
  if (locationParts.length > 0) {
    parts.push(`Site location context: ${locationParts.join(', ')}`)
  }

  // 4. Location & Environmental Notes
  if (settings?.locationNotes && settings.locationNotes.trim().length > 0) {
    parts.push(`Surrounding landscape & environment: ${settings.locationNotes.trim()}`)
  }

  // 5. Boundary Wall
  if (settings?.boundaryWall && settings.boundaryWall !== 'Auto') {
    if (settings.boundaryWall === 'No Boundary Wall') {
      parts.push('Open perimeter without boundary wall, seamless driveway and front landscaping')
    } else {
      parts.push(`Boundary wall treatment: ${settings.boundaryWall}`)
    }
  }

  // 6. Lighting, Time of Day, Season, and Weather
  const time = settings?.timeOfDay || 'Golden Hour'
  const weather = settings?.weather || 'Clear Sky'
  const season = settings?.season && settings.season !== 'All Season / Dry' ? settings.season : null
  const weatherSeason = season ? `${weather}, ${season} season` : weather
  parts.push(`Atmospheric environment: ${time} lighting, ${weatherSeason}`)

  // 7. Primary Mood & Cinematic School
  if (settings?.primaryMood && settings.primaryMood !== 'Ultra Photorealistic') {
    parts.push(`Aesthetic mood: ${settings.primaryMood}`)
  }
  if (settings?.cinematicSchool && settings.cinematicSchool !== 'None') {
    parts.push(`Cinematography influence: ${settings.cinematicSchool}`)
  }

  // 8. Storyboard Creative Shot & Camera Setup
  if (settings?.storyboardShots && settings.storyboardShots.length > 0) {
    parts.push(`Storyboard composition: ${settings.storyboardShots.join('; ')}`)
  }

  // 9. Camera Body, Lens, and Viewpoint
  const camera = settings?.cameraBody || 'Hasselblad X2D 100C'
  const lens = settings?.cameraLens || '35mm Wide'
  const angle = settings?.cameraAngle || 'Eye Level'
  parts.push(`Optics metadata: captured on ${camera}, ${lens} lens, ${angle} perspective with true vertical lines`)

  // 10. Human Presence (Only if not None)
  if (settings?.humanPresence && settings.humanPresence !== 'None') {
    parts.push(`Natural human presence: ${settings.humanPresence}`)
  }

  // 11. Vehicles (Only if not None)
  if (settings?.vehicles && settings.vehicles !== 'None') {
    parts.push(`Parked/passing vehicle: ${settings.vehicles}`)
  }

  // 12. User refinement / base prompt
  if (basePrompt && basePrompt.trim().length > 0) {
    parts.push(basePrompt.trim())
  }

  // 13. Special Instructions & Architectural Lock (from exterior.txt)
  const specialInstructions =
    settings?.specialInstructions?.trim() ||
    'Keep architecture 100% locked. Do not change geometry, materials, roofline, openings, facade design, road, footpath, or landscape position.'
  parts.push(`Structural constraints: ${specialInstructions}`)

  // 14. Prompt Style conditioning
  const styleMode = settings?.promptStyle || 'Detailed'
  if (styleMode === 'Concise') {
    return [parts[0], parts[5], parts[7], specialInstructions].filter(Boolean).join('. ')
  }
  if (styleMode === 'Cinematic') {
    parts.push('35mm anamorphic depth of field, subtle film grain, natural light ray dispersion, Panavision aesthetic, 8k master')
  } else if (styleMode === 'Conceptual') {
    parts.push('Sculptural architectural volume, purity of form, ambient negative space, architectural monograph presentation')
  }

  return parts.join('. ')
}

/**
 * Constructs an architectural prompt for interior rendering from interior.txt configuration.
 */
export function buildInteriorPrompt(settings?: InteriorRenderingSettings, basePrompt?: string): string {
  const parts: string[] = []

  // 1. Room Type
  const roomType = settings?.roomType || 'Living Room & Salon'
  parts.push(`Master architectural interior photography of a luxurious ${roomType}`)

  // 2. Strict Room Geometry & Structural Preservation (from interior.txt)
  parts.push(
    'Strict structural preservation: lock exact room geometry, wall boundaries, ceiling height, window and door placements, structural columns, and perspective alignment of the uploaded reference model. Do not alter wall positions or add unauthorized structural openings',
  )

  // 3. Material Realism (Flooring, Walls, Accents)
  const matParts: string[] = []
  if (settings?.flooringMaterial && settings.flooringMaterial !== 'Original Model Flooring') {
    matParts.push(`flooring: ${settings.flooringMaterial}`)
  }
  if (settings?.wallMaterial && settings.wallMaterial !== 'Original Model Wall Finishes') {
    matParts.push(`wall surfaces: ${settings.wallMaterial}`)
  }
  if (settings?.accentMaterial) {
    matParts.push(`architectural accents & hardware: ${settings.accentMaterial}`)
  }
  if (matParts.length > 0) {
    parts.push(
      `Physically based material realism: ${matParts.join(', ')} with tactile surface variation, natural micro-texture, and physically plausible specular reflections`,
    )
  }

  // 4. Lighting & Global Illumination (from interior.txt)
  const lightingMood = settings?.lightingMood || 'Soft Natural Daylight'
  parts.push(
    `Lighting & illumination: ${lightingMood}, subtle warm ambient accents, realistic global illumination, soft indirect light bounce, natural penumbra shadow falloff, subtle ambient occlusion in corners and joints, zero blown-out highlights`,
  )

  // 5. Camera & Composition (from interior.txt)
  const cameraHeight = settings?.cameraHeight || 'Eye Level (approx 1.5m / 5ft)'
  const perspective = settings?.perspectiveType || 'Preserve Original Viewpoint'
  parts.push(
    `Camera composition: ${cameraHeight}, ${perspective}, perfectly calibrated two-point architectural vertical lines, natural sharpness across all focal planes without artificial optical distortion`,
  )

  // 6. SketchUp / CAD Artifact Removal (from interior.txt)
  if (settings?.removeSketchupOutlines !== false) {
    parts.push(
      'Clean architectural finish: eliminate raw CAD/SketchUp wireframe viewport black lines and polygon facets while maintaining crisp physical material seams, tile grout lines, and architectural reveal joints',
    )
  }

  // 7. Base prompt / custom user prompt
  if (basePrompt && basePrompt.trim().length > 0) {
    parts.push(basePrompt.trim())
  }

  // 8. Special Instructions
  if (settings?.specialInstructions && settings.specialInstructions.trim().length > 0) {
    parts.push(`Architectural constraints: ${settings.specialInstructions.trim()}`)
  }

  return parts.join('. ')
}

/**
 * Builds negative prompt constraints based on category and settings.
 */
export function buildNegativePrompt(
  category: 'exterior' | 'interior',
  settings?: ExteriorRenderingSettings | InteriorRenderingSettings,
): string {
  if (category === 'exterior') {
    const ext = settings as ExteriorRenderingSettings | undefined
    const negs = [
      'altering building geometry',
      'changing window locations',
      'changing roofline',
      'adding or removing floors',
      'moving doors',
      'distorting facade proportions',
      'fake render look',
      'CGI',
      'cartoon',
      'video game graphics',
      'oversaturated neon colors',
      'plastic textures',
      'wireframe overlay',
      'crooked architectural lines',
      'blurry',
      'low resolution',
      'watermark',
      'bad architecture',
    ]

    if (ext?.humanPresence === 'None') {
      negs.push('people', 'crowd', 'pedestrians', 'human figures')
    }

    if (ext?.vehicles === 'None') {
      negs.push('cars', 'vehicles', 'automobiles', 'traffic')
    }

    return negs.join(', ')
  } else {
    return [
      'altering room layout',
      'moving walls',
      'changing ceiling height',
      'warped structural perspective',
      'unauthorized furniture blocking doorways',
      'distorted proportions',
      'SketchUp black viewport outlines',
      'wireframe',
      'clay model',
      'cartoon',
      'blown-out highlights',
      'crushed pitch black shadows',
      'excessive color cast',
      'fake reflections',
      'low quality',
      'blurry',
      'watermark',
    ].join(', ')
  }
}
