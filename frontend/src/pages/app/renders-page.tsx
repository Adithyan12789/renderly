import {
  Check,
  Download,
  Folder,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  RefreshCw,
  Sliders,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import { BeforeAfterSlider } from '@/components/app/before-after-slider'
import { CinematicFlythroughModal } from '@/components/app/cinematic-flythrough-modal'
import { CloseupsModal } from '@/components/app/closeups-modal'
import { HyperRealEnhanceModal } from '@/components/app/hyperreal-enhance-modal'
import { PageHeader } from '@/components/app/page-header'
import { RelightModal } from '@/components/app/relight-modal'
import { RenderEditModal } from '@/components/app/render-edit-modal'
import { Vibe3dSceneToolbar } from '@/components/app/vibe3d-scene-toolbar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { getErrorMessage, resolveImageUrl } from '@/lib/api'
import {
  ARCHITECTURAL_STYLES,
  ENVIRONMENT_PRESETS,
  LIGHTING_PRESETS,
  QUICK_MATERIAL_TAGS,
  RENDER_ENGINES,
  SAMPLE_3D_MODELS,
} from '@/lib/site-content'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type {
  Project,
  Render,
  RenderAspectRatio,
  RenderEngine,
  RenderLighting,
  RenderStyle,
} from '@/types'

const ASPECT_RATIOS: { value: RenderAspectRatio; label: string; aspectClass: string }[] = [
  { value: '16:9', label: '16:9 Landscape', aspectClass: 'aspect-[16/9]' },
  { value: '4:3', label: '4:3 Standard', aspectClass: 'aspect-[4/3]' },
  { value: '1:1', label: '1:1 Square', aspectClass: 'aspect-square' },
  { value: '9:16', label: '9:16 Portrait', aspectClass: 'aspect-[9/16]' },
]

export function RendersPage() {
  const [renders, setRenders] = useState<Render[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)

  // Uploaded 3D Model / Source Image State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageName, setUploadedImageName] = useState<string>('')
  const [uploadedImageSize, setUploadedImageSize] = useState<string>('')
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generatorRef = useRef<HTMLDivElement>(null)

  // Vibe3D Control Parameters
  const [selectedEngine, setSelectedEngine] = useState<RenderEngine>('hyperreal')
  const [selectedLighting, setSelectedLighting] = useState<RenderLighting>('golden-hour')
  const [selectedStyle, setSelectedStyle] = useState<RenderStyle>('modern-luxury')
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('landscaped-gardens')
  const [geometryStrength, setGeometryStrength] = useState<number>(0.42)
  const [selectedAspect, setSelectedAspect] = useState<RenderAspectRatio>('16:9')
  const [refinementPrompt, setRefinementPrompt] = useState<string>('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [setAsThumbnail, setSetAsThumbnail] = useState<boolean>(false)

  // Modal / Lightbox State
  const [activeLightboxRender, setActiveLightboxRender] = useState<Render | null>(null)
  const [activeFlythroughRender, setActiveFlythroughRender] = useState<Render | null>(null)
  const [activeEditRender, setActiveEditRender] = useState<Render | null>(null)
  const [activeRelightRender, setActiveRelightRender] = useState<Render | null>(null)
  const [activeCloseupsRender, setActiveCloseupsRender] = useState<Render | null>(null)
  const [activeEnhanceRender, setActiveEnhanceRender] = useState<Render | null>(null)
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
  }, [])

  // Auto select first sample model if user has no image on first mount
  useEffect(() => {
    if (!uploadedImage && SAMPLE_3D_MODELS[0]) {
      handleSelectSample(SAMPLE_3D_MODELS[0].id)
    }
  }, [])

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
      setUploadedImageName(file.name)
      setUploadedImageSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)
      setSelectedSampleId(null)

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

      toast.success('3D model capture uploaded successfully!', 'Ready to render')
    }
    reader.readAsDataURL(file)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setIsDraggingFile(true)
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    setIsDraggingFile(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDraggingFile(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  function handleSelectSample(sampleId: string) {
    const sample = SAMPLE_3D_MODELS.find((s) => s.id === sampleId)
    if (!sample) return

    setSelectedSampleId(sample.id)
    setUploadedImage(sample.thumbnailUrl)
    setUploadedImageName(`${sample.title} (${sample.category})`)
    setUploadedImageSize('Preset Model')
    setSelectedAspect(sample.aspectRatio)
  }

  function handleClearImage() {
    setUploadedImage(null)
    setUploadedImageName('')
    setUploadedImageSize('')
    setSelectedSampleId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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

    try {
      setIsGenerating(true)
      setGenerationStep(1)

      // Progress animation steps
      const t1 = setTimeout(() => setGenerationStep(2), 2500)
      const t2 = setTimeout(() => setGenerationStep(3), 6000)

      const newRender = await rendersService.generate({
        image: uploadedImage,
        style: selectedStyle,
        engine: selectedEngine,
        lighting: selectedLighting,
        environment: selectedEnvironment,
        geometryStrength,
        aspectRatio: selectedAspect,
        refinementPrompt: refinementPrompt.trim() || undefined,
        projectId: selectedProjectId || null,
        setAsThumbnail,
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
        title="AI Render Studio"
        description="Upload 3D model viewport captures, white models, or clay screenshots and transform them into photorealistic architectural renders (Vibe3D engine)."
      />

      {/* Main Studio Generator Panel */}
      <section
        ref={generatorRef}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl backdrop-blur-xl md:p-8"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <form onSubmit={handleGenerate} className="flex flex-col gap-8">
          {/* 1. Image Upload Dropzone (Primary Input) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold tracking-wide text-foreground">
                1. 3D Model Viewport / Photo Input
              </label>
              <span className="text-xs text-muted">
                Accepts SketchUp, Revit, Rhino, Archicad, Blender exports or photos
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0])
                }
              }}
              className="hidden"
            />

            {!uploadedImage ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer',
                  isDraggingFile
                    ? 'border-accent bg-accent/10 scale-[0.99]'
                    : 'border-border/80 bg-background/50 hover:border-accent/60 hover:bg-background/80',
                )}
              >
                <div className="grid size-14 place-items-center rounded-2xl border border-border bg-surface shadow-inner group-hover:scale-110 transition-transform">
                  <UploadCloud className="size-7 text-accent" />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                  <p className="text-sm font-medium text-foreground">
                    Click to browse or drag & drop 3D model screenshot
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    Clay render, massing model, wireframe, or raw untextured camera view. PNG, JPG, WebP up to 20MB.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background/70 p-4 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Thumbnail Preview */}
                  <div className="relative aspect-[16/9] w-full sm:w-56 shrink-0 overflow-hidden rounded-xl border border-border bg-black">
                    <img
                      src={uploadedImage}
                      alt="Uploaded Model Preview"
                      className="size-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md uppercase">
                        {selectedAspect} Model
                      </span>
                    </div>
                  </div>

                  {/* Metadata and Replacement Actions */}
                  <div className="flex flex-1 flex-col justify-between gap-3 w-full">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-sm font-semibold text-foreground truncate">
                          {uploadedImageName || '3D Model Viewport'}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {uploadedImageSize} · Preserves building massing, geometry & openings
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs"
                      >
                        <RefreshCw className="size-3" />
                        Replace Image
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearImage}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="size-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Sample 3D Models Bar */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-medium text-muted">
                No 3D model right now? Try a curated viewport preset:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_3D_MODELS.map((sample) => {
                  const isSelected = selectedSampleId === sample.id
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample.id)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl border p-2 text-left transition-all',
                        isSelected
                          ? 'border-accent bg-accent/15 ring-1 ring-accent'
                          : 'border-border bg-background/50 hover:border-border-strong hover:bg-background',
                      )}
                    >
                      <img
                        src={sample.thumbnailUrl}
                        alt={sample.title}
                        className="size-11 shrink-0 rounded-lg object-cover border border-border"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {sample.title}
                          </span>
                          {isSelected && <Check className="size-3 text-accent shrink-0" />}
                        </div>
                        <span className="text-[11px] text-muted truncate">
                          {sample.category}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 2. Vibe3D Render Engine Mode */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold tracking-wide text-foreground">
                2. AI Render Engine Mode
              </label>
              <span className="text-xs text-muted">Ray-tracing & material calculation profiles</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {RENDER_ENGINES.map((engine) => {
                const isSelected = selectedEngine === engine.value
                return (
                  <button
                    key={engine.value}
                    type="button"
                    onClick={() => setSelectedEngine(engine.value)}
                    className={cn(
                      'group relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all',
                      isSelected
                        ? 'border-accent bg-accent/[0.09] ring-1 ring-accent shadow-md shadow-accent/5'
                        : 'border-border bg-background/60 hover:border-border-strong hover:bg-background',
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{engine.label}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                          isSelected
                            ? 'bg-accent text-white'
                            : 'bg-white/5 text-muted',
                        )}
                      >
                        {engine.badge}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-accent/90">{engine.tagline}</span>
                    <p className="text-[11px] text-muted leading-relaxed line-clamp-2">
                      {engine.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Scene Lighting (Vibe3D Relighting) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold tracking-wide text-foreground">
                3. Scene Lighting & Time of Day
              </label>
              <span className="text-xs text-muted">Vibe3D instant relighting preset</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {LIGHTING_PRESETS.map((light) => {
                const isSelected = selectedLighting === light.value
                return (
                  <button
                    key={light.value}
                    type="button"
                    onClick={() => setSelectedLighting(light.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                      isSelected
                        ? 'border-accent bg-accent/15 ring-1 ring-accent text-foreground'
                        : 'border-border bg-background/60 text-muted hover:border-border-strong hover:text-foreground',
                    )}
                  >
                    <span className="text-xs font-semibold text-foreground">{light.label}</span>
                    <span className="text-[10px] text-muted leading-tight line-clamp-2">
                      {light.tagline}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Architectural Style Preset */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold tracking-wide text-foreground">
                4. Architectural Style & Material Palette
              </label>
              <span className="text-xs text-muted">{ARCHITECTURAL_STYLES.length} curated profiles</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              {ARCHITECTURAL_STYLES.map((style) => {
                const isSelected = selectedStyle === style.value
                return (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setSelectedStyle(style.value)}
                    className={cn(
                      'group relative flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-all',
                      isSelected
                        ? 'border-accent bg-accent/[0.08] ring-1 ring-accent shadow-md shadow-accent/5'
                        : 'border-border bg-background/60 hover:border-border-strong hover:bg-background',
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{style.label}</span>
                      {isSelected && <span className="size-2 rounded-full bg-accent" />}
                    </div>
                    <span className="text-[11px] leading-tight text-muted">{style.tagline}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5. Environment & Geometry Strength Sliders */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Surroundings / Environment */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Surroundings & Landscape
              </label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                {ENVIRONMENT_PRESETS.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label} ({env.tagline})
                  </option>
                ))}
              </select>
            </div>

            {/* Geometry Adherence / Structural Strength Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-accent" />
                  <span>Geometry Adherence: {(geometryStrength * 100).toFixed(0)}%</span>
                </label>
                <span className="text-[11px] text-muted">
                  {geometryStrength <= 0.35
                    ? 'Strict Structural Lines'
                    : geometryStrength <= 0.48
                    ? 'Balanced Photorealism'
                    : 'Creative Realism'}
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="0.65"
                step="0.01"
                value={geometryStrength}
                onChange={(e) => setGeometryStrength(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-raised accent-accent"
              />
              <div className="flex justify-between text-[10px] text-muted">
                <span>0.25 (Strict Geometry)</span>
                <span>0.42 (Optimal Vibe3D)</span>
                <span>0.65 (Richer Materials)</span>
              </div>
            </div>
          </div>

          {/* 6. Aspect Ratio & Project Link */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Aspect Ratio */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Render Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    type="button"
                    onClick={() => setSelectedAspect(ratio.value)}
                    className={cn(
                      'flex items-center justify-center rounded-xl border py-2 text-xs font-medium transition-colors',
                      selectedAspect === ratio.value
                        ? 'border-accent bg-accent/10 text-foreground'
                        : 'border-border bg-background text-muted hover:border-border-strong hover:text-foreground',
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Link to Project */}
            <div className="flex flex-col gap-2">
              <label htmlFor="project-select" className="text-sm font-medium text-foreground">
                Link to Project <span className="text-xs text-muted">(Optional)</span>
              </label>
              <div className="flex flex-col gap-2">
                <select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="">No project (Standalone render)</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.type})
                    </option>
                  ))}
                </select>

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
            </div>
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
              placeholder="e.g. Low-iron clear glass, honed travertine facade, charred shou sugi ban cedar, bronze mullions..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {QUICK_MATERIAL_TAGS.map((tag) => (
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight text-foreground">Render Gallery</h2>
            <p className="text-xs text-muted">
              {renders.length} {renders.length === 1 ? 'render' : 'renders'} synthesized and saved in database
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : renders.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No renders yet"
            description="Upload a 3D model viewport capture or choose a preset model above to generate your first photorealistic visualization."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {renders.map((render) => {
              const matchedStyle = ARCHITECTURAL_STYLES.find((s) => s.value === render.style)
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

                    {/* Gradient overlay for tags */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none z-10">
                      <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md uppercase">
                        {render.engine || 'HyperReal'}
                      </span>
                      <span className="rounded-full bg-accent/80 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                        {matchedStyle?.label || render.style}
                      </span>
                    </div>

                    {/* Quick Edit & Lightbox Action Icons */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      <Link
                        to={`/app/renders/${render.id}`}
                        title="Open Render Studio & Edit Page"
                        className="flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-md border border-white/15 hover:border-accent hover:bg-accent hover:text-background transition-all shadow-md cursor-pointer"
                      >
                        <Sliders className="size-3 text-accent hover:text-inherit" />
                        <span>Edit Scene</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setActiveLightboxRender(render)}
                        title="View Fullscreen Comparison"
                        className="grid size-7 place-items-center rounded-full bg-black/70 text-white/90 backdrop-blur-md hover:bg-white/20 transition-colors"
                      >
                        <Maximize2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Project tag if attached - clicking redirects to project edit page */}
                    {matchedProject ? (
                      <Link
                        to={`/app/projects/${matchedProject.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`Open and edit project "${matchedProject.name}"`}
                        className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-medium text-white/95 backdrop-blur-md border border-white/10 hover:border-accent hover:bg-accent hover:text-background transition-all shadow-md group/proj cursor-pointer"
                      >
                        <Folder className="size-3 text-accent group-hover/proj:text-background transition-colors" />
                        <span className="truncate max-w-[150px]">{matchedProject.name}</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/app/renders/${render.id}`}
                        title="Open in Scene Studio"
                        className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md border border-white/10 hover:border-accent hover:bg-accent hover:text-background transition-all shadow-md cursor-pointer"
                      >
                        <Sparkles className="size-3 text-accent" />
                        <span>Scene Studio</span>
                      </Link>
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
                        title={`Open edit page for: ${render.prompt}`}
                        className="line-clamp-2 text-sm font-medium text-foreground hover:text-accent transition-colors block"
                      >
                        {render.prompt}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                        <span className="capitalize">{render.lighting?.replace('-', ' ') || 'Golden hour'}</span>
                        <span>·</span>
                        <span>{(render.geometryStrength ? render.geometryStrength * 100 : 42).toFixed(0)}% adherence</span>
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

                      <div className="flex items-center gap-1.5">
                        <Vibe3dSceneToolbar
                          render={render}
                          variant="compact"
                          onOpenEdit={() => setActiveEditRender(render)}
                          onOpenRelight={() => setActiveRelightRender(render)}
                          onOpenEnhance={() => setActiveEnhanceRender(render)}
                          onOpenCloseups={() => setActiveCloseupsRender(render)}
                          onOpenFlythrough={() => setActiveFlythroughRender(render)}
                          onOpenCompare={() => setActiveLightboxRender(render)}
                        />
                        <button
                          type="button"
                          onClick={() => setRenderToDelete(render)}
                          title="Delete render"
                          className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 ml-1"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
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
            <div className="relative flex max-h-[64vh] items-center justify-center bg-black/50 p-6 overflow-y-auto">
              <div className="w-full max-w-4xl">
                {activeLightboxRender.sourceImageUrl ? (
                  <BeforeAfterSlider
                    beforeSrc={activeLightboxRender.sourceImageUrl}
                    afterSrc={activeLightboxRender.imageUrl}
                    beforeLabel="Original 3D Model"
                    afterLabel="Photo Real Render"
                    showControls={true}
                    aspectClass="aspect-[16/9]"
                  />
                ) : (
                  <img
                    src={resolveImageUrl(activeLightboxRender.imageUrl)}
                    alt={activeLightboxRender.prompt}
                    className="max-h-[56vh] w-auto max-w-full mx-auto rounded-xl object-contain shadow-2xl"
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
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {activeLightboxRender.enhancedPrompt}
                  </p>
                </div>
              )}

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
                    <a
                      href={resolveImageUrl(activeLightboxRender.imageUrl)}
                      download={`renderly-render-${activeLightboxRender.id}.jpg`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm">
                        <Download className="size-3.5" />
                        Download
                      </Button>
                    </a>
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
    </div>
  )
}
