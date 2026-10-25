import axios, { isAxiosError } from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url || ''
      // Only clear auth if it's not a login or register check
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        try {
          // Dynamic import or direct store access
          localStorage.removeItem('renderly_user')
          localStorage.removeItem('lucent_user')
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
