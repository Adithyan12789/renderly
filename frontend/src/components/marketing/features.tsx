import { Check, Film, Presentation, Sparkles, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { SectionHeading, SerifAccent } from '@/components/ui/section-heading'
import { RENDER_STYLES } from '@/lib/site-content'
import { cn } from '@/lib/utils'

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              One model in. <SerifAccent>Every deliverable</SerifAccent> out.
            </>
          }
          description="Renderly replaces a stack of rendering, editing, and layout tools with a single studio built for spatial design."
        />

        <div className="mt-16 flex flex-col gap-20 md:gap-28">
          <FeatureRow
            icon={Sparkles}
            label="AI Rendering"
            title="Photoreal renders from a prompt and a camera angle"
            description="Pick a viewpoint in your model, choose a style, and describe the mood. Renderly uses your scene capture as the source image and enhances materials, lighting, and atmosphere."
            points={['Style and prompt presets', 'Image-to-image from your scene', 'Render history and comparisons']}
            visual={<RenderVisual />}
          />
          <FeatureRow
            reverse
            icon={Film}
            label="Walkthrough Videos"
            title="Choreograph a camera path, export a cinematic tour"
            description="Drop keyframes through your space and Renderly interpolates a smooth, stabilized camera move — rendered in the same style as your stills."
            points={['Keyframe timeline editor', 'Ease and speed controls', 'MP4 export up to 60fps']}
            visual={<WalkthroughVisual />}
          />
          <FeatureRow
            icon={Presentation}
            label="Client Presentations"
            title="Turn renders into a polished, shareable deck"
            description="Assemble renders, palettes, and specifications into branded presentation pages. Share a link or export to PDF for your client meeting."
            points={['Material and palette boards', 'Branded layouts', 'Share links and PDF export']}
            visual={<PresentationVisual />}
          />
        </div>
      </div>
    </section>
  )
}

interface FeatureRowProps {
  icon: LucideIcon
  label: string
  title: string
  description: string
  points: string[]
  visual: ReactNode
  reverse?: boolean
}

function FeatureRow({ icon: Icon, label, title, description, points, visual, reverse }: FeatureRowProps) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={cn('flex flex-col gap-5', reverse && 'md:order-2')}>
        <p className="inline-flex items-center gap-2 text-sm text-accent">
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </p>
        <h3 className="text-balance text-2xl font-medium tracking-tight text-foreground md:text-4xl">{title}</h3>
        <p className="text-pretty leading-relaxed text-muted">{description}</p>
        <ul className="mt-2 flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-3 text-sm text-foreground">
              <span className="grid size-5 place-items-center rounded-full bg-accent/15 text-accent">
                <Check className="size-3" aria-hidden="true" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className={cn(reverse && 'md:order-1')}>{visual}</div>
    </div>
  )
}

function VisualFrame({ children }: { children: ReactNode }) {
  return <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface">{children}</div>
}

function RenderVisual() {
  return (
    <VisualFrame>
      <img
        src="/images/gallery-kitchen.png"
        alt="AI-rendered Japandi kitchen with oak cabinetry and marble island"
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-md">
        <p className="text-xs text-foreground/90">Soft morning light, oak and travertine, minimal styling</p>
        <div className="flex flex-wrap gap-1.5">
          {RENDER_STYLES.slice(0, 5).map((style, index) => (
            <span
              key={style}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px]',
                index === 3 ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 text-foreground/70',
              )}
            >
              {style}
            </span>
          ))}
        </div>
      </div>
    </VisualFrame>
  )
}

const KEYFRAMES = [8, 30, 54, 78]

function WalkthroughVisual() {
  return (
    <VisualFrame>
      <div className="relative">
        <img
          src="/images/gallery-loft.png"
          alt="AI-rendered industrial loft used as a walkthrough scene"
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
        />
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M30 250 C 120 230, 140 160, 210 150 S 330 90, 370 60"
            fill="none"
            stroke="#e3b57a"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          {[
            [30, 250],
            [140, 185],
            [260, 125],
            [370, 60],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill="#0a0a0b" stroke="#e3b57a" strokeWidth="2" />
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-4 border-t border-border p-4">
        <span className="font-mono text-[11px] text-muted">00:12</span>
        <div className="relative h-6 flex-1 rounded-md bg-surface-raised">
          {KEYFRAMES.map((position) => (
            <span
              key={position}
              className="absolute top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-accent"
              style={{ left: `${position}%` }}
            />
          ))}
          <span className="absolute inset-y-0 left-[42%] w-px bg-foreground" />
        </div>
        <span className="font-mono text-[11px] text-muted">00:30</span>
      </div>
    </VisualFrame>
  )
}

const PALETTE = ['#e8dfd3', '#b89a7a', '#6f5a48', '#2f2a26']

function PresentationVisual() {
  return (
    <VisualFrame>
      <div className="grid gap-4 p-4 sm:grid-cols-[1.4fr_1fr]">
        <img
          src="/images/gallery-bedroom.png"
          alt="AI-rendered warm minimal bedroom used on a presentation page"
          className="aspect-[4/5] w-full rounded-lg object-cover"
          loading="lazy"
        />
        <div className="flex flex-col gap-5 py-1">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Primary suite</p>
            <p className="mt-1 font-serif text-2xl italic text-foreground">Warm Minimal</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-muted">Palette</p>
            <div className="flex gap-1.5">
              {PALETTE.map((color) => (
                <span key={color} className="h-8 flex-1 rounded-md border border-white/10" style={{ background: color }} />
              ))}
            </div>
          </div>
          <dl className="flex flex-col gap-2 text-xs">
            {[
              ['Flooring', 'Wide-plank white oak'],
              ['Walls', 'Limewash, warm ivory'],
              ['Textiles', 'Linen, bouclé'],
            ].map(([term, detail]) => (
              <div key={term} className="flex justify-between gap-3 border-b border-border pb-2">
                <dt className="text-muted">{term}</dt>
                <dd className="text-right text-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </VisualFrame>
  )
}
