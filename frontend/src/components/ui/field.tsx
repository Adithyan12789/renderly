import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const controlClass =
  'w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-accent/60 focus:outline-none aria-invalid:border-danger/70 disabled:opacity-60'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'min-h-24 py-2.5', className)} {...props} />
}

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
      {message}
    </div>
  )
}
