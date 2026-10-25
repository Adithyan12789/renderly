import { Navigate, Outlet, useLocation } from 'react-router'
import { Logo } from '@/components/ui/logo'
import { useAuthStore } from '@/stores/auth-store'

export function AuthLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (isInitialized && isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/app'
    return <Navigate to={from} replace />
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 md:px-12">
        <Logo />
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <Outlet />
        </main>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border lg:block">
        <img
          src="/images/gallery-pavilion.png"
          alt="AI-rendered timber pavilion in a forest clearing"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
        <blockquote className="absolute inset-x-12 bottom-12 flex flex-col gap-4">
          <p className="text-balance font-serif text-3xl italic leading-snug text-foreground">
            {'“We went from clay model to client sign-off in a single afternoon.”'}
          </p>
          <footer className="text-sm text-foreground/70">Forest Pavilion — rendered in Renderly</footer>
        </blockquote>
      </div>
    </div>
  )
}
