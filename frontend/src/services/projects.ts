import { api } from '@/lib/api'
import type { ApiSuccess, Project, ProjectType } from '@/types'

export interface CreateProjectPayload {
  name: string
  description: string
  type: ProjectType
}

export const projectsService = {
  create: (payload: CreateProjectPayload) =>
    api.post<ApiSuccess<{ project: Project }>>('/projects', payload).then((r) => r.data.data.project),
  list: () =>
    api.get<ApiSuccess<{ projects: Project[] }>>('/projects').then((r) => r.data.data.projects),
  get: (id: string) =>
    api.get<ApiSuccess<{ project: Project }>>(`/projects/${id}`).then((r) => r.data.data.project),
  update: (id: string, payload: Partial<CreateProjectPayload> & { thumbnailUrl?: string | null }) =>
    api.patch<ApiSuccess<{ project: Project }>>(`/projects/${id}`, payload).then((r) => r.data.data.project),
  delete: (id: string) =>
    api.delete<ApiSuccess<null>>(`/projects/${id}`).then((r) => r.data),
}
