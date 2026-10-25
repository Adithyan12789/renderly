import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from './button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl transition-all"
      >
        <div className="flex items-start gap-4">
          {isDestructive && (
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <h3 id="confirm-dialog-title" className="text-lg font-medium text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'primary'}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
