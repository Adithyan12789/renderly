import {
  Check,
  Crosshair,
  Download,
  Focus,
  Loader2,
  Trash2,
  X,
  ZoomIn,
} from 'lucide-react'
import { useRef, useState, type MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { CloseupTarget, Render } from '@/types'

interface CloseupsModalProps {
  render: Render | null
  isOpen: boolean
  onClose: () => void
  onCloseupSuccess: (newRender: Render) => void
}

const QUICK_DETAIL_SUGGESTIONS = [
  { label: 'Marble Countertop & Island', note: 'Polished Calacatta marble veining with subtle chamfered edge' },
  { label: 'Facade Timber Louvers', note: 'Vertical natural teak wood grain and tactile joins' },
  { label: 'Reflection Pool & Water', note: 'Clear crystalline water ripples with subtle underwater lighting caustics' },
  { label: 'Honed Limestone Wall', note: 'Subtle natural sedimentary porosity and shadow relief' },
  { label: 'Window Framing & Glazing', note: 'Slim bronze anodized aluminum mullion junction' },
]

export function CloseupsModal({ render, isOpen, onClose, onCloseupSuccess }: CloseupsModalProps) {
  const [targets, setTargets] = useState<CloseupTarget[]>([
    { x: 0.35, y: 0.45, label: 'Architectural Material #1', note: 'High resolution tactile surface texture' },
  ])
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResults, setGeneratedResults] = useState<{
    render: Render
    closeups: Array<{ id: string; label: string; imageUrl: string }>
  } | null>(null)

  const imageContainerRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !render) return null

  function handleImageClick(e: MouseEvent<HTMLDivElement>) {
    if (!imageContainerRef.current || targets.length >= 4) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height))

    const newTarget: CloseupTarget = {
      x,
      y,
      label: `Detail Target #${targets.length + 1}`,
      note: 'Focus on fine material textures and optical reflections',
    }
    const updated = [...targets, newTarget]
    setTargets(updated)
    setSelectedTargetIndex(updated.length - 1)
  }

  function handleRemoveTarget(idx: number) {
    const updated = targets.filter((_, i) => i !== idx)
    setTargets(updated)
    if (selectedTargetIndex >= updated.length) {
      setSelectedTargetIndex(Math.max(0, updated.length - 1))
    }
  }

  function handleAddPreset(preset: { label: string; note: string }) {
    if (targets.length >= 4) {
      toast.info('Maximum of 4 close-up detail spots allowed.')
      return
    }
    const offsets = [
      { x: 0.3, y: 0.4 },
      { x: 0.65, y: 0.5 },
      { x: 0.45, y: 0.7 },
      { x: 0.75, y: 0.35 },
    ]
    const pos = offsets[targets.length] || { x: 0.5, y: 0.5 }
    const updated = [...targets, { x: pos.x, y: pos.y, label: preset.label, note: preset.note }]
    setTargets(updated)
    setSelectedTargetIndex(updated.length - 1)
  }

  async function handleGenerateCloseups() {
    if (!render || targets.length === 0) return
    setIsGenerating(true)

    try {
      toast.info(`Generating ${targets.length} architectural macro close-up shots…`)
      const result = await rendersService.closeups(render.id, targets)
      setGeneratedResults(result)
      onCloseupSuccess(result.render)
      toast.success('Close-up detail shots successfully synthesized!')
    } catch (err) {
      console.error('Failed to generate closeups:', err)
      toast.error('Failed to generate close-ups. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-raised/40">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent border border-accent/20">
              <Focus className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Vibe3D Close-Up Detail Studio</h2>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  Macro Optics
                </span>
              </div>
              <p className="text-xs text-muted">
                Pin up to 4 architectural focal elements to generate Hasselblad 120mm macro detail portfolio shots.
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
          {/* Left: Interactive Canvas with Pin Targets */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/50 p-6">
            {!generatedResults ? (
              <div
                ref={imageContainerRef}
                onClick={handleImageClick}
                className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl cursor-crosshair group"
              >
                <img
                  src={resolveImageUrl(render.imageUrl)}
                  alt="Render Viewport"
                  className="size-full object-cover select-none pointer-events-none"
                />

                {/* Target Pin Markers */}
                {targets.map((target, idx) => {
                  const isSelected = selectedTargetIndex === idx
                  return (
                    <div
                      key={idx}
                      style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTargetIndex(idx)
                      }}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 cursor-pointer transition-transform duration-150',
                        isSelected ? 'scale-110 z-30' : 'scale-95 opacity-85 hover:scale-105 z-20',
                      )}
                    >
                      <div
                        className={cn(
                          'grid size-8 place-items-center rounded-full border-2 text-xs font-bold shadow-lg transition-all',
                          isSelected
                            ? 'bg-accent text-background border-white ring-4 ring-accent/30'
                            : 'bg-black/80 text-white border-white/60 hover:bg-black',
                        )}
                      >
                        {idx + 1}
                      </div>
                      <span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap backdrop-blur-md border border-white/10">
                        {target.label}
                      </span>
                    </div>
                  )
                })}

                {/* Guidance overlay */}
                <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10 flex items-center justify-between rounded-xl bg-black/80 px-3.5 py-2 text-[11px] text-white backdrop-blur-md border border-white/10">
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="size-3.5 text-accent" />
                    Click anywhere on the image to drop a detail pin ({targets.length}/4)
                  </span>
                  <span className="text-[10px] text-white/60">Hasselblad 120mm Macro</span>
                </div>
              </div>
            ) : (
              /* Generated Results Gallery */
              <div className="flex flex-col gap-4 w-full">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl">
                  <img
                    src={resolveImageUrl(generatedResults.render.imageUrl)}
                    alt="Generated Closeups"
                    className="size-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-background uppercase tracking-wider">
                      Macro Collage Ready
                    </span>
                  </div>
                </div>

                {/* Individual closeups thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {generatedResults.closeups.map((c, i) => (
                    <a
                      key={c.id}
                      href={resolveImageUrl(c.imageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-black hover:border-accent transition-colors"
                    >
                      <img src={resolveImageUrl(c.imageUrl)} alt={c.label} className="size-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                        <ZoomIn className="size-4 text-white" />
                      </div>
                      <span className="absolute bottom-1 left-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] text-white text-center truncate">
                        #{i + 1} {c.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Detail Target Controls Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border bg-surface p-6 gap-6 overflow-y-auto">
            {!generatedResults ? (
              <div className="flex flex-col gap-5">
                {/* Pinned Targets List */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Focus className="size-3.5 text-accent" /> Pinned Details ({targets.length}/4)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {targets.map((target, idx) => {
                      const isSelected = selectedTargetIndex === idx
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedTargetIndex(idx)}
                          className={cn(
                            'flex flex-col rounded-xl border p-3 cursor-pointer transition-all gap-1.5',
                            isSelected
                              ? 'border-accent bg-accent/10 shadow-sm'
                              : 'border-border bg-surface-raised/40 hover:border-border/80',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] text-background font-bold">
                                {idx + 1}
                              </span>
                              {target.label}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveTarget(idx)
                              }}
                              className="text-muted hover:text-red-400 p-0.5"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          {isSelected && (
                            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
                              <input
                                type="text"
                                value={target.label}
                                onChange={(e) => {
                                  const updated = [...targets]
                                  updated[idx].label = e.target.value
                                  setTargets(updated)
                                }}
                                placeholder="Detail label (e.g. Marble island seam)"
                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                              />
                              <textarea
                                rows={2}
                                value={target.note || ''}
                                onChange={(e) => {
                                  const updated = [...targets]
                                  updated[idx].note = e.target.value
                                  setTargets(updated)
                                }}
                                placeholder="Instructions (e.g. Focus on chamfered joinery, reflection caustics)"
                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Quick Detail Suggestions */}
                <div className="flex flex-col gap-2 pt-3 border-t border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Quick Material Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_DETAIL_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPreset(sug)}
                        disabled={targets.length >= 4}
                        className="rounded-full border border-border bg-surface-raised/40 px-2.5 py-1 text-[11px] text-muted hover:border-accent/40 hover:text-foreground transition-colors disabled:opacity-40"
                      >
                        + {sug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Post-Generation Action Panel */
              <div className="flex flex-col gap-5 justify-center py-6">
                <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
                  <h3 className="text-sm font-semibold text-accent flex items-center gap-1.5">
                    <Check className="size-4" /> Detail Shots Generated!
                  </h3>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">
                    {generatedResults.closeups.length} individual macro shots and a high-resolution 2x2 presentation
                    collage have been synthesized and saved to this scene.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = resolveImageUrl(generatedResults.render.imageUrl)
                      link.download = `render-closeups-${Date.now()}.jpg`
                      link.click()
                    }}
                    className="w-full gap-2 shadow-lg shadow-accent/20"
                  >
                    <Download className="size-4" /> Download Close-Ups Collage
                  </Button>
                  <Button variant="outline" onClick={() => setGeneratedResults(null)} className="w-full">
                    Configure New Details
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
                {generatedResults ? 'Done' : 'Cancel'}
              </Button>

              {!generatedResults && (
                <Button
                  onClick={handleGenerateCloseups}
                  disabled={isGenerating || targets.length === 0}
                  className="shadow-lg shadow-accent/20 gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Synthesizing Close-Ups…
                    </>
                  ) : (
                    <>
                      <Focus className="size-4" />
                      Generate {targets.length} Detail Shots
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
