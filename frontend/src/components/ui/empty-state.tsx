import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 grid size-11 place-items-center rounded-xl border border-border bg-surface-raised text-accent">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-pretty text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
