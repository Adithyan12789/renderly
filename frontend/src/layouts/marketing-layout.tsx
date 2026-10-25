import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'

function useScrollToHash() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [pathname, hash])
}

export function MarketingLayout() {
  useScrollToHash()
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
