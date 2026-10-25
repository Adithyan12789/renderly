import { ArrowRight, Play } from 'lucide-react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { SerifAccent } from '@/components/ui/section-heading'
import { ShowcasePreview } from './showcase-preview'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgb(227_181_122/0.14),transparent_65%)]"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-5 pt-20 text-center md:px-8 md:pt-28">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          AI rendering, walkthroughs, and presentations in one studio
        </p>
        <h1 className="max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-tight text-foreground md:text-7xl">
          From 3D Models to <SerifAccent>Cinematic Reality.</SerifAccent>
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted">
          Transform your architectural concepts into stunning AI-enhanced renders, cinematic walkthroughs, and
          client-ready presentations — all in one creative workspace.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link to="/register" className={buttonVariants({ size: 'lg' })}>
            Get started free
            <ArrowRight />
          </Link>
          <Link to={{ pathname: '/', hash: 'workflow' }} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            <Play />
            See how it works
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-7xl px-5 md:mt-20 md:px-8">
        <ShowcasePreview />
      </div>
    </section>
  )
}
