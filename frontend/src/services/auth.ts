import { api } from '@/lib/api'
import type { ApiSuccess, User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  name: string
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<ApiSuccess<{ user: User; token: string }>>('/auth/login', payload).then((r) => r.data.data),
  register: (payload: RegisterPayload) =>
    api.post<ApiSuccess<{ user: User; token: string }>>('/auth/register', payload).then((r) => r.data.data),
  forgotPassword: (email: string) =>
    api.post<ApiSuccess<null>>('/auth/forgot-password', { email }).then((r) => r.data),
  me: () =>
    api.get<ApiSuccess<{ user: User }>>('/auth/me').then((r) => r.data.data),
  logout: () =>
    api.post<ApiSuccess<null>>('/auth/logout').then((r) => r.data),
}
