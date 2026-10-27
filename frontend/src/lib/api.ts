import axios, { isAxiosError } from 'axios'

const defaultRemoteApi =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://renderly-bw57.onrender.com'
    : 'http://localhost:4000'

const rawBase = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://renderly-bw57.onrender.com'
    : '')
)
  .trim()
  .replace(/\/+$/, '')

const baseURL = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 25_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    const isAdminRoute = config.url?.includes('/admin')
    if (isAdminRoute) {
      config.headers = config.headers || {}
      const adminCode = localStorage.getItem('renderly_admin_code') || sessionStorage.getItem('renderly_admin_code')
      if (adminCode) {
        config.headers['x-admin-code'] = adminCode
      }
      const adminToken = localStorage.getItem('renderly_admin_token')
      if (adminToken) {
        config.headers['x-admin-token'] = adminToken
      }
    } else {
      const token = localStorage.getItem('renderly_token') || localStorage.getItem('lucent_token')
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
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
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`
  if (normalizedUrl.startsWith('/uploads/')) {
    const apiOrigin = (import.meta.env.VITE_API_URL || defaultRemoteApi)
      .replace(/\/api\/?$/, '')
      .replace(/\/+$/, '')
    return `${apiOrigin}${normalizedUrl}`
  }
  return url
}

