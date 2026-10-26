import { Film, FolderKanban, LayoutGrid, Settings, Sparkles, type LucideIcon } from 'lucide-react'

export interface AppNavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const APP_NAV: AppNavItem[] = [
  { label: 'Overview', to: '/app', icon: LayoutGrid, end: true },
  { label: 'Projects', to: '/app/projects', icon: FolderKanban },
  { label: 'Render Studio', to: '/app/renders', icon: Sparkles },
  { label: 'Walkthroughs', to: '/app/walkthroughs', icon: Film },
]

export const APP_SECONDARY_NAV: AppNavItem[] = [{ label: 'Settings', to: '/app/settings', icon: Settings }]
