import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { SerifAccent } from '@/components/ui/section-heading'

export function Cta() {
  return (
    <section className="px-5 pb-24 md:px-8 md:pb-32">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border-strong">
        <img
          src="/images/gallery-pavilion.png"
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-6 px-6 py-20 text-center md:py-28">
          <h2 className="max-w-3xl text-balance text-4xl font-medium tracking-tight text-foreground md:text-6xl">
            Your next client meeting starts with <SerifAccent>a better render.</SerifAccent>
          </h2>
          <p className="max-w-lg text-pretty text-foreground/75">
            Create your first project in minutes. No credit card required.
          </p>
          <Link to="/register" className={buttonVariants({ size: 'lg' })}>
            Get started free
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}
