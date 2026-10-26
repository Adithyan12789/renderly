import { api } from '@/lib/api'
import type { ApiSuccess, GenerateRenderPayload, Project, Render } from '@/types'

export const rendersService = {
  list: (projectId?: string) =>
    api
      .get<ApiSuccess<{ renders: Render[] }>>('/renders', {
        params: projectId ? { projectId } : undefined,
      })
      .then((r) => r.data.data.renders),

  get: (id: string) =>
    api.get<ApiSuccess<{ render: Render }>>(`/renders/${id}`).then((r) => r.data.data.render),

  update: (
    id: string,
    payload: { prompt?: string; projectId?: string | null; style?: string; lighting?: string },
  ) =>
    api
      .patch<ApiSuccess<{ render: Render }>>(`/renders/${id}`, payload)
      .then((r) => r.data.data.render),

  generate: (payload: GenerateRenderPayload) =>
    api
      .post<ApiSuccess<{ render: Render }>>('/renders/generate', payload, {
        timeout: 90_000, // Image generation may take up to 90s
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

  edit: (renderId: string, payload: { editPrompt: string; strength?: number }) =>
    api
      .post<ApiSuccess<{ render: Render }>>(`/renders/${renderId}/edit`, payload, {
        timeout: 90_000,
      })
      .then((r) => r.data.data.render),

  saveAdjustment: (renderId: string, payload: { dataUrl: string; label?: string }) =>
    api
      .post<ApiSuccess<{ render: Render }>>(`/renders/${renderId}/save-adjustment`, payload)
      .then((r) => r.data.data.render),

  relight: (renderId: string, payload: import('@/types').RelightPayload) =>
    api
      .post<ApiSuccess<{ render: Render }>>(`/renders/${renderId}/relight`, payload, {
        timeout: 90_000,
      })
      .then((r) => r.data.data.render),

  enhance: (renderId: string) =>
    api
      .post<ApiSuccess<{ render: Render }>>(`/renders/${renderId}/enhance`, {}, {
        timeout: 90_000,
      })
      .then((r) => r.data.data.render),

  closeups: (renderId: string, targets: import('@/types').CloseupTarget[]) =>
    api
      .post<ApiSuccess<{ render: Render; closeups: Array<{ id: string; label: string; imageUrl: string }> }>>(
        `/renders/${renderId}/closeups`,
        { targets },
        { timeout: 90_000 },
      )
      .then((r) => r.data.data),

  getVersions: (renderId: string) =>
    api
      .get<ApiSuccess<{ versions: Render[] }>>(`/renders/${renderId}/versions`)
      .then((r) => r.data.data.versions),
}
