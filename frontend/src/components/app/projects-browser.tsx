import { FolderPlus, SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { Project } from '@/types'
import { ProjectCard } from './project-card'
import { ProjectToolbar, type ProjectFilters } from './project-toolbar'

function applyFilters(projects: Project[], { query, type, sort }: ProjectFilters) {
  const needle = query.trim().toLowerCase()
  const sortKey = sort === 'created' ? 'createdAt' : 'updatedAt'
  return projects
    .filter((project) => (type === 'all' || project.type === type) && project.name.toLowerCase().includes(needle))
    .sort((a, b) => b[sortKey].localeCompare(a[sortKey]))
}

interface ProjectsBrowserProps {
  projects: Project[]
  onDelete?: (id: string) => Promise<void> | void
}

export function ProjectsBrowser({ projects, onDelete }: ProjectsBrowserProps) {
  const [filters, setFilters] = useState<ProjectFilters>({ query: '', type: 'all', sort: 'updated' })
  const visible = applyFilters(projects, filters)

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderPlus}
        title="No projects yet"
        description="Create your first project to upload a 3D model, set up camera angles, and start rendering."
        action={
          <Link to="/app/projects/new" className={buttonVariants()}>
            Create a project
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectToolbar filters={filters} onChange={setFilters} />
      {visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No matching projects" description="Try a different search or filter." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
