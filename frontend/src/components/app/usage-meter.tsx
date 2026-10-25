interface UsageMeterProps {
  label: string
  used: number
  limit: number
  unit?: string
}

export function UsageMeter({ label, used, limit, unit = '' }: UsageMeterProps) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const suffix = unit ? ` ${unit}` : ''

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-foreground">{`${used}${suffix} / ${limit}${suffix}`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} usage`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 overflow-hidden rounded-full bg-white/10"
      >
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
