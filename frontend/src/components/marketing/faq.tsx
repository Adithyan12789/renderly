import { Plus } from 'lucide-react'
import { SectionHeading } from '@/components/ui/section-heading'

const QUESTIONS = [
  {
    q: 'Which 3D file formats can I upload?',
    a: 'GLB and glTF are supported for the initial 3D workflow, with textures and reference images attached to each project. Most tools, including SketchUp, Revit, and Blender, can export glTF.',
  },
  {
    q: 'Does the AI change my design?',
    a: 'Renders start from your actual 3D scene and camera, and use image-to-image enhancement to add materials, lighting, and atmosphere. AI can still alter fine details, so always review renders before sharing them as construction-accurate.',
  },
  {
    q: 'How long does a render take?',
    a: 'Most stills finish in under a minute. Walkthrough videos run as background jobs and you’ll be notified when they’re ready.',
  },
  {
    q: 'Can I share work with clients?',
    a: 'Yes. Presentations can be shared via a private link or exported as a PDF, and all renders can be downloaded in high resolution.',
  },
  {
    q: 'Who owns the renders I create?',
    a: 'You do. Everything generated from your models is yours to use commercially on any paid plan.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[1fr_1.4fr] md:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="size-4 shrink-0 text-muted transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
