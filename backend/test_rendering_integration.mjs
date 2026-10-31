import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// Load backend .env if available
try {
  const envPath = path.resolve(import.meta.dirname, '.env')
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath)
  }
} catch {}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'mock-gemini-nano-banana-key-12345'
}
import { resolveRendering } from './dist/utils/render-settings.js'
import { buildExteriorPrompt, buildInteriorPrompt, buildNegativePrompt } from './dist/utils/prompt-builder.js'
import { ImageGenerationService } from './dist/services/image-generation.service.js'
import { HttpError } from './dist/utils/http-error.js'

const baseExterior = {
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
  resolveRendering({ category: 'exterior', exteriorSettings: { ...baseExterior, ...over }, renderingMode: mode })

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

let passedCount = 0
const test = (name, fn) => {
  try {
    fn()
    passedCount++
    console.log(`✓ PASS: ${name}`)
  } catch (err) {
    console.error(`✗ FAIL: ${name}`)
    throw err
  }
}

const testAsync = async (name, fn) => {
  try {
    await fn()
    passedCount++
    console.log(`✓ PASS: ${name}`)
  } catch (err) {
    console.error(`✗ FAIL: ${name}`)
    throw err
  }
}

console.log('--- 1. Exterior Configuration Normalization ---')
test('preserves selected building type and architectural style', () => {
  const r = ext({ buildingType: 'Traditional Kerala House', architecturalStyle: 'Kerala Traditional' })
  assert.equal(r.settings.buildingType, 'Traditional Kerala House')
  assert.equal(r.settings.architecturalStyle, 'Kerala Traditional')
  assert.match(r.prompt, /Traditional Kerala House/)
  assert.match(r.prompt, /Kerala Traditional/)
})

test('time of day and weather normalize into lighting phrases without dropping values', () => {
  const r = ext({ timeOfDay: 'Night', weather: 'Rain' })
  assert.equal(r.lighting, 'night')
  assert.match(r.prompt, /no sunlight/)
  assert.match(r.prompt, /visible falling rain/)
})

test('mood harmonizes with time of day and notifies via warning rather than dropping selection', () => {
  const r = ext({ primaryMood: 'Night Luxury', timeOfDay: 'Golden Hour' })
  assert.ok(r.warnings.some((w) => /suggests Night lighting/i.test(w)))
  assert.match(r.prompt, /luxurious night atmosphere/i)
  assert.match(r.prompt, /golden-hour sunlight/i)
})

test('rain softens direct sun and registers diffuse warning', () => {
  const r = ext({ weather: 'Rain' })
  assert.match(r.prompt, /visible falling rain/)
  assert.ok(r.warnings.some((w) => /blocks direct sun/i.test(w)))
})

console.log('\n--- 2. Interior Configuration Normalization ---')
test('living room does not contain bathroom or spa details', () => {
  const r = int({})
  assert.doesNotMatch(r.prompt, /bath|tub|vanity|shower|toilet/i)
  assert.match(r.prompt, /Living Room & Salon/)
})

test('spa bathroom generates room-specific fixtures conditionally', () => {
  const r = int({ roomType: 'Spa Bathroom / Powder Room' })
  assert.match(r.prompt, /vanity/)
  assert.match(r.prompt, /rain shower/i)
})

test('kitchen room generates kitchen cabinetry and countertop elements', () => {
  const r = int({ roomType: 'Luxury Kitchen & Dining' })
  assert.match(r.prompt, /kitchen cabinetry|countertop/i)
  assert.doesNotMatch(r.prompt, /bathtub|bedding/i)
})

console.log('\n--- 3. UI Selection to API Payload & Audit Mapping ---')
test('every audit entry has status, value, and detail', () => {
  const r = ext({
    boundaryWall: 'Kerala Laterite Wall',
    storyboardShots: ['SHOT 06 — FOREGROUND LIFESTYLE SHOT'],
    cameraBody: 'Hasselblad X2D 100C',
    cameraLens: '24mm Tilt-Shift Architectural',
  })
  assert.ok(r.audit.length >= 8)
  for (const entry of r.audit) {
    assert.ok(entry.option, 'Missing option name')
    assert.ok(entry.value, 'Missing value')
    assert.ok(entry.status, 'Missing status')
    assert.ok(entry.detail, 'Missing detail')
  }
})

test('boundary wall maps to authentic visual phrases', () => {
  const r = ext({ boundaryWall: 'Kerala Laterite Wall' })
  assert.match(r.prompt, /laterite/i)
  assert.doesNotMatch(r.negativePrompt, /boundary wall/)
})

test('boundary wall "No Boundary Wall" routes to negative prompt', () => {
  const r = ext({ boundaryWall: 'No Boundary Wall' })
  assert.match(r.negativePrompt, /boundary wall/)
  assert.match(r.prompt, /Open site perimeter with no boundary wall/)
})

console.log('\n--- 4. Prompt Generation for Exterior Configurations ---')
test('human and vehicle presence are added when selected and excluded when None', () => {
  const rNone = ext({ humanPresence: 'None', vehicles: 'None' })
  assert.match(rNone.negativePrompt, /people/)
  assert.match(rNone.negativePrompt, /cars/)
  assert.doesNotMatch(rNone.prompt, /Human Presence: None/)

  const rActive = ext({ humanPresence: 'Family', vehicles: 'Range Rover' })
  assert.match(rActive.prompt, /Human Presence: Family/)
  assert.match(rActive.prompt, /Vehicles: Range Rover/)
  assert.doesNotMatch(rActive.negativePrompt, /people|cars/)
})

test('camera lens and body optics are applied in prompt', () => {
  const r = ext({ cameraBody: 'Sony A7R V', cameraLens: '24mm Tilt-Shift Architectural', cameraAngle: 'Low Road Level' })
  assert.match(r.prompt, /Sony A7R V/)
  assert.match(r.prompt, /tilt-shift perspective correction/i)
  assert.match(r.prompt, /Low Road Level/i)
})

console.log('\n--- 5. Prompt Generation for Interior Materials & Realism ---')
test('interior flooring and walls retain original when default, replace when chosen', () => {
  const rDefault = int({})
  assert.match(rDefault.prompt, /Keep the existing floor finish/)
  assert.match(rDefault.prompt, /Keep the existing wall finishes/)

  const rCustom = int({
    flooringMaterial: 'Herringbone French Oak Hardwood',
    wallMaterial: 'Vertical Fluted Walnut Slats',
  })
  assert.match(rCustom.prompt, /Replace only the floor finish with herringbone/i)
  assert.match(rCustom.prompt, /Replace only the wall finish with vertical fluted walnut/i)
})

test('outline removal instructs elimination of CAD wireframe lines', () => {
  const r = int({ removeSketchupOutlines: true })
  assert.match(r.prompt, /Eliminate all SketchUp black outline strokes/i)
  assert.match(r.negativePrompt, /SketchUp black outlines/)
})

console.log('\n--- 6. Preservation Constraints & Storyboard Overrides ---')
test('storyboard shots are included with structural preservation directives', () => {
  const r = ext({
    storyboardShots: [
      'SHOT 02 — CORNER THREE-QUARTER VIEW',
      'SHOT 14 — DRONE OBLIQUE CONTEXT SHOT',
    ],
  })
  assert.match(r.prompt, /corner three-quarter view/i)
  assert.match(r.prompt, /drone perspective/i)
  assert.match(r.prompt, /Retain structural alignment with the reference building/i)
})

test('storyboard shot with people (SHOT 15) is retained and applied', () => {
  const r = ext({ storyboardShots: ['SHOT 15 — FAMILY/CELEBRATION PORTRAIT SHOT'] })
  assert.match(r.prompt, /welcoming family lifestyle scene/i)
})

console.log('\n--- 7 & 8. Nano Banana 2.1 Edit Request & Image Handling (Mocked) ---')
await testAsync('Nano Banana 2.1 edit request receives uploaded image and returns synthesized render', async () => {
  const samplePath = path.resolve(import.meta.dirname, 'uploads/samples/villa-model.jpg')
  assert.ok(fs.existsSync(samplePath), 'Sample villa-model.jpg exists')

  const fakeOutputBuffer = fs.readFileSync(samplePath) // Valid image buffer
  const fakeBase64 = fakeOutputBuffer.toString('base64')

  let capturedUrl = ''
  let capturedBody = null
  let capturedHeaders = null

  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url)
    capturedBody = init?.body ? JSON.parse(String(init.body)) : null
    capturedHeaders = init?.headers

    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'x-goog-request-id': 'req-nano-banana-12345' }),
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: fakeBase64,
                  },
                },
              ],
            },
          },
        ],
      }),
    }
  }

  try {
    const result = await ImageGenerationService.generateRenderFromImage({
      image: samplePath,
      style: 'modern-luxury',
      renderingMode: 'preserve-structure',
      quality: 'high',
      category: 'exterior',
      exteriorSettings: {
        buildingType: 'Modern Villa',
        architecturalStyle: 'Tropical Modern',
        storyboardShots: ['SHOT 01 — HERO FRONT WIDE'],
      },
    })

    assert.equal(
      capturedUrl,
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent',
    )
    assert.ok(capturedBody?.contents?.[0]?.parts?.[1]?.inlineData?.data, 'Reference image sent as inlineData base64')
    assert.equal(capturedBody?.generationConfig?.imageConfig?.imageSize, '2K')
    assert.ok(result.imageUrl.startsWith('/uploads/renders/render-'))
    assert.match(result.provider, /gemini-nano-banana-2\.1/)
    assert.equal(result.providerRequest?.endpoint, '/v1beta/models/gemini-nano-banana-2.1:generateContent')
    assert.equal(result.providerRequest?.imageSent, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

console.log('\n--- 9. Error Handling: Auth (401), Quota (429), and Invalid Request (400) ---')
await testAsync('handles Nano Banana 2.1 401 unauthorized gracefully', async () => {
  const samplePath = path.resolve(import.meta.dirname, 'uploads/samples/villa-model.jpg')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    headers: new Headers(),
    text: async () => JSON.stringify({ error: { message: 'API key not valid. Please pass a valid API key.' } }),
  })

  try {
    await assert.rejects(
      async () => {
        await ImageGenerationService.generateRenderFromImage({
          image: samplePath,
          style: 'modern-luxury',
        })
      },
      (err) => {
        assert.ok(err instanceof HttpError)
        assert.equal(err.status, 401)
        assert.equal(err.code, 'GEMINI_AUTH_ERROR')
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

await testAsync('handles Nano Banana 2.1 429 quota exhausted with actionable URL', async () => {
  const samplePath = path.resolve(import.meta.dirname, 'uploads/samples/villa-model.jpg')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    headers: new Headers(),
    text: async () =>
      JSON.stringify({
        error: {
          message: 'Quota exceeded for quota metric and limit.',
          status: 'RESOURCE_EXHAUSTED',
        },
      }),
  })

  try {
    await assert.rejects(
      async () => {
        await ImageGenerationService.generateRenderFromImage({
          image: samplePath,
          style: 'modern-luxury',
        })
      },
      (err) => {
        assert.ok(err instanceof HttpError)
        assert.equal(err.status, 429)
        assert.equal(err.code, 'GEMINI_QUOTA_EXHAUSTED')
        assert.match(err.message, /aistudio\.google\.com\/apikey/i)
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

await testAsync('handles Nano Banana 2.1 400 invalid request with clear error message', async () => {
  const samplePath = path.resolve(import.meta.dirname, 'uploads/samples/villa-model.jpg')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    headers: new Headers(),
    text: async () =>
      JSON.stringify({
        error: {
          message: 'The image provided is too small or invalid aspect ratio',
          status: 'INVALID_ARGUMENT',
        },
      }),
  })

  try {
    await assert.rejects(
      async () => {
        await ImageGenerationService.generateRenderFromImage({
          image: samplePath,
          style: 'modern-luxury',
        })
      },
      (err) => {
        assert.ok(err instanceof HttpError)
        assert.equal(err.status, 400)
        assert.equal(err.code, 'GEMINI_INVALID_REQUEST')
        assert.match(err.message, /too small or invalid aspect ratio/i)
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

console.log('\n--- 10. Failed AI Requests Never Masquerade as Successful Renders ---')
await testAsync('server error throws HttpError without writing or returning a fake render', async () => {
  const samplePath = path.resolve(import.meta.dirname, 'uploads/samples/villa-model.jpg')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    headers: new Headers(),
    text: async () => 'Nano Banana 2.1 Internal Server Error',
  })

  try {
    await assert.rejects(
      async () => {
        await ImageGenerationService.generateRenderFromImage({
          image: samplePath,
          style: 'modern-luxury',
        })
      },
      (err) => {
        assert.ok(err instanceof HttpError)
        assert.equal(err.status, 502)
        assert.equal(err.code, 'GEMINI_SERVER_ERROR')
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

console.log('\n--- 11. Ensuring No OpenAI or Stability AI Request is Made in Active Pipeline ---')
await testAsync('active pipeline never contacts api.openai.com or api.stability.ai', async () => {
  const samplePath = path.resolve(import.meta.dirname, 'uploads/samples/villa-model.jpg')
  const fakeOutputBuffer = fs.readFileSync(samplePath)
  let legacyContacted = false

  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const urlStr = String(url)
    if (urlStr.includes('stability.ai') || urlStr.includes('openai.com')) {
      legacyContacted = true
      throw new Error('LEGACY_PROVIDER_ACCESSED_IN_ACTIVE_PIPELINE')
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: fakeOutputBuffer.toString('base64'),
                  },
                },
              ],
            },
          },
        ],
      }),
    }
  }

  try {
    await ImageGenerationService.generateRenderFromImage({
      image: samplePath,
      style: 'modern-luxury',
      renderingMode: 'preserve-structure',
    })

    assert.equal(legacyContacted, false, 'OpenAI or Stability AI was unexpectedly called')
  } finally {
    globalThis.fetch = originalFetch
  }
})

console.log(`\n========================================`)
console.log(`ALL ${passedCount} COMPREHENSIVE INTEGRATION TESTS PASSED!`)
console.log(`========================================`)
