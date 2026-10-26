import {
  Check,
  Download,
  Flame,
  Layers,
  Loader2,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { BeforeAfterSlider } from '@/components/app/before-after-slider'
import { Button } from '@/components/ui/button'
import { resolveImageUrl } from '@/lib/api'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { Render } from '@/types'

interface HyperRealEnhanceModalProps {
  render: Render | null
  isOpen: boolean
  onClose: () => void
  onEnhanceSuccess: (newRender: Render) => void
}

export function HyperRealEnhanceModal({
  render,
  isOpen,
  onClose,
  onEnhanceSuccess,
}: HyperRealEnhanceModalProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedRender, setEnhancedRender] = useState<Render | null>(null)

  if (!isOpen || !render) return null

  async function handleExecuteEnhance() {
    if (!render) return
    setIsEnhancing(true)

    try {
      toast.info('Elevating render to HyperReal 8K Master quality…')
      const result = await rendersService.enhance(render.id)
      setEnhancedRender(result)
      onEnhanceSuccess(result)
      toast.success('Render upgraded to HyperReal Studio Quality!')
    } catch (err) {
      console.error('HyperReal enhance failed:', err)
      toast.error('Failed to enhance render. Please try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-raised/40">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent border border-accent/20">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Vibe3D HyperReal Enhance</h2>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  8K Studio Master
                </span>
              </div>
              <p className="text-xs text-muted">
                Unmatched photorealism with rich details, refined reflections, and portfolio-grade micro-textures.
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
          {/* Left: Before & After Comparison Stage */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/50 p-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl">
              <BeforeAfterSlider
                beforeSrc={resolveImageUrl(render.imageUrl)}
                afterSrc={enhancedRender ? resolveImageUrl(enhancedRender.imageUrl) : resolveImageUrl(render.imageUrl)}
                beforeLabel="ORIGINAL RENDER"
                afterLabel={enhancedRender ? 'HYPERREAL 8K' : 'HYPERREAL PREVIEW'}
                aspectClass="aspect-[16/9]"
              />
            </div>
          </div>

          {/* Right: Enhancement Details & Action Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border bg-surface p-6 gap-6 overflow-y-auto">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  What HyperReal Enhances
                </span>
                <p className="text-xs text-muted leading-relaxed">
                  Best applied as your final polishing step. The HyperReal optical engine recalculates micro-surface
                  roughness, adds ambient contact shadows, and refines architectural glazing.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised/40 p-3">
                  <div className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent shrink-0 mt-0.5">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Hasselblad H6D-100c Optical Clarity</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      100-megapixel medium-format sharpness with true-to-life architectural tilt-shift perspective.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised/40 p-3">
                  <div className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent shrink-0 mt-0.5">
                    <Layers className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Tactile Micro-Surface Porosity</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Honed limestone grain, board-formed concrete roughness, and organic timber knots.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised/40 p-3">
                  <div className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent shrink-0 mt-0.5">
                    <Flame className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Low-Iron Structural Glazing</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Ray-traced water caustics, crisp Fresnel reflections, and zero artificial CGI sheen.
                    </p>
                  </div>
                </div>
              </div>

              {enhancedRender && (
                <div className="rounded-xl border border-accent/40 bg-accent/10 p-3.5">
                  <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
                    <Check className="size-4" /> HyperReal Master Saved!
                  </span>
                  <p className="text-[11px] text-muted mt-1">
                    Drag the comparison slider on the left to inspect the enhanced micro-detail and reflections.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isEnhancing}>
                {enhancedRender ? 'Done' : 'Cancel'}
              </Button>

              {enhancedRender ? (
                <Button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = resolveImageUrl(enhancedRender.imageUrl)
                    link.download = `render-hyperreal-8k-${Date.now()}.jpg`
                    link.click()
                  }}
                  className="shadow-lg shadow-accent/20 gap-2"
                >
                  <Download className="size-4" /> Download 8K Master
                </Button>
              ) : (
                <Button
                  onClick={handleExecuteEnhance}
                  disabled={isEnhancing}
                  className="shadow-lg shadow-accent/20 gap-2"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Synthesizing 8K Master…
                    </>
                  ) : (
                    <>
                      <Zap className="size-4" />
                      Enhance to HyperReal 8K
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
