import {
  ArrowLeft,
  Box,
  Boxes,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BeforeAfterSlider } from '@/components/app/before-after-slider'
import { CinematicFlythroughModal } from '@/components/app/cinematic-flythrough-modal'
import { CloseupsModal } from '@/components/app/closeups-modal'
import { HyperRealEnhanceModal } from '@/components/app/hyperreal-enhance-modal'
import { RelightModal } from '@/components/app/relight-modal'
import { RenderEditModal } from '@/components/app/render-edit-modal'
import { Spatial3dRenderModal } from '@/components/app/spatial-3d-render-modal'
import { Vibe3dSceneToolbar } from '@/components/app/vibe3d-scene-toolbar'
import { Button, buttonVariants } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Field, Input, Textarea } from '@/components/ui/field'
import { getErrorMessage, resolveImageUrl } from '@/lib/api'
import { PROJECT_TYPES } from '@/lib/site-content'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import type { Project, ProjectType, Render } from '@/types'

export function ProjectEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [renders, setRenders] = useState<Render[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ProjectType>('architecture')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Vibe3D Modals State
  const [activeLightboxRender, setActiveLightboxRender] = useState<Render | null>(null)
  const [activeFlythroughRender, setActiveFlythroughRender] = useState<Render | null>(null)
  const [activeEditRender, setActiveEditRender] = useState<Render | null>(null)
  const [activeRelightRender, setActiveRelightRender] = useState<Render | null>(null)
  const [activeCloseupsRender, setActiveCloseupsRender] = useState<Render | null>(null)
  const [activeEnhanceRender, setActiveEnhanceRender] = useState<Render | null>(null)
  const [active3DModalRender, setActive3DModalRender] = useState<Render | null>(null)
  const [renderToDelete, setRenderToDelete] = useState<Render | null>(null)
  const [isDeletingRender, setIsDeletingRender] = useState(false)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setIsLoading(true)

    Promise.all([projectsService.get(id), rendersService.list(id)])
      .then(([projData, rendersData]) => {
        if (!mounted) return
        setProject(projData)
        setName(projData.name)
        setDescription(projData.description || '')
        setType(projData.type)
        setThumbnailUrl(projData.thumbnailUrl)
        setRenders(rendersData || [])
      })
      .catch((err) => {
        console.error('Failed to load project details:', err)
        toast.error('Project could not be found.')
        navigate('/app/projects')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id, navigate])

  async function handleSaveProjectDetails(e: FormEvent) {
    e.preventDefault()
    if (!id || !name.trim()) return

    setIsSavingDetails(true)
    try {
      const updated = await projectsService.update(id, {
        name: name.trim(),
        description: description.trim(),
        type,
        thumbnailUrl,
      })
      setProject(updated)
      setIsFormOpen(false)
      toast.success(`Project "${updated.name}" updated successfully!`)
    } catch (err) {
      toast.error(getErrorMessage(err), 'Failed to update project')
    } finally {
      setIsSavingDetails(false)
    }
  }

  async function handleDeleteRenderConfirm() {
    if (!renderToDelete) return
    setIsDeletingRender(true)
    try {
      await rendersService.delete(renderToDelete.id)
      setRenders((prev) => prev.filter((r) => r.id !== renderToDelete.id))
      toast.success('Render deleted successfully.')
      setRenderToDelete(null)
    } catch (err) {
      toast.error(getErrorMessage(err), 'Failed to delete render')
    } finally {
      setIsDeletingRender(false)
    }
  }

  const handleAddNewVersion = (newRender: Render) => {
    setRenders((prev) => [newRender, ...prev])
    setActiveLightboxRender(newRender)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!project) return null

  const typeLabel = PROJECT_TYPES.find((t) => t.value === project.type)?.label || project.type

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link to="/app/projects" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          <span>Projects</span>
        </Link>
        <ChevronRight className="size-3 text-muted/50" />
        <span className="font-medium text-foreground truncate max-w-xs">{project.name}</span>
      </div>

      {/* Project Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Cover Thumbnail */}
            <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-black shadow-md">
              {project.thumbnailUrl ? (
                <img
                  src={resolveImageUrl(project.thumbnailUrl)}
                  alt={project.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-muted">
                  <Boxes className="size-6" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{project.name}</h1>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                  {typeLabel}
                </span>
                <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-[11px] text-muted border border-border">
                  {renders.length} {renders.length === 1 ? 'Scene' : 'Scenes'}
                </span>
              </div>
              {project.description ? (
                <p className="text-xs text-muted leading-relaxed line-clamp-2 max-w-2xl">{project.description}</p>
              ) : (
                <p className="text-xs text-muted italic">No project description added yet.</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen((prev) => !prev)}
              className="gap-1.5"
            >
              <Wand2 className="size-3.5 text-accent" />
              <span>{isFormOpen ? 'Close Settings' : 'Edit Project Details'}</span>
            </Button>

            <Link
              to={
                project.type === 'interior'
                  ? `/app/interior?projectId=${project.id}`
                  : `/app/exterior?projectId=${project.id}`
              }
              className={buttonVariants({ size: 'sm', className: 'gap-1.5 shadow-lg shadow-accent/20' })}
            >
              <Plus className="size-3.5" />
              <span>{project.type === 'interior' ? 'Render Interior' : 'Render Exterior'}</span>
            </Link>
          </div>
        </div>

        {/* Collapsible Project Details Edit Form */}
        {isFormOpen && (
          <form
            onSubmit={handleSaveProjectDetails}
            className="mt-6 border-t border-border pt-6 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="edit-name" label="Project Name">
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="e.g. Hillside Villa Residence"
                />
              </Field>

              <Field id="edit-type" label="Project Type">
                <select
                  id="edit-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ProjectType)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.description.split('.')[0]})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id="edit-description" label="Project Description">
              <Textarea
                id="edit-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Architectural style, site context, materials, client notes..."
              />
            </Field>

            {/* Choose cover image from project renders */}
            {renders.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-foreground">Select Cover Thumbnail</span>
                <div className="flex flex-wrap gap-2.5">
                  {renders.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setThumbnailUrl(r.imageUrl)}
                      className={cn(
                        'relative aspect-[4/3] w-20 overflow-hidden rounded-xl border-2 transition-all',
                        thumbnailUrl === r.imageUrl
                          ? 'border-accent ring-2 ring-accent/30 scale-105'
                          : 'border-border/60 hover:border-accent/40 opacity-70 hover:opacity-100',
                      )}
                    >
                      <img src={resolveImageUrl(r.imageUrl)} alt="Option" className="size-full object-cover" />
                      {thumbnailUrl === r.imageUrl && (
                        <div className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] text-background font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" size="sm" disabled={isSavingDetails} className="gap-1.5">
                {isSavingDetails ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save Changes
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Project Scenes Section */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Project Scenes & Renders</h2>
            <p className="text-xs text-muted">
              Manage, relight, enhance, and create flythroughs for all views in {project.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/app/exterior?projectId=${project.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
            >
              <Plus className="size-3.5" />
              <span>Exterior View</span>
            </Link>
            <Link
              to={`/app/interior?projectId=${project.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
            >
              <Plus className="size-3.5" />
              <span>Interior View</span>
            </Link>
          </div>
        </div>

        {renders.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No scenes rendered yet"
            description="Upload your 3D model viewport capture or draft render to add the first scene to this project."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link to={`/app/exterior?projectId=${project.id}`} className={buttonVariants()}>
                  <Sparkles className="size-4" />
                  Render Exterior Scene
                </Link>
                <Link to={`/app/interior?projectId=${project.id}`} className={buttonVariants({ variant: 'outline' })}>
                  <Sparkles className="size-4" />
                  Render Interior Scene
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {renders.map((render) => {
              return (
                <article
                  key={render.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xl hover:shadow-black/30"
                >
                  {/* Before/After Viewport */}
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

                  {/* Card Content & Actions */}
                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div>
                      <Link
                        to={`/app/renders/${render.id}`}
                        title={render.prompt}
                        className="line-clamp-2 text-sm font-medium text-foreground hover:text-accent transition-colors block"
                      >
                        {render.prompt}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                        <span className="capitalize">{render.lighting?.replace('-', ' ') || 'Golden hour'}</span>
                        <span>·</span>
                        <span className="uppercase">{render.aspectRatio}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <span className="text-[11px] text-muted">
                        {new Date(render.createdAt).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActive3DModalRender(render)}
                          title="View 3D Spatial Mesh"
                          className="grid size-8 place-items-center rounded-lg border border-border bg-surface-raised text-muted transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-400"
                        >
                          <Box className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = resolveImageUrl(render.imageUrl)
                            link.download = `render-${render.id}.jpg`
                            link.target = '_blank'
                            link.click()
                          }}
                          title="Download render"
                          className="grid size-8 place-items-center rounded-lg border border-border bg-surface-raised text-muted transition-colors hover:border-border-strong hover:bg-surface hover:text-foreground"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenderToDelete(render)}
                          title="Delete scene"
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
      </section>

      {/* Lightbox Modal */}
      {activeLightboxRender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveLightboxRender(null)}
          />
          <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent uppercase">
                  {activeLightboxRender.engine || 'HyperReal'} Engine
                </span>
                <span className="text-xs text-muted capitalize">
                  {activeLightboxRender.style.replace('-', ' ')} ·{' '}
                  {activeLightboxRender.lighting?.replace('-', ' ') || 'Golden hour'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxRender(null)}
                className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
              >
                ✕
              </button>
            </div>

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

            {/* Footer with Vibe3D Toolbar */}
            <div className="flex flex-col gap-4 border-t border-border p-6 overflow-y-auto">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Title / Prompt</p>
                <p className="mt-1 text-sm text-foreground">{activeLightboxRender.prompt}</p>
              </div>

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
      )}

      {/* Flythrough Modal */}
      {activeFlythroughRender && (
        <CinematicFlythroughModal
          render={activeFlythroughRender}
          isOpen={Boolean(activeFlythroughRender)}
          onClose={() => setActiveFlythroughRender(null)}
        />
      )}

      {/* Retouch Modal */}
      {activeEditRender && (
        <RenderEditModal
          render={activeEditRender}
          isOpen={Boolean(activeEditRender)}
          onClose={() => setActiveEditRender(null)}
          onRenderUpdated={handleAddNewVersion}
        />
      )}

      {/* Relight Modal */}
      {activeRelightRender && (
        <RelightModal
          render={activeRelightRender}
          isOpen={Boolean(activeRelightRender)}
          onClose={() => setActiveRelightRender(null)}
          onRelitSuccess={handleAddNewVersion}
        />
      )}

      {/* Closeups Modal */}
      {activeCloseupsRender && (
        <CloseupsModal
          render={activeCloseupsRender}
          isOpen={Boolean(activeCloseupsRender)}
          onClose={() => setActiveCloseupsRender(null)}
          onCloseupSuccess={handleAddNewVersion}
        />
      )}

      {/* Enhance Modal */}
      {activeEnhanceRender && (
        <HyperRealEnhanceModal
          render={activeEnhanceRender}
          isOpen={Boolean(activeEnhanceRender)}
          onClose={() => setActiveEnhanceRender(null)}
          onEnhanceSuccess={handleAddNewVersion}
        />
      )}

      {/* Spatial 3D Render Modal */}
      {active3DModalRender && (
        <Spatial3dRenderModal
          render={active3DModalRender}
          isOpen={Boolean(active3DModalRender)}
          onClose={() => setActive3DModalRender(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(renderToDelete)}
        title="Delete this scene?"
        description="This render and its image file will be permanently removed. This action cannot be undone."
        confirmText="Delete render"
        isDestructive={true}
        isLoading={isDeletingRender}
        onConfirm={handleDeleteRenderConfirm}
        onClose={() => setRenderToDelete(null)}
      />
    </div>
  )
}
