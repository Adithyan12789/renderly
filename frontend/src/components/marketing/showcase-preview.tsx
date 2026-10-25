import { Box, Camera, Layers, MousePointer2, Sparkles, Sun } from 'lucide-react'

const TOOLS = [MousePointer2, Box, Camera, Sun, Layers]

const PROPERTIES = [
  { label: 'Style', value: 'Modern Luxury' },
  { label: 'Time of day', value: 'Golden hour' },
  { label: 'Lens', value: '24mm' },
  { label: 'Exposure', value: '+0.3 EV' },
]

export function ShowcasePreview() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <p className="truncate text-xs text-muted">Hillside Residence — Render Studio</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-accent">
          <Sparkles className="size-3" aria-hidden="true" />
          Rendering 4K
        </span>
      </div>

      <div className="flex">
        <div className="hidden flex-col gap-1 border-r border-border p-2 md:flex" aria-hidden="true">
          {TOOLS.map((Icon, index) => (
            <span
              key={index}
              className={
                index === 2
                  ? 'grid size-9 place-items-center rounded-lg bg-white/10 text-foreground'
                  : 'grid size-9 place-items-center rounded-lg text-muted'
              }
            >
              <Icon className="size-4" />
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <img
            src="/images/hero-villa.png"
            alt="Photorealistic AI render of a modern hillside villa at golden hour with an infinity pool"
            className="aspect-[16/9] w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/55 p-2.5 backdrop-blur-md md:right-auto md:w-96">
            <Sparkles className="size-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="truncate text-xs text-foreground/90">
              Warm evening light, travertine deck, reflections on the pool
            </p>
          </div>
        </div>

        <aside className="hidden w-60 shrink-0 flex-col gap-5 border-l border-border p-4 lg:flex" aria-label="Render settings preview">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Render settings</p>
          <dl className="flex flex-col gap-3">
            {PROPERTIES.map((property) => (
              <div key={property.label} className="flex flex-col gap-1">
                <dt className="text-[11px] text-muted">{property.label}</dt>
                <dd className="rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-foreground">
                  {property.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-muted">
              <span>Progress</span>
              <span>72%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-accent" />
            </div>
          </div>
        </aside>
      </div>
      <figcaption className="sr-only">Preview of the Renderly render editor</figcaption>
    </figure>
  )
}
