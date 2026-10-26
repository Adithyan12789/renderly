import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ImageMagnifierProps {
  src: string
  alt: string
  objectFit?: 'contain' | 'cover'
  magnifierEnabled?: boolean
  magnification?: number
  lensSize?: number
  className?: string
  zoom?: number
  pan?: { x: number; y: number }
}

export function ImageMagnifier({
  src,
  alt,
  objectFit = 'contain',
  magnifierEnabled = true,
  magnification = 0.5,
  lensSize = 210,
  className,
  zoom = 1,
  pan = { x: 0, y: 0 },
}: ImageMagnifierProps) {
  const resolvedSrc = resolveImageUrl(src)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [isHovered, setIsHovered] = useState(false)
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 })
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 })
  const [bgSize, setBgSize] = useState({ width: 0, height: 0 })

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!magnifierEnabled || zoom > 1) {
      if (isHovered) setIsHovered(false)
      return
    }

    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return

    const containerRect = container.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()

    const clientX = e.clientX
    const clientY = e.clientY

    // Compute actual rendered bounds of the image when object-contain is active
    let renderWidth = imgRect.width
    let renderHeight = imgRect.height
    let renderLeft = imgRect.left
    let renderTop = imgRect.top

    if (objectFit === 'contain') {
      const naturalRatio = img.naturalWidth / img.naturalHeight
      const elementRatio = imgRect.width / imgRect.height

      if (elementRatio > naturalRatio) {
        renderWidth = imgRect.height * naturalRatio
        renderLeft = imgRect.left + (imgRect.width - renderWidth) / 2
      } else {
        renderHeight = imgRect.width / naturalRatio
        renderTop = imgRect.top + (imgRect.height - renderHeight) / 2
      }
    }

    // Check if mouse is actually over the rendered image itself
    if (
      clientX < renderLeft ||
      clientX > renderLeft + renderWidth ||
      clientY < renderTop ||
      clientY > renderTop + renderHeight
    ) {
      setIsHovered(false)
      return
    }

    setIsHovered(true)

    // Position of the lens center relative to the container
    const lensX = clientX - containerRect.left
    const lensY = clientY - containerRect.top
    setLensPos({ x: lensX, y: lensY })

    // Position relative to the actual visible image
    const imgRelX = clientX - renderLeft
    const imgRelY = clientY - renderTop

    // Calculate background position so the point under the cursor is centered in the lens
    const bgX = Math.round(-(imgRelX * magnification - lensSize / 2))
    const bgY = Math.round(-(imgRelY * magnification - lensSize / 2))

    setBgPos({ x: bgX, y: bgY })
    setBgSize({
      width: Math.round(renderWidth * magnification),
      height: Math.round(renderHeight * magnification),
    })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Hide magnifier if zoom is engaged
  useEffect(() => {
    if (zoom > 1) {
      setIsHovered(false)
    }
  }, [zoom])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative size-full select-none overflow-hidden flex items-center justify-center bg-black',
        magnifierEnabled && zoom === 1 ? 'cursor-crosshair' : 'cursor-default',
        className,
      )}
    >
      {/* The Base Image */}
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={alt}
        className={cn(
          'size-full transition-transform duration-100 ease-out select-none pointer-events-auto',
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

      {/* Interactive Magnifying Glass Loupe */}
      {magnifierEnabled && isHovered && zoom === 1 && (
        <div
          id="magnifier-loupe"
          className="pointer-events-none absolute z-40 rounded-full border-2 border-accent shadow-[0_0_25px_rgba(245,158,11,0.4),0_15px_35px_rgba(0,0,0,0.9)] overflow-hidden transition-transform duration-75 ease-out"
          style={{
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            left: `${Math.round(lensPos.x - lensSize / 2)}px`,
            top: `${Math.round(lensPos.y - lensSize / 2)}px`,
            backgroundImage: `url("${resolvedSrc}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${bgSize.width}px ${bgSize.height}px`,
            backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
          }}
        >
          {/* Circular Glass Specular Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 rounded-full pointer-events-none" />

          {/* Precision Target Crosshair Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-2 rounded-full border border-white/80 bg-accent/60 shadow-sm" />
            <div className="absolute h-px w-4 bg-white/40" />
            <div className="absolute w-px h-4 bg-white/40" />
          </div>

          {/* Magnification Badge */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/85 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-accent backdrop-blur-md border border-accent/40 shadow-md">
            {magnification}x LOUPE
          </div>
        </div>
      )}
    </div>
  )
}
