import {
  Flame,
  Lamp,
  Lightbulb,
  Loader2,
  Moon,
  Sparkles,
  Sun,
  Sunset,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { RelightPayload, Render } from '@/types'

interface RelightModalProps {
  render: Render | null
  isOpen: boolean
  onClose: () => void
  onRelitSuccess: (newRender: Render) => void
}

const TIME_OPTIONS = [
  {
    id: 'morning',
    label: 'Morning',
    desc: 'Crisp, bright daylight with soft penumbra shadows',
    icon: Sun,
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    desc: 'Warm amber sunset rays and glowing horizons',
    icon: Sunset,
  },
  {
    id: 'evening',
    label: 'Evening / Dusk',
    desc: 'Deep indigo blue-hour twilight atmosphere',
    icon: Sunset,
  },
  {
    id: 'night',
    label: 'Night',
    desc: 'Starlit night with dramatic artificial lighting pools',
    icon: Moon,
  },
] as const

const TEMP_OPTIONS = [
  { id: 'warm', label: 'Warm 2700K', desc: 'Cozy amber glow' },
  { id: 'neutral', label: 'Neutral 4000K', desc: 'Crisp architectural balance' },
  { id: 'cool', label: 'Cool 6500K', desc: 'Pure overcast modern daylight' },
] as const

export function RelightModal({ render, isOpen, onClose, onRelitSuccess }: RelightModalProps) {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'golden-hour' | 'evening' | 'night'>('golden-hour')
  const [naturalIntensity, setNaturalIntensity] = useState<number>(1.0)
  const [colorTemp, setColorTemp] = useState<'warm' | 'neutral' | 'cool'>('warm')

  const [directLights, setDirectLights] = useState(true)
  const [indirectLights, setIndirectLights] = useState(true)
  const [exteriorLights, setExteriorLights] = useState(true)

  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !render) return null

  // Calculate live visual filter preview
  const getFilterStyle = () => {
    let brightness = 100
    let sepia = 0
    let hueRotate = 0
    let contrast = 100

    if (timeOfDay === 'morning') {
      brightness = naturalIntensity * 105
      contrast = 104
      sepia = 5
    } else if (timeOfDay === 'golden-hour') {
      brightness = naturalIntensity * 100
      sepia = 35
      contrast = 108
    } else if (timeOfDay === 'evening') {
      brightness = naturalIntensity * 85
      hueRotate = 210
      contrast = 112
    } else if (timeOfDay === 'night') {
      brightness = Math.min(80, naturalIntensity * 65)
      contrast = 120
      hueRotate = 230
    }

    if (colorTemp === 'warm') sepia += 20
    else if (colorTemp === 'cool') hueRotate += 15

    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) sepia(${sepia}%) hue-rotate(${hueRotate}deg)`,
      transition: 'filter 0.25s ease-out',
    }
  }

  async function handleExecuteRelight() {
    if (!render) return
    setIsProcessing(true)

    try {
      const payload: RelightPayload = {
        timeOfDay,
        naturalIntensity,
        colorTemp,
        directLights,
        indirectLights,
        exteriorLights,
      }

      toast.info('Synthesizing photorealistic architectural relighting…')
      const newRender = await rendersService.relight(render.id, payload)
      toast.success('Scene successfully relit!')
      onRelitSuccess(newRender)
      onClose()
    } catch (err) {
      console.error('Relight failed:', err)
      toast.error('Failed to relight scene. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-raised/40">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent border border-accent/20">
              <Lightbulb className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Vibe3D Instant Relight</h2>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  Lighting Engine
                </span>
              </div>
              <p className="text-xs text-muted">
                Independently control natural sunlight and artificial fixtures with zero geometry degradation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Left: Interactive Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/50 p-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
              <img
                src={resolveImageUrl(render.imageUrl)}
                alt="Relight Preview"
                className="size-full object-cover"
                style={getFilterStyle()}
              />

              {/* Status overlay badge */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <span className="rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/15">
                  Lighting: {TIME_OPTIONS.find((t) => t.id === timeOfDay)?.label} · {colorTemp.toUpperCase()}
                </span>
              </div>

              {/* Active fixtures pill */}
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between rounded-xl bg-black/80 px-3.5 py-2 text-[11px] text-white/90 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-3">
                  <span className={cn('flex items-center gap-1', directLights ? 'text-amber-300' : 'text-white/40')}>
                    <Lamp className="size-3.5" /> Direct {directLights ? 'ON' : 'OFF'}
                  </span>
                  <span className={cn('flex items-center gap-1', indirectLights ? 'text-amber-300' : 'text-white/40')}>
                    <Sparkles className="size-3.5" /> Cove {indirectLights ? 'ON' : 'OFF'}
                  </span>
                  <span className={cn('flex items-center gap-1', exteriorLights ? 'text-amber-300' : 'text-white/40')}>
                    <Flame className="size-3.5" /> Exterior {exteriorLights ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[10px] text-white/60">Real-time Simulation</span>
              </div>
            </div>
          </div>

          {/* Right: Controls Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border bg-surface p-6 gap-6 overflow-y-auto">
            <div className="flex flex-col gap-5">
              {/* Natural Light Section */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Sun className="size-3.5 text-accent" /> Natural Light & Atmosphere
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map((time) => {
                    const Icon = time.icon
                    const isSelected = timeOfDay === time.id
                    return (
                      <button
                        key={time.id}
                        type="button"
                        onClick={() => setTimeOfDay(time.id)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                          isSelected
                            ? 'border-accent bg-accent/15 text-foreground shadow-sm'
                            : 'border-border bg-surface-raised/40 text-muted hover:border-accent/40 hover:text-foreground',
                        )}
                      >
                        <div
                          className={cn(
                            'grid size-8 place-items-center rounded-lg',
                            isSelected ? 'bg-accent text-background' : 'bg-surface text-muted',
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">{time.label}</span>
                          <span className="text-[10px] text-muted truncate">{time.desc.split(' ')[0]} light</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Natural Intensity Slider */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-foreground">Sunlight Intensity</span>
                    <span className="text-accent font-semibold">{(naturalIntensity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.8"
                    step="0.05"
                    value={naturalIntensity}
                    onChange={(e) => setNaturalIntensity(parseFloat(e.target.value))}
                    className="h-1.5 w-full cursor-pointer accent-accent"
                  />
                </div>

                {/* Color Temperature */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="text-xs font-medium text-foreground">Light Temperature</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TEMP_OPTIONS.map((temp) => (
                      <button
                        key={temp.id}
                        type="button"
                        onClick={() => setColorTemp(temp.id)}
                        className={cn(
                          'rounded-lg border px-2 py-1.5 text-center text-xs transition-colors',
                          colorTemp === temp.id
                            ? 'border-accent bg-accent/15 text-accent font-semibold'
                            : 'border-border bg-background text-muted hover:text-foreground',
                        )}
                      >
                        {temp.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Artificial Light Section */}
              <div className="flex flex-col gap-3 pt-3 border-t border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Lamp className="size-3.5 text-accent" /> Artificial Fixtures
                </span>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-2.5 cursor-pointer hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 place-items-center rounded-lg bg-surface text-accent">
                        <Lamp className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">Direct Lights</span>
                        <span className="text-[10px] text-muted">Ceiling downlights & recessed spots</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={directLights}
                      onChange={(e) => setDirectLights(e.target.checked)}
                      className="size-4 accent-accent rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-2.5 cursor-pointer hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 place-items-center rounded-lg bg-surface text-accent">
                        <Sparkles className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">Indirect Cove Lights</span>
                        <span className="text-[10px] text-muted">Architectural soffits & wall washing</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={indirectLights}
                      onChange={(e) => setIndirectLights(e.target.checked)}
                      className="size-4 accent-accent rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-2.5 cursor-pointer hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 place-items-center rounded-lg bg-surface text-accent">
                        <Flame className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">Exterior & Landscape</span>
                        <span className="text-[10px] text-muted">Garden uplights, pool illumination</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={exteriorLights}
                      onChange={(e) => setExteriorLights(e.target.checked)}
                      className="size-4 accent-accent rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>

              <Button
                onClick={handleExecuteRelight}
                disabled={isProcessing}
                className="shadow-lg shadow-accent/20 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Relighting Scene…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Synthesize Relit Render
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
