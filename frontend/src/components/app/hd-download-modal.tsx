import { Download, Loader2, Sparkles, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { rendersService } from '@/services/renders'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/stores/toast-store'
import type { Render } from '@/types'

export type ImageDownloadQuality = '4k' | '2k' | '1080p' | 'original'
export type ImageDownloadFormat = 'jpg' | 'png'

interface HdDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  render: Render | null
}

const QUALITY_OPTIONS: {
  id: ImageDownloadQuality
  title: string
  resolution: string
  description: string
  badge: string
  recommended?: boolean
  fileSizeEstimate: string
}[] = [
  {
    id: '4k',
    title: 'Ultra HD 4K Master',
    resolution: '3840 × 2160 px',
    description: 'Sub-pixel sharpened with Lanczos3 filter. Perfect for client presentations & large-format prints.',
    badge: '4K UHD',
    recommended: true,
    fileSizeEstimate: '~6 - 9 MB',
  },
  {
    id: '2k',
    title: 'Studio 2K High-Res',
    resolution: '2048 × 1152 px',
    description: 'Super-clean architectural visualization for portfolio decks and Retina / iPad displays.',
    badge: '2K Studio',
    fileSizeEstimate: '~3 - 5 MB',
  },
  {
    id: '1080p',
    title: 'Standard HD 1080p',
    resolution: '1920 × 1080 px',
    description: 'Fast, lightweight export optimized for web sharing, email attachments, and messaging.',
    badge: '1080p HD',
    fileSizeEstimate: '~1.5 MB',
  },
  {
    id: 'original',
    title: 'Native Source Master',
    resolution: 'Original Resolution',
    description: 'Raw direct output file synthesized by Vibe3D AI neural engine without scaling.',
    badge: 'Native Master',
    fileSizeEstimate: '~2 - 4 MB',
  },
]

export function HdDownloadModal({ isOpen, onClose, render }: HdDownloadModalProps) {
  const user = useAuthStore((state) => state.user)
  const isStarter = user?.plan === 'starter'
  const [selectedQuality, setSelectedQuality] = useState<ImageDownloadQuality>('4k')
  const [selectedFormat, setSelectedFormat] = useState<ImageDownloadFormat>('jpg')
  const [isDownloading, setIsDownloading] = useState(false)

  if (!isOpen || !render) return null

  async function handleDownload() {
    if (!render) return

    try {
      setIsDownloading(true)
      const downloadUrl = rendersService.getDownloadUrl(render.id, {
        quality: selectedQuality,
        format: selectedFormat,
      })

      // Initiate download via temporary link
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `renderly-${selectedQuality}-${render.id}.${selectedFormat}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(
        `Exporting ${selectedQuality.toUpperCase()} render (${selectedFormat.toUpperCase()})…`,
        'Download Started',
      )

      setTimeout(() => {
        setIsDownloading(false)
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Download error:', err)
      // Client-side fallback
      const fallbackLink = document.createElement('a')
      fallbackLink.href = resolveImageUrl(render.imageUrl)
      fallbackLink.download = `render-${render.id}.jpg`
      fallbackLink.target = '_blank'
      fallbackLink.click()
      setIsDownloading(false)
      onClose()
    }
  }

  const activeOption = QUALITY_OPTIONS.find((q) => q.id === selectedQuality) || QUALITY_OPTIONS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-accent/15 text-accent border border-accent/20">
              <Download className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Download HD Render</h2>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
                  HD & 4K Options
                </span>
              </div>
              <p className="text-xs text-muted">Select high-definition export resolution and image format.</p>
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

        {/* Render Preview Info */}
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-border bg-background p-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-black">
            <img
              src={resolveImageUrl(render.imageUrl)}
              alt={render.prompt}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs font-semibold text-foreground">{render.prompt}</p>
            <p className="text-[11px] text-muted mt-0.5 capitalize">
              {render.style.replace('-', ' ')} · {render.lighting?.replace('-', ' ') || 'Golden hour'} · Aspect{' '}
              {render.aspectRatio}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px]">
              <span className="rounded bg-surface-raised px-1.5 py-0.5 font-medium text-foreground border border-border">
                {render.engine || 'HyperReal'} Engine
              </span>
              {render.metadata?.category && (
                <span className="rounded bg-accent/10 px-1.5 py-0.5 font-medium text-accent capitalize">
                  {render.metadata.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quality Options Grid */}
        <div className="mt-5 flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Select Resolution Quality</span>
            <span className="text-[11px] text-muted font-normal">Native AI Neural Scaling</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QUALITY_OPTIONS.map((opt) => {
              const isSelected = selectedQuality === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedQuality(opt.id)}
                  className={cn(
                    'group relative flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all',
                    isSelected
                      ? 'border-accent bg-accent/15 ring-2 ring-accent shadow-md shadow-accent/10'
                      : 'border-border bg-background/60 hover:border-border-strong hover:bg-background',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{opt.title}</span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                        isSelected ? 'bg-accent text-white' : 'bg-surface-raised text-muted',
                      )}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full mt-0.5">
                    <span className="text-[11px] font-mono text-accent">{opt.resolution}</span>
                    <span className="text-[10px] text-muted">{opt.fileSizeEstimate}</span>
                  </div>
                  <p className="text-[10px] text-muted leading-relaxed line-clamp-2 mt-1">
                    {opt.description}
                  </p>
                  {opt.recommended && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-amber-400">
                      <Sparkles className="size-2.5" />
                      <span>Recommended for Best Quality</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Format Selector */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-background/50 p-3">
          <div>
            <span className="text-xs font-semibold text-foreground">File Format</span>
            <p className="text-[11px] text-muted">Choose your preferred image format</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFormat('jpg')}
              className={cn(
                'rounded-lg px-3 py-1 font-medium transition-colors',
                selectedFormat === 'jpg'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              JPG (98% Crisp)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('png')}
              className={cn(
                'rounded-lg px-3 py-1 font-medium transition-colors',
                selectedFormat === 'png'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              PNG (Lossless)
            </button>
          </div>
        </div>

        {/* Studio Upgrade Hint for 4K/2K on Starter Plan */}
        {isStarter && (selectedQuality === '4k' || selectedQuality === '2k') && (
          <div className="mt-3.5 flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-accent font-medium">
              <Zap className="size-3.5" />
              <span>Ultra HD 4K & 2K Masters require Studio Pro</span>
            </span>
            <Link
              to="/app/subscription"
              onClick={onClose}
              className="text-[11px] font-bold text-accent hover:underline"
            >
              Upgrade (Razorpay) →
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/80 pt-4">
          <div className="text-xs text-muted">
            Ready to download: <span className="font-semibold text-foreground">{activeOption.resolution}</span> (
            {selectedFormat.toUpperCase()})
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isDownloading}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-2 shadow-lg shadow-accent/20 px-5"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating Download…
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Download {activeOption.badge}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
