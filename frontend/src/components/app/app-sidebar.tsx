import { useEffect, useState } from 'react'
import { LogOut, User as UserIcon, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router'
import { Logo } from '@/components/ui/logo'
import { APP_NAV, APP_SECONDARY_NAV, type AppNavItem } from '@/lib/app-nav'
import { PLAN_LIMITS } from '@/lib/site-content'
import { rendersService } from '@/services/renders'
import { toast } from '@/stores/toast-store'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useUiStore } from '@/stores/ui-store'
import { UsageMeter } from './usage-meter'

export function AppSidebar() {
  const navigate = useNavigate()
  const isOpen = useUiStore((state) => state.isSidebarOpen)
  const setOpen = useUiStore((state) => state.setSidebarOpen)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [rendersCount, setRendersCount] = useState<number>(0)

  const planKey = user?.plan || 'starter'
  const planInfo = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.starter

  useEffect(() => {
    rendersService
      .list()
      .then((renders) => setRendersCount(renders?.length || 0))
      .catch(() => {})
  }, [user])

  async function handleLogout() {
    await logout()
    toast.info('You have been signed out. See you next time!', 'Signed out')
    navigate('/login')
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn('fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden', !isOpen && 'hidden')}
      />
      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo to="/app" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-white/5 lg:hidden"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>

        <nav aria-label="Workspace" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <NavGroup items={APP_NAV} onNavigate={() => setOpen(false)} />
          <div className="mt-auto flex flex-col gap-4">
            <NavGroup items={APP_SECONDARY_NAV} onNavigate={() => setOpen(false)} />

            {/* Usage meters */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold capitalize text-foreground">{planInfo.label} Plan</span>
                <NavLink
                  to="/app/subscription"
                  className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider hover:bg-accent hover:text-white transition-colors"
                >
                  {planKey === 'starter' ? 'Upgrade' : 'Manage'}
                </NavLink>
              </div>
              <UsageMeter
                label="AI renders"
                used={rendersCount}
                limit={user?.rendersLimit ?? (planKey === 'studio' ? 100 : planKey === 'enterprise' ? 999999 : 5)}
              />
              <UsageMeter label="Storage" used={0.2} limit={planInfo.storageGb} unit="GB" />
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{user?.name || 'Studio User'}</p>
                  <p className="truncate text-[11px] text-muted">{user?.email || 'Signed in'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}

function NavGroup({ items, onNavigate }: { items: AppNavItem[]; onNavigate: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-white/[0.07] text-foreground' : 'text-muted hover:bg-white/[0.04] hover:text-foreground',
              )
            }
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
