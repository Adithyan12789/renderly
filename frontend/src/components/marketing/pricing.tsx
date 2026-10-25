import { Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { SectionHeading, SerifAccent } from '@/components/ui/section-heading'
import { BRAND } from '@/lib/site-content'
import { cn } from '@/lib/utils'

type Billing = 'monthly' | 'annual'

const TIERS = [
  {
    name: 'Starter',
    description: 'For trying Renderly on a single project.',
    price: { monthly: 0, annual: 0 },
    features: ['3 projects', '25 AI renders / month', '1080p exports', '2 GB storage'],
    cta: { label: 'Start free', to: '/register' },
    featured: false,
  },
  {
    name: 'Studio',
    description: 'For independent architects and designers.',
    price: { monthly: 39, annual: 31 },
    features: [
      'Unlimited projects',
      '500 AI renders / month',
      '4K renders and walkthrough videos',
      'Presentation builder and share links',
      '50 GB storage',
    ],
    cta: { label: 'Get Studio', to: '/register' },
    featured: true,
  },
  {
    name: 'Enterprise',
    description: 'For firms with teams and brand standards.',
    price: null,
    features: ['Team workspaces and roles', 'Custom render volume', 'SSO and audit logs', 'Dedicated support'],
    cta: { label: 'Contact sales', href: `mailto:${BRAND.contactEmail}` },
    featured: false,
  },
]

export function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly')

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col items-center gap-8">
          <SectionHeading
            eyebrow="Pricing"
            align="center"
            title={
              <>
                Simple plans that <SerifAccent>scale with you</SerifAccent>
              </>
            }
          />
          <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-border bg-surface p-1">
            {(['monthly', 'annual'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={billing === option}
                onClick={() => setBilling(option)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm capitalize transition-colors',
                  billing === option ? 'bg-foreground text-background' : 'text-muted hover:text-foreground',
                )}
              >
                {option}
                {option === 'annual' ? <span className="ml-1.5 text-xs opacity-70">-20%</span> : null}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <li
              key={tier.name}
              className={cn(
                'flex flex-col gap-8 rounded-2xl border p-7',
                tier.featured ? 'border-accent/50 bg-accent/[0.06]' : 'border-border bg-surface',
              )}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">{tier.name}</h3>
                  {tier.featured ? (
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted">{tier.description}</p>
              </div>

              <p className="flex items-baseline gap-1.5">
                {tier.price ? (
                  <>
                    <span className="text-5xl font-medium tracking-tight text-foreground">${tier.price[billing]}</span>
                    <span className="text-sm text-muted">/ month</span>
                  </>
                ) : (
                  <span className="text-5xl font-medium tracking-tight text-foreground">Custom</span>
                )}
              </p>

              <ul className="flex flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {tier.cta.to ? (
                  <Link
                    to={tier.cta.to}
                    className={cn(buttonVariants({ variant: tier.featured ? 'primary' : 'outline' }), 'w-full')}
                  >
                    {tier.cta.label}
                  </Link>
                ) : (
                  <a href={tier.cta.href} className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
                    {tier.cta.label}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
