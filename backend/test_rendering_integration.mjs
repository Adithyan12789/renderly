import fs from 'node:fs'
import path from 'node:path'
import { ImageGenerationService } from './dist/services/image-generation.service.js'
import { buildExteriorPrompt, buildInteriorPrompt, buildNegativePrompt, validateRenderingSettings } from './dist/utils/prompt-builder.js'

async function runTests() {
  console.log('--- STARTING ARCHITECTURAL RENDERING WORKFLOW TESTS ---')

  // 1. Test validation helper
  console.log('\n[1] Testing validation helper...')
  const val1 = validateRenderingSettings('exterior', { promptStyle: 'Detailed', buildingType: 'Modern Villa' })
  console.log('Exterior valid check:', val1.valid ? 'PASSED' : 'FAILED')
  if (!val1.valid) throw new Error('Validation failed for valid exterior settings')

  const val2 = validateRenderingSettings('exterior', { promptStyle: 'InvalidStyle' })
  console.log('Invalid promptStyle caught:', !val2.valid ? 'PASSED' : 'FAILED')
  if (val2.valid) throw new Error('Failed to catch invalid promptStyle')

  // 2. Test buildExteriorPrompt
  console.log('\n[2] Testing buildExteriorPrompt with full exterior.txt options...')
  const exteriorSettings = {
    buildingType: 'Traditional Kerala House',
    architecturalStyle: 'Kerala Traditional',
    promptStyle: 'Detailed',
    countryRegion: 'India – Kerala',
    districtPlace: 'Alappuzha',
    areaCommunity: 'Backwater Heritage Enclave',
    timeOfDay: 'Sunset',
    primaryMood: 'Monsoon Mood',
    cinematicSchool: 'Storaro-warm palette',
    season: 'Monsoon',
    weather: 'Rain',
    humanPresence: 'Kerala Street Life',
    vehicles: 'Tuk-tuks / Autorickshaws',
    boundaryWall: 'Kerala Laterite Wall',
    cameraBody: 'Hasselblad X2D 100C',
    cameraLens: '35mm Wide',
    cameraAngle: 'Eye Level',
    storyboardShots: ['SHOT 07 — BLUE HOUR STREET CROSSING SHOT'],
    structuralNotes: 'Traditional sloping tiled roof, wooden charupadi louvers, carved teak pillars',
    locationNotes: 'Wet laterite road, lush banana and coconut vegetation, reflecting puddles',
    specialInstructions: 'Keep architecture 100% locked. Do not change geometry, materials, roofline, openings, facade design, road, footpath, or landscape position.',
  }

  const extPrompt = buildExteriorPrompt(exteriorSettings, 'Low-iron clear glass accents')
  console.log('Generated Exterior Prompt:\n', extPrompt)

  const requiredExteriorKeywords = [
    'Traditional Kerala House',
    'Kerala Traditional',
    'Alappuzha',
    'Backwater Heritage Enclave',
    'India – Kerala',
    'Monsoon Mood',
    'Storaro-warm palette',
    'Rain, Monsoon season',
    'Kerala Laterite Wall',
    'Hasselblad X2D 100C',
    '35mm Wide',
    'SHOT 07 — BLUE HOUR STREET CROSSING SHOT',
    'Kerala Street Life',
    'Tuk-tuks / Autorickshaws',
    'Keep architecture 100% locked',
  ]

  for (const kw of requiredExteriorKeywords) {
    if (!extPrompt.includes(kw)) {
      throw new Error(`Exterior prompt missing required keyword: "${kw}"`)
    }
  }
  console.log('Exterior Prompt Verification: ALL KEYWORDS PASSED!')

  // Negative prompt check
  const extNeg = buildNegativePrompt('exterior', { humanPresence: 'None', vehicles: 'None' })
  console.log('\nExterior Negative Prompt (with None for people and vehicles):', extNeg)
  if (!extNeg.includes('people') || !extNeg.includes('cars')) {
    throw new Error('Exterior negative prompt failed to exclude people/cars when None was set')
  }
  console.log('Exterior Negative Prompt Check: PASSED!')

  // 3. Test buildInteriorPrompt
  console.log('\n[3] Testing buildInteriorPrompt with interior.txt rules...')
  const interiorSettings = {
    roomType: 'Spa Bathroom / Powder Room',
    flooringMaterial: 'Honed Calacatta Marble Slabs',
    wallMaterial: 'Vertical Fluted Walnut Slats',
    accentMaterial: 'Brushed Warm Brass / Bronze',
    lightingMood: 'Warm 3000K Ambient Cove & Recessed LEDs',
    cameraHeight: 'Eye Level (approx 1.5m / 5ft)',
    perspectiveType: 'One-Point Central Perspective',
    removeSketchupOutlines: true,
    specialInstructions: 'Strict structural preservation: lock exact room geometry and fixture positions.',
  }

  const intPrompt = buildInteriorPrompt(interiorSettings, 'Textured bouclé stool')
  console.log('Generated Interior Prompt:\n', intPrompt)

  const requiredInteriorKeywords = [
    'Spa Bathroom / Powder Room',
    'Strict structural preservation',
    'Honed Calacatta Marble Slabs',
    'Vertical Fluted Walnut Slats',
    'Brushed Warm Brass / Bronze',
    'Warm 3000K Ambient Cove & Recessed LEDs',
    'Eye Level (approx 1.5m / 5ft)',
    'One-Point Central Perspective',
    'eliminate raw CAD/SketchUp wireframe viewport black lines',
    'Strict structural preservation: lock exact room geometry and fixture positions.',
  ]

  for (const kw of requiredInteriorKeywords) {
    if (!intPrompt.includes(kw)) {
      throw new Error(`Interior prompt missing required keyword: "${kw}"`)
    }
  }
  console.log('Interior Prompt Verification: ALL KEYWORDS PASSED!')

  // 4. Test Image-to-Image Generation with Local Vibe3D Structural Architecture Engine
  console.log('\n[4] Testing Image-to-Image Engine with sample template image...')
  const sampleImagePath = path.resolve(process.cwd(), 'assets', 'templates', 'hero-villa.png')
  if (!fs.existsSync(sampleImagePath)) {
    throw new Error(`Sample image not found at ${sampleImagePath}`)
  }

  const extGenResult = await ImageGenerationService.generateRenderFromImage({
    image: '/assets/templates/hero-villa.png',
    style: 'tropical',
    engine: 'hyperreal',
    lighting: 'golden-hour',
    renderingMode: 'preserve-structure',
    category: 'exterior',
    exteriorSettings,
  })

  console.log('Exterior Render Result:', {
    imageUrl: extGenResult.imageUrl,
    provider: extGenResult.provider,
    sourceImageUrl: extGenResult.sourceImageUrl,
  })

  const extDiskPath = path.resolve(process.cwd(), extGenResult.imageUrl.replace(/^\//, ''))
  if (!fs.existsSync(extDiskPath)) {
    throw new Error(`Generated exterior render was not saved on disk at ${extDiskPath}`)
  }
  const extStats = fs.statSync(extDiskPath)
  console.log(`Exterior Render Image saved successfully! Size: ${(extStats.size / 1024).toFixed(1)} KB`)

  // 5. Test Interior Image-to-Image Generation
  console.log('\n[5] Testing Interior Image-to-Image Generation...')
  const intGenResult = await ImageGenerationService.generateRenderFromImage({
    image: '/assets/templates/gallery-loft.png',
    style: 'modern-luxury',
    engine: 'fidelity',
    lighting: 'daylight',
    renderingMode: 'preserve-structure',
    category: 'interior',
    interiorSettings,
  })

  console.log('Interior Render Result:', {
    imageUrl: intGenResult.imageUrl,
    provider: intGenResult.provider,
    sourceImageUrl: intGenResult.sourceImageUrl,
  })

  const intDiskPath = path.resolve(process.cwd(), intGenResult.imageUrl.replace(/^\//, ''))
  if (!fs.existsSync(intDiskPath)) {
    throw new Error(`Generated interior render was not saved on disk at ${intDiskPath}`)
  }
  const intStats = fs.statSync(intDiskPath)
  console.log(`Interior Render Image saved successfully! Size: ${(intStats.size / 1024).toFixed(1)} KB`)

  console.log('\n======================================================')
  console.log('🎉 ALL EXTERIOR & INTERIOR RENDERING INTEGRATION TESTS PASSED!')
  console.log('======================================================\n')
}

runTests().catch((err) => {
  console.error('Test failed with error:', err)
  process.exit(1)
})
