import {
  Box,
  Download,
  Film,
  Focus,
  Lightbulb,
  SlidersHorizontal,
  Wand2,
  Zap,
} from 'lucide-react'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Render } from '@/types'

export interface Vibe3dSceneToolbarProps {
  render: Render
  onOpenEdit?: () => void
  onOpenRelight?: () => void
  onOpenEnhance?: () => void
  onOpenCloseups?: () => void
  onOpenFlythrough?: () => void
  onOpenCompare?: () => void
  onOpen3DView?: () => void
  onDownload?: () => void
  variant?: 'compact' | 'studio'
  className?: string
}

export function Vibe3dSceneToolbar({
  render,
  onOpenEdit,
  onOpenRelight,
  onOpenEnhance,
  onOpenCloseups,
  onOpenFlythrough,
  onOpenCompare,
  onOpen3DView,
  onDownload,
  variant = 'compact',
  className,
}: Vibe3dSceneToolbarProps) {
  const isCompact = variant === 'compact'

  const handleDefaultDownload = () => {
    if (onDownload) {
      onDownload()
      return
    }
    const link = document.createElement('a')
    link.href = resolveImageUrl(render.imageUrl)
    link.download = `render-${render.id}.jpg`
    link.click()
  }

  if (isCompact) {
    return (
      <div
        className={cn(
          'flex items-center gap-1 rounded-xl bg-black/85 p-1 backdrop-blur-md border border-white/15 shadow-xl text-white/90',
          className,
        )}
      >
        {onOpenEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenEdit()
            }}
            title="AI Inpainting & Retouch"
            className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-white transition-colors"
          >
            <Wand2 className="size-3.5" />
          </button>
        )}

        {onOpenRelight && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenRelight()
            }}
            title="Instant Relight"
            className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-amber-300 transition-colors"
          >
            <Lightbulb className="size-3.5" />
          </button>
        )}

        {onOpenEnhance && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenEnhance()
            }}
            title="HyperReal 8K Enhance"
            className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-accent transition-colors"
          >
            <Zap className="size-3.5" />
          </button>
        )}

        {onOpenCloseups && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenCloseups()
            }}
            title="Macro Close-Ups"
            className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-white transition-colors"
          >
            <Focus className="size-3.5" />
          </button>
        )}

        {onOpenFlythrough && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenFlythrough()
            }}
            title="Cinematic Flythrough"
            className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-accent transition-colors"
          >
            <Film className="size-3.5" />
          </button>
        )}

        {onOpenCompare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenCompare()
            }}
            title="Compare Slider"
            className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-white transition-colors"
          >
            <SlidersHorizontal className="size-3.5" />
          </button>
        )}

        {onOpen3DView && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen3DView()
            }}
            title="Interactive 3D Spatial View"
            className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-emerald-400 transition-colors"
          >
            <Box className="size-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleDefaultDownload()
          }}
          title="Download Render"
          className="grid size-7 place-items-center rounded-lg hover:bg-white/20 hover:text-white transition-colors"
        >
          <Download className="size-3.5" />
        </button>
      </div>
    )
  }

  // Full Studio Toolbar (used at top of modal or in full view)
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-2 shadow-lg',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {onOpenEdit && (
          <button
            type="button"
            onClick={onOpenEdit}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:bg-accent/10 transition-colors"
          >
            <Wand2 className="size-3.5 text-accent" />
            <span>Edit</span>
          </button>
        )}

        {onOpenRelight && (
          <button
            type="button"
            onClick={onOpenRelight}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:bg-accent/10 transition-colors"
          >
            <Lightbulb className="size-3.5 text-amber-400" />
            <span>Relight</span>
          </button>
        )}

        {onOpenEnhance && (
          <button
            type="button"
            onClick={onOpenEnhance}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:bg-accent/10 transition-colors"
          >
            <Zap className="size-3.5 text-accent" />
            <span>HyperReal</span>
          </button>
        )}

        {onOpenCloseups && (
          <button
            type="button"
            onClick={onOpenCloseups}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:bg-accent/10 transition-colors"
          >
            <Focus className="size-3.5 text-emerald-400" />
            <span>Close-Ups</span>
          </button>
        )}

        {onOpenFlythrough && (
          <button
            type="button"
            onClick={onOpenFlythrough}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:bg-accent/10 transition-colors"
          >
            <Film className="size-3.5 text-purple-400" />
            <span>Flythrough</span>
          </button>
        )}

        {onOpenCompare && (
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:bg-accent/10 transition-colors"
          >
            <SlidersHorizontal className="size-3.5 text-sky-400" />
            <span>Compare</span>
          </button>
        )}

        {onOpen3DView && (
          <button
            type="button"
            onClick={onOpen3DView}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            <Box className="size-3.5 text-emerald-400" />
            <span>View in 3D</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDefaultDownload}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:bg-accent/10 transition-colors"
        >
          <Download className="size-3.5 text-muted" />
          <span>Download</span>
        </button>
      </div>
    </div>
  )
}
