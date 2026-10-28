import {
  Box,
  Download,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BeforeAfterSlider } from '@/components/app/before-after-slider'
import { CinematicFlythroughModal } from '@/components/app/cinematic-flythrough-modal'
import { CloseupsModal } from '@/components/app/closeups-modal'
import { CreateProjectModal } from '@/components/app/create-project-modal'
import { HdDownloadModal } from '@/components/app/hd-download-modal'
import { HyperRealEnhanceModal } from '@/components/app/hyperreal-enhance-modal'
import { PageHeader } from '@/components/app/page-header'
import { RelightModal } from '@/components/app/relight-modal'
import { RenderEditModal } from '@/components/app/render-edit-modal'
import { RenderingOptionsPanel } from '@/components/app/rendering-options-panel'
import { Spatial3dRenderModal } from '@/components/app/spatial-3d-render-modal'
import { Vibe3dSceneToolbar } from '@/components/app/vibe3d-scene-toolbar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { getErrorMessage, resolveImageUrl } from '@/lib/api'
import { resolveRendering } from '@/lib/render-settings'
import {
  EXTERIOR_MATERIAL_TAGS,
  INTERIOR_MATERIAL_TAGS,
} from '@/lib/site-content'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type {
  ExteriorRenderingSettings,
  InteriorRenderingSettings,
  Project,
  Render,
  RenderAspectRatio,
  RenderCategory,
  RenderEngine,
  RenderLighting,
  RenderStyle,
  RenderingMode,
} from '@/types'

interface RendersPageProps {
  mode?: RenderCategory
}

export function RendersPage({ mode = 'exterior' }: RendersPageProps) {
  const [searchParams] = useSearchParams()
  const initialProjectId = searchParams.get('projectId')

  const materialTags = mode === 'interior' ? INTERIOR_MATERIAL_TAGS : EXTERIOR_MATERIAL_TAGS

  const [renders, setRenders] = useState<Render[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [galleryFilter, setGalleryFilter] = useState<'category' | 'all'>('category')

  // Uploaded 3D Model / Source Image State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const generatorRef = useRef<HTMLDivElement>(null)

  // Vibe3D Control Parameters
  const [selectedRenderingMode] = useState<RenderingMode>('preserve-structure')
  const [selectedEngine] = useState<RenderEngine>('hyperreal')
  const [selectedLighting] = useState<RenderLighting>('golden-hour')
  const [selectedStyle] = useState<RenderStyle>('modern-luxury')
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(
    mode === 'interior' ? 'interior-living' : 'landscaped-gardens',
  )
  const [geometryStrength] = useState<number>(0.85)
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'high' | 'ultra'>('high')
  const [selectedAspect, setSelectedAspect] = useState<RenderAspectRatio>('16:9')
  const [refinementPrompt, setRefinementPrompt] = useState<string>('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState<boolean>(false)
  const [setAsThumbnail, setSetAsThumbnail] = useState<boolean>(false)

  // Exterior & Interior Configuration Settings (from exterior.txt & interior.txt)
  const [exteriorSettings, setExteriorSettings] = useState<ExteriorRenderingSettings>({
    buildingType: 'Modern Villa',
    architecturalStyle: 'Tropical Modern',
    promptStyle: 'Detailed',
    countryRegion: 'India – Kerala',
    areaCommunity: '',
    districtPlace: '',
    timeOfDay: 'Golden Hour',
    primaryMood: 'Ultra Photorealistic',
    cinematicSchool: 'None',
    season: 'All Season / Dry',
    weather: 'Clear Sky',
    humanPresence: 'None',
    vehicles: 'None',
    boundaryWall: 'Auto',
    cameraBody: 'Hasselblad X2D 100C',
    cameraLens: '35mm Wide',
    cameraAngle: 'Eye Level',
    storyboardShots: ['SHOT 01 — HERO FRONT WIDE'],
    structuralNotes: '',
    locationNotes: '',
    specialInstructions:
      'Keep architecture 100% locked. Do not change geometry, materials, roofline, openings, facade design, road, footpath, or landscape position.',
  })

  const [interiorSettings, setInteriorSettings] = useState<InteriorRenderingSettings>({
    roomType: 'Living Room & Salon',
    flooringMaterial: 'Original Model Flooring',
    wallMaterial: 'Original Model Wall Finishes',
    accentMaterial: 'Brushed Warm Brass / Bronze',
    lightingMood: 'Soft Natural Daylight',
    cameraHeight: 'Eye Level (approx 1.5m / 5ft)',
    perspectiveType: 'Preserve Original Viewpoint',
    removeSketchupOutlines: true,
    specialInstructions:
      'Preserve room geometry, wall boundaries, ceiling height, and window/door openings 100% locked. Enhance materials and lighting with physically plausible realism.',
  })

  // Optional secondary Location Image
  const [locationImage, setLocationImage] = useState<string | null>(null)

  function handleLocationImageSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP).')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image size exceeds 20MB limit.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setLocationImage(result)
      toast.success(`Location image (${file.name}) attached!`, 'Environmental Guidance Active')
    }
    reader.readAsDataURL(file)
  }

  function handleLocationImageClear() {
    setLocationImage(null)
  }

  // Real-time live architectural resolution & conflict detection
  const resolvedConfig = useMemo(() => {
    return resolveRendering({
      category: mode,
      exteriorSettings,
      interiorSettings,
      renderingMode: selectedRenderingMode,
      quality: selectedQuality,
      fallbackLighting: selectedLighting,
      refinementPrompt,
    })
  }, [mode, exteriorSettings, interiorSettings, selectedRenderingMode, selectedQuality, selectedLighting, refinementPrompt])

  const livePrompt = resolvedConfig.prompt
  const liveWarnings = resolvedConfig.warnings

  // Modal / Lightbox State
  const [activeLightboxRender, setActiveLightboxRender] = useState<Render | null>(null)
  const [activeFlythroughRender, setActiveFlythroughRender] = useState<Render | null>(null)
  const [activeEditRender, setActiveEditRender] = useState<Render | null>(null)
  const [activeRelightRender, setActiveRelightRender] = useState<Render | null>(null)
  const [activeCloseupsRender, setActiveCloseupsRender] = useState<Render | null>(null)
  const [activeEnhanceRender, setActiveEnhanceRender] = useState<Render | null>(null)
  const [downloadModalRender, setDownloadModalRender] = useState<Render | null>(null)
  const [active3DModalRender, setActive3DModalRender] = useState<Render | null>(null)
  const [renderToDelete, setRenderToDelete] = useState<Render | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  // Load initial renders & projects
  useEffect(() => {
    let mounted = true
    Promise.all([rendersService.list(), projectsService.list()])
      .then(([rendersData, projectsData]) => {
        if (!mounted) return
        setRenders(rendersData || [])
        setProjects(projectsData || [])
        if (projectsData && projectsData.length > 0) {
          if (initialProjectId && projectsData.some((p) => p.id === initialProjectId)) {
            setSelectedProjectId(initialProjectId)
          } else {
            setSelectedProjectId(projectsData[0].id)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load initial studio data:', err)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [initialProjectId])

  // Reset environment on mode change or mount
  useEffect(() => {
    setSelectedEnvironment(mode === 'interior' ? 'interior-living' : 'landscaped-gardens')
  }, [mode])

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP).')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image size exceeds 20MB limit. Please upload a smaller file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedImage(result)

      // Auto detect aspect ratio
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        if (ratio > 1.45) setSelectedAspect('16:9')
        else if (ratio > 1.15) setSelectedAspect('4:3')
        else if (ratio < 0.75) setSelectedAspect('9:16')
        else setSelectedAspect('1:1')
      }
      img.src = result

      toast.success(
        mode === 'interior'
          ? 'Room reference image attached!'
          : 'Structural reference image attached!',
        'Ready to render',
      )
    }
    reader.readAsDataURL(file)
  }

  function handleClearImage() {
    setUploadedImage(null)
  }

  function handleAddMaterialTag(tag: string) {
    if (refinementPrompt.includes(tag)) return
    setRefinementPrompt((prev) => (prev ? `${prev}, ${tag}` : tag))
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault()

    if (!uploadedImage) {
      toast.error('Please upload a 3D model viewport capture or select a sample model.')
      return
    }

    if (!selectedProjectId) {
      toast.error(
        'A project is required to create a render. Please select or create a project first.',
        'Project Required',
      )
      setIsCreateProjectOpen(true)
      return
    }

    try {
      setIsGenerating(true)
      setGenerationStep(1)

      // Progress animation steps
      const t1 = setTimeout(() => setGenerationStep(2), 2500)
      const t2 = setTimeout(() => setGenerationStep(3), 6000)

      const newRender = await rendersService.generate({
        image: uploadedImage,
        locationImage: locationImage || undefined,
        style: selectedStyle,
        engine: selectedEngine,
        lighting: selectedLighting,
        renderingMode: selectedRenderingMode,
        quality: selectedQuality,
        environment: selectedEnvironment,
        geometryStrength,
        aspectRatio: selectedAspect,
        refinementPrompt: refinementPrompt.trim() || undefined,
        projectId: selectedProjectId || null,
        setAsThumbnail,
        category: mode,
        exteriorSettings: mode === 'exterior' ? exteriorSettings : undefined,
        interiorSettings: mode === 'interior' ? interiorSettings : undefined,
      })

      clearTimeout(t1)
      clearTimeout(t2)
      setGenerationStep(4)

      setRenders((prev) => [newRender, ...prev])
      toast.success(
        'Photorealistic architectural render synthesized with Vibe3D engine!',
        'Render complete',
      )

      if (selectedProjectId && setAsThumbnail) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProjectId ? { ...p, thumbnailUrl: newRender.imageUrl } : p,
          ),
        )
      }
    } catch (err) {
      toast.error(getErrorMessage(err), 'Rendering failed')
    } finally {
      setIsGenerating(false)
      setGenerationStep(0)
    }
  }

  async function handleDeleteRender() {
    if (!renderToDelete) return
    try {
      setIsDeleting(true)
      await rendersService.delete(renderToDelete.id)
      setRenders((prev) => prev.filter((r) => r.id !== renderToDelete.id))
      toast.success('Render removed.', 'Deleted')
      if (activeLightboxRender?.id === renderToDelete.id) {
        setActiveLightboxRender(null)
      }
    } catch (err) {
      toast.error(getErrorMessage(err), 'Failed to delete render')
    } finally {
      setIsDeleting(false)
      setRenderToDelete(null)
    }
  }

  async function handleSetProjectThumbnail(render: Render, targetProjectId: string) {
    try {
      await rendersService.setAsThumbnail(render.id, targetProjectId)
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjectId ? { ...p, thumbnailUrl: render.imageUrl } : p,
        ),
      )
      toast.success('Project thumbnail updated successfully!', 'Thumbnail updated')
    } catch (err) {
      toast.error(getErrorMessage(err), 'Failed to update thumbnail')
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={mode === 'interior' ? 'Interior Render Studio' : 'Exterior Render Studio'}
        description={
          mode === 'interior'
            ? 'Transform interior room blockouts, floor views, and SketchUp/Blender white models into photorealistic interior designs with bespoke lighting, materials, and furnishings (Vibe3D engine).'
            : 'Upload 3D model viewport captures, massing studies, and facade screenshots to transform them into photorealistic architectural exterior renders and landscaping (Vibe3D engine).'
        }
      />

      {/* Main Studio Generator Panel */}
      <section
        ref={generatorRef}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl backdrop-blur-xl md:p-8"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <form onSubmit={handleGenerate} className="flex flex-col gap-8">
          {/* Project Selection (Required) */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/50 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label htmlFor="project-select" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Folder className="size-4 text-accent" />
                <span>Assigned Project</span>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                  Required
                </span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreateProjectOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <Plus className="size-3.5" />
                <span>New Project</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-accent/20 text-accent">
                    <FolderPlus className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">A project is required to create renders</p>
                    <p className="text-[11px] text-muted">Create a project first to organize and synthesize your visualizations.</p>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={() => setIsCreateProjectOpen(true)}>
                  <Plus className="size-3.5" /> Create Project
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select
                    id="project-select"
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className={cn(
                      'h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none',
                      !selectedProjectId ? 'border-accent ring-1 ring-accent/30' : 'border-border',
                    )}
                  >
                    <option value="" disabled>
                      — Select a project (Required) —
                    </option>
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
                    className="shrink-0 gap-1.5 h-10 px-3.5"
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">New Project</span>
                  </Button>
                </div>

                {selectedProjectId && (
                  <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={setAsThumbnail}
                      onChange={(e) => setSetAsThumbnail(e.target.checked)}
                      className="size-4 rounded border-border bg-background text-accent accent-accent"
                    />
                    <span>Set this render as the project cover thumbnail</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Detailed Architectural Configurations (exterior.txt / interior.txt) */}
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                <span>
                  {mode === 'exterior'
                    ? 'Architectural & Storyboard Configurations'
                    : 'Interior Realism & Room Configurations'}
                </span>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                  {mode === 'exterior' ? 'exterior.txt' : 'interior.txt'}
                </span>
              </label>
              <span className="text-xs text-muted">
                {mode === 'exterior'
                  ? 'Collapsible options for building massing, location, weather, optics & storyboard angles'
                  : 'Collapsible options for room geometry, PBR finishes, bounce lighting & CAD line cleanup'}
              </span>
            </div>

            <RenderingOptionsPanel
              mode={mode}
              uploadedImage={uploadedImage}
              onUploadedImageSelect={handleFileSelect}
              onUploadedImageClear={handleClearImage}
              exteriorSettings={exteriorSettings}
              onUpdateExterior={(settings) => setExteriorSettings((prev) => ({ ...prev, ...settings }))}
              interiorSettings={interiorSettings}
              onUpdateInterior={(settings) => setInteriorSettings((prev) => ({ ...prev, ...settings }))}
              locationImage={locationImage}
              onLocationImageSelect={handleLocationImageSelect}
              onLocationImageClear={handleLocationImageClear}
              livePrompt={livePrompt}
              liveWarnings={liveWarnings}
              quality={selectedQuality}
              onQualityChange={setSelectedQuality}
            />
          </div>

          {/* 7. Optional Material & Detail Notes */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="material-notes" className="text-xs font-semibold text-foreground">
                Specific Material & Detail Notes <span className="font-normal text-muted">(Optional)</span>
              </label>
              <span className="text-[11px] text-muted">Click tags to quickly add physical textures</span>
            </div>

            <textarea
              id="material-notes"
              rows={2}
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              placeholder={
                mode === 'interior'
                  ? 'e.g. French oak herringbone floor, honed Calacatta marble island, fluted walnut walls, warm 3000K recessed cove lighting...'
                  : 'e.g. Low-iron clear glass, honed travertine facade, charred shou sugi ban cedar, bronze mullions...'
              }
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {materialTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddMaterialTag(tag)}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted hover:border-accent/50 hover:text-foreground transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Action Button & Step-by-step indicator */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
            <div className="text-xs text-muted">
              {isGenerating ? (
                <span className="flex items-center gap-2 text-accent font-medium animate-pulse">
                  <Loader2 className="size-3.5 animate-spin" />
                  {generationStep === 1 && 'Step 1/3: Analyzing 3D building geometry & perspective...'}
                  {generationStep === 2 && 'Step 2/3: Calculating ray-traced lighting & physical shaders...'}
                  {generationStep === 3 && 'Step 3/3: Synthesizing photorealistic materials & environment...'}
                  {generationStep === 4 && 'Finalizing 8K architectural render...'}
                </span>
              ) : (
                'Vibe3D AI engine • Preserves exact building geometry with photorealistic materials'
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !uploadedImage}
              className="w-full sm:w-auto px-8 shadow-lg shadow-accent/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Synthesizing Photorealism…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Render Photo Real
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Renders Gallery Section */}
      <section className="flex flex-col gap-6">
        {(() => {
          const categoryRenders = renders.filter((r) => {
            if (mode === 'interior') {
              return r.metadata?.category === 'interior'
            } else {
              return r.metadata?.category === 'exterior' || !r.metadata?.category
            }
          })
          const displayedRenders = galleryFilter === 'category' ? categoryRenders : renders

          return (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-foreground">
                    {mode === 'interior' ? 'Interior Render Gallery' : 'Exterior Render Gallery'}
                  </h2>
                  <p className="text-xs text-muted">
                    {displayedRenders.length} {displayedRenders.length === 1 ? 'render' : 'renders'} in this view
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setGalleryFilter('category')}
                    className={cn(
                      'rounded-lg px-3 py-1 font-medium transition-colors',
                      galleryFilter === 'category'
                        ? 'bg-surface text-foreground shadow-sm'
                        : 'text-muted hover:text-foreground',
                    )}
                  >
                    {mode === 'interior' ? 'Interior Only' : 'Exterior Only'} ({categoryRenders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryFilter('all')}
                    className={cn(
                      'rounded-lg px-3 py-1 font-medium transition-colors',
                      galleryFilter === 'all'
                        ? 'bg-surface text-foreground shadow-sm'
                        : 'text-muted hover:text-foreground',
                    )}
                  >
                    All Renders ({renders.length})
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-24 text-muted">
                  <Loader2 className="size-8 animate-spin" />
                </div>
              ) : displayedRenders.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title={
                    galleryFilter === 'category'
                      ? mode === 'interior'
                        ? 'No interior renders yet'
                        : 'No exterior renders yet'
                      : 'No renders yet'
                  }
                  description={
                    mode === 'interior'
                      ? 'Upload an interior room blockout or select a sample above to synthesize your first photorealistic interior scene.'
                      : 'Upload a 3D model viewport capture or choose a preset model above to generate your first photorealistic exterior render.'
                  }
                />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedRenders.map((render) => {
                    const matchedProject = projects.find((p) => p.id === render.projectId)

                    return (
                      <article
                        key={render.id}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xl hover:shadow-black/30"
                      >
                        {/* Before/After or Image Container */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
                          {render.sourceImageUrl ? (
                            <BeforeAfterSlider
                              beforeSrc={render.sourceImageUrl}
                              afterSrc={render.imageUrl}
                              beforeLabel="3D Model"
                              afterLabel="Photo Real"
                              showControls={false}
                              aspectClass="aspect-[16/9]"
                            />
                          ) : (
                            <img
                              src={resolveImageUrl(render.imageUrl)}
                              alt={render.prompt}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          )}
                        </div>

                        {/* Details & Actions */}
                        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                          <div>
                            {matchedProject && (
                              <Link
                                to={`/app/projects/${matchedProject.id}`}
                                title={`Edit project ${matchedProject.name}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline mb-1"
                              >
                                <Folder className="size-3" />
                                <span>{matchedProject.name}</span>
                              </Link>
                            )}
                            <Link
                              to={`/app/renders/${render.id}`}
                              title={render.prompt}
                              className="line-clamp-2 text-sm font-medium text-foreground hover:text-accent transition-colors block"
                            >
                              {render.prompt}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                              {render.metadata?.category && (
                                <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent capitalize">
                                  {render.metadata.category}
                                </span>
                              )}
                              {render.renderingMode && (
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground capitalize">
                                  {render.renderingMode.replace('-', ' ')}
                                </span>
                              )}
                              <span className="capitalize">
                                {render.lighting?.replace('-', ' ') || 'Golden hour'}
                              </span>
                              <span>·</span>
                              <span>
                                {(render.geometryStrength ? render.geometryStrength * 100 : 85).toFixed(0)}% adherence
                              </span>
                            </div>
                          </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <span className="text-[11px] text-muted">
                        {new Date(render.createdAt).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' · '}
                        <span className="uppercase">{render.aspectRatio}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActive3DModalRender(render)}
                          title="View in Interactive 3D Spatial Mesh"
                          className="grid size-8 place-items-center rounded-lg border border-border bg-surface-raised text-muted transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                        >
                          <Box className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDownloadModalRender(render)}
                          title="Download HD render (4K / 2K / 1080p)"
                          className="grid size-8 place-items-center rounded-lg border border-border bg-surface-raised text-muted transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenderToDelete(render)}
                          title="Delete render"
                          className="grid size-8 place-items-center rounded-lg border border-border bg-surface-raised text-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
            </>
          )
        })()}
      </section>

      {/* Lightbox Modal with Interactive Before & After Slider */}
      {activeLightboxRender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveLightboxRender(null)}
          />
          <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent uppercase">
                  {activeLightboxRender.engine || 'HyperReal'} Engine
                </span>
                <span className="text-xs text-muted capitalize">
                  {activeLightboxRender.style.replace('-', ' ')} ·{' '}
                  {activeLightboxRender.lighting?.replace('-', ' ') || 'Golden hour'}
                </span>
                {projects.find((p) => p.id === activeLightboxRender.projectId) && (
                  <Link
                    to={`/app/projects/${activeLightboxRender.projectId}`}
                    className="flex items-center gap-1.5 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-accent hover:text-background transition-colors border border-border"
                  >
                    <Folder className="size-3 text-accent" />
                    <span>Project: {projects.find((p) => p.id === activeLightboxRender.projectId)?.name}</span>
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxRender(null)}
                className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Main Stage with Before/After Slider */}
            <div className="relative flex max-h-[64vh] items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto">
              <div className="flex items-center justify-center w-full max-w-4xl">
                {activeLightboxRender.sourceImageUrl ? (
                  <BeforeAfterSlider
                    beforeSrc={activeLightboxRender.sourceImageUrl}
                    afterSrc={activeLightboxRender.imageUrl}
                    beforeLabel="Original 3D Model"
                    afterLabel="Photo Real Render"
                    showControls={true}
                    aspectClass={cn(
                      "w-full max-h-[58vh]",
                      activeLightboxRender.aspectRatio === '1:1' ? 'aspect-square' :
                      activeLightboxRender.aspectRatio === '4:3' ? 'aspect-[4/3]' :
                      activeLightboxRender.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                      'aspect-[16/9]'
                    )}
                    objectFit="contain"
                  />
                ) : (
                  <img
                    src={resolveImageUrl(activeLightboxRender.imageUrl)}
                    alt={activeLightboxRender.prompt}
                    className="max-h-[58vh] w-auto max-w-full mx-auto rounded-xl object-contain shadow-2xl"
                  />
                )}
              </div>
            </div>

            {/* Details Footer */}
            <div className="flex flex-col gap-4 border-t border-border p-6 overflow-y-auto">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Title / Prompt</p>
                <p className="mt-1 text-sm text-foreground">{activeLightboxRender.prompt}</p>
              </div>

              {activeLightboxRender.enhancedPrompt !== activeLightboxRender.prompt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Vibe3D Synthesized Realism Parameters
                  </p>
                  <p className="mt-1 text-xs text-muted leading-relaxed font-mono bg-surface/50 p-2.5 rounded-lg border border-border/40">
                    {activeLightboxRender.enhancedPrompt}
                  </p>
                </div>
              )}

              {/* Warnings and Quality Audit */}
              {Array.isArray(activeLightboxRender.metadata?.warnings) &&
                (activeLightboxRender.metadata.warnings as string[]).length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-xs font-semibold text-amber-300">Option Adjustments Applied:</p>
                    <ul className="mt-1.5 list-disc pl-4 text-xs text-amber-200/90 space-y-1">
                      {(activeLightboxRender.metadata.warnings as string[]).map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted">
                <span className="rounded-md border border-border/60 bg-surface px-2 py-0.5">
                  Provider: <span className="text-foreground font-medium">{activeLightboxRender.provider}</span>
                </span>
                {Boolean(activeLightboxRender.metadata?.quality) && (
                  <span className="rounded-md border border-border/60 bg-surface px-2 py-0.5">
                    Quality:{' '}
                    <span className="text-foreground font-medium uppercase">
                      {((activeLightboxRender.metadata?.quality as any)?.applied ||
                        (activeLightboxRender.metadata?.quality as any)?.requested ||
                        'standard')}
                    </span>
                  </span>
                )}
                {Boolean(activeLightboxRender.metadata?.negativePrompt) && (
                  <span className="rounded-md border border-border/60 bg-surface px-2 py-0.5 text-muted">
                    Negative Constraints Active
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                {/* Project selector to set as thumbnail */}
                {projects.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Set as cover for:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSetProjectThumbnail(activeLightboxRender, e.target.value)
                        }
                      }}
                      defaultValue=""
                      className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      <option value="" disabled>
                        Select a project…
                      </option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
                  <Vibe3dSceneToolbar
                    render={activeLightboxRender}
                    variant="studio"
                    className="w-full sm:w-auto"
                    onOpenEdit={() => {
                      setActiveEditRender(activeLightboxRender)
                      setActiveLightboxRender(null)
                    }}
                    onOpenRelight={() => {
                      setActiveRelightRender(activeLightboxRender)
                      setActiveLightboxRender(null)
                    }}
                    onOpenEnhance={() => {
                      setActiveEnhanceRender(activeLightboxRender)
                      setActiveLightboxRender(null)
                    }}
                    onOpenCloseups={() => {
                      setActiveCloseupsRender(activeLightboxRender)
                      setActiveLightboxRender(null)
                    }}
                    onOpenFlythrough={() => {
                      setActiveFlythroughRender(activeLightboxRender)
                      setActiveLightboxRender(null)
                    }}
                    onOpen3DView={() => {
                      setActive3DModalRender(activeLightboxRender)
                      setActiveLightboxRender(null)
                    }}
                  />

                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRenderToDelete(activeLightboxRender)}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDownloadModalRender(activeLightboxRender)}
                      className="gap-1.5 shadow-md shadow-accent/20"
                    >
                      <Download className="size-3.5" />
                      <span>Download HD</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cinematic Flythrough Modal */}
      {activeFlythroughRender && (
        <CinematicFlythroughModal
          render={activeFlythroughRender}
          isOpen={Boolean(activeFlythroughRender)}
          onClose={() => setActiveFlythroughRender(null)}
        />
      )}

      {/* Post-Render Edit & Studio Retouch Modal */}
      {activeEditRender && (
        <RenderEditModal
          render={activeEditRender}
          isOpen={Boolean(activeEditRender)}
          onClose={() => setActiveEditRender(null)}
          onRenderUpdated={(newRender) => {
            setRenders((prev) => [newRender, ...prev])
            setActiveLightboxRender(newRender)
          }}
        />
      )}

      {/* Vibe3D Instant Relight Modal */}
      {activeRelightRender && (
        <RelightModal
          render={activeRelightRender}
          isOpen={Boolean(activeRelightRender)}
          onClose={() => setActiveRelightRender(null)}
          onRelitSuccess={(newRender) => {
            setRenders((prev) => [newRender, ...prev])
            setActiveLightboxRender(newRender)
          }}
        />
      )}

      {/* Vibe3D Close-Ups Studio Modal */}
      {activeCloseupsRender && (
        <CloseupsModal
          render={activeCloseupsRender}
          isOpen={Boolean(activeCloseupsRender)}
          onClose={() => setActiveCloseupsRender(null)}
          onCloseupSuccess={(newRender) => {
            setRenders((prev) => [newRender, ...prev])
            setActiveLightboxRender(newRender)
          }}
        />
      )}

      {/* Vibe3D HyperReal Studio Enhance Modal */}
      {activeEnhanceRender && (
        <HyperRealEnhanceModal
          render={activeEnhanceRender}
          isOpen={Boolean(activeEnhanceRender)}
          onClose={() => setActiveEnhanceRender(null)}
          onEnhanceSuccess={(newRender) => {
            setRenders((prev) => [newRender, ...prev])
            setActiveLightboxRender(newRender)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(renderToDelete)}
        title="Delete this render?"
        description="This render and its image file will be permanently removed from MongoDB and server storage. This action cannot be undone."
        confirmText="Delete render"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteRender}
        onClose={() => setRenderToDelete(null)}
      />
      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSuccess={(newProj) => {
          setProjects((prev) => [newProj, ...prev])
          setSelectedProjectId(newProj.id)
        }}
        title="Create Project for Render"
        description="All synthesized renders must belong to a project for organization and client presentations."
      />

      {/* HD Download Quality Modal */}
      <HdDownloadModal
        isOpen={Boolean(downloadModalRender)}
        onClose={() => setDownloadModalRender(null)}
        render={downloadModalRender}
      />

      {/* 3D Spatial Depth Mesh Viewer Modal */}
      {active3DModalRender && (
        <Spatial3dRenderModal
          isOpen={Boolean(active3DModalRender)}
          onClose={() => setActive3DModalRender(null)}
          imageUrl={active3DModalRender.imageUrl}
          title={active3DModalRender.prompt?.split('·')[0]?.trim() || 'Architectural 3D Scene'}
          prompt={active3DModalRender.prompt}
        />
      )}
    </div>
  )
}
