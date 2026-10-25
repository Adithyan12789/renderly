import { Search } from 'lucide-react'
import { Input } from '@/components/ui/field'
import { PROJECT_TYPES } from '@/lib/site-content'
import type { ProjectType } from '@/types'

export type ProjectSort = 'updated' | 'created'

export interface ProjectFilters {
  query: string
  type: ProjectType | 'all'
  sort: ProjectSort
}

interface ProjectToolbarProps {
  filters: ProjectFilters
  onChange: (filters: ProjectFilters) => void
}

const selectClass =
  'h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-accent/60 focus:outline-none'

export function ProjectToolbar({ filters, onChange }: ProjectToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        <Input
          id="project-search"
          type="search"
          placeholder="Search projects"
          className="pl-9"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>
      <div className="flex gap-3">
        <label htmlFor="project-type" className="sr-only">
          Filter by type
        </label>
        <select
          id="project-type"
          className={selectClass}
          value={filters.type}
          onChange={(event) => onChange({ ...filters, type: event.target.value as ProjectFilters['type'] })}
        >
          <option value="all">All types</option>
          {PROJECT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <label htmlFor="project-sort" className="sr-only">
          Sort projects
        </label>
        <select
          id="project-sort"
          className={selectClass}
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as ProjectSort })}
        >
          <option value="updated">Last modified</option>
          <option value="created">Date created</option>
        </select>
      </div>
    </div>
  )
}
