import type { RenderLighting } from '../models/render.model.js'
import {
  DIFFUSE_WEATHER,
  FLOOR_PHRASES,
  INTERIOR_LIGHT_PHRASES,
  LENS_PHRASES,
  MOOD_PHRASES,
  ORIGINAL_ACCENT,
  SEASON_PHRASES,
  SUN_TIMES,
  TIME_PHRASES,
  WALL_FINISH_PHRASES,
  WALL_PHRASES,
  WEATHER_PHRASES,
  buildExteriorPrompt,
  buildInteriorPrompt,
  buildNegativePrompt,
  getStoryboardShotInstruction,
  type ExteriorSettings,
  type InteriorSettings,
  type ResolvedExteriorSettings,
} from './prompt-builder.js'

export type RenderQuality = 'standard' | 'high' | 'ultra'
export type RenderingModeValue = 'preserve-structure' | 'realistic-enhancement' | 'creative-redesign'

export type AuditStatus = 'prompt' | 'parameter' | 'negative-prompt' | 'excluded' | 'conflict'

export interface AuditEntry {
  option: string
  value: string
  status: AuditStatus
  detail: string
}

export interface EffectiveRendering {
  category: 'exterior' | 'interior'
  renderingMode: RenderingModeValue
  quality: RenderQuality
  lighting: RenderLighting
  settings: ExteriorSettings | InteriorSettings
  prompt: string
  negativePrompt: string
  warnings: string[]
  audit: AuditEntry[]
}

const TIME_TO_LIGHTING: Record<string, RenderLighting> = {
  Midday: 'daylight',
  'Golden Hour': 'golden-hour',
  'Blue Hour': 'dusk',
  Dusk: 'dusk',
  Dawn: 'daylight',
  Night: 'night',
  'Overcast Day': 'overcast',
  Sunset: 'golden-hour',
}

const MOOD_IMPLIES: Record<string, { time?: string; weather?: string }> = {
  'Golden Hour Mood': { time: 'Golden Hour' },
  'Blue Hour Mood': { time: 'Blue Hour' },
  'Night Luxury': { time: 'Night' },
  'Sunset Drama': { time: 'Sunset' },
  'Overcast Soft Light': { time: 'Overcast Day' },
  'Tropical Daylight': { time: 'Midday' },
  'Monsoon Mood': { weather: 'Rain' },
}

const MOOD_TO_LIGHTING_LABEL = (m: string) => MOOD_PHRASES[m] || m

const INTERIOR_MOOD_TO_LIGHTING: Record<string, RenderLighting> = {
  'Soft Natural Daylight': 'daylight',
  'Neutral Daylight with Subtle Warm Accents': 'daylight',
  'Warm 3000K Ambient Cove & Recessed LEDs': 'dusk',
  'Golden Hour Sunset Window Streams': 'golden-hour',
  'Evening Lamp Glow & Subtle Chandelier': 'night',
  'Diffused Overcast Gallery Illumination': 'overcast',
}

const has = (v: string | undefined, ...empty: string[]) => Boolean(v && v.trim() && !empty.includes(v.trim()))

function resolveExterior(
  input: ExteriorSettings,
  mode: RenderingModeValue,
  fallbackLighting: RenderLighting,
  warnings: string[],
  audit: AuditEntry[],
): { settings: ResolvedExteriorSettings; lighting: RenderLighting } {
  const s: ResolvedExteriorSettings = { ...input }
  const locked = mode !== 'creative-redesign'
  s._lockViewpoint = locked

  const time = s.timeOfDay || 'Golden Hour'
  const weather = s.weather || 'Clear Sky'
  const season = s.season || 'All Season / Dry'

  // --- Mood vs explicit time/weather: harmonize rather than discarding user selection.
  const implied = s.primaryMood ? MOOD_IMPLIES[s.primaryMood] : undefined
  if (implied?.time && implied.time !== time) {
    warnings.push(
      `Mood "${s.primaryMood}" suggests ${implied.time} lighting while Time of Day is set to "${time}". Both are harmonized in the prompt.`,
    )
    audit.push({
      option: 'primaryMood',
      value: s.primaryMood!,
      status: 'prompt',
      detail: `Harmonized with Time of Day "${time}"`,
    })
  } else if (implied?.weather && implied.weather !== weather) {
    warnings.push(
      `Mood "${s.primaryMood}" suggests ${implied.weather} weather while Weather is set to "${weather}". Both are harmonized in the prompt.`,
    )
    audit.push({
      option: 'primaryMood',
      value: s.primaryMood!,
      status: 'prompt',
      detail: `Harmonized with Weather "${weather}"`,
    })
  } else if (s.primaryMood && s.primaryMood !== 'Ultra Photorealistic') {
    audit.push({
      option: 'primaryMood',
      value: s.primaryMood,
      status: 'prompt',
      detail: MOOD_PHRASES[s.primaryMood] ? `Mapped to "${MOOD_TO_LIGHTING_LABEL(s.primaryMood)}"` : 'Added as mood phrase',
    })
  }

  // --- Time + weather: combine physically.
  const timePhrase = TIME_PHRASES[time]
  const weatherPhrase = WEATHER_PHRASES[weather]
  let lightingPhrase: string
  if (DIFFUSE_WEATHER.includes(weather) && SUN_TIMES.includes(time)) {
    warnings.push(
      `Weather "${weather}" blocks direct sun, so "${time}" is rendered with diffuse cloud filtering.`,
    )
    audit.push({ option: 'timeOfDay', value: time, status: 'prompt', detail: `Diffuse cloud-filtered lighting for ${time}` })
    lightingPhrase = `${weatherPhrase}, light colour and brightness of ${time.toLowerCase()} filtered through overcast clouds`
  } else if (time === 'Night' && weather === 'Clear Sky') {
    lightingPhrase = `${timePhrase}, clear starry night sky`
    audit.push({ option: 'timeOfDay', value: time, status: 'prompt', detail: timePhrase })
  } else {
    lightingPhrase = [timePhrase || `${time} lighting`, weatherPhrase || weather].join(', ')
    audit.push({
      option: 'timeOfDay',
      value: time,
      status: 'prompt',
      detail: timePhrase || `${time} lighting`,
    })
  }
  audit.push({
    option: 'weather',
    value: weather,
    status: 'prompt',
    detail: weatherPhrase || weather,
  })

  if (SEASON_PHRASES[season]) {
    lightingPhrase += `, ${SEASON_PHRASES[season]}`
    audit.push({ option: 'season', value: season, status: 'prompt', detail: SEASON_PHRASES[season] })
    if (season === 'Monsoon' && weather === 'Clear Sky') {
      warnings.push('Season "Monsoon" with "Clear Sky": vegetation will appear lush without falling rain.')
    }
  } else {
    audit.push({ option: 'season', value: season, status: 'excluded', detail: 'Default dry season' })
  }

  if (weather === 'Snow' && /kerala|india|dubai|uae/i.test(s.countryRegion || '')) {
    warnings.push(`Snow is unusual for "${s.countryRegion}". Applied as selected.`)
  }
  s._lightingPhrase = lightingPhrase

  // --- Storyboard shots: ensure all selected shots reach the prompt!
  const cues: string[] = []
  const viewpointShots: string[] = []
  for (const shot of s.storyboardShots || []) {
    const instruction = getStoryboardShotInstruction(shot)

    if (instruction) {
      cues.push(instruction)
      viewpointShots.push(shot)
      audit.push({
        option: 'storyboardShots',
        value: shot,
        status: 'prompt',
        detail: locked
          ? `Composition applied while locking reference building geometry: ${instruction}`
          : `Requested composition: ${instruction}`,
      })
    } else {
      audit.push({ option: 'storyboardShots', value: shot, status: 'excluded', detail: 'Unrecognised storyboard shot' })
    }
  }
  s._shotCues = cues
  s._viewpointShots = viewpointShots

  // --- Camera Angle, Body, and Lens.
  if (has(s.cameraAngle)) {
    audit.push({
      option: 'cameraAngle',
      value: s.cameraAngle!,
      status: 'prompt',
      detail: `Camera angle framing: ${s.cameraAngle}`,
    })
  }
  if (s.cameraBody) {
    audit.push({ option: 'cameraBody', value: s.cameraBody, status: 'prompt', detail: `Sensor and optical color profile of ${s.cameraBody}` })
  }
  if (s.cameraLens) {
    audit.push({
      option: 'cameraLens',
      value: s.cameraLens,
      status: 'prompt',
      detail: LENS_PHRASES[s.cameraLens] ? LENS_PHRASES[s.cameraLens] : `${s.cameraLens} focal perspective`,
    })
  }

  // --- People / vehicles / wall.
  if (has(s.humanPresence, 'None')) {
    audit.push({ option: 'humanPresence', value: s.humanPresence!, status: 'prompt', detail: 'People added as selected' })
  } else {
    audit.push({ option: 'humanPresence', value: 'None', status: 'negative-prompt', detail: 'People excluded via negative prompt' })
  }

  if (has(s.vehicles, 'None')) {
    audit.push({ option: 'vehicles', value: s.vehicles!, status: 'prompt', detail: 'Vehicle added as selected' })
  } else {
    audit.push({ option: 'vehicles', value: 'None', status: 'negative-prompt', detail: 'Vehicles excluded via negative prompt' })
  }

  if (has(s.boundaryWall, 'Auto')) {
    audit.push({
      option: 'boundaryWall',
      value: s.boundaryWall!,
      status: s.boundaryWall === 'No Boundary Wall' ? 'negative-prompt' : 'prompt',
      detail:
        s.boundaryWall === 'No Boundary Wall'
          ? 'No boundary wall; perimeter walls excluded'
          : WALL_PHRASES[s.boundaryWall!] || s.boundaryWall!,
    })
  } else {
    audit.push({ option: 'boundaryWall', value: 'Auto', status: 'excluded', detail: 'Auto uses site perimeter from reference' })
  }

  // --- Plain pass-through fields.
  const simple: Array<[keyof ExteriorSettings, string]> = [
    ['buildingType', 'Identifies architectural typology to preserve and render'],
    ['architecturalStyle', 'Guides material and facade vocabulary'],
    ['structuralNotes', 'Structural massing and facade details to preserve'],
    ['locationNotes', 'Site context, topography and surroundings'],
    ['specialInstructions', 'Explicit user constraints'],
    ['promptStyle', 'Controls composition tone and detail level'],
    ['cinematicSchool', 'Cinematographic color grade reference'],
  ]
  for (const [k, detail] of simple) {
    const v = s[k]
    if (typeof v === 'string' && v.trim() && v !== 'None') {
      audit.push({ option: k, value: v.length > 60 ? `${v.slice(0, 57)}...` : v, status: 'prompt', detail })
    }
  }
  const loc = [s.districtPlace, s.areaCommunity, s.countryRegion].filter((x) => has(x))
  if (loc.length) {
    audit.push({ option: 'location', value: loc.join(', '), status: 'prompt', detail: 'Drives regional landscaping and climate textures' })
  }

  return { settings: s, lighting: TIME_TO_LIGHTING[time] || fallbackLighting }
}

function resolveInterior(
  input: InteriorSettings,
  fallbackLighting: RenderLighting,
  warnings: string[],
  audit: AuditEntry[],
): { settings: InteriorSettings; lighting: RenderLighting } {
  const s = { ...input }
  const room = s.roomType || 'Living Room & Salon'

  audit.push({ option: 'roomType', value: room, status: 'prompt', detail: 'Room type strictly limits applicable interior furnishings' })

  if (has(s.flooringMaterial, 'Original Model Flooring')) {
    audit.push({ option: 'flooringMaterial', value: s.flooringMaterial!, status: 'prompt', detail: `REPLACE floor: ${FLOOR_PHRASES[s.flooringMaterial!] || s.flooringMaterial}` })
  } else {
    audit.push({ option: 'flooringMaterial', value: 'Original Model Flooring', status: 'prompt', detail: 'PRESERVE existing floor finish with realistic specular depth' })
  }
  if (has(s.wallMaterial, 'Original Model Wall Finishes')) {
    audit.push({ option: 'wallMaterial', value: s.wallMaterial!, status: 'prompt', detail: `REPLACE walls: ${WALL_FINISH_PHRASES[s.wallMaterial!] || s.wallMaterial}` })
  } else {
    audit.push({ option: 'wallMaterial', value: 'Original Model Wall Finishes', status: 'prompt', detail: 'PRESERVE existing wall finishes with realistic texture' })
  }
  if (has(s.accentMaterial, ORIGINAL_ACCENT)) {
    audit.push({ option: 'accentMaterial', value: s.accentMaterial!, status: 'prompt', detail: `Accent hardware: ${s.accentMaterial}` })
  } else {
    audit.push({ option: 'accentMaterial', value: ORIGINAL_ACCENT, status: 'prompt', detail: 'PRESERVE existing hardware' })
  }

  const mood = s.lightingMood || 'Soft Natural Daylight'
  audit.push({
    option: 'lightingMood',
    value: mood,
    status: 'prompt',
    detail: INTERIOR_LIGHT_PHRASES[mood] || `${mood} indoor illumination`,
  })

  const perspective = s.perspectiveType || 'Preserve Original Viewpoint'
  audit.push({ option: 'perspectiveType', value: perspective, status: 'prompt', detail: `Perspective framing: ${perspective}` })
  if (s.cameraHeight) {
    audit.push({ option: 'cameraHeight', value: s.cameraHeight, status: 'prompt', detail: `Camera height: ${s.cameraHeight}` })
  }

  audit.push({
    option: 'removeSketchupOutlines',
    value: String(s.removeSketchupOutlines !== false),
    status: s.removeSketchupOutlines !== false ? 'prompt' : 'excluded',
    detail: s.removeSketchupOutlines !== false ? 'Eliminates CAD viewport outlines and polygon borders' : 'Wireframe lines retained',
  })

  if (has(s.specialInstructions)) {
    audit.push({ option: 'specialInstructions', value: 'custom', status: 'prompt', detail: 'Added as user constraints' })
    if (!/bath|spa|powder/i.test(room) && /\b(bathtub|bath tub|vanity|shower|toilet)\b/i.test(s.specialInstructions!)) {
      warnings.push(`Your instructions mention bathroom items, but the room is "${room}". Verify this is intentional.`)
    }
  }

  return { settings: s, lighting: INTERIOR_MOOD_TO_LIGHTING[mood] || fallbackLighting }
}

/**
 * Single source of truth: builds the effective configuration, prompts, warnings and audit
 * used by the preview endpoint AND the real provider request.
 */
export function resolveRendering(input: {
  category: 'exterior' | 'interior'
  exteriorSettings?: ExteriorSettings
  interiorSettings?: InteriorSettings
  renderingMode?: RenderingModeValue
  quality?: RenderQuality
  fallbackLighting?: RenderLighting
  refinementPrompt?: string
}): EffectiveRendering {
  const warnings: string[] = []
  const audit: AuditEntry[] = []
  const mode = input.renderingMode || 'preserve-structure'
  const fallbackLighting = input.fallbackLighting || 'golden-hour'

  let settings: ExteriorSettings | InteriorSettings
  let lighting: RenderLighting
  let prompt: string

  if (input.category === 'exterior') {
    const r = resolveExterior(input.exteriorSettings || {}, mode, fallbackLighting, warnings, audit)
    settings = r.settings
    lighting = r.lighting
    prompt = buildExteriorPrompt(r.settings, input.refinementPrompt)
  } else {
    const r = resolveInterior(input.interiorSettings || {}, fallbackLighting, warnings, audit)
    settings = r.settings
    lighting = r.lighting
    prompt = buildInteriorPrompt(r.settings, input.refinementPrompt)
  }

  audit.push({
    option: 'renderingMode',
    value: mode,
    status: 'parameter',
    detail:
      mode === 'preserve-structure'
        ? 'Strict geometric and structural fidelity'
        : mode === 'realistic-enhancement'
          ? 'Balanced architectural realism and natural materials'
          : 'Creative architectural redesign with flexible styling',
  })

  // Strip internal fields before returning the settings that get stored.
  const publicSettings = Object.fromEntries(Object.entries(settings).filter(([k]) => !k.startsWith('_'))) as ExteriorSettings | InteriorSettings

  return {
    category: input.category,
    renderingMode: mode,
    quality: input.quality || 'standard',
    lighting,
    settings: publicSettings,
    prompt,
    negativePrompt: buildNegativePrompt(input.category, settings),
    warnings,
    audit,
  }
}
