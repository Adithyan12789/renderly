import { FolderPlus, Loader2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api'
import { PROJECT_TYPES } from '@/lib/site-content'
import { projectsService } from '@/services/projects'
import { toast } from '@/stores/toast-store'
import type { Project, ProjectType } from '@/types'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (project: Project) => void
  title?: string
  description?: string
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Create New Project',
  description = 'Projects organize your 3D models, photorealistic renders, and cinematic flythroughs.',
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ProjectType>('architecture')
  const [projectDescription, setProjectDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Please enter a project name.')
      return
    }

    try {
      setIsSubmitting(true)
      const created = await projectsService.create({
        name: trimmedName,
        type,
        description: projectDescription.trim(),
      })

      toast.success(`Project "${created.name}" created successfully!`)
      setName('')
      setProjectDescription('')
      setType('architecture')
      onSuccess(created)
      onClose()
    } catch (err) {
      console.error('Failed to create project:', err)
      toast.error(getErrorMessage(err), 'Project Creation Notice')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-accent/15 text-accent border border-accent/20">
              <FolderPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <p className="text-xs text-muted leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* Project Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-project-name" className="text-xs font-semibold text-foreground">
              Project Name <span className="text-accent">*</span>
            </label>
            <input
              id="modal-project-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Villa Horizon, Skyline Tower..."
              className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {/* Project Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-project-type" className="text-xs font-semibold text-foreground">
              Typology
            </label>
            <select
              id="modal-project-type"
              value={type}
              onChange={(e) => setType(e.target.value as ProjectType)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none capitalize"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-project-desc" className="text-xs font-semibold text-foreground">
              Description <span className="text-xs text-muted font-normal">(Optional)</span>
            </label>
            <textarea
              id="modal-project-desc"
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="e.g. Modern coastal architectural concept with cantilevered decks and natural stone..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <FolderPlus className="size-3.5" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
