import { MoveHorizontal } from 'lucide-react'
import { useState } from 'react'
import { SectionHeading, SerifAccent } from '@/components/ui/section-heading'

export function BeforeAfter() {
  const [position, setPosition] = useState(50)

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Before / After"
            title={
              <>
                Your viewport, <SerifAccent>reimagined</SerifAccent>
              </>
            }
          />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Drag the handle to compare a raw untextured model against the final AI render — same camera, same geometry.
          </p>
        </div>

        <div className="relative mt-12 aspect-[16/9] select-none overflow-hidden rounded-2xl border border-border-strong">
          <img
            src="/images/compare-after.png"
            alt="Final AI render of a living room with warm lighting and natural materials"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
          <img
            src="/images/compare-before.png"
            alt="Untextured grey clay model of the same living room"
            className="absolute inset-0 size-full object-cover"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            loading="lazy"
          />

          <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs text-foreground backdrop-blur">
            Clay model
          </span>
          <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            AI render
          </span>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-foreground"
            style={{ left: `${position}%` }}
          >
            <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background shadow-lg">
              <MoveHorizontal className="size-4" />
            </span>
          </div>

          <label htmlFor="compare-slider" className="sr-only">
            Comparison position
          </label>
          <input
            id="compare-slider"
            type="range"
            min={0}
            max={100}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="absolute inset-0 size-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
    </section>
  )
}
