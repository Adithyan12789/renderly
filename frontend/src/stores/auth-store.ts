import { create } from 'zustand'
import { authService } from '@/services/auth'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  checkAuth: () => Promise<void>
  logout: () => Promise<void>
}

const STORAGE_KEY = 'renderly_user'

function loadSavedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('lucent_user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

const initialUser = loadSavedUser()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialUser),
  isLoading: false,
  isInitialized: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      set({ user, isAuthenticated: true, isInitialized: true })
    } else {
      localStorage.removeItem(STORAGE_KEY)
      set({ user: null, isAuthenticated: false, isInitialized: true })
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true })
      const data = await authService.me()
      if (data?.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
        set({ user: data.user, isAuthenticated: true, isLoading: false, isInitialized: true })
      } else {
        localStorage.removeItem(STORAGE_KEY)
        set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true })
    }
  },

  logout: async () => {
    try {
      await authService.logout()
    } catch {
      // Continue even if network error
    } finally {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('lucent_user')
      set({ user: null, isAuthenticated: false, isInitialized: true })
    }
  },
}))
