import { Menu, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui-store'

export function AppTopbar() {
  const isOpen = useUiStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-xl md:px-8">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-expanded={isOpen}
        aria-controls="app-sidebar"
        className="grid size-9 place-items-center rounded-lg text-foreground hover:bg-white/5 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
        <span className="sr-only">Open navigation</span>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <Link to="/app/projects/new" className={buttonVariants({ size: 'sm' })}>
          <Plus aria-hidden="true" />
          New project
        </Link>
      </div>
    </header>
  )
}
