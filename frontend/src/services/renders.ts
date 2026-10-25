import { api } from '@/lib/api'
import type { ApiSuccess, GenerateRenderPayload, Project, Render } from '@/types'

export const rendersService = {
  list: (projectId?: string) =>
    api
      .get<ApiSuccess<{ renders: Render[] }>>('/renders', {
        params: projectId ? { projectId } : undefined,
      })
      .then((r) => r.data.data.renders),

  generate: (payload: GenerateRenderPayload) =>
    api
      .post<ApiSuccess<{ render: Render }>>('/renders/generate', payload, {
        timeout: 60_000, // Image generation may take up to 60s
      })
      .then((r) => r.data.data.render),

  delete: (id: string) =>
    api.delete<ApiSuccess<null>>(`/renders/${id}`).then((r) => r.data),

  setAsThumbnail: (renderId: string, projectId: string) =>
    api
      .patch<ApiSuccess<{ project: Project }>>(`/renders/${renderId}/set-thumbnail`, {
        projectId,
      })
      .then((r) => r.data.data.project),
}
