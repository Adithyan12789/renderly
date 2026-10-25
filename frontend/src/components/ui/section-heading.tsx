import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({ eyebrow, title, description, align = 'left', className }: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-4', align === 'center' && 'items-center text-center', className)}>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="max-w-2xl text-balance text-3xl font-medium tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg">{description}</p>
      ) : null}
    </div>
  )
}

export function SerifAccent({ children }: { children: ReactNode }) {
  return <span className="font-serif text-[1.1em] font-normal italic text-accent">{children}</span>
}
