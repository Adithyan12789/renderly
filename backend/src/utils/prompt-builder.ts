export interface ExteriorSettings {
  buildingType?: string
  architecturalStyle?: string
  promptStyle?: 'Concise' | 'Detailed' | 'Conceptual' | 'Cinematic'
  countryRegion?: string
  areaCommunity?: string
  districtPlace?: string
  timeOfDay?: string
  primaryMood?: string
  cinematicSchool?: string
  season?: string
  weather?: string
  humanPresence?: string
  vehicles?: string
  boundaryWall?: string
  cameraBody?: string
  cameraLens?: string
  cameraAngle?: string
  storyboardShots?: string[]
  structuralNotes?: string
  locationNotes?: string
  specialInstructions?: string
}

/**
  Exterior settings after conflict resolution (see render-settings.ts).
 */
export interface ResolvedExteriorSettings extends ExteriorSettings {
  _lightingPhrase?: string
  _shotCues?: string[]
  _viewpointShots?: string[]
  _lockViewpoint?: boolean
}

export interface InteriorSettings {
  roomType?: string
  structuralPreservation?: string
  flooringMaterial?: string
  wallMaterial?: string
  accentMaterial?: string
  lightingMood?: string
  cameraHeight?: string
  perspectiveType?: string
  removeSketchupOutlines?: boolean
  specialInstructions?: string
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

/** Weather that removes hard direct sun regardless of the selected time of day. */
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
  Joyful: 'warm and uplifting natural ambiance',
  Serene: 'calm, tranquil, and balanced atmosphere',
  Romantic: 'atmospheric lighting with gentle contrast',
  Dramatic: 'bold dramatic light and shadow contrasts',
  Mysterious: 'deep shadows and evocative atmospheric mood',
  Melancholic: 'contemplative moody tonal palette',
  Energetic: 'crisp vibrant lighting with lively presence',
  Minimal: 'clean restrained simplicity and uncluttered focus',
  Luxurious: 'sophisticated high-end finish and editorial prestige',
}

export const LENS_PHRASES: Record<string, string> = {
  '24mm Tilt-Shift Architectural': '24mm tilt-shift perspective correction with perfectly vertical lines',
  '35mm Wide': '35mm wide architectural lens perspective',
  '50mm Standard Prime': '50mm natural eye-level prime perspective',
  '16mm Ultra-Wide': '16mm ultra-wide perspective',
  '85mm Compressed Perspective': '85mm compressed telephoto perspective',
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

export const STORYBOARD_SHOT_DESCRIPTIONS: Record<string, string> = {
  'shot-01': 'monumental hero front elevation capturing complete building facade symmetry, entrance approach, and architectural presence',
  'shot-02': 'dynamic corner three-quarter view revealing architectural volume, massing, depth, and return facades',
  'shot-03': 'low road-level perspective looking up from the approach road/driveway, emphasizing architectural scale and height',
  'shot-04': 'wide neighbourhood establishing shot showcasing complete site boundaries, streetscape, and contextual vegetation',
  'shot-05': 'dramatic night luxury arrival shot with glowing warm interior lighting through glazing and architectural landscape uplighting',
  'shot-06': 'cinematic foreground lifestyle framing through lush tropical foliage, garden trees, or reflective courtyard water',
  'shot-07': 'blue hour twilight street shot with illuminated facade fixtures reflecting off wet driveway pavers under a deep twilight sky',
  'shot-08': 'rear walking follow perspective along the entrance pathway looking toward the main architectural entrance',
  'shot-09': 'frontal architectural elevation with natural human figures gracefully positioned to demonstrate true architectural scale',
  'shot-10': 'architectural facade with subtle motion-blurred passing vehicle streaks along the foreground street',
  'shot-11': 'pedestrian footpath edge perspective along stone pavers, curb, and site boundary wall',
  'shot-12': 'authentic local neighbourhood establishing shot with regional flora, native trees, and cultural atmosphere',
  'shot-13': 'macro architectural detail closeup highlighting tactile materials: concrete joints, timber louvers, and bronze hardware',
  'shot-14': 'elevated 45-degree oblique drone perspective capturing roof form, building footprint, and surrounding topography',
  'shot-15': 'welcoming family lifestyle scene near the veranda or entrance showcasing residential warmth and hospitality',
}

/** Shot number -> behaviour. Used by the resolver and the builder. */
export interface ShotMeta {
  viewpoint: boolean
  cue?: string
  needsPeople?: boolean
  needsVehicle?: boolean
  impliesTime?: string[]
}

export const SHOT_META: Record<number, ShotMeta> = {
  1: { viewpoint: true, cue: 'monumental hero front elevation' },
  2: { viewpoint: true, cue: 'dynamic corner three-quarter perspective revealing depth and volume' },
  3: { viewpoint: true, cue: 'low road-level perspective looking up from foreground driveway' },
  4: { viewpoint: true, cue: 'wide neighbourhood establishing shot showing streetscape and vegetation' },
  5: { viewpoint: true, impliesTime: ['Night'], cue: 'dramatic night luxury arrival shot with glowing warm interior light and landscape uplighting' },
  6: { viewpoint: false, cue: 'lush foreground foliage softly framing the view' },
  7: { viewpoint: false, impliesTime: ['Blue Hour', 'Dusk'], cue: 'wet street reflections under the twilight sky' },
  8: { viewpoint: true, needsPeople: true, cue: 'a person walking along the path toward the entrance, seen from behind' },
  9: { viewpoint: true, needsPeople: true, cue: 'a few natural human figures giving true architectural scale' },
  10: { viewpoint: false, needsVehicle: true, cue: 'a subtly motion-blurred passing vehicle in the foreground' },
  11: { viewpoint: true, cue: 'pedestrian footpath perspective along curb and stone pavers' },
  12: { viewpoint: false, cue: 'authentic regional neighbourhood atmosphere and local flora' },
  13: { viewpoint: true, cue: 'tactile architectural material macro closeup of joints, louvers, and surfaces' },
  14: { viewpoint: true, cue: 'elevated 45-degree oblique drone perspective capturing roof planes and topography' },
  15: { viewpoint: false, needsPeople: true, cue: 'a welcoming family scene near the entrance' },
}

export function parseShotNumber(shot: string): number | null {
  const m = /SHOT\s*(\d+)/i.exec(shot)
  return m ? Number(m[1]) : null
}

export function getStoryboardShotInstruction(shot: string): string {
  const num = parseShotNumber(shot)
  if (num) {
    const key = `shot-${String(num).padStart(2, '0')}`
    if (STORYBOARD_SHOT_DESCRIPTIONS[key]) {
      return STORYBOARD_SHOT_DESCRIPTIONS[key]
    }
    if (SHOT_META[num]?.cue) {
      return SHOT_META[num]!.cue!
    }
  }
  for (const [key, desc] of Object.entries(STORYBOARD_SHOT_DESCRIPTIONS)) {
    if (shot.toLowerCase().includes(key)) return desc
  }
  return shot.replace(/^SHOT\s*\d+\s*[—–-]?\s*/i, '').trim()
}

export function validateRenderingSettings(
  category: 'exterior' | 'interior',
  settings: Record<string, unknown> | undefined,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!settings || typeof settings !== 'object') {
    return { valid: true, errors: [] }
  }

  if (category === 'exterior') {
    const ext = settings as Partial<ExteriorSettings>
    if (ext.promptStyle && !['Concise', 'Detailed', 'Conceptual', 'Cinematic'].includes(ext.promptStyle)) {
      errors.push(`Invalid promptStyle: ${ext.promptStyle}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

const isSet = (v: string | undefined, ...empty: string[]): v is string =>
  Boolean(v && v.trim().length > 0 && !empty.includes(v.trim()))

/**
 * Exterior prompt composed of 8 structured priorities:
 * 1. Core image-editing objective
 * 2. Uploaded reference image interpretation
 * 3. Structural-preservation constraints
 * 4. User-selected configuration values (building type, architectural style, location context)
 * 5. Material, lighting, and realism instructions (PBR, weather, time of day, atmosphere)
 * 6. Selected storyboard or camera instructions (framing, lens, body, viewpoint)
 * 7. User's additional instructions & refinement
 * 8. Relevant negative constraints to avoid unwanted changes
 */
export function buildExteriorPrompt(
  rawSettings?: ExteriorSettings,
  basePrompt?: string,
): string {
  const settings = (rawSettings || {}) as ResolvedExteriorSettings
  const buildingType = settings.buildingType || 'Contemporary House'
  const archStyle = settings.architecturalStyle || 'Tropical Modern'

  // Section 1: Objective & Subject
  const objective = `Photorealistic architectural visualization and image-edit of the 3D model shown in the reference image: a ${buildingType} executed in ${archStyle} architectural design language.`

  // Section 2: Reference Image Interpretation
  const referenceInterpretation =
    'Treat the uploaded SketchUp / CAD viewport capture as the primary geometric blueprint. Transform flat, untextured surfaces into authentic real-world architectural construction.'

  // Section 3: Structural Preservation
  const structureRules = [
    'Preserve the building silhouette, number of storeys, overall dimensions, proportions, and roof form from the reference image.',
    'Keep the exact placement and proportions of doors, windows, balconies, stairs, columns, and structural openings.',
  ]
  if (isSet(settings.structuralNotes)) {
    structureRules.push(`Structural details: ${settings.structuralNotes.trim()}.`)
  }
  const preservation = structureRules.join(' ')

  // Section 4: Configuration Values (Location, Boundary, Elements)
  const loc = [settings.districtPlace, settings.areaCommunity, settings.countryRegion].filter((v) => isSet(v)).map((v) => v!.trim())
  const locationPhrase = loc.length
    ? `Site Context: Situated in ${loc.join(', ')}, featuring regionally authentic indigenous vegetation, road textures, and terrain.`
    : ''
  const locationNotesPhrase = isSet(settings.locationNotes) ? `Surroundings: ${settings.locationNotes.trim()}.` : ''

  let wallPhrase = ''
  if (isSet(settings.boundaryWall, 'Auto')) {
    wallPhrase =
      settings.boundaryWall === 'No Boundary Wall'
        ? 'Perimeter: Open site perimeter with no boundary wall or fence.'
        : `Perimeter: ${WALL_PHRASES[settings.boundaryWall] || settings.boundaryWall}.`
  }

  const peoplePhrase = isSet(settings.humanPresence, 'None')
    ? `Human Presence: ${settings.humanPresence} with natural, scale-appropriate attire.`
    : ''
  const vehiclesPhrase = isSet(settings.vehicles, 'None')
    ? `Vehicles: ${settings.vehicles} positioned naturally on the approach or driveway.`
    : ''

  // Section 5: Material, Lighting, and Realism Instructions
  const time = settings.timeOfDay || 'Golden Hour'
  const weather = settings.weather || 'Clear Sky'
  const lighting =
    settings._lightingPhrase ||
    [TIME_PHRASES[time] || `${time} lighting`, WEATHER_PHRASES[weather] || weather, SEASON_PHRASES[settings.season || ''] || '']
      .filter(Boolean)
      .join(', ')

  const moodParts: string[] = []
  if (isSet(settings.primaryMood, 'Ultra Photorealistic')) {
    moodParts.push(MOOD_PHRASES[settings.primaryMood] || `${settings.primaryMood} mood`)
  }
  if (isSet(settings.cinematicSchool, 'None')) {
    moodParts.push(`colour grading inspired by ${settings.cinematicSchool} cinematography`)
  }
  const moodPhrase = moodParts.length ? `Atmosphere & Mood: ${moodParts.join(', ')}.` : ''

  const pbrRealism =
    'Physically based rendering (PBR): authentic concrete porosity, natural stone grain, warm timber grain, crisp low-iron architectural glazing with real Fresnel reflections and subtle interior transparency, realistic contact shadows, and natural ambient occlusion.'

  // Section 6: Storyboard Shot & Camera Optics
  const camera = isSet(settings.cameraBody) ? settings.cameraBody : 'Hasselblad medium-format camera'
  const lens = isSet(settings.cameraLens) ? settings.cameraLens : '35mm Wide'
  const lensLook = LENS_PHRASES[lens] || `${lens} lens perspective`
  const angle = isSet(settings.cameraAngle, 'Eye Level') ? `, ${settings.cameraAngle} camera angle` : ''
  const cameraPhrase = `Camera & Optics: Shot on ${camera} with ${lensLook}${angle}.`

  const shotInstructions: string[] = []
  if (settings.storyboardShots && settings.storyboardShots.length) {
    for (const shot of settings.storyboardShots) {
      const desc = getStoryboardShotInstruction(shot)
      if (desc) shotInstructions.push(desc)
    }
  }
  const storyboardPhrase = shotInstructions.length
    ? `Composition & Storyboard: ${shotInstructions.join('; ')}. Retain structural alignment with the reference building while fulfilling this composition.`
    : 'Composition: Maintain the camera viewpoint, framing, and perspective established in the reference image.'

  // Section 7: User Additional Instructions & Refinement
  const refinement = basePrompt && basePrompt.trim().length > 0 ? `Refinement: ${basePrompt.trim()}` : ''
  const special = isSet(settings.specialInstructions)
    ? `User Constraints: ${settings.specialInstructions.trim()}`
    : 'User Constraints: Keep architecture strictly locked. Do not invent contradictory architectural volumes or shift openings.'

  // Section 8: Negative Constraints
  const negativeGuidance =
    'Negative Constraints: Eliminate all SketchUp black outline strokes, CAD wireframes, polygon edges, flat cartoon textures, artificial CGI glows, watermarks, and distorted proportions.'

  const style = settings.promptStyle || 'Detailed'
  if (style === 'Concise') {
    return [
      objective,
      preservation,
      `Lighting: ${lighting}.`,
      wallPhrase,
      peoplePhrase,
      vehiclesPhrase,
      storyboardPhrase,
      special,
      negativeGuidance,
    ]
      .filter(Boolean)
      .join(' ')
  }

  const sections = [
    objective,
    referenceInterpretation,
    preservation,
    locationPhrase,
    locationNotesPhrase,
    wallPhrase,
    peoplePhrase,
    vehiclesPhrase,
    `Lighting & Environment: ${lighting}.`,
    moodPhrase,
    pbrRealism,
    cameraPhrase,
    storyboardPhrase,
    refinement,
    special,
    negativeGuidance,
  ]

  if (style === 'Cinematic') {
    sections.push('Cinematic Optical Traits: Subtle organic film grain, natural depth of field falloff, wide dynamic range without harsh HDR clipping.')
  } else if (style === 'Conceptual') {
    sections.push('Conceptual Artistic Traits: Sculptural geometric volume emphasis, serene negative space, restrained architectural magazine aesthetic.')
  }

  return sections.filter(Boolean).join(' ')
}

/**
 * Interior prompt composed of 8 structured priorities:
 * 1. Core interior objective & room type
 * 2. Reference image spatial interpretation
 * 3. Spatial & geometric preservation constraints
 * 4. User-selected interior materials (flooring, wall finishes, accents)
 * 5. Lighting, shadows, and PBR realism (room-appropriate elements, no bathroom bleed into living/bedrooms)
 * 6. Camera height, composition, and perspective alignment
 * 7. User additional instructions & refinement
 * 8. Outline removal and negative constraints
 */
export function buildInteriorPrompt(settings?: InteriorSettings, basePrompt?: string): string {
  const s = settings || {}
  const roomType = s.roomType || 'Living Room & Salon'

  // Section 1: Objective & Room Type
  const objective = `Photorealistic architectural interior visualization and image-edit of the exact ${roomType} shown in the reference image.`

  // Section 2: Reference Image Interpretation
  const referenceInterpretation =
    'Treat the uploaded SketchUp / CAD room viewport capture as the spatial blueprint. Render flat surfaces and simple models into authentic high-end interior architecture.'

  // Section 3: Spatial Preservation
  const preservation = isSet(s.structuralPreservation)
    ? s.structuralPreservation.trim()
    : 'Preserve the 1:1 room layout, wall positions, ceiling height, structural columns, doors, window openings, and primary furniture placements from the reference image.'

  // Section 4: Materials (Flooring, Walls, Accents, Ceiling)
  const floor = s.flooringMaterial
  const floorPhrase = isSet(floor, 'Original Model Flooring')
    ? `Floor Finish: Replace only the floor finish with ${FLOOR_PHRASES[floor] || floor}, maintaining floor boundaries and perspective lines.`
    : 'Floor Finish: Keep the existing floor finish and color from the reference model unchanged, only make it physically realistic with specular reflections and material depth.'

  const wall = s.wallMaterial
  const wallPhrase = isSet(wall, 'Original Model Wall Finishes')
    ? `Wall Treatment: Replace only the wall finish with ${WALL_FINISH_PHRASES[wall] || wall}, preserving exact wall geometry.`
    : 'Wall Treatment: Keep the existing wall finishes and colors from the reference model unchanged, only make them physically realistic with subtle plaster texture.'

  const accent = s.accentMaterial
  const accentPhrase = isSet(accent, ORIGINAL_ACCENT)
    ? `Hardware & Accents: Finished in ${accent}.`
    : ''

  const ceilingPhrase = 'Ceiling: Smooth architectural ceiling with seamless reveals, realistic ambient light bounce, and recessed architectural lighting fixtures.'

  // Section 5: Lighting, Shadows & Room-Appropriate Realism
  const mood = s.lightingMood || 'Soft Natural Daylight'
  const lightPhrase = `Lighting: ${INTERIOR_LIGHT_PHRASES[mood] || mood}. Physically accurate global illumination with multi-bounce ambient light, natural soft penumbra shadows under furniture, and no blown-out highlights.`

  // Strictly room-appropriate architectural details (prevent bathroom fixtures in living/bedrooms!)
  let roomDetails = ''
  if (/bath|spa|powder/i.test(roomType)) {
    roomDetails = 'Room Elements: Luxury bathroom vanity, high-end sanitaryware, brushed metal tapware, frameless LED backlit mirror, designer basin, and walk-in rain shower with frameless low-iron glass.'
  } else if (/kitchen/i.test(roomType)) {
    roomDetails = 'Room Elements: Luxury kitchen cabinetry, premium countertop slabs, undermount sink, designer mixer, integrated architectural appliances, and breakfast counter joinery.'
  } else if (/bed/i.test(roomType)) {
    roomDetails = 'Room Elements: Contemporary upholstered bed frame, natural linen bedding, architectural headboard feature, bespoke bedside tables, and integrated wardrobe joinery.'
  } else if (/office|library/i.test(roomType)) {
    roomDetails = 'Room Elements: Executive floating desk, ergonomic designer chair, bespoke timber bookshelves with subtle shelf illumination, and curated decor.'
  } else if (/lounge|bar/i.test(roomType)) {
    roomDetails = 'Room Elements: Sculptural cocktail lounge seating, bespoke backlit back-bar joinery, smoked glass shelves, and low-profile lounge tables.'
  } else if (/theater|cinema/i.test(roomType)) {
    roomDetails = 'Room Elements: Tiered acoustic wall panelling, plush cinema recliners, concealed low-level aisle lighting, and luxury fabric textures.'
  } else {
    // Living room / salon default
    roomDetails = 'Room Elements: Contemporary designer sofa seating, sculpted coffee table, textured area rug, low-profile media console, floor-to-ceiling drapery, and curated architectural decor.'
  }

  // Section 6: Camera & Perspective
  const cameraHeight = s.cameraHeight || 'Eye Level (approx 1.5m / 5ft)'
  const perspective = s.perspectiveType || 'Preserve Original Viewpoint'
  const cameraPhrase = perspective === 'Preserve Original Viewpoint'
    ? 'Camera: Maintain the reference image camera position and framing exactly, with straight vertical architectural lines.'
    : `Camera: ${cameraHeight}, ${perspective}, with perfectly vertical architectural lines.`

  // Section 7: User Additional Instructions & Refinement
  const refinement = basePrompt && basePrompt.trim().length > 0 ? `Refinement: ${basePrompt.trim()}` : ''
  const special = isSet(s.specialInstructions)
    ? `User Constraints: ${s.specialInstructions.trim()}`
    : 'User Constraints: Preserve interior spatial layout and walls 100% locked. Do not arbitrarily reconfigure room architecture.'

  // Section 8: Outline Removal & Negative Constraints
  const outlineRemoval = s.removeSketchupOutlines !== false
    ? 'Artifact Removal: Eliminate all SketchUp black outline strokes, CAD wireframe lines, and visible polygon mesh edges. Replace them with authentic material seams, tile grout joints, and soft contact shadows.'
    : ''
  const negativeGuidance =
    'Negative Constraints: Do not alter room layout, do not move walls or doors, no warped perspective, no furniture blocking walkways, no cartoon rendering, no clay model appearance, no blurry artifacts.'

  return [
    objective,
    referenceInterpretation,
    preservation,
    floorPhrase,
    wallPhrase,
    accentPhrase,
    ceilingPhrase,
    lightPhrase,
    roomDetails,
    cameraPhrase,
    refinement,
    special,
    outlineRemoval,
    negativeGuidance,
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Builds negative prompt constraints based on category and settings.
 */
export function buildNegativePrompt(category: 'exterior' | 'interior', settings?: ExteriorSettings | InteriorSettings): string {
  if (category === 'exterior') {
    const ext = settings as ExteriorSettings | undefined
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
