import { Camera, Upload, Wand2, Zap } from 'lucide-react'
import { SectionHeading, SerifAccent } from '@/components/ui/section-heading'

const STEPS = [
  {
    icon: Upload,
    title: 'Import',
    description: 'Upload GLB or glTF models along with textures and reference images into a private project.',
  },
  {
    icon: Camera,
    title: 'Design',
    description: 'Orbit the scene in the browser editor, tune lighting and materials, and save camera angles.',
  },
  {
    icon: Wand2,
    title: 'Render',
    description: 'Choose a style and prompt. AI renders and walkthrough videos process as background jobs.',
  },
  {
    icon: Zap,
    title: 'Refine & Relight',
    description: 'Simulate natural lighting shifts, synthesize macro detail close-ups, and upscale to 8K.',
  },
]

export function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-20 border-y border-border bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Workflow"
          align="center"
          className="mx-auto"
          title={
            <>
              From upload to client-ready in <SerifAccent>four steps</SerifAccent>
            </>
          }
        />
        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-6 bg-background p-7">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl border border-border bg-surface-raised text-accent">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
