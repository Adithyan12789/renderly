import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { env } from '../config/env.js'
import type { RenderAspectRatio, RenderEngine, RenderLighting, RenderStyle } from '../models/render.model.js'
import {
  type ExteriorSettings,
  type InteriorSettings,
} from '../utils/prompt-builder.js'
import { HttpError } from '../utils/http-error.js'
import { resolveRendering, type AuditEntry, type RenderQuality } from '../utils/render-settings.js'

export type RenderingMode = 'preserve-structure' | 'realistic-enhancement' | 'creative-redesign'

export interface GenerateImageFromModelOptions {
  image: string
  locationImage?: string
  style: RenderStyle
  engine?: RenderEngine
  lighting?: RenderLighting
  renderingMode?: RenderingMode
  environment?: string
  geometryStrength?: number
  refinementPrompt?: string
  aspectRatio?: RenderAspectRatio
  category?: 'exterior' | 'interior'
  quality?: RenderQuality
  exteriorSettings?: ExteriorSettings
  interiorSettings?: InteriorSettings
}

export interface GenerateImageOptions {
  prompt: string
  style: RenderStyle
  aspectRatio: RenderAspectRatio
}

export interface GenerateImageResult {
  imageUrl: string
  sourceImageUrl?: string | null
  locationImageUrl?: string | null
  enhancedPrompt: string
  provider: string
  aspectRatio?: RenderAspectRatio
  warnings?: string[]
  audit?: AuditEntry[]
  effectiveSettings?: Record<string, unknown>
  negativePrompt?: string
  quality?: { requested: RenderQuality; applied: RenderQuality }
  providerRequest?: Record<string, unknown>
}

interface GeminiInlineData {
  mimeType?: string
  mime_type?: string
  data?: string
}

interface GeminiCandidatePart {
  text?: string
  inlineData?: GeminiInlineData
  inline_data?: GeminiInlineData
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[]
    }
    finishReason?: string
  }>
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

export class ImageGenerationService {
  private static ensureDirs(): { rendersDir: string; sourcesDir: string } {
    const rendersDir = path.resolve(process.cwd(), 'uploads', 'renders')
    const sourcesDir = path.resolve(process.cwd(), 'uploads', 'sources')
    if (!fs.existsSync(rendersDir)) {
      fs.mkdirSync(rendersDir, { recursive: true })
    }
    if (!fs.existsSync(sourcesDir)) {
      fs.mkdirSync(sourcesDir, { recursive: true })
    }
    return { rendersDir, sourcesDir }
  }

  /**
   * Resolves the configured Gemini / Nano Banana 2.1 API key from environment variables.
   */
  private static getApiKey(): string {
    const apiKey = (env.GEMINI_API_KEY || env.NANO_BANANA_API_KEY || process.env.GEMINI_API_KEY || process.env.NANO_BANANA_API_KEY || '').trim()
    if (!apiKey) {
      throw new HttpError(
        500,
        'GEMINI_API_KEY is not configured on the server. Please add your Gemini Nano Banana 2.1 API key from https://aistudio.google.com/apikey to backend/.env to enable AI image rendering.',
        'GEMINI_KEY_MISSING',
      )
    }
    return apiKey
  }

  /**
   * Resolves the active Nano Banana model name.
   */
  private static getModelName(): string {
    return (env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1').trim()
  }

  /**
   * Resolves an image input (base64 data URL, local path, or remote URL)
   * Saves it to uploads/sources and returns buffer, url, dimensions, and aspect ratio.
   */
  public static async resolveSourceImage(imageInput: string): Promise<{
    buffer: Buffer
    sourceUrl: string
    detectedAspect: RenderAspectRatio
    width: number
    height: number
  }> {
    const { sourcesDir } = this.ensureDirs()
    let rawBuffer: Buffer

    if (imageInput.startsWith('data:image/')) {
      const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '')
      rawBuffer = Buffer.from(base64Data, 'base64')
      const fileName = `source-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`
      const filePath = path.join(sourcesDir, fileName)

      await sharp(rawBuffer).jpeg({ quality: 95 }).toFile(filePath)
      const metadata = await sharp(filePath).metadata()
      const width = metadata.width || 1024
      const height = metadata.height || 768
      const detectedAspect = this.computeAspectRatio(width, height)

      return {
        buffer: rawBuffer,
        sourceUrl: `/uploads/sources/${fileName}`,
        detectedAspect,
        width,
        height,
      }
    }

    let localFilePath: string | null = null
    if (imageInput.startsWith('/uploads/') || imageInput.startsWith('uploads/')) {
      const rel = imageInput.startsWith('/') ? imageInput.slice(1) : imageInput
      localFilePath = path.resolve(process.cwd(), rel)
    } else if (imageInput.startsWith('/assets/') || imageInput.startsWith('assets/')) {
      const rel = imageInput.startsWith('/') ? imageInput.slice(1) : imageInput
      localFilePath = path.resolve(process.cwd(), rel)
    } else if (imageInput.startsWith('/images/')) {
      const inSamples = path.resolve(process.cwd(), 'uploads', imageInput.replace('/images/', ''))
      const inFrontend = path.resolve(process.cwd(), '../frontend/public', imageInput.slice(1))
      if (fs.existsSync(inSamples)) {
        localFilePath = inSamples
      } else if (fs.existsSync(inFrontend)) {
        localFilePath = inFrontend
      }
    } else if (fs.existsSync(path.resolve(process.cwd(), imageInput))) {
      localFilePath = path.resolve(process.cwd(), imageInput)
    }

    if (localFilePath && fs.existsSync(localFilePath)) {
      rawBuffer = fs.readFileSync(localFilePath)
      const metadata = await sharp(rawBuffer).metadata()
      const width = metadata.width || 1024
      const height = metadata.height || 768
      const detectedAspect = this.computeAspectRatio(width, height)

      const fileName = `source-${Date.now()}-${path.basename(localFilePath)}`
      const targetPath = path.join(sourcesDir, fileName)
      fs.copyFileSync(localFilePath, targetPath)

      return {
        buffer: rawBuffer,
        sourceUrl: `/uploads/sources/${fileName}`,
        detectedAspect,
        width,
        height,
      }
    }

    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const response = await fetch(imageInput)
      if (!response.ok) {
        throw new HttpError(400, `Could not download reference image: HTTP ${response.status}`, 'IMAGE_DOWNLOAD_FAILED')
      }
      rawBuffer = Buffer.from(await response.arrayBuffer())
      const fileName = `source-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`
      const filePath = path.join(sourcesDir, fileName)
      await sharp(rawBuffer).jpeg({ quality: 95 }).toFile(filePath)
      const metadata = await sharp(filePath).metadata()
      const width = metadata.width || 1024
      const height = metadata.height || 768
      const detectedAspect = this.computeAspectRatio(width, height)

      return {
        buffer: rawBuffer,
        sourceUrl: `/uploads/sources/${fileName}`,
        detectedAspect,
        width,
        height,
      }
    }

    throw new HttpError(400, 'Unsupported image input format. Please upload a valid PNG, JPG, or WebP file.', 'INVALID_IMAGE_FORMAT')
  }

  public static computeAspectRatio(width: number, height: number): RenderAspectRatio {
    const ratio = width / height
    if (ratio > 1.45) return '16:9'
    if (ratio > 1.15) return '4:3'
    if (ratio < 0.75) return '9:16'
    return '1:1'
  }

  /**
   * Translates application quality tiers into Nano Banana 2.1 supported imageSize values ("1K", "2K", "4K").
   */
  private static mapQualityToNanoBananaSize(quality: RenderQuality): '1K' | '2K' | '4K' {
    if (quality === 'ultra') return '4K'
    if (quality === 'high') return '2K'
    return '1K'
  }

  /**
   * Diagnostic logger that formats execution trace without exposing sensitive secrets.
   */
  private static logDiagnostics(info: {
    requestId: string
    category: string
    action: string
    model: string
    endpoint: string
    dimensions?: string
    imageSizeBytes?: number
    sectionsIncluded?: string[]
    normalizedSettings?: Record<string, unknown>
    durationMs?: number
    status?: 'success' | 'failed'
    providerRequestId?: string | null
    errorDetails?: string | null
  }) {
    console.log(
      `[ImageGen][${info.requestId}] ${info.action.toUpperCase()} (${info.category}) | Model: ${info.model} | Endpoint: ${info.endpoint}` +
        (info.dimensions ? ` | Size: ${info.dimensions}` : '') +
        (info.imageSizeBytes ? ` | Image: ${(info.imageSizeBytes / 1024).toFixed(1)} KB` : '') +
        (info.durationMs !== undefined ? ` | Duration: ${info.durationMs}ms` : '') +
        (info.status ? ` | Status: ${info.status}` : '') +
        (info.providerRequestId ? ` | ReqId: ${info.providerRequestId}` : '') +
        (info.errorDetails ? ` | Error: ${info.errorDetails}` : ''),
    )
    if (info.sectionsIncluded && info.sectionsIncluded.length) {
      console.log(`[ImageGen][${info.requestId}] Sections applied: ${info.sectionsIncluded.join(', ')}`)
    }
  }

  /**
   * Extracts the generated image Buffer from a Gemini Nano Banana 2.1 generateContent response.
   */
  private static extractImageFromGeminiResponse(data: GeminiGenerateContentResponse): Buffer | null {
    const parts = data.candidates?.[0]?.content?.parts
    if (!Array.isArray(parts)) return null

    for (const part of parts) {
      const inline = part.inlineData || part.inline_data
      if (inline?.data) {
        return Buffer.from(inline.data, 'base64')
      }
    }
    return null
  }

  /**
   * Executes a multimodal image-editing request against Gemini Nano Banana 2.1
   * (`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent`).
   * Includes bounded retries for transient 5xx server issues.
   */
  private static async executeNanoBananaImageEdit(options: {
    requestId: string
    imageBuffer: Buffer
    locationImageBuffer?: Buffer | null
    prompt: string
    negativePrompt?: string
    aspectRatio?: RenderAspectRatio
    quality: RenderQuality
    category: 'exterior' | 'interior'
    normalizedSettings?: Record<string, unknown>
    sectionsIncluded?: string[]
    inputDimensions?: { width: number; height: number }
  }): Promise<{ buffer: Buffer; providerRequestId: string | null; modelUsed: string }> {
    const apiKey = this.getApiKey()
    const model = this.getModelName()
    const endpointPath = `/v1beta/models/${model}:generateContent`
    const endpoint = `https://generativelanguage.googleapis.com${endpointPath}`
    const imageSize = this.mapQualityToNanoBananaSize(options.quality)
    const aspectRatio = options.aspectRatio || '16:9'
    const startTime = Date.now()

    const combinedTextPrompt = options.negativePrompt
      ? `${options.prompt}\n\nSTRICT NEGATIVE CONSTRAINTS (DO NOT INCLUDE): ${options.negativePrompt}`
      : options.prompt

    this.logDiagnostics({
      requestId: options.requestId,
      category: options.category,
      action: 'dispatch_nano_banana_edit',
      model,
      endpoint: endpointPath,
      dimensions: options.inputDimensions ? `${options.inputDimensions.width}x${options.inputDimensions.height}` : undefined,
      imageSizeBytes: options.imageBuffer.length,
      sectionsIncluded: options.sectionsIncluded,
      normalizedSettings: options.normalizedSettings,
    })

    const maxAttempts = 2
    let attempt = 0
    let lastError: HttpError | null = null

    while (attempt < maxAttempts) {
      attempt++
      try {
        const parts: Array<Record<string, unknown>> = [
          { text: combinedTextPrompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: options.imageBuffer.toString('base64'),
            },
          },
        ]

        if (options.locationImageBuffer) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: options.locationImageBuffer.toString('base64'),
            },
          })
        }

        const requestBody = {
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio,
              imageSize,
            },
          },
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        })

        const durationMs = Date.now() - startTime
        const providerRequestId = response.headers.get('x-request-id') || response.headers.get('x-goog-request-id')

        if (!response.ok) {
          const rawErrorText = await response.text()
          let parsedError: GeminiGenerateContentResponse | null = null
          try {
            parsedError = JSON.parse(rawErrorText) as GeminiGenerateContentResponse
          } catch {
            // non-json response
          }

          const errMsg = parsedError?.error?.message || rawErrorText
          const errStatus = parsedError?.error?.status || null

          this.logDiagnostics({
            requestId: options.requestId,
            category: options.category,
            action: 'nano_banana_error_response',
            model,
            endpoint: endpointPath,
            durationMs,
            status: 'failed',
            providerRequestId,
            errorDetails: `HTTP ${response.status} (${errStatus || 'unknown'}): ${errMsg.slice(0, 300)}`,
          })

          // 401 / 403: Invalid API Key or Permission Denied
          if (response.status === 401 || response.status === 403 || /API_KEY_INVALID|invalid api key/i.test(errMsg)) {
            throw new HttpError(
              401,
              'Authentication failed: Invalid Gemini Nano Banana 2.1 API key. Please check your GEMINI_API_KEY in backend/.env.',
              'GEMINI_AUTH_ERROR',
            )
          }

          // 429: Quota / Billing Exhaustion vs Rate Limit
          if (response.status === 429) {
            const isQuotaExhausted =
              errStatus === 'RESOURCE_EXHAUSTED' ||
              /quota|billing|credit/i.test(errMsg)

            if (isQuotaExhausted) {
              throw new HttpError(
                429,
                'Gemini Nano Banana 2.1 quota or billing limit reached. Please check your quota at https://aistudio.google.com/apikey to continue AI rendering.',
                'GEMINI_QUOTA_EXHAUSTED',
              )
            }

            throw new HttpError(
              429,
              'Nano Banana 2.1 rate limit reached. Please wait a few seconds before generating another render.',
              'GEMINI_RATE_LIMIT',
            )
          }

          // 400: Bad Request / Safety Filter / Invalid Parameters
          if (response.status === 400) {
            throw new HttpError(
              400,
              `Nano Banana 2.1 rejected the rendering request: ${errMsg}`,
              'GEMINI_INVALID_REQUEST',
            )
          }

          // 5xx: Transient Server Errors (allow bounded retry)
          if (response.status >= 500 && attempt < maxAttempts) {
            console.warn(`[ImageGen][${options.requestId}] Transient Nano Banana 2.1 5xx error (${response.status}), retrying in 1.5s...`)
            await new Promise((resolve) => setTimeout(resolve, 1500))
            continue
          }

          throw new HttpError(
            502,
            `Nano Banana 2.1 image-editing service returned an error (HTTP ${response.status}): ${errMsg}`,
            'GEMINI_SERVER_ERROR',
          )
        }

        const data = (await response.json()) as GeminiGenerateContentResponse
        const generatedBuffer = this.extractImageFromGeminiResponse(data)

        if (!generatedBuffer || generatedBuffer.length < 2000) {
          throw new HttpError(
            502,
            'Nano Banana 2.1 returned an empty or invalid image response. Please try again.',
            'GEMINI_EMPTY_RESPONSE',
          )
        }

        this.logDiagnostics({
          requestId: options.requestId,
          category: options.category,
          action: 'render_synthesis_success',
          model,
          endpoint: endpointPath,
          durationMs,
          status: 'success',
          providerRequestId,
        })

        return {
          buffer: generatedBuffer,
          providerRequestId,
          modelUsed: model,
        }
      } catch (err) {
        if (err instanceof HttpError) {
          // Do not retry client or permanent errors (401, 400, 429)
          if (err.status < 500) throw err
          lastError = err
        } else {
          lastError = new HttpError(
            500,
            `Network failure communicating with Nano Banana 2.1 API: ${(err as Error).message}`,
            'GEMINI_NETWORK_ERROR',
          )
        }

        if (attempt < maxAttempts) {
          console.warn(`[ImageGen][${options.requestId}] Request attempt ${attempt} failed: ${lastError.message}. Retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }
    }

    throw lastError || new HttpError(500, 'Rendering failed after multiple attempts.', 'RENDER_FAILED')
  }

  /**
   * Transforms an uploaded 3D model viewport or photo into a photorealistic render
   * using Gemini Nano Banana 2.1 (`gemini-nano-banana-2.1`) as the active AI rendering provider.
   */
  public static async generateRenderFromImage(
    options: GenerateImageFromModelOptions,
  ): Promise<GenerateImageResult> {
    const {
      image,
      lighting = 'golden-hour',
      renderingMode = 'preserve-structure',
      refinementPrompt = '',
      category = 'exterior',
      quality = 'standard',
    } = options

    const requestId = `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const { rendersDir } = this.ensureDirs()

    // 1. Resolve source image and optional secondary location reference
    const {
      buffer: rawSourceBuffer,
      sourceUrl,
      detectedAspect,
      width: origWidth,
      height: origHeight,
    } = await this.resolveSourceImage(image)

    const targetAspect: RenderAspectRatio = options.aspectRatio || detectedAspect

    let locationImageUrl: string | null = null
    let locationImageBuffer: Buffer | null = null
    if (options.locationImage) {
      try {
        const locRes = await this.resolveSourceImage(options.locationImage)
        locationImageUrl = locRes.sourceUrl || null
        locationImageBuffer = await sharp(locRes.buffer)
          .resize(1536, 1536, { fit: 'inside', withoutEnlargement: false })
          .jpeg({ quality: 92 })
          .toBuffer()
      } catch (err) {
        console.warn(`[ImageGen][${requestId}] Could not resolve secondary location reference image:`, err)
      }
    }

    // 2. Resolve settings and construct full structured prompt
    const effective = resolveRendering({
      category,
      exteriorSettings: options.exteriorSettings,
      interiorSettings: options.interiorSettings,
      renderingMode,
      quality,
      fallbackLighting: lighting,
      refinementPrompt,
    })

    const warnings: string[] = [...effective.warnings]
    const audit = [...effective.audit]
    const enhancedPrompt = effective.prompt
    const negativeConstraints = effective.negativePrompt

    // Determine prompt sections included for diagnostic logging
    const sectionsIncluded = [
      'objective',
      'reference_interpretation',
      'structural_preservation',
      'materials_pbr',
      'lighting_environment',
      'camera_composition',
      'negative_constraints',
    ]
    if (options.refinementPrompt || refinementPrompt) sectionsIncluded.push('user_refinement')
    if (category === 'exterior' && options.exteriorSettings?.storyboardShots?.length) {
      sectionsIncluded.push('storyboard_composition')
    }

    // 3. Prepare clean reference image buffer for Nano Banana 2.1
    const preparedInitBuffer = await sharp(rawSourceBuffer)
      .resize(1536, 1536, { fit: 'inside', withoutEnlargement: false })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toBuffer()

    const preparedMeta = await sharp(preparedInitBuffer).metadata()

    // 4. Call Nano Banana 2.1 multimodal generateContent endpoint
    const { buffer: generatedBuffer, providerRequestId, modelUsed } = await this.executeNanoBananaImageEdit({
      requestId,
      imageBuffer: preparedInitBuffer,
      locationImageBuffer,
      prompt: enhancedPrompt,
      negativePrompt: negativeConstraints,
      aspectRatio: targetAspect,
      quality,
      category,
      normalizedSettings: effective.settings as Record<string, unknown>,
      sectionsIncluded,
      inputDimensions: { width: preparedMeta.width || origWidth, height: preparedMeta.height || origHeight },
    })

    // 5. Save generated image output
    const fileName = `render-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`
    const filePath = path.join(rendersDir, fileName)
    const relativeUrl = `/uploads/renders/${fileName}`

    const optimizedOutput = await sharp(generatedBuffer)
      .jpeg({ quality: 96, mozjpeg: true })
      .toBuffer()

    fs.writeFileSync(filePath, optimizedOutput)
    console.log(`[ImageGen][${requestId}] Architectural synthesis complete via ${modelUsed}! Saved to ${relativeUrl}`)

    const providerRequest = {
      provider: 'gemini-nano-banana-2.1',
      endpoint: `/v1beta/models/${modelUsed}:generateContent`,
      model: modelUsed,
      imageSent: true,
      locationImageSent: Boolean(locationImageBuffer),
      qualitySent: this.mapQualityToNanoBananaSize(quality),
      aspectRatioSent: targetAspect,
      providerRequestId,
      inputSize: `${preparedMeta.width}x${preparedMeta.height}`,
    }

    return {
      imageUrl: relativeUrl,
      sourceImageUrl: sourceUrl,
      locationImageUrl,
      enhancedPrompt,
      provider: modelUsed,
      aspectRatio: targetAspect,
      warnings,
      audit,
      effectiveSettings: effective.settings as Record<string, unknown>,
      negativePrompt: negativeConstraints,
      quality: { requested: quality, applied: quality },
      providerRequest,
    }
  }

  /**
   * Text-to-image prompt generation via Gemini Nano Banana 2.1
   */
  public static async generateRender(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const { prompt, style, aspectRatio } = options
    const { rendersDir } = this.ensureDirs()
    const apiKey = this.getApiKey()
    const model = this.getModelName()
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const enhancedPrompt = `${prompt}, ${style} architecture, professional architectural photography, 8k resolution, photorealistic masterpiece`

    console.log(`[ImageGen] Generating architectural render via Nano Banana 2.1 (${model})...`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: enhancedPrompt }],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio || '16:9',
            imageSize: '2K',
          },
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      if (response.status === 401 || response.status === 403) {
        throw new HttpError(401, 'Invalid Gemini Nano Banana 2.1 API key. Check backend/.env.', 'GEMINI_AUTH_ERROR')
      }
      if (response.status === 429) {
        throw new HttpError(
          429,
          'Gemini Nano Banana 2.1 quota is exhausted. Please check your quota at https://aistudio.google.com/apikey',
          'GEMINI_QUOTA_EXHAUSTED',
        )
      }
      throw new HttpError(response.status, `Nano Banana 2.1 generation failed: ${errText}`, 'GEMINI_GENERATION_FAILED')
    }

    const data = (await response.json()) as GeminiGenerateContentResponse
    const buffer = this.extractImageFromGeminiResponse(data)

    if (!buffer) {
      throw new HttpError(502, 'Nano Banana 2.1 generation returned an empty response.', 'GEMINI_EMPTY_RESPONSE')
    }

    const fileName = `render-gen-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`
    const filePath = path.join(rendersDir, fileName)
    const relativeUrl = `/uploads/renders/${fileName}`

    await sharp(buffer).jpeg({ quality: 96, mozjpeg: true }).toFile(filePath)

    return {
      imageUrl: relativeUrl,
      enhancedPrompt,
      provider: model,
      aspectRatio,
    }
  }

  /**
   * Applies targeted post-render modifications via Gemini Nano Banana 2.1
   */
  public static async editRender(options: {
    image: string
    editPrompt: string
    strength?: number
    style?: RenderStyle
    engine?: RenderEngine
    lighting?: RenderLighting
    aspectRatio?: RenderAspectRatio
  }): Promise<{ imageUrl: string; enhancedPrompt: string; provider: string }> {
    const { image, editPrompt, aspectRatio = '16:9' } = options
    const requestId = `edit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const { rendersDir } = this.ensureDirs()

    const { buffer: rawSourceBuffer, detectedAspect } = await this.resolveSourceImage(image)
    const targetAspect = aspectRatio || detectedAspect

    const preparedBuffer = await sharp(rawSourceBuffer)
      .resize(1536, 1536, { fit: 'inside' })
      .jpeg({ quality: 95 })
      .toBuffer()

    const editEnhancedPrompt = `Modify the architectural render according to these instructions: ${editPrompt.trim()}. Maintain identical building geometry, floor count, roofline, perspective, and untouched structural elements.`

    const { buffer: editedBuffer, modelUsed } = await this.executeNanoBananaImageEdit({
      requestId,
      imageBuffer: preparedBuffer,
      prompt: editEnhancedPrompt,
      aspectRatio: targetAspect,
      quality: 'high',
      category: 'exterior',
      sectionsIncluded: ['edit_directive', 'structural_preservation'],
    })

    const fileName = `render-edit-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`
    const filePath = path.join(rendersDir, fileName)
    const relativeUrl = `/uploads/renders/${fileName}`

    await sharp(editedBuffer).jpeg({ quality: 96, mozjpeg: true }).toFile(filePath)

    return {
      imageUrl: relativeUrl,
      enhancedPrompt: editEnhancedPrompt,
      provider: `${modelUsed}-edit`,
    }
  }

  /**
   * Re-illuminates an architectural render using Gemini Nano Banana 2.1
   */
  public static async relightRender(options: {
    image: string
    timeOfDay: 'morning' | 'golden-hour' | 'evening' | 'night'
    naturalIntensity?: number
    colorTemp?: 'warm' | 'neutral' | 'cool'
    directLights?: boolean
    indirectLights?: boolean
    exteriorLights?: boolean
    style?: RenderStyle
    aspectRatio?: RenderAspectRatio
  }): Promise<{ imageUrl: string; enhancedPrompt: string; provider: string }> {
    const {
      image,
      timeOfDay,
      naturalIntensity = 1.0,
      colorTemp = 'warm',
      directLights = true,
      indirectLights = true,
      exteriorLights = true,
      aspectRatio = '16:9',
    } = options

    const requestId = `relight-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const { rendersDir } = this.ensureDirs()
    const { buffer: rawSourceBuffer, detectedAspect } = await this.resolveSourceImage(image)
    const targetAspect = aspectRatio || detectedAspect

    const preparedBuffer = await sharp(rawSourceBuffer)
      .resize(1536, 1536, { fit: 'inside' })
      .jpeg({ quality: 95 })
      .toBuffer()

    const timeDescriptions = {
      morning: 'crisp early morning sun with long angled soft shadows and clean natural daylight',
      'golden-hour': 'dramatic low golden hour sunset rays, warm honey tones, and glowing horizon',
      evening: 'moody blue hour twilight with deep indigo sky and atmospheric dusk illumination',
      night: 'starlit architectural night scene with dark sky and focused artificial lighting pools',
    }

    const tempDescriptions = {
      warm: 'warm 2700K incandescent amber illumination',
      neutral: 'neutral 4000K pure architectural white light',
      cool: 'cool 6000K daylight-balanced illumination',
    }

    const naturalSunDesc = timeDescriptions[timeOfDay] || timeDescriptions['golden-hour']
    const tempDesc = tempDescriptions[colorTemp] || tempDescriptions.warm

    const artificialParts: string[] = []
    if (directLights) artificialParts.push('direct architectural ceiling downlights turned on casting warm pools of light')
    if (indirectLights) artificialParts.push('hidden linear LED cove lighting illuminating architectural soffits and ceiling coves')
    if (exteriorLights) artificialParts.push('exterior spotlights grazing textured walls, garden uplights, and pool illumination')
    if (!directLights && !indirectLights && !exteriorLights) {
      artificialParts.push('all artificial fixtures turned off, lit only by ambient natural light')
    }

    const relightPrompt = `Re-illuminate this architectural scene while keeping all building geometry, materials, and camera perspective 100% identical. Lighting design: ${naturalSunDesc}, natural intensity ${naturalIntensity.toFixed(1)}, color balance ${tempDesc}, ${artificialParts.join(', ')}. Accurate global illumination bounce, contact shadows, and realistic reflections.`

    const { buffer: relitBuffer, modelUsed } = await this.executeNanoBananaImageEdit({
      requestId,
      imageBuffer: preparedBuffer,
      prompt: relightPrompt,
      aspectRatio: targetAspect,
      quality: 'high',
      category: 'exterior',
      sectionsIncluded: ['relighting_specification', 'structural_preservation'],
    })

    const fileName = `render-relit-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`
    const filePath = path.join(rendersDir, fileName)
    const relativeUrl = `/uploads/renders/${fileName}`

    await sharp(relitBuffer).jpeg({ quality: 96, mozjpeg: true }).toFile(filePath)

    return {
      imageUrl: relativeUrl,
      enhancedPrompt: relightPrompt,
      provider: `${modelUsed}-relight`,
    }
  }

  /**
   * Enhances an existing render to master 4K quality using Gemini Nano Banana 2.1
   */
  public static async enhanceToHyperReal(options: {
    image: string
    style?: RenderStyle
    aspectRatio?: RenderAspectRatio
  }): Promise<{ imageUrl: string; enhancedPrompt: string; provider: string }> {
    const { image, aspectRatio } = options
    const requestId = `enhance-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const { rendersDir } = this.ensureDirs()
    const { buffer: rawSourceBuffer, detectedAspect } = await this.resolveSourceImage(image)
    const targetAspect = aspectRatio || detectedAspect

    const preparedBuffer = await sharp(rawSourceBuffer)
      .resize(1536, 1536, { fit: 'inside' })
      .jpeg({ quality: 95 })
      .toBuffer()

    const hyperrealPrompt =
      'Enhance this architectural render to master portfolio quality: render authentic micro-surface material porosity, honed stone textures, realistic wood grain, crystalline glass reflections, ray-traced caustics, and clean ambient occlusion, while keeping building geometry, openings, and perspective 100% locked.'

    const { buffer: enhancedBuffer, modelUsed } = await this.executeNanoBananaImageEdit({
      requestId,
      imageBuffer: preparedBuffer,
      prompt: hyperrealPrompt,
      aspectRatio: targetAspect,
      quality: 'ultra',
      category: 'exterior',
      sectionsIncluded: ['hyperreal_enhancement', 'geometric_preservation'],
    })

    const fileName = `render-hyperreal-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`
    const filePath = path.join(rendersDir, fileName)
    const relativeUrl = `/uploads/renders/${fileName}`

    await sharp(enhancedBuffer).jpeg({ quality: 98, mozjpeg: true }).toFile(filePath)

    return {
      imageUrl: relativeUrl,
      enhancedPrompt: hyperrealPrompt,
      provider: `${modelUsed}-hyperreal`,
    }
  }

  /**
   * Generates macro architectural close-up detail shots from selected pinned targets on the render
   */
  public static async generateCloseups(options: {
    image: string
    targets: Array<{
      x: number
      y: number
      width?: number
      height?: number
      label: string
      note?: string
    }>
    style?: RenderStyle
  }): Promise<{
    closeups: Array<{ id: string; label: string; imageUrl: string }>
    collageUrl: string
    provider: string
  }> {
    const { image, targets } = options
    const { rendersDir } = this.ensureDirs()
    const { buffer: rawSourceBuffer, width: origW, height: origH } = await this.resolveSourceImage(image)
    const model = this.getModelName()

    const closeups: Array<{ id: string; label: string; imageUrl: string }> = []
    const croppedBuffers: Buffer[] = []

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]
      const cropW = Math.round(Math.min(origW, Math.max(160, (target.width || 0.3) * origW)))
      const cropH = Math.round(Math.min(origH, Math.max(160, (target.height || 0.3) * origH)))
      const cropX = Math.round(Math.max(0, Math.min(origW - cropW, target.x * origW - cropW / 2)))
      const cropY = Math.round(Math.max(0, Math.min(origH - cropH, target.y * origH - cropH / 2)))

      const cropped = await sharp(rawSourceBuffer)
        .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
        .resize(1024, 1024, { fit: 'cover' })
        .jpeg({ quality: 95 })
        .toBuffer()

      const detailPrompt = `Macro architectural close-up photograph of ${target.label || 'architectural material'}, ${target.note || ''}. Extreme tactile micro-texture, fine joints, material porosity, realistic craftsmanship, shallow depth of field, Hasselblad macro lens optical clarity.`

      const requestId = `closeup-${Date.now()}-${i}`
      let macroBuffer: Buffer

      try {
        const { buffer } = await this.executeNanoBananaImageEdit({
          requestId,
          imageBuffer: cropped,
          prompt: detailPrompt,
          aspectRatio: '1:1',
          quality: 'high',
          category: 'exterior',
          sectionsIncluded: ['macro_detail_specification'],
        })
        macroBuffer = buffer
      } catch (err) {
        throw new HttpError(
          (err as HttpError).status || 500,
          `Failed to synthesize closeup detail for "${target.label}": ${(err as Error).message}`,
          'CLOSEUP_SYNTHESIS_FAILED',
        )
      }

      const fileName = `render-closeup-${Date.now()}-${i}-${crypto.randomBytes(4).toString('hex')}.jpg`
      const filePath = path.join(rendersDir, fileName)
      const relativeUrl = `/uploads/renders/${fileName}`

      await sharp(macroBuffer).jpeg({ quality: 96, mozjpeg: true }).toFile(filePath)
      croppedBuffers.push(macroBuffer)
      closeups.push({ id: `closeup-${i + 1}`, label: target.label || `Detail #${i + 1}`, imageUrl: relativeUrl })
    }

    let collageUrl = closeups[0]?.imageUrl || ''
    if (croppedBuffers.length >= 2) {
      const collageFileName = `render-collage-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`
      const collagePath = path.join(rendersDir, collageFileName)
      const halfSize = 512

      const resizedCrops = await Promise.all(
        croppedBuffers.slice(0, 4).map((buf) =>
          sharp(buf).resize(halfSize, halfSize, { fit: 'cover' }).toBuffer(),
        ),
      )

      const composites = [
        { input: resizedCrops[0], top: 0, left: 0 },
        { input: resizedCrops[1], top: 0, left: halfSize },
      ]
      if (resizedCrops[2]) composites.push({ input: resizedCrops[2], top: halfSize, left: 0 })
      if (resizedCrops[3]) composites.push({ input: resizedCrops[3], top: halfSize, left: halfSize })

      const collageHeight = resizedCrops.length > 2 ? halfSize * 2 : halfSize
      await sharp({
        create: {
          width: halfSize * 2,
          height: collageHeight,
          channels: 3,
          background: { r: 15, g: 15, b: 15 },
        },
      })
        .composite(composites)
        .jpeg({ quality: 95 })
        .toFile(collagePath)

      collageUrl = `/uploads/renders/${collageFileName}`
    }

    return {
      closeups,
      collageUrl,
      provider: `${model}-closeup`,
    }
  }

  /**
   * Saves a canvas-adjusted / color-graded image (user manual edits)
   */
  public static async saveAdjustedImage(dataUrl: string): Promise<string> {
    const { rendersDir } = this.ensureDirs()
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `render-graded-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`
    const filePath = path.join(rendersDir, fileName)
    await sharp(buffer).jpeg({ quality: 96, chromaSubsampling: '4:4:4' }).toFile(filePath)
    return `/uploads/renders/${fileName}`
  }
}
