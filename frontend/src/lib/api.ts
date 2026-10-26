import axios, { isAxiosError } from 'axios'

const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
const baseURL = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('renderly_token') || localStorage.getItem('lucent_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // Ignore storage issues
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url || ''
      // Only clear auth if it's not a login or register check
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        try {
          localStorage.removeItem('renderly_user')
          localStorage.removeItem('lucent_user')
          localStorage.removeItem('renderly_token')
          localStorage.removeItem('lucent_token')
        } catch {
          // Ignore
        }
      }
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const serverMessage = error.response?.data?.error?.message
    if (typeof serverMessage === 'string') return serverMessage
    if (!error.response) return 'Unable to reach the Renderly API. Make sure the server is running.'
    return `Request failed (${error.response.status}).`
  }
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  if (url.startsWith('/uploads/')) {
    const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:4000')
      .replace(/\/api\/?$/, '')
      .replace(/\/+$/, '')
    return `${apiOrigin}${url}`
  }
  return url
}

