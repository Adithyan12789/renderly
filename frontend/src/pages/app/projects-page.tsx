import { Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/app/page-header'
import { ProjectsBrowser } from '@/components/app/projects-browser'
import { buttonVariants } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api'
import { projectsService } from '@/services/projects'
import { toast } from '@/stores/toast-store'
import type { Project } from '@/types'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    projectsService
      .list()
      .then((data) => {
        if (mounted) setProjects(data || [])
      })
      .catch((err) => {
        console.error('Failed to load projects:', err)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  async function handleDeleteProject(id: string) {
    try {
      await projectsService.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project was deleted successfully.', 'Project removed')
    } catch (err) {
      toast.error(getErrorMessage(err), 'Failed to delete project')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Projects"
        description="Every model, render, and presentation is organized by project."
        actions={
          <Link to="/app/projects/new" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            New project
          </Link>
        }
      />
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <ProjectsBrowser projects={projects} onDelete={handleDeleteProject} />
      )}
    </div>
  )
}
