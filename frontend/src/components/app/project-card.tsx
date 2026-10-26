import { Boxes, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PROJECT_TYPES } from '@/lib/site-content'
import type { Project } from '@/types'

const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })

const TYPE_FALLBACK_IMAGES: Record<string, string> = {
  architecture: '/images/hero-villa.png',
  interior: '/images/gallery-loft.png',
  product: '/images/gallery-pavilion.png',
}

interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => Promise<void> | void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const typeLabel = PROJECT_TYPES.find((type) => type.value === project.type)?.label ?? project.type
  const displayThumbnail = project.thumbnailUrl || TYPE_FALLBACK_IMAGES[project.type]

  async function handleDeleteConfirm() {
    if (!onDelete) return
    try {
      setIsDeleting(true)
      await onDelete(project.id)
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xl hover:shadow-black/20">
        <Link to={`/app/projects/${project.id}`} className="block relative aspect-[4/3] overflow-hidden bg-surface-raised cursor-pointer">
          {displayThumbnail ? (
            <img
              src={displayThumbnail}
              alt={project.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="grid size-full place-items-center text-muted">
              <Boxes className="size-8" aria-hidden="true" />
            </div>
          )}

          {/* Type badge overlay */}
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
              {typeLabel}
            </span>
          </div>

          {/* Delete action button */}
          {onDelete && (
            <div className="absolute top-3 right-3 opacity-90 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConfirm(true)
                }}
                title="Delete project"
                className="grid size-8 place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur-md transition-colors hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sr-only">Delete {project.name}</span>
              </button>
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col justify-between gap-2 p-4">
          <div>
            <Link to={`/app/projects/${project.id}`} className="hover:text-accent transition-colors">
              <h3 className="truncate font-medium text-foreground hover:text-accent" title={project.name}>
                {project.name}
              </h3>
            </Link>
            {project.description ? (
              <p className="mt-1 line-clamp-1 text-xs text-muted" title={project.description}>
                {project.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted">
            <span>Edited {dateFormatter.format(new Date(project.updatedAt))}</span>
          </div>
        </div>
      </article>

      <ConfirmDialog
        isOpen={showConfirm}
        title={`Delete "${project.name}"?`}
        description="This project and its settings will be permanently removed from MongoDB. This action cannot be undone."
        confirmText="Delete project"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setShowConfirm(false)}
      />
    </>
  )
}
