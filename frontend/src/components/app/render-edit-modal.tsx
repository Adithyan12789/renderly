import {
  Download,
  Loader2,
  Palette,
  Save,
  Sliders,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getErrorMessage, resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { Render } from '@/types'

interface RenderEditModalProps {
  render: Render
  isOpen: boolean
  onClose: () => void
  onRenderUpdated: (newRender: Render) => void
}

type EditTab = 'ai-edit' | 'color-grading'

const QUICK_EDIT_PRESETS = [
  { label: 'Add poolside loungers & umbrellas', prompt: 'Add modern luxury poolside loungers, sun umbrellas and towel set by the pool' },
  { label: 'Change facade to charred shou sugi ban cedar', prompt: 'Change exterior timber siding to dark charred shou sugi ban cedar wood with natural grain' },
  { label: 'Add dramatic wet ground reflections', prompt: 'Wet rain-drenched ground and asphalt with realistic ray-traced reflections of the building and lights' },
  { label: 'Add lush tropical palms & monsteras', prompt: 'Add lush exotic landscaping with mature tropical palms, cascading monsteras and birds of paradise' },
  { label: 'Shift to Blue Hour twilight lighting', prompt: 'Change lighting to blue hour dusk with dark indigo sky and warm glowing architectural linear LED accents' },
  { label: 'Add warm evening fire pit glow', prompt: 'Add a modern sunken concrete fire pit with warm glowing amber flames and seating area' },
]

const COLOR_PRESETS = [
  { id: 'natural', label: 'Natural Raw', brightness: 0, contrast: 1, saturation: 1, warmth: 0, vignette: 0 },
  { id: 'golden-hour', label: 'Sunset Glow', brightness: 4, contrast: 1.15, saturation: 1.25, warmth: 18, vignette: 15 },
  { id: 'nordic', label: 'Nordic Clean', brightness: 2, contrast: 1.1, saturation: 0.9, warmth: -12, vignette: 5 },
  { id: 'editorial', label: 'Architectural Digest', brightness: -2, contrast: 1.25, saturation: 1.05, warmth: 5, vignette: 20 },
  { id: 'monochrome', label: 'Fine Art B&W', brightness: 0, contrast: 1.35, saturation: 0, warmth: 0, vignette: 25 },
]

export function RenderEditModal({ render, isOpen, onClose, onRenderUpdated }: RenderEditModalProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('ai-edit')

  // AI Edit State
  const [editPrompt, setEditPrompt] = useState('')
  const [editStrength, setEditStrength] = useState(0.32)
  const [isApplyingEdit, setIsApplyingEdit] = useState(false)

  // Color Grading State
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(1)
  const [saturation, setSaturation] = useState(1)
  const [warmth, setWarmth] = useState(0)
  const [vignette, setVignette] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState('natural')
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageObjRef = useRef<HTMLImageElement | null>(null)

  // Load image into canvas for real-time grading
  useEffect(() => {
    if (!isOpen) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = resolveImageUrl(render.imageUrl)
    img.onload = () => {
      imageObjRef.current = img
      applyColorGrading(img, brightness, contrast, saturation, warmth, vignette)
    }
  }, [isOpen, render.imageUrl])

  // Update canvas when sliders change
  useEffect(() => {
    if (imageObjRef.current) {
      applyColorGrading(imageObjRef.current, brightness, contrast, saturation, warmth, vignette)
    }
  }, [brightness, contrast, saturation, warmth, vignette])

  function applyColorGrading(
    img: HTMLImageElement,
    bVal: number,
    cVal: number,
    sVal: number,
    wVal: number,
    vVal: number,
  ) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.naturalWidth || 1344
    canvas.height = img.naturalHeight || 768

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Build CSS filter string for high-speed hardware acceleration
    const brightnessFilter = `brightness(${100 + bVal}%)`
    const contrastFilter = `contrast(${cVal * 100}%)`
    const saturationFilter = `saturate(${sVal * 100}%)`
    const sepiaFilter = wVal > 0 ? `sepia(${wVal}%)` : ''
    const hueFilter = wVal < 0 ? `hue-rotate(${wVal * 1.5}deg)` : ''

    ctx.filter = [brightnessFilter, contrastFilter, saturationFilter, sepiaFilter, hueFilter]
      .filter(Boolean)
      .join(' ')

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'

    // Apply Vignette overlay if requested
    if (vVal > 0) {
      const radius = Math.max(canvas.width, canvas.height) * 0.7
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        radius * 0.4,
        canvas.width / 2,
        canvas.height / 2,
        radius,
      )
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, `rgba(0,0,0,${(vVal / 100) * 0.85})`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  function handleApplyPreset(preset: typeof COLOR_PRESETS[0]) {
    setSelectedPreset(preset.id)
    setBrightness(preset.brightness)
    setContrast(preset.contrast)
    setSaturation(preset.saturation)
    setWarmth(preset.warmth)
    setVignette(preset.vignette)
  }

  async function handleExecuteAiEdit() {
    if (!editPrompt.trim()) {
      toast.error('Please enter instructions for the AI modification.')
      return
    }

    try {
      setIsApplyingEdit(true)
      const editedRender = await rendersService.edit(render.id, {
        editPrompt: editPrompt.trim(),
        strength: editStrength,
      })

      onRenderUpdated(editedRender)
      toast.success('AI render modification synthesized successfully!', 'Edit Applied')
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err), 'Failed to apply AI edit')
    } finally {
      setIsApplyingEdit(false)
    }
  }

  async function handleSaveColorAdjustment() {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      setIsSavingAdjustment(true)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      const presetName = COLOR_PRESETS.find((p) => p.id === selectedPreset)?.label || 'Color Graded'

      const savedRender = await rendersService.saveAdjustment(render.id, {
        dataUrl,
        label: presetName,
      })

      onRenderUpdated(savedRender)
      toast.success('Color graded render saved to your gallery!', 'Adjustment Saved')
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err), 'Failed to save adjustment')
    } finally {
      setIsSavingAdjustment(false)
    }
  }

  function handleDownloadGraded() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/jpeg', 0.96)
    a.download = `renderly-retouched-${render.id}.jpg`
    a.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
              <Wand2 className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Post-Render Studio Retouch & Edit</h2>
              <p className="text-xs text-muted">Modify materials, foliage, lighting, or grade tones directly</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex items-center rounded-xl border border-border bg-background p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ai-edit')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1 font-medium transition-colors',
                  activeTab === 'ai-edit'
                    ? 'bg-accent/20 text-accent font-semibold'
                    : 'text-muted hover:text-foreground',
                )}
              >
                <Sparkles className="size-3" />
                <span>AI Targeted Inpainting</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('color-grading')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1 font-medium transition-colors',
                  activeTab === 'color-grading'
                    ? 'bg-accent/20 text-accent font-semibold'
                    : 'text-muted hover:text-foreground',
                )}
              >
                <Palette className="size-3" />
                <span>Photographic Grading</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Left Preview Stage */}
          <div className="lg:col-span-7 flex flex-col justify-center items-center bg-black/40 p-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl">
              <div className="relative size-full">
                <img
                  src={resolveImageUrl(render.imageUrl)}
                  alt="Render Preview"
                  className="size-full object-cover transition-all duration-100"
                  style={
                    activeTab === 'color-grading'
                      ? {
                          filter: `brightness(${100 + brightness}%) contrast(${contrast * 100}%) saturate(${
                            saturation * 100
                          }%) ${warmth > 0 ? `sepia(${warmth}%)` : warmth < 0 ? `hue-rotate(${warmth * 1.5}deg)` : ''}`,
                        }
                      : undefined
                  }
                />
                {activeTab === 'color-grading' && vignette > 0 && (
                  <div
                    className="pointer-events-none absolute inset-0 transition-opacity"
                    style={{
                      background: `radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(0,0,0,${
                        (vignette / 100) * 0.85
                      }) 100%)`,
                    }}
                  />
                )}
                {/* Canvas used for generating export / save buffer */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="absolute top-3 left-3 pointer-events-none z-10">
                <span className="rounded-full bg-black/75 px-3 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur-md border border-white/10 uppercase">
                  {activeTab === 'ai-edit' ? 'Active Render' : 'Grading Preview'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border bg-surface p-6 gap-6">
            {activeTab === 'ai-edit' ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="ai-edit-prompt" className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Targeted Modification Instructions
                  </label>
                  <textarea
                    id="ai-edit-prompt"
                    rows={3}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. Add luxury modern sun loungers beside the pool with folded white towels..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-medium text-muted">Quick modification suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_EDIT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditPrompt(preset.prompt)}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted hover:border-accent/40 hover:text-foreground transition-colors"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Strength Slider */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Sliders className="size-3.5 text-accent" />
                      <span>Modification Strength: {(editStrength * 100).toFixed(0)}%</span>
                    </label>
                    <span className="text-[10px] text-muted">
                      {editStrength <= 0.28 ? 'Subtle Touch' : editStrength <= 0.4 ? 'Balanced Inpainting' : 'Major Restyle'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.5"
                    step="0.01"
                    value={editStrength}
                    onChange={(e) => setEditStrength(parseFloat(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-raised accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>0.20 (Preserve All Lines)</span>
                    <span>0.32 (Optimal)</span>
                    <span>0.50 (Deeper Re-styling)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Grading Presets */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Architectural Film Presets
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className={cn(
                          'rounded-xl border p-2 text-left text-xs transition-all',
                          selectedPreset === p.id
                            ? 'border-accent bg-accent/15 text-foreground font-semibold'
                            : 'border-border bg-background text-muted hover:text-foreground',
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Sliders */}
                <div className="flex flex-col gap-3.5 pt-2 border-t border-border/50">
                  {/* Brightness */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Exposure / Brightness</span>
                      <span className="text-foreground">{brightness > 0 ? `+${brightness}` : brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="-35"
                      max="35"
                      value={brightness}
                      onChange={(e) => {
                        setBrightness(parseInt(e.target.value, 10))
                        setSelectedPreset('custom')
                      }}
                      className="h-1.5 w-full cursor-pointer accent-accent"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Contrast</span>
                      <span className="text-foreground">{contrast.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.45"
                      step="0.02"
                      value={contrast}
                      onChange={(e) => {
                        setContrast(parseFloat(e.target.value))
                        setSelectedPreset('custom')
                      }}
                      className="h-1.5 w-full cursor-pointer accent-accent"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Color Saturation</span>
                      <span className="text-foreground">{(saturation * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.8"
                      step="0.05"
                      value={saturation}
                      onChange={(e) => {
                        setSaturation(parseFloat(e.target.value))
                        setSelectedPreset('custom')
                      }}
                      className="h-1.5 w-full cursor-pointer accent-accent"
                    />
                  </div>

                  {/* Warmth / Color Temperature */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Warmth / Color Temp</span>
                      <span className="text-foreground">{warmth > 0 ? `+${warmth} (Warm)` : warmth < 0 ? `${warmth} (Cool)` : 'Neutral'}</span>
                    </div>
                    <input
                      type="range"
                      min="-25"
                      max="25"
                      value={warmth}
                      onChange={(e) => {
                        setWarmth(parseInt(e.target.value, 10))
                        setSelectedPreset('custom')
                      }}
                      className="h-1.5 w-full cursor-pointer accent-accent"
                    />
                  </div>

                  {/* Vignette */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Cinematic Vignette</span>
                      <span className="text-foreground">{vignette}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={vignette}
                      onChange={(e) => {
                        setVignette(parseInt(e.target.value, 10))
                        setSelectedPreset('custom')
                      }}
                      className="h-1.5 w-full cursor-pointer accent-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>

              {activeTab === 'ai-edit' ? (
                <Button
                  onClick={handleExecuteAiEdit}
                  disabled={isApplyingEdit || !editPrompt.trim()}
                  className="shadow-lg shadow-accent/20"
                >
                  {isApplyingEdit ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Applying AI Modifications…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Synthesize AI Edit
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadGraded}>
                    <Download className="size-3.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveColorAdjustment}
                    disabled={isSavingAdjustment}
                    className="shadow-lg shadow-accent/20"
                  >
                    {isSavingAdjustment ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="size-3.5" />
                        Save as New Render
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
