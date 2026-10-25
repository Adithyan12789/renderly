import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (newToast) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = newToast.duration ?? 4500

    set((state) => ({
      toasts: [...state.toasts, { ...newToast, id }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }

    return id
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}))

export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', message, title, duration }),
  error: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'error', message, title, duration }),
  info: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', message, title, duration }),
  warning: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', message, title, duration }),
}
