import {
  Camera,
  Download,
  Film,
  Folder,
  FolderPlus,
  Loader2,
  Orbit,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Video,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CreateProjectModal } from '@/components/app/create-project-modal'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { resolveImageUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { Project, Render } from '@/types'

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
]

export function WalkthroughsPage() {
  const [renders, setRenders] = useState<Render[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [selectedRender, setSelectedRender] = useState<Render | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Motion Settings
  const [selectedPath, setSelectedPath] = useState<CameraPath>('push-in')
  const [durationSec, setDurationSec] = useState<number>(8)
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('16:9')
  const [enableParticles, setEnableParticles] = useState(true)
  const [enableSunFlare, setEnableSunFlare] = useState(true)

  // Playback
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportQuality, setExportQuality] = useState<'1080p' | '4k' | '720p'>('1080p')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }>>([])

  // Load Projects & Renders
  useEffect(() => {
    let mounted = true
    Promise.all([projectsService.list(), rendersService.list()])
      .then(([projectsData, rendersData]) => {
        if (!mounted) return
        setProjects(projectsData || [])
        setRenders(rendersData || [])
        if (projectsData && projectsData.length > 0) {
          const initialProjectId = projectsData[0].id
          setSelectedProjectId(initialProjectId)
          const matchedRenders = (rendersData || []).filter((r) => r.projectId === initialProjectId)
          if (matchedRenders.length > 0) {
            setSelectedRender(matchedRenders[0])
          } else if (rendersData && rendersData.length > 0) {
            setSelectedRender(rendersData[0])
          }
        }
      })
      .catch((err) => console.error('Failed to load data for walkthroughs:', err))
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Initialize Particles
  useEffect(() => {
    const particles = []
    for (let i = 0; i < 40; i++) {
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

  // Load Selected Image
  useEffect(() => {
    if (!selectedRender) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = resolveImageUrl(selectedRender.imageUrl)
    img.onload = () => {
      imageRef.current = img
      startTimeRef.current = performance.now()
      setIsPlaying(true)
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [selectedRender])

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) return

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

      drawFrame(canvas, img, progress, selectedPath, aspectMode, enableParticles, enableSunFlare)

      animationFrameRef.current = requestAnimationFrame(renderFrame)
    }

    animationFrameRef.current = requestAnimationFrame(renderFrame)

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isPlaying, durationSec, selectedPath, aspectMode, enableParticles, enableSunFlare])

  function drawFrame(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    progress: number,
    path: CameraPath,
    aspect: AspectRatioMode,
    particles: boolean,
    sunFlare: boolean,
    quality: '1080p' | '4k' | '720p' = '1080p',
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const baseWidth = quality === '4k' ? 3840 : quality === '720p' ? 1280 : 1920
    const targetWidth = baseWidth
    const targetHeight =
      aspect === '2.39:1'
        ? Math.round(targetWidth / 2.39)
        : aspect === '9:16'
        ? Math.round((targetWidth * 16) / 9)
        : Math.round((targetWidth * 9) / 16)
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const ease = 0.5 - Math.cos(progress * Math.PI) / 2

    let scale = 1.0
    let transX = 0
    let transY = 0
    let rotate = 0

    switch (path) {
      case 'push-in':
        scale = 1.05 + ease * 0.18
        transX = (ease - 0.5) * -40
        transY = (ease - 0.5) * -20
        break
      case 'orbit':
        scale = 1.12 + Math.sin(ease * Math.PI) * 0.06
        transX = (ease - 0.5) * 120
        transY = (ease - 0.5) * 30
        rotate = (ease - 0.5) * 0.015
        break
      case 'crane-rise':
        scale = 1.1 + ease * 0.08
        transY = (0.5 - ease) * 110
        transX = (ease - 0.5) * 25
        break
      case 'dolly-zoom':
        scale = 1.02 + ease * 0.22
        transY = (ease - 0.5) * 35
        break
    }

    ctx.save()
    ctx.translate(canvas.width / 2 + transX, canvas.height / 2 + transY)
    ctx.rotate(rotate)
    ctx.scale(scale, scale)

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

    if (particles && particlesRef.current.length > 0) {
      for (const p of particlesRef.current) {
        p.x = (p.x + p.speedX + 1) % 1
        p.y = (p.y + p.speedY + 1) % 1
        ctx.beginPath()
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 240, 210, ${p.opacity * (0.4 + ease * 0.3)})`
        ctx.fill()
      }
    }

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

  async function handleExportVideo() {
    if (!selectedProjectId) {
      toast.error('A project is required to export a flythrough walkthrough. Please select or create a project first.', 'Project Required')
      setIsCreateProjectOpen(true)
      return
    }

    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !selectedRender) {
      toast.error('Please select a render from this project to animate.')
      return
    }

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
        a.download = `renderly-flythrough-${exportQuality.toUpperCase()}-${selectedPath}-${selectedRender.id}.webm`
        a.click()
        URL.revokeObjectURL(url)
        setIsExporting(false)
        setIsPlaying(true)
        toast.success(
          `Cinematic flythrough video (${exportQuality.toUpperCase()}) exported successfully!`,
          'Video Exported',
        )
      }

      mediaRecorder.start()

      const totalFrames = durationSec * 60
      let frame = 0

      const exportStep = () => {
        if (frame >= totalFrames) {
          mediaRecorder.stop()
          return
        }

        const progress = frame / totalFrames
        drawFrame(canvas, img, progress, selectedPath, aspectMode, enableParticles, enableSunFlare, exportQuality)
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

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    const matchingRenders = renders.filter((r) => r.projectId === projectId)
    if (matchingRenders.length > 0) {
      setSelectedRender(matchingRenders[0])
    } else {
      setSelectedRender(null)
    }
  }

  const matchedProject = projects.find((p) => p.id === selectedProjectId)
  const projectRenders = selectedProjectId
    ? renders.filter((r) => r.projectId === selectedProjectId)
    : []

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cinematic Walkthroughs & Flythroughs"
        description="Transform your architectural visualizations into smooth 60fps drone flythroughs, crane sweeps, and client presentation videos (Vibe3D engine)."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted">
          <Loader2 className="size-8 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="Create a project to generate flythroughs"
          description="Cinematic flythrough walkthroughs must belong to an architectural project. Create your first project to get started."
          action={
            <Button onClick={() => setIsCreateProjectOpen(true)}>
              <Plus className="size-4" /> Create First Project
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active Project Selector Bar (Required) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent border border-accent/20">
                <Folder className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Project: {matchedProject?.name || 'Select Project'}
                  </span>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                    Required
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Cinematic flythrough walkthroughs and exports are tied to your active project.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="h-10 min-w-[200px] rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.type})
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateProjectOpen(true)}
                className="gap-1.5 h-10 px-3.5 shrink-0"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Project</span>
              </Button>
            </div>
          </div>

          {projectRenders.length === 0 ? (
            <EmptyState
              icon={Film}
              title={`No renders in "${matchedProject?.name || 'this project'}" yet`}
              description="Upload a 3D model viewport capture and synthesize renders for this project in Render Studio before generating flythroughs."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link to={`/app/exterior?projectId=${selectedProjectId}`}>
                    <Button size="sm">Go to Exterior Studio</Button>
                  </Link>
                  <Link to={`/app/interior?projectId=${selectedProjectId}`}>
                    <Button size="sm" variant="outline">Go to Interior Studio</Button>
                  </Link>
                </div>
              }
            />
          ) : (
        <div className="flex flex-col gap-8">
          {/* Main Stage & Studio Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Canvas Video Player */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center bg-black/80 rounded-2xl border border-border p-5 gap-4">
                <div
                  className={cn(
                    'relative w-full overflow-hidden rounded-xl border border-border bg-black shadow-2xl transition-all',
                    aspectMode === '2.39:1' ? 'aspect-[2.39/1]' : aspectMode === '9:16' ? 'aspect-[9/16] max-h-[55vh]' : 'aspect-[16/9]',
                  )}
                >
                  <canvas ref={canvasRef} className="size-full object-contain" />

                  <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/15 uppercase">
                      <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                      <span>Cinematic 60FPS</span>
                    </span>
                    <span className="rounded-full bg-accent/80 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md uppercase">
                      {selectedPath.replace('-', ' ')}
                    </span>
                  </div>

                  {isExporting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm gap-3 p-6 text-center">
                      <Loader2 className="size-8 text-accent animate-spin" />
                      <p className="text-sm font-semibold text-white">
                        Encoding {exportQuality === '4k' ? 'Ultra HD 4K (3840×2160)' : exportQuality === '1080p' ? 'Full HD 1080p' : 'HD 720p'} 60fps Video…
                      </p>
                      <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-150"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted">
                        {exportProgress}% rendered • {exportQuality.toUpperCase()} 60FPS
                      </span>
                    </div>
                  )}
                </div>

                {/* Timeline and Controls */}
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
                      onClick={() => {
                        startTimeRef.current = performance.now()
                        setCurrentTime(0)
                        setIsPlaying(true)
                      }}
                      title="Replay from start"
                      className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                    <span className="text-xs font-mono text-muted pl-1">
                      00:0{Math.floor(currentTime)} / 00:0{durationSec}
                    </span>
                  </div>

                  <div className="flex-1 mx-2">
                    <div className="relative h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-75"
                        style={{ width: `${(currentTime / durationSec) * 100}%` }}
                      />
                    </div>
                  </div>

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

              {/* Right Settings Panel */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Flythrough Motion Choreography</h3>
                    <p className="text-xs text-muted">Select camera path and cinematic lighting dynamics</p>
                  </div>

                  {/* Camera Paths */}
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
                            <span className="text-xs font-semibold text-foreground">{path.label}</span>
                            <span className="text-[11px] text-muted leading-tight mt-0.5">{path.tagline}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <label className="text-xs font-medium text-foreground">Video Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[5, 8, 12].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setDurationSec(sec)}
                          className={cn(
                            'py-1.5 text-xs font-medium rounded-xl border transition-colors',
                            durationSec === sec
                              ? 'border-accent bg-accent/15 text-foreground font-semibold'
                              : 'border-border bg-background text-muted hover:text-foreground',
                          )}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Atmosphere */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <label className="text-xs font-medium text-foreground">Atmospheric Realism</label>
                    <div className="flex flex-col gap-2 text-xs">
                      <label className="flex items-center justify-between text-muted cursor-pointer hover:text-foreground">
                        <span className="flex items-center gap-2">
                          <Sparkles className="size-3.5 text-amber-400" />
                          <span>Volumetric Sun Flare Sweep</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={enableSunFlare}
                          onChange={(e) => setEnableSunFlare(e.target.checked)}
                          className="size-4 rounded accent-accent"
                        />
                      </label>
                      <label className="flex items-center justify-between text-muted cursor-pointer hover:text-foreground">
                        <span className="flex items-center gap-2">
                          <Film className="size-3.5 text-accent" />
                          <span>Ambient Dust Particles</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={enableParticles}
                          onChange={(e) => setEnableParticles(e.target.checked)}
                          className="size-4 rounded accent-accent"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Video Export Quality Selector */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Export Resolution Quality</label>
                      <span className="text-[10px] text-accent font-bold uppercase">60 FPS Native</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '1080p', label: '1080p HD', desc: 'Full HD' },
                        { id: '4k', label: '4K Ultra HD', desc: 'Master' },
                        { id: '720p', label: '720p Fast', desc: 'Quick' },
                      ].map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setExportQuality(q.id as '1080p' | '4k' | '720p')}
                          className={cn(
                            'flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all',
                            exportQuality === q.id
                              ? 'border-accent bg-accent/15 text-foreground font-semibold ring-1 ring-accent'
                              : 'border-border bg-background text-muted hover:text-foreground',
                          )}
                        >
                          <span className="text-xs font-semibold">{q.label}</span>
                          <span className="text-[9px] text-muted">{q.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleExportVideo}
                  disabled={isExporting}
                  className="w-full shadow-lg shadow-accent/20 gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Exporting {exportQuality.toUpperCase()} {exportProgress}%
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      Export {exportQuality.toUpperCase()} 60FPS Video (WebM/MP4)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Select Render from Active Project Gallery */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight text-foreground">
                Select an Architectural Render to Animate
              </h3>
              <span className="text-xs text-muted">
                {projectRenders.length} {projectRenders.length === 1 ? 'render' : 'renders'} in this project
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {projectRenders.map((render) => {
                const isSelected = selectedRender?.id === render.id
                return (
                  <button
                    key={render.id}
                    type="button"
                    onClick={() => setSelectedRender(render)}
                    className={cn(
                      'group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all',
                      isSelected
                        ? 'border-accent ring-2 ring-accent shadow-xl shadow-accent/10'
                        : 'border-border bg-surface hover:border-border-strong',
                    )}
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-black">
                      <img
                        src={resolveImageUrl(render.imageUrl)}
                        alt={render.prompt}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-xs font-semibold text-foreground">{render.prompt}</p>
                      <p className="text-[10px] text-muted capitalize mt-0.5">
                        {render.style.replace('-', ' ')} · {render.lighting?.replace('-', ' ') || 'Golden hour'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSuccess={(newProj) => {
          setProjects((prev) => [newProj, ...prev])
          handleSelectProject(newProj.id)
        }}
        title="Create Project for Flythrough"
        description="Flythrough motion walkthroughs must be linked to a project for organization and presentation exports."
      />
    </div>
  )
}
