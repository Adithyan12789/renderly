import {
  Camera,
  Check,
  Download,
  Eye,
  Film,
  Folder,
  Loader2,
  Orbit,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CreateProjectModal } from '@/components/app/create-project-modal'
import { Button } from '@/components/ui/button'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { Project, Render } from '@/types'

interface CinematicFlythroughModalProps {
  render: Render
  isOpen: boolean
  onClose: () => void
}

type CameraPath = 'push-in' | 'orbit' | 'crane-rise' | 'dolly-zoom' | 'lateral-pan'
type AspectRatioMode = '16:9' | '2.39:1' | '9:16'

interface CameraPathOption {
  id: CameraPath
  label: string
  tagline: string
  icon: typeof Orbit
}

const CAMERA_PATHS: CameraPathOption[] = [
  { id: 'push-in', label: 'Push-In Walkthrough', tagline: 'Slow dramatic forward glide into the entryway', icon: Camera },
  { id: 'orbit', label: 'Drone Orbit & Pan', tagline: 'Curved panoramic orbit with parallax depth', icon: Orbit },
  { id: 'crane-rise', label: 'Cantilever Crane Boom', tagline: 'Vertical rise from ground over the roofline', icon: Video },
  { id: 'dolly-zoom', label: 'Parallax Dolly Zoom', tagline: '2.5D optical focal length perspective shift', icon: Film },
  { id: 'lateral-pan', label: 'Architectural Tracking', tagline: 'Smooth horizontal glide across the facade', icon: Eye },
]

export function CinematicFlythroughModal({ render, isOpen, onClose }: CinematicFlythroughModalProps) {
  const [selectedPath, setSelectedPath] = useState<CameraPath>('push-in')
  const [durationSec, setDurationSec] = useState<number>(8)
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('16:9')
  const [enableParticles, setEnableParticles] = useState(true)
  const [enableSunFlare, setEnableSunFlare] = useState(true)

  // Playback State
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportQuality, setExportQuality] = useState<'1080p' | '4k' | '720p'>('1080p')

  // Project state (Required for flythrough)
  const [projects, setProjects] = useState<Project[]>([])
  const [assignedProjectId, setAssignedProjectId] = useState<string>(render.projectId || '')
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)

  // Load projects if render has no project
  useEffect(() => {
    if (!isOpen || render.projectId) return
    projectsService
      .list()
      .then((data) => {
        setProjects(data || [])
        if (data && data.length > 0 && !assignedProjectId) {
          setAssignedProjectId(data[0].id)
        }
      })
      .catch(console.error)
  }, [isOpen, render.projectId])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }>>([])

  // Initialize Particles
  useEffect(() => {
    const particles = []
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.001,
        speedY: -Math.random() * 0.001 - 0.0005,
        opacity: Math.random() * 0.7 + 0.2,
      })
    }
    particlesRef.current = particles
  }, [])

  // Load Image
  useEffect(() => {
    if (!isOpen) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = resolveImageUrl(render.imageUrl)
    img.onload = () => {
      imageRef.current = img
      startTimeRef.current = performance.now()
      setIsPlaying(true)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isOpen, render.imageUrl])

  // Animation Loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return

    const renderFrame = (timestamp: number) => {
      const canvas = canvasRef.current
      const img = imageRef.current
      if (!canvas || !img) {
        animationFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000
      const progress = (elapsed % durationSec) / durationSec
      setCurrentTime(elapsed % durationSec)

      drawCinematicFrame(canvas, img, progress, selectedPath, aspectMode, enableParticles, enableSunFlare, exportQuality)

      animationFrameRef.current = requestAnimationFrame(renderFrame)
    }

    animationFrameRef.current = requestAnimationFrame(renderFrame)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isOpen, isPlaying, durationSec, selectedPath, aspectMode, enableParticles, enableSunFlare, exportQuality])

  function drawCinematicFrame(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    progress: number, // 0 to 1
    path: CameraPath,
    aspect: AspectRatioMode,
    particles: boolean,
    sunFlare: boolean,
    quality: '1080p' | '4k' | '720p' = '1080p',
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas internal resolution based on selected quality
    const baseWidth = quality === '4k' ? 3840 : quality === '720p' ? 1280 : 1920
    const targetWidth = baseWidth
    const targetHeight =
      aspect === '2.39:1'
        ? Math.round(baseWidth / 2.39)
        : aspect === '9:16'
        ? Math.round((baseWidth * 16) / 9)
        : Math.round((baseWidth * 9) / 16)
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Smooth Bezier Ease In Out curve
    const ease = 0.5 - Math.cos(progress * Math.PI) / 2

    // Calculate Camera Transformations based on Path
    let scale = 1.0
    let transX = 0
    let transY = 0
    let rotate = 0

    switch (path) {
      case 'push-in':
        // Slow cinematic forward zoom into the facade
        scale = 1.05 + ease * 0.18
        transX = (ease - 0.5) * -40
        transY = (ease - 0.5) * -20
        break

      case 'orbit':
        // Rotational panoramic sweep
        scale = 1.12 + Math.sin(ease * Math.PI) * 0.06
        transX = (ease - 0.5) * 120
        transY = (ease - 0.5) * 30
        rotate = (ease - 0.5) * 0.015
        break

      case 'crane-rise':
        // Low to high vertical boom rise
        scale = 1.1 + ease * 0.08
        transY = (0.5 - ease) * 110
        transX = (ease - 0.5) * 25
        break

      case 'dolly-zoom':
        // Vertigo optical compression
        scale = 1.02 + ease * 0.22
        transY = (ease - 0.5) * 35
        break

      case 'lateral-pan':
        // Architectural tracking pan
        scale = 1.14
        transX = (0.5 - ease) * 160
        transY = 0
        break
    }

    // Apply Transformation Matrix
    ctx.save()
    ctx.translate(canvas.width / 2 + transX, canvas.height / 2 + transY)
    ctx.rotate(rotate)
    ctx.scale(scale, scale)

    // Draw Source Image fitted to cover
    const imgRatio = img.naturalWidth / img.naturalHeight
    const canvasRatio = canvas.width / canvas.height
    let drawW = canvas.width
    let drawH = canvas.height

    if (imgRatio > canvasRatio) {
      drawH = canvas.height
      drawW = canvas.height * imgRatio
    } else {
      drawW = canvas.width
      drawH = canvas.width / imgRatio
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()

    // 1. Volumetric Sun Flare / Light Sweep
    if (sunFlare) {
      const flareX = canvas.width * (0.2 + ease * 0.6)
      const flareY = canvas.height * (0.15 + ease * 0.2)
      const flareRadius = canvas.width * 0.45

      const flareGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, flareRadius)
      flareGrad.addColorStop(0, 'rgba(255, 235, 180, 0.32)')
      flareGrad.addColorStop(0.3, 'rgba(255, 180, 100, 0.15)')
      flareGrad.addColorStop(0.7, 'rgba(255, 140, 50, 0.04)')
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = flareGrad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 2. Ambient Micro Particles / Dust Motes
    if (particles && particlesRef.current.length > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      for (const p of particlesRef.current) {
        p.x = (p.x + p.speedX + 1) % 1
        p.y = (p.y + p.speedY + 1) % 1
        const px = p.x * canvas.width
        const py = p.y * canvas.height

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 240, 210, ${p.opacity * (0.4 + ease * 0.3)})`
        ctx.fill()
      }
    }

    // 3. Cinematic Letterbox & Vignette
    const vigGrad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.35,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.75,
    )
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)')
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vigGrad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Export Flythrough Video (Browser native MediaRecorder)
  async function handleExportVideo() {
    const finalProjectId = render.projectId || assignedProjectId
    if (!finalProjectId) {
      toast.error('A project is required to export this flythrough. Please select or create a project first.', 'Project Required')
      setIsCreateProjectOpen(true)
      return
    }

    if (!render.projectId && assignedProjectId) {
      rendersService.update(render.id, { projectId: assignedProjectId }).catch(console.error)
    }

    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    try {
      setIsExporting(true)
      setIsPlaying(false)
      setExportProgress(0)

      const stream = canvas.captureStream(60)
      const mimeTypes = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
      const chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm'

      const bitrate =
        exportQuality === '4k'
          ? 35_000_000
          : exportQuality === '720p'
          ? 8_000_000
          : 16_000_000

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: chosenMime,
        videoBitsPerSecond: bitrate,
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: chosenMime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `renderly-flythrough-${exportQuality.toUpperCase()}-${selectedPath}-${render.id}.webm`
        a.click()
        URL.revokeObjectURL(url)
        setIsExporting(false)
        setIsPlaying(true)
        toast.success(`Cinematic flythrough (${exportQuality.toUpperCase()}) exported successfully!`, 'Video Exported')
      }

      mediaRecorder.start()

      // Render exactly the frames for durationSec at 60fps
      const totalFrames = durationSec * 60
      let frame = 0

      const exportStep = () => {
        if (frame >= totalFrames) {
          mediaRecorder.stop()
          return
        }

        const progress = frame / totalFrames
        drawCinematicFrame(
          canvas,
          img,
          progress,
          selectedPath,
          aspectMode,
          enableParticles,
          enableSunFlare,
          exportQuality,
        )
        setExportProgress(Math.round(progress * 100))
        frame++

        setTimeout(exportStep, 1000 / 60)
      }

      exportStep()
    } catch (err) {
      console.error('Video export error:', err)
      toast.error('Failed to export video in browser.')
      setIsExporting(false)
      setIsPlaying(true)
    }
  }

  function handleTogglePlay() {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      startTimeRef.current = performance.now() - currentTime * 1000
      setIsPlaying(true)
    }
  }

  function handleRestart() {
    startTimeRef.current = performance.now()
    setCurrentTime(0)
    setIsPlaying(true)
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
              <Film className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Vibe3D Cinematic Flythrough Studio</h2>
              <p className="text-xs text-muted">Transform still architectural renders into cinematic 3D motion walkthroughs</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Main Stage Canvas Player */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-black/80 p-4 sm:p-5 gap-3 max-h-[72vh]">
            <div
              className={cn(
                'relative flex items-center justify-center w-full max-h-[56vh] overflow-hidden rounded-2xl border border-border bg-black shadow-2xl transition-all',
                aspectMode === '2.39:1' ? 'aspect-[2.39/1]' : aspectMode === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]',
              )}
            >
              <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />

              {/* Top Status Overlays */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                <span className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/15 uppercase">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <span>
                    {exportQuality === '4k'
                      ? 'Ultra HD 4K · 60FPS'
                      : exportQuality === '720p'
                      ? 'HD 720p · 60FPS'
                      : 'Full HD 1080p · 60FPS'}
                  </span>
                </span>
                <span className="rounded-full bg-accent/80 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md uppercase">
                  {selectedPath.replace('-', ' ')}
                </span>
              </div>

              {/* Exporting Progress Overlay */}
              {isExporting && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-3 p-6 text-center">
                  <Loader2 className="size-8 text-accent animate-spin" />
                  <p className="text-sm font-semibold text-white">Rendering & Exporting Cinematic Video…</p>
                  <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{exportProgress}% completed (encoding frames)</span>
                </div>
              )}
            </div>

            {/* Playback Controls Bar */}
            <div className="flex w-full items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-2.5 backdrop-blur-md gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="grid size-8 place-items-center rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  title="Replay from start"
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-foreground transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <span className="text-xs font-mono text-muted pl-1">
                  00:0{Math.floor(currentTime)} / 00:0{durationSec}
                </span>
              </div>

              {/* Progress Track */}
              <div className="flex-1 mx-2">
                <div className="relative h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-75"
                    style={{ width: `${(currentTime / durationSec) * 100}%` }}
                  />
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5 text-xs">
                {(['16:9', '2.39:1', '9:16'] as AspectRatioMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAspectMode(mode)}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors',
                      aspectMode === mode ? 'bg-accent text-white' : 'text-muted hover:text-foreground',
                    )}
                  >
                    {mode === '2.39:1' ? 'Cinemascope' : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border bg-surface p-6 gap-6">
            <div className="flex flex-col gap-5">
              {/* Camera Movement Paths */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Camera Motion Path
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {CAMERA_PATHS.map((path) => {
                    const isSelected = selectedPath === path.id
                    const Icon = path.icon
                    return (
                      <button
                        key={path.id}
                        type="button"
                        onClick={() => setSelectedPath(path.id)}
                        className={cn(
                          'group flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                          isSelected
                            ? 'border-accent bg-accent/15 ring-1 ring-accent'
                            : 'border-border bg-background hover:border-border-strong hover:bg-background/80',
                        )}
                      >
                        <div
                          className={cn(
                            'grid size-8 shrink-0 place-items-center rounded-lg mt-0.5',
                            isSelected ? 'bg-accent text-white' : 'bg-surface text-muted group-hover:text-foreground',
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">{path.label}</span>
                            {isSelected && <Check className="size-3 text-accent shrink-0" />}
                          </div>
                          <span className="text-[11px] text-muted leading-tight mt-0.5">{path.tagline}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Export Resolution Quality */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Export Resolution Quality
                  </label>
                  <span className="text-[10px] font-bold text-accent uppercase">
                    {exportQuality === '4k' ? 'Ultra HD 4K' : exportQuality === '1080p' ? 'Full HD 1080p' : '720p Fast'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1080p', label: '1080p HD', sub: 'High Fidelity' },
                    { id: '4k', label: '4K Ultra HD', sub: 'Cinema Master' },
                    { id: '720p', label: '720p Fast', sub: 'Quick Share' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setExportQuality(q.id as '1080p' | '4k' | '720p')}
                      className={cn(
                        'flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all',
                        exportQuality === q.id
                          ? 'border-accent bg-accent/15 text-foreground font-semibold shadow-sm ring-1 ring-accent'
                          : 'border-border bg-background text-muted hover:text-foreground hover:border-border-strong',
                      )}
                    >
                      <span className="text-xs font-semibold">{q.label}</span>
                      <span className="text-[9px] text-muted">{q.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Control */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Flythrough Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 12].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSec(sec)}
                      className={cn(
                        'py-2 text-xs font-medium rounded-xl border transition-colors',
                        durationSec === sec
                          ? 'border-accent bg-accent/15 text-foreground font-semibold'
                          : 'border-border bg-background text-muted hover:text-foreground',
                      )}
                    >
                      {sec} Seconds
                    </button>
                  ))}
                </div>
              </div>

              {/* Atmosphere Effects Toggles */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Atmospheric Realism
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-amber-400" />
                      <span>Volumetric Sun Flare & Light Sweep</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enableSunFlare}
                      onChange={(e) => setEnableSunFlare(e.target.checked)}
                      className="size-4 rounded border-border bg-background text-accent accent-accent"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Film className="size-3.5 text-accent" />
                      <span>Ambient Micro Dust Particles</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enableParticles}
                      onChange={(e) => setEnableParticles(e.target.checked)}
                      className="size-4 rounded border-border bg-background text-accent accent-accent"
                    />
                  </label>
                </div>
              </div>
            </div>

              {!render.projectId && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Folder className="size-3.5 text-accent" />
                      <span>Assign to Project</span>
                      <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent uppercase">
                        Required
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="text-[11px] text-accent hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <Plus className="size-3" /> New
                    </button>
                  </div>
                  <select
                    value={assignedProjectId}
                    onChange={(e) => setAssignedProjectId(e.target.value)}
                    className="h-8.5 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
                  >
                    <option value="" disabled>Select a project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>

              <Button
                onClick={handleExportVideo}
                disabled={isExporting}
                className="shadow-lg shadow-accent/20"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Exporting {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Export Video (MP4 / WebM)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSuccess={(newProj) => {
          setProjects((prev) => [newProj, ...prev])
          setAssignedProjectId(newProj.id)
        }}
        title="Create Project for Flythrough"
        description="Flythrough videos must be associated with an architectural project for organization."
      />
    </div>
  )
}
