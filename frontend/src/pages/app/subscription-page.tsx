import {
  Building2,
  Check,
  CheckCircle2,
  Crown,
  FolderKanban,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { loadRazorpayScript } from '@/lib/razorpay'
import { cn } from '@/lib/utils'
import { subscriptionsService } from '@/services/subscriptions'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/stores/toast-store'
import type { UsageData } from '@/types'

export function SubscriptionPage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [isProcessingPlan, setIsProcessingPlan] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    subscriptionsService
      .getUsage()
      .then((usage) => {
        if (!mounted) return
        setUsageData(usage)
      })
      .catch((err) => {
        console.error('Failed to load subscription data:', err)
        toast.error('Unable to fetch subscription details.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  async function handleUpgrade(targetPlanId: 'studio' | 'enterprise') {
    if (user?.plan === targetPlanId) {
      toast.info(`You are already subscribed to the ${targetPlanId.toUpperCase()} plan.`)
      return
    }

    try {
      setIsProcessingPlan(targetPlanId)
      toast.info('Initializing secure Razorpay payment gateway…', 'Please wait')

      // 1. Ensure Razorpay checkout script is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded || !window.Razorpay) {
        toast.error('Could not load Razorpay payment modal. Please check your internet connection.')
        setIsProcessingPlan(null)
        return
      }

      // 2. Create Order on backend
      const orderData = await subscriptionsService.createOrder({
        plan: targetPlanId,
        billingCycle,
      })

      // 3. Configure Razorpay modal
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Oks5Gpac00wL72',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Renderly AI',
        description: `${orderData.planName} Subscription (${billingCycle === 'annual' ? '1 Year' : '1 Month'})`,
        image: '/logo.png',
        order_id: orderData.orderId.startsWith('order_test_') ? undefined : orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#e07a5f',
          backdrop_color: 'rgba(0, 0, 0, 0.85)',
        },
        handler: async function (response: {
          razorpay_payment_id: string
          razorpay_order_id?: string
          razorpay_signature?: string
        }) {
          try {
            toast.info('Verifying payment and updating studio limits…', 'Processing')
            const verification = await subscriptionsService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: targetPlanId,
              billingCycle,
            })

            // Update user in global store
            setUser(verification.user)

            // Refresh usage stats
            const updatedUsage = await subscriptionsService.getUsage()
            setUsageData(updatedUsage)

            toast.success(
              `Payment verified (${response.razorpay_payment_id}). Your account is now upgraded to ${orderData.planName}!`,
              'Plan Activated!',
            )
          } catch (err) {
            console.error('Payment verification failed:', err)
            toast.error('Payment was received, but account update failed. Please contact support.')
          } finally {
            setIsProcessingPlan(null)
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPlan(null)
            toast.info('Payment checkout dismissed.')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Upgrade initiation failed:', err)
      toast.error('Failed to initiate subscription upgrade.')
      setIsProcessingPlan(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    )
  }

  const currentPlan = user?.plan || 'starter'
  const isStarter = currentPlan === 'starter'
  const isStudio = currentPlan === 'studio'
  const isEnterprise = currentPlan === 'enterprise'

  const rendersUsed = usageData?.usage.rendersCount || 0
  const rendersLimit = usageData?.usage.rendersLimit || 5
  const rendersPercent =
    rendersLimit === -1 ? 100 : Math.min(100, Math.round((rendersUsed / rendersLimit) * 100))

  const projectsUsed = usageData?.usage.projectsCount || 0
  const projectsLimit = usageData?.usage.projectsLimit || 1
  const projectsPercent =
    projectsLimit === -1 ? 100 : Math.min(100, Math.round((projectsUsed / projectsLimit) * 100))

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Subscription & Studio Plans"
        description="Manage your architectural rendering limits, HD 4K download privileges, and active Razorpay billing tier."
      />

      {/* Active Account Status & Live Limits Meter */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-xl backdrop-blur-xl md:p-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent shadow-inner">
                <Crown className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground capitalize">
                    {usageData?.planName || currentPlan} Plan
                  </h3>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    {usageData?.subscriptionStatus || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {isStarter
                    ? 'Free starter tier for individual room blockouts and massing tests.'
                    : `Active ${usageData?.billingCycle || 'monthly'} subscription · Next renewal: ${
                        usageData?.subscriptionPeriodEnd
                          ? new Date(usageData.subscriptionPeriodEnd).toLocaleDateString()
                          : 'In 30 days'
                      }`}
                </p>
              </div>
            </div>

            {isStarter && (
              <Button
                onClick={() => handleUpgrade('studio')}
                disabled={Boolean(isProcessingPlan)}
                className="gap-2 shadow-lg shadow-accent/20"
              >
                {isProcessingPlan === 'studio' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Zap className="size-4" />
                )}
                <span>Upgrade to Studio (4K & Unlimited)</span>
              </Button>
            )}
          </div>

          {/* Usage Gauges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Renders Usage Meter */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-background/60 p-4">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-accent" />
                    <span>Monthly AI Renders</span>
                  </span>
                  <span className="font-mono text-muted">
                    {rendersUsed} / {rendersLimit === -1 ? '∞' : rendersLimit}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      rendersPercent >= 90 ? 'bg-red-500' : rendersPercent >= 70 ? 'bg-amber-400' : 'bg-accent',
                    )}
                    style={{ width: `${rendersLimit === -1 ? 15 : rendersPercent}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted">
                {rendersLimit === -1
                  ? 'Unlimited AI photorealistic generations available.'
                  : `${Math.max(0, rendersLimit - rendersUsed)} renders remaining in current cycle.`}
              </p>
            </div>

            {/* Projects Usage Meter */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-background/60 p-4">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <FolderKanban className="size-3.5 text-accent" />
                    <span>Active Projects</span>
                  </span>
                  <span className="font-mono text-muted">
                    {projectsUsed} / {projectsLimit === -1 ? '∞' : projectsLimit}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      projectsPercent >= 100 ? 'bg-red-500' : 'bg-accent',
                    )}
                    style={{ width: `${projectsLimit === -1 ? 15 : projectsPercent}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted">
                {projectsLimit === -1
                  ? 'Unlimited client workspaces & scene libraries.'
                  : `${Math.max(0, projectsLimit - projectsUsed)} project slots available.`}
              </p>
            </div>

            {/* Features Status Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-background/60 p-4">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>Feature Permissions</span>
              </span>
              <div className="mt-2 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted text-[11px]">HD Master Downloads</span>
                  <span className="font-semibold text-foreground">
                    {isStarter ? '1080p Standard' : 'Ultra HD 4K & 2K'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted text-[11px]">Cinematic Flythrough 60FPS</span>
                  <span className={cn('font-semibold text-[11px]', isStarter ? 'text-muted' : 'text-emerald-400')}>
                    {isStarter ? 'Studio Only' : 'Unlocked'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted text-[11px]">Vibe3D Relight & Close-ups</span>
                  <span className="font-semibold text-emerald-400 text-[11px]">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section with Monthly / Annual Switcher */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Choose Your Studio Tier</h2>
            <p className="text-xs text-muted mt-0.5">
              Powered by Razorpay Test Gateway · Instant activation with test credentials
            </p>
          </div>

          {/* Billing Switcher Toggle */}
          <div className="flex items-center rounded-2xl border border-border bg-surface p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'rounded-xl px-4 py-1.5 text-xs font-semibold transition-all',
                billingCycle === 'monthly'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold transition-all',
                billingCycle === 'annual'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 uppercase">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Tier Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 1. Starter Tier */}
          <div
            className={cn(
              'relative flex flex-col justify-between rounded-3xl border p-6 transition-all bg-surface/70 backdrop-blur-md',
              isStarter ? 'border-accent/40 ring-1 ring-accent/30' : 'border-border',
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Starter</span>
                {isStarter && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white/90">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-muted min-h-[36px]">
                For testing Renderly on architectural massing and room blockouts.
              </p>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl font-extrabold text-foreground">₹0</span>
                <span className="text-xs text-muted">/ forever free</span>
              </div>

              <div className="h-px bg-border/60" />

              <div className="flex flex-col gap-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Includes:</span>
                {[
                  '5 AI photorealistic renders / month',
                  '1 active architectural project',
                  'Standard HD 1080p downloads',
                  'Vibe3D Instant Relighting presets',
                  'Basic geometry adherence controls',
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-xs text-muted">
                    <Check className="size-4 shrink-0 text-accent/80 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/40">
              <Button
                variant="outline"
                disabled={true}
                className="w-full text-xs font-semibold"
              >
                {isStarter ? 'Current Active Tier' : 'Downgrade to Starter'}
              </Button>
            </div>
          </div>

          {/* 2. Studio Pro Tier (Recommended / Most Popular) */}
          <div
            className={cn(
              'relative flex flex-col justify-between rounded-3xl border-2 p-6 transition-all bg-surface shadow-2xl scale-[1.02] z-10',
              isStudio
                ? 'border-accent ring-2 ring-accent/30 shadow-accent/15'
                : 'border-accent bg-gradient-to-b from-surface via-surface to-accent/[0.04]',
            )}
          >
            {/* Top Recommended Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                <Sparkles className="size-3" />
                <span>Most Popular for Studios</span>
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <Crown className="size-4 text-accent" />
                  <span>Studio Pro</span>
                </span>
                {isStudio && (
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent border border-accent/40">
                    Active Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-muted min-h-[36px]">
                For independent architects, interior designers & visualization artists.
              </p>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {billingCycle === 'annual' ? '₹14,990' : '₹1,499'}
                </span>
                <span className="text-xs text-muted">
                  {billingCycle === 'annual' ? '/ year (~₹1,249/mo)' : '/ month'}
                </span>
              </div>

              <div className="h-px bg-border/60" />

              <div className="flex flex-col gap-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Everything in Starter, plus:
                </span>
                {[
                  '100 AI photorealistic renders / month',
                  '15 active architectural projects',
                  'Ultra HD 4K & Studio 2K Master exports (PNG / JPG)',
                  'Cinematic 60FPS 4K Flythrough Walkthroughs',
                  'Vibe3D Instant Relight & Macro Close-ups Studio',
                  'HyperReal 8K Studio upscale engine',
                  'Commercial client presentation rights',
                  'Priority GPU ray-tracing queue',
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                    <CheckCircle2 className="size-4 shrink-0 text-accent mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/40">
              <Button
                onClick={() => handleUpgrade('studio')}
                disabled={isStudio || Boolean(isProcessingPlan)}
                className="w-full text-xs font-bold gap-2 shadow-xl shadow-accent/25"
              >
                {isProcessingPlan === 'studio' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Launching Razorpay…</span>
                  </>
                ) : isStudio ? (
                  <>
                    <Check className="size-4" />
                    <span>Active Subscription</span>
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    <span>Upgrade to Studio Pro (Razorpay Test)</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 3. Enterprise Studio Tier */}
          <div
            className={cn(
              'relative flex flex-col justify-between rounded-3xl border p-6 transition-all bg-surface/70 backdrop-blur-md',
              isEnterprise ? 'border-accent/40 ring-1 ring-accent/30' : 'border-border',
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="size-4 text-muted" />
                  <span>Enterprise Studio</span>
                </span>
                {isEnterprise && (
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent border border-accent/40">
                    Active Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-muted min-h-[36px]">
                For architectural firms, development teams & high-volume production.
              </p>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {billingCycle === 'annual' ? '₹49,990' : '₹4,999'}
                </span>
                <span className="text-xs text-muted">
                  {billingCycle === 'annual' ? '/ year' : '/ month'}
                </span>
              </div>

              <div className="h-px bg-border/60" />

              <div className="flex flex-col gap-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Maximum Power & Scale:
                </span>
                {[
                  'Unlimited AI photorealistic renders',
                  'Unlimited architectural projects',
                  'Uncapped 4K & 8K Master quality downloads',
                  'Unlimited 60FPS drone & flythrough videos',
                  'Dedicated GPU rendering compute pipeline',
                  'Team workspaces & project sharing',
                  'Dedicated 24/7 account manager & SLA',
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-xs text-muted">
                    <Check className="size-4 shrink-0 text-accent/80 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/40">
              <Button
                variant={isEnterprise ? 'outline' : 'primary'}
                onClick={() => handleUpgrade('enterprise')}
                disabled={isEnterprise || Boolean(isProcessingPlan)}
                className="w-full text-xs font-semibold gap-2"
              >
                {isProcessingPlan === 'enterprise' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Launching Razorpay…</span>
                  </>
                ) : isEnterprise ? (
                  'Active Subscription'
                ) : (
                  'Upgrade to Enterprise'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Razorpay Test Gateway Notice */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-4 text-xs text-muted">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-xl bg-accent/20 text-accent shrink-0">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Razorpay Sandbox / Test Mode Active</p>
            <p className="text-[11px] text-muted">
              Key ID: <code className="font-mono text-accent">{usageData?.razorpayKeyId || 'rzp_test_Oks5Gpac00wL72'}</code>. You can test card payments, net banking, and UPI safely using standard Razorpay test credentials.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-bold text-accent uppercase tracking-wider">
          Test Gateway
        </span>
      </section>
    </div>
  )
}
