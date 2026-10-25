import { Film, LogOut, Presentation, Sparkles, User, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/stores/toast-store'

interface SectionPageProps {
  title: string
  description: string
  icon: LucideIcon
  emptyTitle: string
  emptyDescription: string
}

function SectionPage({ title, description, icon, emptyTitle, emptyDescription }: SectionPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </div>
  )
}

export function RendersPage() {
  return (
    <SectionPage
      title="Render Studio"
      description="Generate AI renders from prompts, styles, and scene captures."
      icon={Sparkles}
      emptyTitle="No renders yet"
      emptyDescription="Create a project and upload a model to start generating renders. Queued, processing, and completed jobs will be listed here."
    />
  )
}

export function WalkthroughsPage() {
  return (
    <SectionPage
      title="Walkthroughs"
      description="Choreograph camera paths and export cinematic videos."
      icon={Film}
      emptyTitle="No walkthroughs yet"
      emptyDescription="Walkthroughs are created from a project's 3D scene. Add camera keyframes in the editor to build one."
    />
  )
}

export function PresentationsPage() {
  return (
    <SectionPage
      title="Presentations"
      description="Turn renders and specifications into client-ready decks."
      icon={Presentation}
      emptyTitle="No presentations yet"
      emptyDescription="Assemble renders, palettes, and project details into shareable presentations and PDFs."
    />
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  async function handleLogout() {
    await logout()
    toast.info('You have been signed out. See you next time!', 'Signed out')
    navigate('/login')
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Manage your profile, workspace, and account credentials." />

      <div className="flex max-w-2xl flex-col gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-full bg-accent/15 text-lg font-bold text-accent">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="size-6" />}
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">{user?.name || 'Studio Member'}</h2>
              <p className="text-sm text-muted">{user?.email || 'No email attached'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Current Plan</p>
              <p className="mt-1 text-sm font-medium capitalize text-foreground">{user?.plan || 'Starter'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">User ID</p>
              <p className="mt-1 truncate font-mono text-xs text-muted">{user?.id || 'Local session'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-base font-medium text-foreground">Account Actions</h3>
          <p className="mt-1 text-xs text-muted">Sign out of your active session on this device.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
