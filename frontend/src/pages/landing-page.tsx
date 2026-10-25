import { BeforeAfter } from '@/components/marketing/before-after'
import { Cta } from '@/components/marketing/cta'
import { Faq } from '@/components/marketing/faq'
import { Features } from '@/components/marketing/features'
import { Gallery } from '@/components/marketing/gallery'
import { Hero } from '@/components/marketing/hero'
import { Pricing } from '@/components/marketing/pricing'
import { Workflow } from '@/components/marketing/workflow'

export function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Workflow />
      <BeforeAfter />
      <Gallery />
      <Pricing />
      <Faq />
      <Cta />
    </>
  )
}
