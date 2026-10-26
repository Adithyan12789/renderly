import {
  ArrowLeft,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Film,
  Focus,
  Folder,
  Layers,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Wand2,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CinematicFlythroughModal } from '@/components/app/cinematic-flythrough-modal'
import { CloseupsModal } from '@/components/app/closeups-modal'
import { HyperRealEnhanceModal } from '@/components/app/hyperreal-enhance-modal'
import { ImageMagnifier } from '@/components/app/image-magnifier'
import { RelightModal } from '@/components/app/relight-modal'
import { RenderEditModal } from '@/components/app/render-edit-modal'
import { Button, buttonVariants } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { resolveImageUrl } from '@/lib/api'
import { ARCHITECTURAL_STYLES, LIGHTING_PRESETS } from '@/lib/site-content'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { Project, Render } from '@/types'

export function RenderStudioPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [render, setRender] = useState<Render | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [versions, setVersions] = useState<Render[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Render | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Full-Screen Theater & Zoom Viewport State
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('contain')
  const [isMagnifierActive, setIsMagnifierActive] = useState(true)
  const [magnification, setMagnification] = useState(0.5)
  const [viewingOriginalModel, setViewingOriginalModel] = useState(false)

  const MAGNIFICATION_LEVELS = [0.5, 1.0, 1.5, 2.0, 2.5, 4.0]
  const handleCycleMagnification = () => {
    const nextIdx = (MAGNIFICATION_LEVELS.indexOf(magnification) + 1) % MAGNIFICATION_LEVELS.length
    setMagnification(MAGNIFICATION_LEVELS[nextIdx] ?? 0.5)
  }

  // Edit Scene Metadata State
  const [isEditingScene, setIsEditingScene] = useState(false)
  const [editPrompt, setEditPrompt] = useState('')
  const [editProjectId, setEditProjectId] = useState<string>('')
  const [editStyle, setEditStyle] = useState<string>('')
  const [editLighting, setEditLighting] = useState<string>('')
  const [isSavingScene, setIsSavingScene] = useState(false)

  // Vibe3D Modals State
  const [isFlythroughOpen, setIsFlythroughOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRelightOpen, setIsRelightOpen] = useState(false)
  const [isCloseupsOpen, setIsCloseupsOpen] = useState(false)
  const [isEnhanceOpen, setIsEnhanceOpen] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Keyboard shortcut for Escape key in theater mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterMode) {
        setIsTheaterMode(false)
        setZoomLevel(1)
        setPanOffset({ x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTheaterMode])

  useEffect(() => {
    if (!id) return
    let mounted = true
    setIsLoading(true)

    Promise.all([rendersService.get(id), projectsService.list()])
      .then(async ([renderData, projectsList]) => {
        if (!mounted) return
        setRender(renderData)
        setSelectedVersion(renderData)
        setAllProjects(projectsList || [])
        setEditPrompt(renderData.prompt)
        setEditProjectId(renderData.projectId || '')
        setEditStyle(renderData.style)
        setEditLighting(renderData.lighting || 'golden-hour')

        // Fetch project if attached
        if (renderData.projectId) {
          const matchedProj = (projectsList || []).find((p) => p.id === renderData.projectId)
          if (matchedProj) {
            setProject(matchedProj)
          } else {
            projectsService
              .get(renderData.projectId)
              .then((p) => {
                if (mounted) setProject(p)
              })
              .catch(() => {})
          }
        }

        // Fetch all scene versions
        try {
          const versionsList = await rendersService.getVersions(renderData.id)
          if (mounted && versionsList && versionsList.length > 0) {
            setVersions(versionsList)
          } else if (mounted) {
            setVersions([renderData])
          }
        } catch {
          if (mounted) setVersions([renderData])
        }
      })
      .catch((err) => {
        console.error('Failed to load render:', err)
        toast.error('Render could not be found.')
        navigate('/app/renders')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id, navigate])

  async function handleSaveSceneDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRender || !editPrompt.trim()) return
    setIsSavingScene(true)
    try {
      const updated = await rendersService.update(activeRender.id, {
        prompt: editPrompt.trim(),
        projectId: editProjectId || null,
        style: editStyle,
        lighting: editLighting,
      })
      setRender(updated)
      setSelectedVersion(updated)
      setVersions((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
      if (editProjectId) {
        const found = allProjects.find((p) => p.id === editProjectId)
        setProject(found || null)
      } else {
        setProject(null)
      }
      setIsEditingScene(false)
      toast.success('Scene details saved successfully!')
    } catch (err) {
      console.error('Failed to save scene details:', err)
      toast.error('Failed to update scene details.')
    } finally {
      setIsSavingScene(false)
    }
  }

  const handleAddNewVersion = (newRender: Render) => {
    setVersions((prev) => [...prev, newRender])
    setSelectedVersion(newRender)
    setRender(newRender)
  }

  async function handleDeleteConfirm() {
    if (!activeRender) return
    setIsDeleting(true)
    try {
      await rendersService.delete(activeRender.id)
      toast.success('Render removed successfully.')
      navigate(project ? `/app/projects/${project.id}` : '/app/renders')
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Failed to delete render.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!render) return null

  const activeRender = selectedVersion || render
  const matchedStyle = ARCHITECTURAL_STYLES.find((s) => s.value === activeRender.style)

  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  const handleStageMouseUp = () => {
    setIsPanning(false)
  }

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.5, Math.round((z + 0.25) * 100) / 100))
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(1, Math.round((z - 0.25) * 100) / 100)
      if (next === 1) setPanOffset({ x: 0, y: 0 })
      return next
    })
  }
  const handleResetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header / Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5 text-xs text-muted">
          <Link
            to={project ? `/app/projects/${project.id}` : '/app/renders'}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-foreground hover:bg-surface-raised transition-colors shadow-sm"
          >
            <ArrowLeft className="size-3.5" />
            <span>{project ? project.name : 'Render Gallery'}</span>
          </Link>
          <ChevronRight className="size-3 text-muted/40" />
          <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
            {activeRender.prompt}
          </span>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/30">
            {activeRender.versionType || 'Render'}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted/70">
            <span>·</span>
            <span className="text-foreground/80">{matchedStyle?.label || activeRender.style}</span>
            <span>·</span>
            <span className="capitalize">{activeRender.lighting?.replace('-', ' ') || 'Golden hour'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {project && (
            <Link
              to={`/app/projects/${project.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5 text-xs' })}
            >
              <Folder className="size-3.5 text-accent" />
              <span>Project Workspace</span>
            </Link>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditingScene((prev) => !prev)}
            className="gap-1.5 text-xs"
          >
            <Edit3 className="size-3.5 text-accent" />
            <span>{isEditingScene ? 'Close Editor' : 'Edit Scene Details'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTheaterMode((prev) => !prev)}
            className="gap-1.5 text-xs text-accent border-accent/40 hover:bg-accent/10 shadow-sm"
            title={isTheaterMode ? 'Exit Fullscreen' : 'Enter Fullscreen (All Details)'}
          >
            {isTheaterMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            <span>{isTheaterMode ? 'Exit Fullscreen' : 'Fullscreen View'}</span>
          </Button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this render"
            className="grid size-8 place-items-center rounded-lg border border-border bg-surface text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Focal Canvas Stage - Full Viewport with Detail Zoom & Pan */}
      <div
        className={cn(
          'relative overflow-hidden bg-black shadow-2xl transition-all duration-300 flex flex-col justify-between select-none',
          isTheaterMode
            ? 'fixed inset-0 z-50 w-screen h-screen'
            : 'w-full h-[85vh] min-h-[640px] rounded-3xl border border-border',
        )}
      >
        {/* Top-Right Floating Zoom & Fullscreen Controls (Minimal & Unobtrusive) */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-black/60 p-1 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="Zoom Out"
            className="grid size-7 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="min-w-[42px] text-center text-[11px] font-semibold text-white/90">
            {(zoomLevel * 100).toFixed(0)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.5}
            title="Zoom In (Inspect Details)"
            className="grid size-7 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ZoomIn className="size-3.5" />
          </button>

          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom to 100%"
              className="grid size-7 place-items-center rounded-full text-accent hover:bg-white/15 transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          <button
            type="button"
            onClick={() => setObjectFit((f) => (f === 'contain' ? 'cover' : 'contain'))}
            title={objectFit === 'contain' ? 'Fill Screen (Edge-to-Edge)' : 'Fit in Frame'}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          >
            <span>{objectFit === 'contain' ? 'Fit' : 'Fill'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTheaterMode((m) => !m)}
            title={isTheaterMode ? 'Exit Fullscreen (Esc)' : 'Expand Fullscreen'}
            className="grid size-7 place-items-center rounded-full bg-accent/20 text-accent hover:bg-accent hover:text-background transition-all shadow-sm"
          >
            {isTheaterMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>

        {/* Viewport Canvas Stage with Interactive Magnifier */}
        <div
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
          className={cn(
            'relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-black',
            zoomLevel > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default',
          )}
        >
          <ImageMagnifier
            src={
              viewingOriginalModel && activeRender.sourceImageUrl
                ? activeRender.sourceImageUrl
                : activeRender.imageUrl
            }
            alt={activeRender.prompt}
            objectFit={objectFit}
            magnifierEnabled={isMagnifierActive && !viewingOriginalModel}
            magnification={magnification}
            zoom={zoomLevel}
            pan={panOffset}
            className="size-full"
          />

          {/* Notice when zoomed in */}
          {zoomLevel > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md border border-white/10 shadow-lg">
              <Move className="size-3 text-accent" />
              <span>Drag with mouse to pan and explore fine textures</span>
            </div>
          )}
        </div>

        {/* Unified Vibe3D Action Toolbar inside Studio Canvas */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/85 backdrop-blur-2xl p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Magnifier Loupe Feature */}
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1 backdrop-blur-md mr-1">
              <button
                type="button"
                onClick={() => setIsMagnifierActive((v) => !v)}
                title={isMagnifierActive ? 'Disable Magnifying Loupe' : 'Enable Magnifying Loupe'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  isMagnifierActive && !viewingOriginalModel
                    ? 'bg-accent text-background font-semibold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10',
                )}
              >
                <Search className="size-3.5" />
                <span>Magnifier</span>
              </button>
              {isMagnifierActive && !viewingOriginalModel && (
                <button
                  type="button"
                  onClick={handleCycleMagnification}
                  title={`Loupe Power: ${magnification}x. Click to cycle (0.5x, 1x, 1.5x, 2x, 2.5x, 4x)`}
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-accent hover:bg-white/10 transition-colors"
                >
                  {magnification}x
                </button>
              )}
            </div>

            {/* View Mode: Photoreal Render vs Original 3D Model */}
            {activeRender.sourceImageUrl && (
              <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1 backdrop-blur-md mr-1">
                <button
                  type="button"
                  onClick={() => setViewingOriginalModel(false)}
                  title="View Photoreal Render (with Magnifier)"
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    !viewingOriginalModel
                      ? 'bg-accent text-background font-semibold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10',
                  )}
                >
                  <Eye className="size-3.5" />
                  <span>Render</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingOriginalModel(true)}
                  title="View Original 3D Model"
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    viewingOriginalModel
                      ? 'bg-accent text-background font-semibold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10',
                  )}
                >
                  <EyeOff className="size-3.5" />
                  <span>3D Model</span>
                </button>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="gap-1.5 shadow-sm hover:border-accent/50 hover:bg-accent/10 border-white/15 text-white/90"
            >
              <Wand2 className="size-3.5 text-accent" />
              <span>AI Retouch & Edit</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRelightOpen(true)}
              className="gap-1.5 shadow-sm hover:border-amber-400/50 hover:bg-amber-400/10 border-white/15 text-white/90"
            >
              <Lightbulb className="size-3.5 text-amber-400" />
              <span>Instant Relight</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEnhanceOpen(true)}
              className="gap-1.5 shadow-sm hover:border-accent/50 hover:bg-accent/10 border-white/15 text-white/90"
            >
              <Zap className="size-3.5 text-accent" />
              <span>HyperReal 8K</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCloseupsOpen(true)}
              className="gap-1.5 shadow-sm hover:border-emerald-400/50 hover:bg-emerald-400/10 border-white/15 text-white/90"
            >
              <Focus className="size-3.5 text-emerald-400" />
              <span>Macro Close-Ups</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFlythroughOpen(true)}
              className="gap-1.5 shadow-sm hover:border-purple-400/50 hover:bg-purple-400/10 border-white/15 text-white/90"
            >
              <Film className="size-3.5 text-purple-400" />
              <span>Cinematic Flythrough</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <a
              href={resolveImageUrl(activeRender.imageUrl)}
              download={`renderly-${activeRender.id}.jpg`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" className="gap-1.5 shadow-lg shadow-accent/20">
                <Download className="size-3.5" />
                <span>Download Master</span>
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Scene Metadata Editor Drawer/Panel */}
      {isEditingScene && (
        <form
          onSubmit={handleSaveSceneDetails}
          className="rounded-2xl border border-accent/40 bg-surface/90 p-5 shadow-xl backdrop-blur-md flex flex-col gap-4 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Edit3 className="size-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Edit Scene Details & Settings</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingScene(false)}
              className="text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground block mb-1">Scene Description / Prompt</label>
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                placeholder="E.g. Modern Luxury Architecture · Golden Hour"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Attached Project</label>
              <select
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">No Project (Standalone Scene)</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Lighting Preset</label>
              <select
                value={editLighting}
                onChange={(e) => setEditLighting(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                {LIGHTING_PRESETS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Architectural Style</label>
              <select
                value={editStyle}
                onChange={(e) => setEditStyle(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                {ARCHITECTURAL_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end">
              <Button type="submit" size="sm" disabled={isSavingScene} className="gap-1.5 shadow-md">
                {isSavingScene ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                <span>Save Scene Details</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Versions of This Scene Carousel */}
      {versions.length > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Layers className="size-3.5 text-accent" />
              Versions of this Scene ({versions.length})
            </span>
            <span className="text-[11px] text-muted">Click any version to switch canvas view</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1">
            {versions.map((ver, idx) => {
              const isSelected = activeRender.id === ver.id
              return (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => setSelectedVersion(ver)}
                  className={cn(
                    'group relative aspect-[16/9] w-36 shrink-0 overflow-hidden rounded-xl border-2 transition-all text-left shadow-sm',
                    isSelected
                      ? 'border-accent ring-2 ring-accent/40 scale-105 z-10'
                      : 'border-border opacity-70 hover:opacity-100 hover:border-border-strong',
                  )}
                >
                  <img
                    src={resolveImageUrl(ver.imageUrl)}
                    alt={ver.prompt}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-semibold text-white truncate">
                    #{idx + 1} {ver.versionLabel || ver.versionType || 'Render'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Architectural Specs and Realism Parameters */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Scene Details</span>
            <button
              type="button"
              onClick={() => setIsEditingScene(true)}
              className="text-[11px] text-accent hover:underline flex items-center gap-1"
            >
              <Edit3 className="size-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-[11px] text-muted font-medium">Prompt Description</span>
              <p className="text-sm font-medium text-foreground mt-0.5">{activeRender.prompt}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 text-xs">
              <div>
                <span className="text-muted text-[11px]">Architectural Style</span>
                <p className="font-semibold text-foreground mt-0.5">{matchedStyle?.label || activeRender.style}</p>
              </div>
              <div>
                <span className="text-muted text-[11px]">Render Engine</span>
                <p className="font-semibold text-foreground mt-0.5 uppercase">{activeRender.engine || 'HyperReal'}</p>
              </div>
              <div>
                <span className="text-muted text-[11px]">Lighting & Time</span>
                <p className="font-semibold text-foreground mt-0.5 capitalize">
                  {activeRender.lighting?.replace('-', ' ') || 'Golden hour'}
                </p>
              </div>
              <div>
                <span className="text-muted text-[11px]">Geometry Adherence</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {(activeRender.geometryStrength ? activeRender.geometryStrength * 100 : 42).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Vibe3D Optical Realism Pipeline
          </span>
          <div className="flex flex-col gap-2 text-xs leading-relaxed text-muted">
            <p className="bg-surface-raised/60 p-3 rounded-xl border border-border/60 text-[11px]">
              {activeRender.enhancedPrompt ||
                'Hasselblad H6D-100c medium format optics, 24mm tilt-shift architectural lens, honed limestone porosity, ray-traced low-iron glass reflections, ArchDaily building of the year feature.'}
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span>Synthesized: {new Date(activeRender.createdAt).toLocaleString()}</span>
              <span className="font-semibold text-accent uppercase">{activeRender.provider}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-h-[96vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <span className="text-sm font-semibold text-foreground">{activeRender.prompt}</span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-[16/9] w-full max-h-[75vh] bg-black">
              <ImageMagnifier
                src={activeRender.imageUrl}
                alt={activeRender.prompt}
                objectFit="contain"
                magnifierEnabled={true}
                magnification={3}
                className="size-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Flythrough Studio Modal */}
      {isFlythroughOpen && (
        <CinematicFlythroughModal
          render={activeRender}
          isOpen={isFlythroughOpen}
          onClose={() => setIsFlythroughOpen(false)}
        />
      )}

      {/* Retouch Modal */}
      {isEditOpen && (
        <RenderEditModal
          render={activeRender}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onRenderUpdated={handleAddNewVersion}
        />
      )}

      {/* Relight Modal */}
      {isRelightOpen && (
        <RelightModal
          render={activeRender}
          isOpen={isRelightOpen}
          onClose={() => setIsRelightOpen(false)}
          onRelitSuccess={handleAddNewVersion}
        />
      )}

      {/* Closeups Modal */}
      {isCloseupsOpen && (
        <CloseupsModal
          render={activeRender}
          isOpen={isCloseupsOpen}
          onClose={() => setIsCloseupsOpen(false)}
          onCloseupSuccess={handleAddNewVersion}
        />
      )}

      {/* HyperReal Enhance Modal */}
      {isEnhanceOpen && (
        <HyperRealEnhanceModal
          render={activeRender}
          isOpen={isEnhanceOpen}
          onClose={() => setIsEnhanceOpen(false)}
          onEnhanceSuccess={handleAddNewVersion}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this render?"
        description="This render and its synthesized assets will be permanently removed. This action cannot be undone."
        confirmText="Delete render"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
