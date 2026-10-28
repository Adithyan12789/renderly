import assert from 'node:assert/strict'
import { resolveRendering } from './dist/utils/render-settings.js'

const base = {
  buildingType: 'Modern Villa',
  architecturalStyle: 'Tropical Modern',
  countryRegion: 'India – Kerala',
  timeOfDay: 'Golden Hour',
  weather: 'Clear Sky',
  season: 'All Season / Dry',
  primaryMood: 'Ultra Photorealistic',
  humanPresence: 'None',
  vehicles: 'None',
  boundaryWall: 'Auto',
  cameraAngle: 'Eye Level',
  storyboardShots: [],
}

const ext = (over, mode = 'preserve-structure') =>
  resolveRendering({ category: 'exterior', exteriorSettings: { ...base, ...over }, renderingMode: mode })

let n = 0
const ok = (name, fn) => { fn(); n++; console.log('PASS', name) }

ok('golden hour produces warm low-angle light', () => {
  const r = ext({})
  assert.match(r.prompt, /golden-hour sunlight/)
})
ok('time of day changes the prompt (night)', () => {
  const r = ext({ timeOfDay: 'Night' })
  assert.match(r.prompt, /no sunlight/)
  assert.equal(r.lighting, 'night')
})
ok('rain gives visible rain effects and suppresses hard sun', () => {
  const r = ext({ weather: 'Rain' })
  assert.match(r.prompt, /visible falling rain/)
  assert.ok(r.warnings.some((w) => /blocks direct sun/.test(w)))
})
ok('human/vehicle None go to negative prompt, not the prompt', () => {
  const r = ext({})
  assert.match(r.negativePrompt, /people/)
  assert.match(r.negativePrompt, /cars/)
  assert.doesNotMatch(r.prompt, /People:|Vehicle:/)
})
ok('selected people/vehicle are added and not negated', () => {
  const r = ext({ humanPresence: 'Family', vehicles: 'Tesla' })
  assert.match(r.prompt, /People: Family/)
  assert.match(r.prompt, /Vehicle: Tesla/)
  assert.doesNotMatch(r.negativePrompt, /people|cars/)
})
ok('boundary wall selection is mapped to visual language', () => {
  const r = ext({ boundaryWall: 'Kerala Laterite Wall' })
  assert.match(r.prompt, /laterite/i)
})
ok('mood vs time conflict: time wins with a warning', () => {
  const r = ext({ primaryMood: 'Night Luxury', timeOfDay: 'Golden Hour' })
  assert.ok(r.warnings.some((w) => /Night/.test(w)))
  assert.doesNotMatch(r.prompt, /luxurious night/)
})
ok('shot wanting people is dropped when Human Presence is None', () => {
  const r = ext({ storyboardShots: ['SHOT 15 — FAMILY/CELEBRATION PORTRAIT SHOT'] })
  assert.ok(r.warnings.some((w) => /Human Presence is "None"/.test(w)))
  assert.doesNotMatch(r.prompt, /family scene/)
})
ok('viewpoint shots are flagged as not applicable when structure is locked', () => {
  const r = ext({ storyboardShots: ['SHOT 14 — DRONE OBLIQUE CONTEXT SHOT'] })
  assert.ok(r.warnings.some((w) => /can't be applied/.test(w)))
})
ok('creative mode allows viewpoint request', () => {
  const r = ext({ storyboardShots: ['SHOT 14 — DRONE OBLIQUE CONTEXT SHOT'] }, 'creative-redesign')
  assert.match(r.prompt, /preferred viewpoint/)
})
ok('every audit entry has a status and detail', () => {
  const r = ext({ boundaryWall: 'Kerala Laterite Wall', storyboardShots: ['SHOT 06 — FOREGROUND LIFESTYLE SHOT'] })
  assert.ok(r.audit.length > 8)
  for (const a of r.audit) assert.ok(a.status && a.detail, JSON.stringify(a))
})

const int = (over) =>
  resolveRendering({
    category: 'interior',
    interiorSettings: {
      roomType: 'Living Room & Salon',
      flooringMaterial: 'Original Model Flooring',
      wallMaterial: 'Original Model Wall Finishes',
      accentMaterial: 'Original Model Hardware & Accents',
      lightingMood: 'Soft Natural Daylight',
      perspectiveType: 'Preserve Original Viewpoint',
      removeSketchupOutlines: true,
      ...over,
    },
  })

ok('interior: preserve flooring/walls stay unchanged', () => {
  const r = int({})
  assert.match(r.prompt, /Keep the existing floor finish/)
  assert.match(r.prompt, /Keep the existing wall finishes/)
  assert.doesNotMatch(r.prompt, /Replace only/)
})
ok('interior: herringbone replaces floor with recognisable pattern', () => {
  const r = int({ flooringMaterial: 'Herringbone French Oak Hardwood' })
  assert.match(r.prompt, /Replace only the floor finish with herringbone/)
})
ok('interior: wallpaper replaces walls', () => {
  const r = int({ wallMaterial: 'Textured Botanical Wallpaper' })
  assert.match(r.prompt, /Replace only the wall finish with textured botanical/)
})
ok('interior: warm 3000K lighting mapped', () => {
  const r = int({ lightingMood: 'Warm 3000K Ambient Cove & Recessed LEDs' })
  assert.match(r.prompt, /3000K cove lighting/)
})
ok('interior: overcast gallery is soft/diffused', () => {
  const r = int({ lightingMood: 'Diffused Overcast Gallery Illumination' })
  assert.match(r.prompt, /diffused overcast/)
  assert.equal(r.lighting, 'overcast')
})
ok('interior: no bathroom detail in a living room prompt', () => {
  const r = int({})
  assert.doesNotMatch(r.prompt, /bath|tub|vanity|shower|spa/i)
})
ok('interior: camera height ignored with preserved viewpoint (warned)', () => {
  const r = int({ cameraHeight: 'Countertop Level (approx 1.2m / 4ft)' })
  assert.ok(r.warnings.some((w) => /ignored/.test(w)))
})

console.log(`\n${n} resolver checks passed`)
