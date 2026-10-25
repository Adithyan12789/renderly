import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore, type ToastType } from '@/stores/toast-store'

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES: Record<ToastType, { icon: string; border: string; bg: string }> = {
  success: {
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-950/20',
  },
  error: {
    icon: 'text-rose-400',
    border: 'border-rose-500/20',
    bg: 'bg-rose-950/20',
  },
  info: {
    icon: 'text-sky-400',
    border: 'border-sky-500/20',
    bg: 'bg-sky-950/20',
  },
  warning: {
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-950/20',
  },
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed top-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        const style = STYLES[toast.type]

        return (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-200',
              'bg-surface-raised/95 text-foreground',
              style.border,
              style.bg,
            )}
          >
            <span className={cn('mt-0.5 shrink-0', style.icon)}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex-1 text-sm">
              {toast.title && <p className="font-semibold text-foreground">{toast.title}</p>}
              <p className={cn('text-xs leading-relaxed text-muted-foreground', !toast.title && 'text-sm text-foreground')}>
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Dismiss notification</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
