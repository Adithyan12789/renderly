import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="text-3xl font-medium tracking-tight text-foreground">This page doesn&apos;t exist</h1>
        <p className="text-sm text-muted">The link may be broken, or the page may have moved.</p>
        <Link to="/" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
          Back to home
        </Link>
      </div>
    </main>
  )
}
