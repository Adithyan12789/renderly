import {
  Download,
  Folder,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { getErrorMessage } from '@/lib/api'
import { ARCHITECTURAL_STYLES } from '@/lib/site-content'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { Project, Render, RenderAspectRatio, RenderStyle } from '@/types'

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

  // Form State
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<RenderStyle>('modern-luxury')
  const [selectedAspect, setSelectedAspect] = useState<RenderAspectRatio>('16:9')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [setAsThumbnail, setSetAsThumbnail] = useState(false)

  // Modal / Lightbox State
  const [activeLightboxRender, setActiveLightboxRender] = useState<Render | null>(null)
  const [renderToDelete, setRenderToDelete] = useState<Render | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Initial fetch
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

  const currentStyleConfig =
    ARCHITECTURAL_STYLES.find((s) => s.value === selectedStyle) ?? ARCHITECTURAL_STYLES[0]

  async function handleGenerate(e: FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) {
      toast.error('Please enter a description or prompt for your architectural render.')
      return
    }

    try {
      setIsGenerating(true)
      const newRender = await rendersService.generate({
        prompt: prompt.trim(),
        style: selectedStyle,
        aspectRatio: selectedAspect,
        projectId: selectedProjectId || null,
        setAsThumbnail,
      })

      setRenders((prev) => [newRender, ...prev])
      toast.success('Architectural render synthesized successfully!', 'Render complete')

      // If set as thumbnail, update local project list
      if (selectedProjectId && setAsThumbnail) {
        setProjects((prev) =>
          prev.map((p) => (p.id === selectedProjectId ? { ...p, thumbnailUrl: newRender.imageUrl } : p)),
        )
      }
    } catch (err) {
      toast.error(getErrorMessage(err), 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDeleteRender() {
    if (!renderToDelete) return
    try {
      setIsDeleting(true)
      await rendersService.delete(renderToDelete.id)
      setRenders((prev) => prev.filter((r) => r.id !== renderToDelete.id))
      toast.success('Render deleted.', 'Removed')
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
        prev.map((p) => (p.id === targetProjectId ? { ...p, thumbnailUrl: render.imageUrl } : p)),
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
        description="Synthesize photorealistic architectural visualizations from natural language prompts and curated styles."
      />

      {/* Generator Studio Panel */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <form onSubmit={handleGenerate} className="flex flex-col gap-8">
          {/* Prompt Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="render-prompt" className="text-sm font-medium text-foreground">
                Architectural Concept & Prompt
              </label>
              <span className="text-xs text-muted">Be descriptive: materials, site, lighting, atmosphere</span>
            </div>
            <textarea
              id="render-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Cantilevered modern villa overlooking the Mediterranean with infinity pool, travertine walls and warm dusk lighting..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            {/* Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-muted">Try prompt:</span>
              {currentStyleConfig.samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  {sample.length > 55 ? `${sample.slice(0, 55)}…` : sample}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-foreground">
              Architectural Style Preset <span className="text-muted font-normal">({ARCHITECTURAL_STYLES.length} curated profiles)</span>
            </label>
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

          {/* Aspect Ratio & Project Linking Controls */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Aspect Ratio */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
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

          {/* Submit Action */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <div className="text-xs text-muted">
              Powered by server-side AI generation • Prompt optimization applied automatically
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !prompt.trim()}
              className="px-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Generating architectural render…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Generate Render
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
            description="Choose a style preset, write an architectural description, and generate your first photorealistic rendering."
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
                  {/* Image container */}
                  <div
                    onClick={() => setActiveLightboxRender(render)}
                    className="relative aspect-[16/9] cursor-pointer overflow-hidden bg-surface-raised"
                  >
                    <img
                      src={render.imageUrl}
                      alt={render.prompt}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 transition-opacity group-hover:opacity-100" />

                    {/* Style tag */}
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
                        {matchedStyle?.label || render.style}
                      </span>
                    </div>

                    {/* Quick Lightbox Action Icon */}
                    <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveLightboxRender(render)
                        }}
                        title="View full resolution"
                        className="grid size-8 place-items-center rounded-full bg-black/60 text-white/90 backdrop-blur-md hover:bg-white/20"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>

                    {/* Project tag if attached */}
                    {matchedProject && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] text-white/90 backdrop-blur-md">
                        <Folder className="size-3" />
                        <span>{matchedProject.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Details & Actions */}
                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div>
                      <p className="line-clamp-2 text-sm text-foreground" title={render.prompt}>
                        {render.prompt}
                      </p>
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

                      <div className="flex items-center gap-1">
                        <a
                          href={render.imageUrl}
                          download={`renderly-render-${render.id}.jpg`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download high-resolution image"
                          className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                        >
                          <Download className="size-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setRenderToDelete(render)}
                          title="Delete render"
                          className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
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

      {/* Lightbox Modal */}
      {activeLightboxRender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveLightboxRender(null)}
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent capitalize">
                  {activeLightboxRender.style.replace('-', ' ')}
                </span>
                <span className="text-xs text-muted">
                  {new Date(activeLightboxRender.createdAt).toLocaleDateString('en', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxRender(null)}
                className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Image Preview */}
            <div className="relative flex max-h-[60vh] items-center justify-center bg-black/40 p-4">
              <img
                src={activeLightboxRender.imageUrl}
                alt={activeLightboxRender.prompt}
                className="max-h-[56vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>

            {/* Details Footer */}
            <div className="flex flex-col gap-4 border-t border-border p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Prompt</p>
                <p className="mt-1 text-sm text-foreground">{activeLightboxRender.prompt}</p>
              </div>

              {activeLightboxRender.enhancedPrompt !== activeLightboxRender.prompt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Engine Architectural Parameters
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

                <div className="ml-auto flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRenderToDelete(activeLightboxRender)
                    }}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                  <a
                    href={activeLightboxRender.imageUrl}
                    download={`renderly-render-${activeLightboxRender.id}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm">
                      <Download className="size-3.5" />
                      Download High-Res
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
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
