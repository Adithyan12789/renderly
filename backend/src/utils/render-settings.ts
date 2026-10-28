import type { RenderLighting } from '../models/render.model.js'
import {
  DIFFUSE_WEATHER,
  FLOOR_PHRASES,
  INTERIOR_LIGHT_PHRASES,
  LENS_PHRASES,
  MOOD_PHRASES,
  ORIGINAL_ACCENT,
  SEASON_PHRASES,
  SHOT_META,
  SUN_TIMES,
  TIME_PHRASES,
  WALL_FINISH_PHRASES,
  WALL_PHRASES,
  WEATHER_PHRASES,
  buildExteriorPrompt,
  buildInteriorPrompt,
  buildNegativePrompt,
  parseShotNumber,
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

const has = (v: string | undefined, ...empty: string[]) => Boolean(v && v.trim() && !empty.includes(v))

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

  // --- Mood vs explicit time/weather: explicit time of day wins.
  const implied = s.primaryMood ? MOOD_IMPLIES[s.primaryMood] : undefined
  if (implied?.time && implied.time !== time) {
    warnings.push(
      `Mood "${s.primaryMood}" implies ${implied.time} lighting, but Time of Day is "${time}". Time of Day takes priority; the mood's lighting was dropped. Set Time of Day to "${implied.time}" to match.`,
    )
    audit.push({ option: 'primaryMood', value: s.primaryMood!, status: 'conflict', detail: `Overridden by Time of Day "${time}"` })
    s.primaryMood = 'Ultra Photorealistic'
  } else if (implied?.weather && implied.weather !== weather) {
    warnings.push(
      `Mood "${s.primaryMood}" implies ${implied.weather}, but Weather is "${weather}". Weather takes priority; the mood's weather was dropped.`,
    )
    audit.push({ option: 'primaryMood', value: s.primaryMood!, status: 'conflict', detail: `Overridden by Weather "${weather}"` })
    s.primaryMood = 'Ultra Photorealistic'
  } else if (s.primaryMood && s.primaryMood !== 'Ultra Photorealistic') {
    audit.push({
      option: 'primaryMood',
      value: s.primaryMood,
      status: 'prompt',
      detail: MOOD_PHRASES[s.primaryMood] ? `Mapped to "${MOOD_TO_LIGHTING_LABEL(s.primaryMood)}"` : 'Added as a generic mood phrase',
    })
  }

  // --- Time + weather: combine physically. Diffuse weather removes hard sun.
  const timePhrase = TIME_PHRASES[time]
  const weatherPhrase = WEATHER_PHRASES[weather]
  let lightingPhrase: string
  if (DIFFUSE_WEATHER.includes(weather) && SUN_TIMES.includes(time)) {
    warnings.push(
      `Weather "${weather}" blocks direct sun, so "${time}" is applied only as colour temperature and brightness (no hard sun shadows).`,
    )
    audit.push({ option: 'timeOfDay', value: time, status: 'conflict', detail: `Applied as light colour only because of ${weather}` })
    lightingPhrase = `${weatherPhrase}, light colour and brightness of ${time.toLowerCase()} filtered through the clouds`
  } else if (time === 'Night' && weather === 'Clear Sky') {
    lightingPhrase = `${timePhrase}, clear starry night sky`
    audit.push({ option: 'timeOfDay', value: time, status: 'prompt', detail: timePhrase })
  } else {
    lightingPhrase = [timePhrase || `${time} lighting`, weatherPhrase || weather].join(', ')
    audit.push({
      option: 'timeOfDay',
      value: time,
      status: timePhrase ? 'prompt' : 'excluded',
      detail: timePhrase || 'Unrecognised value, used as plain text',
    })
  }
  audit.push({
    option: 'weather',
    value: weather,
    status: weatherPhrase ? 'prompt' : 'excluded',
    detail: weatherPhrase || 'Unrecognised value, used as plain text',
  })

  if (SEASON_PHRASES[season]) {
    lightingPhrase += `, ${SEASON_PHRASES[season]}`
    audit.push({ option: 'season', value: season, status: 'prompt', detail: SEASON_PHRASES[season] })
    if (season === 'Monsoon' && weather === 'Clear Sky') {
      warnings.push('Season "Monsoon" with a "Clear Sky": vegetation will look monsoon-lush, but there will be no rain. Choose Weather "Rain" for rain.')
    }
  } else {
    audit.push({ option: 'season', value: season, status: 'excluded', detail: 'Default season, no extra instruction' })
  }

  if (weather === 'Snow' && /kerala|india|dubai|uae/i.test(s.countryRegion || '')) {
    warnings.push(`Snow is unusual for "${s.countryRegion}". Applied as selected.`)
  }
  s._lightingPhrase = lightingPhrase

  // --- Storyboard shots.
  const cues: string[] = []
  const viewpointShots: string[] = []
  for (const shot of s.storyboardShots || []) {
    const n = parseShotNumber(shot)
    const meta = n ? SHOT_META[n] : undefined
    if (!meta) {
      audit.push({ option: 'storyboardShots', value: shot, status: 'excluded', detail: 'Unrecognised shot' })
      continue
    }
    if (meta.needsPeople && !has(s.humanPresence, 'None')) {
      warnings.push(`${shot} wants people, but Human Presence is "None". No people were added (your explicit "None" wins).`)
      audit.push({ option: 'storyboardShots', value: shot, status: 'conflict', detail: 'People omitted because Human Presence is None' })
      continue
    }
    if (meta.needsVehicle && !has(s.vehicles, 'None')) {
      warnings.push(`${shot} wants a vehicle, but Vehicle Presence is "None". No vehicle was added.`)
      audit.push({ option: 'storyboardShots', value: shot, status: 'conflict', detail: 'Vehicle omitted because Vehicle Presence is None' })
      continue
    }
    if (meta.impliesTime && !meta.impliesTime.includes(time)) {
      warnings.push(`${shot} implies ${meta.impliesTime.join(' / ')} lighting, but Time of Day is "${time}". Time of Day wins, so the shot's lighting was not applied.`)
      audit.push({ option: 'storyboardShots', value: shot, status: 'conflict', detail: `Lighting overridden by Time of Day "${time}"` })
      continue
    }
    if (meta.cue) cues.push(meta.cue)
    if (meta.viewpoint) {
      if (locked) {
        const isDefault = n === 1
        audit.push({
          option: 'storyboardShots',
          value: shot,
          status: 'excluded',
          detail: 'Viewpoint is fixed by the structure-locked reference image' + (meta.cue ? '; atmosphere cue kept' : ''),
        })
        if (!isDefault) {
          warnings.push(`${shot}: a new viewpoint can't be applied while the reference structure is locked. The reference camera angle is kept. Use "Creative Redesign" to allow a looser viewpoint (not guaranteed).`)
        }
      } else {
        viewpointShots.push(shot)
        audit.push({ option: 'storyboardShots', value: shot, status: 'prompt', detail: 'Requested as preferred viewpoint (best effort, not guaranteed by the model)' })
      }
    } else {
      audit.push({ option: 'storyboardShots', value: shot, status: 'prompt', detail: meta.cue || 'Composition cue' })
    }
  }
  s._shotCues = cues
  s._viewpointShots = viewpointShots

  // --- Camera.
  if (has(s.cameraAngle, 'Eye Level')) {
    if (locked) {
      warnings.push(`Camera angle "${s.cameraAngle}" can't be applied while the reference structure is locked; the reference viewpoint is kept.`)
      audit.push({ option: 'cameraAngle', value: s.cameraAngle!, status: 'excluded', detail: 'Reference viewpoint locked' })
      s.cameraAngle = undefined
    } else {
      audit.push({ option: 'cameraAngle', value: s.cameraAngle!, status: 'prompt', detail: 'Best effort' })
    }
  } else if (s.cameraAngle) {
    audit.push({ option: 'cameraAngle', value: s.cameraAngle, status: 'excluded', detail: 'Default; reference viewpoint kept' })
  }
  if (s.cameraBody) {
    audit.push({ option: 'cameraBody', value: s.cameraBody, status: 'prompt', detail: 'Style hint only. The model does not simulate real sensors' })
  }
  if (s.cameraLens) {
    audit.push({
      option: 'cameraLens',
      value: s.cameraLens,
      status: 'prompt',
      detail: LENS_PHRASES[s.cameraLens] ? `Mapped to "${LENS_PHRASES[s.cameraLens]}" (style hint only)` : 'Perspective hint only',
    })
  }

  // --- People / vehicles / wall.
  audit.push(
    has(s.humanPresence, 'None')
      ? { option: 'humanPresence', value: s.humanPresence!, status: 'prompt', detail: 'People added as selected' }
      : { option: 'humanPresence', value: 'None', status: 'negative-prompt', detail: 'People excluded via negative prompt' },
  )
  audit.push(
    has(s.vehicles, 'None')
      ? { option: 'vehicles', value: s.vehicles!, status: 'prompt', detail: 'Vehicle added as selected' }
      : { option: 'vehicles', value: 'None', status: 'negative-prompt', detail: 'Vehicles excluded via negative prompt' },
  )
  if (has(s.boundaryWall, 'Auto')) {
    audit.push({
      option: 'boundaryWall',
      value: s.boundaryWall!,
      status: 'prompt',
      detail:
        s.boundaryWall === 'No Boundary Wall'
          ? 'No wall requested; walls excluded via negative prompt'
          : WALL_PHRASES[s.boundaryWall!] || 'Added as plain text',
    })
  } else {
    audit.push({ option: 'boundaryWall', value: 'Auto', status: 'excluded', detail: 'Auto leaves the wall to the reference/model' })
  }

  // --- Plain pass-through fields.
  const simple: Array<[keyof ExteriorSettings, string]> = [
    ['buildingType', 'Guides interpretation of the reference design'],
    ['architecturalStyle', 'Guides material and design language'],
    ['structuralNotes', 'Added as structural details to respect'],
    ['locationNotes', 'Added as surroundings'],
    ['specialInstructions', 'Added as constraints'],
    ['promptStyle', 'Controls prompt length and tone'],
    ['cinematicSchool', 'Colour grade hint'],
  ]
  for (const [k, detail] of simple) {
    const v = s[k]
    if (typeof v === 'string' && v.trim() && v !== 'None') audit.push({ option: k, value: v.length > 60 ? `${v.slice(0, 57)}...` : v, status: 'prompt', detail })
  }
  const loc = [s.districtPlace, s.areaCommunity, s.countryRegion].filter((x) => has(x))
  if (loc.length) audit.push({ option: 'location', value: loc.join(', '), status: 'prompt', detail: 'Drives vegetation, terrain and climate context' })

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

  audit.push({ option: 'roomType', value: room, status: 'prompt', detail: 'Selected room type is the only room-specific context used' })

  if (has(s.flooringMaterial, 'Original Model Flooring')) {
    audit.push({ option: 'flooringMaterial', value: s.flooringMaterial!, status: 'prompt', detail: `REPLACE floor: ${FLOOR_PHRASES[s.flooringMaterial!] || 'plain text'}` })
  } else {
    audit.push({ option: 'flooringMaterial', value: 'Original Model Flooring', status: 'prompt', detail: 'PRESERVE existing floor finish' })
  }
  if (has(s.wallMaterial, 'Original Model Wall Finishes')) {
    audit.push({ option: 'wallMaterial', value: s.wallMaterial!, status: 'prompt', detail: `REPLACE walls: ${WALL_FINISH_PHRASES[s.wallMaterial!] || 'plain text'}` })
  } else {
    audit.push({ option: 'wallMaterial', value: 'Original Model Wall Finishes', status: 'prompt', detail: 'PRESERVE existing wall finishes' })
  }
  if (has(s.accentMaterial, ORIGINAL_ACCENT)) {
    audit.push({ option: 'accentMaterial', value: s.accentMaterial!, status: 'prompt', detail: 'REPLACE hardware and accents' })
  } else {
    audit.push({ option: 'accentMaterial', value: ORIGINAL_ACCENT, status: 'prompt', detail: 'PRESERVE existing hardware and accents' })
  }

  const mood = s.lightingMood || 'Soft Natural Daylight'
  audit.push({
    option: 'lightingMood',
    value: mood,
    status: INTERIOR_LIGHT_PHRASES[mood] ? 'prompt' : 'excluded',
    detail: INTERIOR_LIGHT_PHRASES[mood] || 'Unrecognised value, used as plain text',
  })

  const perspective = s.perspectiveType || 'Preserve Original Viewpoint'
  if (perspective !== 'Preserve Original Viewpoint') {
    audit.push({ option: 'perspectiveType', value: perspective, status: 'prompt', detail: 'Explicit perspective request (best effort; structure conditioning keeps most of the original framing)' })
    warnings.push(`Perspective "${perspective}" is best effort: structure-guided rendering keeps most of the original framing.`)
    audit.push({ option: 'cameraHeight', value: s.cameraHeight || 'default', status: 'prompt', detail: 'Used together with perspective' })
  } else {
    audit.push({ option: 'perspectiveType', value: perspective, status: 'prompt', detail: 'Reference viewpoint preserved' })
    if (s.cameraHeight && !s.cameraHeight.startsWith('Eye Level')) {
      warnings.push(`Camera height "${s.cameraHeight}" is ignored because "Preserve Original Viewpoint" is selected.`)
      audit.push({ option: 'cameraHeight', value: s.cameraHeight, status: 'excluded', detail: 'Overridden by Preserve Original Viewpoint' })
    }
  }

  audit.push({
    option: 'removeSketchupOutlines',
    value: String(s.removeSketchupOutlines !== false),
    status: s.removeSketchupOutlines !== false ? 'prompt' : 'excluded',
    detail: s.removeSketchupOutlines !== false ? 'Outline removal instruction + negative prompt' : 'Outlines are not asked to be removed',
  })

  if (has(s.specialInstructions)) {
    audit.push({ option: 'specialInstructions', value: 'custom', status: 'prompt', detail: 'Added as constraints' })
    if (!/bath|spa/i.test(room) && /\b(bathtub|bath tub|vanity|shower|toilet)\b/i.test(s.specialInstructions!)) {
      warnings.push(`Your instructions mention bathroom items, but the room is "${room}". They are passed as written; remove them if unintended.`)
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
        ? 'Maps to a high structure control_strength'
        : mode === 'realistic-enhancement'
          ? 'Maps to a medium structure control_strength'
          : 'Maps to a low structure control_strength',
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
