import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppTopbar } from '@/components/app/app-topbar'
import { useAuthStore } from '@/stores/auth-store'

export function AppLayout() {
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore()
  const location = useLocation()

  // Wait for initial session validation if user is not loaded from storage
  if (!isInitialized && isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm font-medium tracking-wide text-muted">Checking authentication…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
