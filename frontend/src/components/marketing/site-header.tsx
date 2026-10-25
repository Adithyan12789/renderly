import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { MARKETING_NAV } from '@/lib/site-content'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

export function SiteHeader() {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.hash}
              to={{ pathname: '/', hash: item.hash }}
              className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link to="/app" className={buttonVariants({ size: 'sm' })}>
              Open Studio →
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Log in
              </Link>
              <Link to="/register" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-full text-foreground hover:bg-white/5 md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      <div id="mobile-nav" className={cn('border-t border-border md:hidden', !isMenuOpen && 'hidden')}>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-5 py-4">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.hash}
              to={{ pathname: '/', hash: item.hash }}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {user ? (
              <Link to="/app" className={buttonVariants({ className: 'col-span-2' })}>
                Open Studio →
              </Link>
            ) : (
              <>
                <Link to="/login" className={buttonVariants({ variant: 'outline' })}>
                  Log in
                </Link>
                <Link to="/register" className={buttonVariants({ variant: 'secondary' })}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
