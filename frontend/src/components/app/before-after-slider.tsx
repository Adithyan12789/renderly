import { Columns2, Eye, EyeOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
  aspectClass?: string
  className?: string
  showControls?: boolean
  showLabels?: boolean
  initialSliderPosition?: number
  objectFit?: 'cover' | 'contain'
  zoom?: number
  pan?: { x: number; y: number }
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

type ViewMode = 'split' | 'rendered' | 'original'

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = '3D Model Viewport',
  afterLabel = 'Photorealistic Render',
  aspectClass = 'aspect-[16/9]',
  className,
  showControls = false,
  showLabels = false,
  initialSliderPosition = 50,
  objectFit = 'cover',
  zoom = 1,
  pan = { x: 0, y: 0 },
  viewMode: controlledViewMode,
  onViewModeChange,
}: BeforeAfterSliderProps) {
  const resolvedBeforeSrc = resolveImageUrl(beforeSrc)
  const resolvedAfterSrc = resolveImageUrl(afterSrc)
  const [sliderPos, setSliderPos] = useState(initialSliderPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('split')
  const viewMode = controlledViewMode ?? internalViewMode
  const containerRef = useRef<HTMLDivElement>(null)

  const setViewMode = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode)
    } else {
      setInternalViewMode(mode)
    }
  }

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPos(percent)
  }, [])

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    handleMove(e.clientX)
  }

  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true)
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX)
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: globalThis.MouseEvent) => {
      handleMove(e.clientX)
    }
    const onTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX)
      }
    }
    const onStop = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onStop)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onStop)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onStop)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onStop)
    }
  }, [isDragging, handleMove])

  return (
    <div className={cn('relative flex flex-col gap-2', className)}>
      {/* View Mode Controls */}
      {showControls && (
        <div className="flex items-center justify-end px-1">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background/80 p-0.5 text-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'split'
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-muted hover:text-foreground',
              )}
            >
              <Columns2 className="size-3" />
              <span>Split Slider</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('rendered')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'rendered'
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-muted hover:text-foreground',
              )}
            >
              <Eye className="size-3" />
              <span>Render</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'original'
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-muted hover:text-foreground',
              )}
            >
              <EyeOff className="size-3" />
              <span>Original Model</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <div
        ref={containerRef}
        onMouseDown={viewMode === 'split' ? handleMouseDown : undefined}
        onTouchStart={viewMode === 'split' ? handleTouchStart : undefined}
        className={cn(
          'group relative select-none overflow-hidden rounded-2xl border border-border bg-black',
          aspectClass,
          viewMode === 'split' ? 'cursor-ew-resize' : 'cursor-default',
        )}
      >
        {/* Under layer: The Uploaded Model / Original Viewport */}
        {(viewMode === 'split' || viewMode === 'original') && (
          <div className="absolute inset-0 size-full overflow-hidden">
            <img
              src={resolvedBeforeSrc}
              alt={beforeLabel}
              className={cn(
                'size-full transition-transform duration-100 ease-out',
                objectFit === 'contain' ? 'object-contain' : 'object-cover',
              )}
              style={
                zoom !== 1 || pan.x !== 0 || pan.y !== 0
                  ? {
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: 'center center',
                    }
                  : undefined
              }
              draggable={false}
            />
            {showLabels && (
              <div className="absolute top-3 left-3 pointer-events-none z-10">
                <span className="rounded-full bg-black/75 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md border border-white/10 uppercase shadow-md">
                  {beforeLabel}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Over layer: The Photorealistic Render with clip-path */}
        {(viewMode === 'split' || viewMode === 'rendered') && (
          <div
            className="absolute inset-0 size-full overflow-hidden transition-[clip-path] duration-75"
            style={
              viewMode === 'split'
                ? { clipPath: `inset(0 0 0 ${sliderPos}%)` }
                : { clipPath: 'inset(0 0 0 0)' }
            }
          >
            <img
              src={resolvedAfterSrc}
              alt={afterLabel}
              className={cn(
                'size-full transition-transform duration-100 ease-out',
                objectFit === 'contain' ? 'object-contain' : 'object-cover',
              )}
              style={
                zoom !== 1 || pan.x !== 0 || pan.y !== 0
                  ? {
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: 'center center',
                    }
                  : undefined
              }
              draggable={false}
            />
            {showLabels && (
              <div className="absolute top-3 right-3 pointer-events-none z-10">
                <span className="rounded-full bg-accent/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-md border border-white/20 uppercase shadow-md shadow-accent/20">
                  {afterLabel}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Split Divider & Drag Handle */}
        {viewMode === 'split' && (
          <div
            className="pointer-events-none absolute inset-y-0 z-20 flex items-center justify-center -ml-px"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Divider Line */}
            <div className="h-full w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

            {/* Glowing Grab Handle */}
            <div className="absolute flex size-9 items-center justify-center rounded-full border-2 border-white bg-black/80 text-white shadow-2xl backdrop-blur-md transition-transform group-hover:scale-110">
              <Columns2 className="size-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
