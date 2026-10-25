import { Film, ImageIcon, Loader2, Presentation, Sparkles, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ProjectsBrowser } from '@/components/app/projects-browser'
import { UsageMeter } from '@/components/app/usage-meter'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SerifAccent } from '@/components/ui/section-heading'
import { PLAN_LIMITS } from '@/lib/site-content'
import { projectsService } from '@/services/projects'
import { rendersService } from '@/services/renders'
import { useAuthStore } from '@/stores/auth-store'
import type { Project, Render } from '@/types'

const QUICK_ACTIONS: { label: string; description: string; to: string; icon: LucideIcon }[] = [
  { label: 'AI render', description: 'Generate a still from a prompt', to: '/app/renders', icon: Sparkles },
  { label: 'Walkthrough', description: 'Animate a camera path', to: '/app/walkthroughs', icon: Film },
  { label: 'Presentation', description: 'Build a client deck', to: '/app/presentations', icon: Presentation },
]

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [projects, setProjects] = useState<Project[]>([])
  const [renders, setRenders] = useState<Render[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const planKey = user?.plan || 'starter'
  const planInfo = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.starter
  const firstName = user?.name ? user.name.split(' ')[0] : 'Creator'

  useEffect(() => {
    let mounted = true
    Promise.all([projectsService.list(), rendersService.list()])
      .then(([projectsData, rendersData]) => {
        if (mounted) {
          setProjects(projectsData || [])
          setRenders(rendersData || [])
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  async function handleDeleteProject(id: string) {
    try {
      await projectsService.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted">Workspace • {user?.email || 'Active'}</p>
          <h1 className="mt-1 text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Welcome back, <SerifAccent>{firstName}</SerifAccent>
          </h1>
        </div>
        <div className="grid w-full gap-5 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:w-[420px]">
          <UsageMeter label="AI renders" used={renders.length} limit={planInfo.aiRenders} />
          <UsageMeter label="Active projects" used={projects.length} limit={10} />
        </div>
      </section>

      <section aria-labelledby="quick-actions" className="flex flex-col gap-4">
        <h2 id="quick-actions" className="sr-only">
          Quick actions
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.label}>
              <Link
                to={action.to}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-raised"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
                  <action.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <span className="text-xs text-muted">{action.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent Projects */}
      <section aria-labelledby="recent-projects" className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 id="recent-projects" className="text-lg font-medium text-foreground">
            Recent projects
          </h2>
          {projects.length > 0 && (
            <Link to="/app/projects" className="text-xs text-muted hover:text-foreground">
              View all ({projects.length}) →
            </Link>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <ProjectsBrowser projects={projects.slice(0, 3)} onDelete={handleDeleteProject} />
        )}
      </section>

      {/* Recent Renders */}
      <section aria-labelledby="recent-renders" className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 id="recent-renders" className="text-lg font-medium text-foreground">
            Recent renders
          </h2>
          {renders.length > 0 && (
            <Link to="/app/renders" className="text-xs text-muted hover:text-foreground">
              Open Studio ({renders.length}) →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : renders.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No renders yet"
            description="Synthesize your first photorealistic architectural still using AI Render Studio."
            action={
              <Link to="/app/renders" className={buttonVariants({ size: 'sm' })}>
                <Sparkles className="size-3.5" aria-hidden="true" />
                Open Render Studio
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {renders.slice(0, 3).map((render) => (
              <Link
                key={render.id}
                to="/app/renders"
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
                  <img
                    src={render.imageUrl}
                    alt={render.prompt}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md capitalize">
                      {render.style.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3.5">
                  <p className="line-clamp-1 text-xs font-medium text-foreground">{render.prompt}</p>
                  <p className="text-[10px] text-muted">
                    {new Date(render.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
