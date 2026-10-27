import { Building2, Crown, Film, FolderKanban, LayoutGrid, Settings, ShieldCheck, Sofa, type LucideIcon } from 'lucide-react'

export interface AppNavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const APP_NAV: AppNavItem[] = [
  { label: 'Overview', to: '/app', icon: LayoutGrid, end: true },
  { label: 'Projects', to: '/app/projects', icon: FolderKanban },
  { label: 'Exterior', to: '/app/exterior', icon: Building2 },
  { label: 'Interior', to: '/app/interior', icon: Sofa },
  { label: 'Walkthrough', to: '/app/walkthroughs', icon: Film },
]

export const APP_SECONDARY_NAV: AppNavItem[] = [
  { label: 'Plans & Limits', to: '/app/subscription', icon: Crown },
  { label: 'Settings', to: '/app/settings', icon: Settings },
  { label: 'Admin Control', to: '/admin', icon: ShieldCheck },
]
