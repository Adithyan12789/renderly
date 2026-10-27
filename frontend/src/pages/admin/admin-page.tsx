import { useState, useEffect, useId } from 'react'
import {
  ShieldCheck,
  KeyRound,
  Users,
  ImageIcon,
  FolderKanban,
  CreditCard,
  Activity,
  HardDrive,
  RefreshCw,
  LogOut,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  Download,
  CheckCircle2,
  Database,
  Cpu,
  X,
  Lock,
  UserPlus,
  RotateCcw,
  Gift,
  Eye,
  Mail,
} from 'lucide-react'
import { Link } from 'react-router'
import {
  adminService,
  type AdminMetrics,
  type AdminUser,
  type AdminRender,
  type AdminProject,
  type AdminSubscription,
} from '@/services/admin'
import { resolveImageUrl } from '@/lib/api'
import { toast } from '@/stores/toast-store'

export function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('renderly_admin_token') || !!localStorage.getItem('renderly_admin_code')
  })
  const [passcode, setPasscode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'renders' | 'projects' | 'subscriptions' | 'system'
  >('overview')

  // Data State
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [renders, setRenders] = useState<AdminRender[]>([])
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([])

  // Search & Filters
  const [userSearch, setUserSearch] = useState('')
  const [userPlanFilter, setUserPlanFilter] = useState('all')
  const [renderSearch, setRenderSearch] = useState('')
  const [renderTypeFilter, setRenderTypeFilter] = useState('all')

  // Modals
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [inspectRender, setInspectRender] = useState<AdminRender | null>(null)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isGrantSubOpen, setIsGrantSubOpen] = useState(false)

  // Form states for creating a new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'starter' as 'starter' | 'studio' | 'enterprise',
    rendersLimit: 5,
    projectsLimit: 1,
  })
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)

  // Form states for granting subscription
  const [grantSub, setGrantSub] = useState({
    userId: '',
    plan: 'studio',
    days: 30,
  })
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false)

  // Recovery email state for forgot passcode
  const [isForgotPasscodeOpen, setIsForgotPasscodeOpen] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('adithiruthiparambil12@gmail.com')
  const [isSendingRecovery, setIsSendingRecovery] = useState(false)
  const [recoverySentMessage, setRecoverySentMessage] = useState<string | null>(null)

  const passcodeInputId = useId()
  const editTierId = useId()
  const editRendersId = useId()
  const editProjectsId = useId()

  // Handle Passcode Unlock
  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!passcode.trim()) return

    setIsVerifying(true)
    setAuthError(null)

    try {
      const res = await adminService.auth(passcode.trim())
      if (res.authenticated) {
        localStorage.setItem('renderly_admin_code', passcode.trim())
        setIsAuthenticated(true)
        toast.success('Admin authentication verified', 'Welcome to Renderly Control Plane')
        loadDashboardData()
      } else {
        setAuthError('Invalid passcode. Access denied.')
      }
    } catch {
      setAuthError('Authentication failed. Check your admin access code.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle Send Recovery Email
  async function handleSendRecoveryEmail(e: React.FormEvent) {
    e.preventDefault()
    setIsSendingRecovery(true)
    setRecoverySentMessage(null)

    try {
      const res = await adminService.forgotPasscode(recoveryEmail.trim())
      setRecoverySentMessage(res.message || 'Passcode dispatched to authorized administrator email.')
      toast.success('Recovery email dispatched to ' + recoveryEmail)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to dispatch recovery email'
      toast.error(msg)
    } finally {
      setIsSendingRecovery(false)
    }
  }

  function handleLogout() {
    adminService.logout()
    localStorage.removeItem('renderly_admin_code')
    setIsAuthenticated(false)
    setPasscode('')
    toast.info('Admin session terminated', 'Signed Out')
  }

  // Fetch Dashboard Data from MongoDB
  async function loadDashboardData() {
    setIsLoading(true)
    try {
      const [m, u, r, p, s] = await Promise.all([
        adminService.getMetrics(),
        adminService.getUsers(),
        adminService.getRenders(),
        adminService.getProjects(),
        adminService.getSubscriptions(),
      ])

      setMetrics(m)
      setUsers(u)
      setRenders(r)
      setProjects(p)
      setSubscriptions(s.subscriptions || [])
    } catch (err: any) {
      console.error('Failed to load admin data:', err)
      toast.error('Failed to load latest database telemetry. Re-verifying credentials...')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  // Create User Handler
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in name, email, and password')
      return
    }

    setIsSubmittingUser(true)
    try {
      const created = await adminService.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        plan: newUser.plan,
        rendersLimit: newUser.rendersLimit,
        projectsLimit: newUser.projectsLimit,
      })
      setUsers((prev) => [created, ...prev])
      toast.success(`User ${created.name} created successfully!`)
      setIsCreateUserOpen(false)
      setNewUser({
        name: '',
        email: '',
        password: '',
        plan: 'starter',
        rendersLimit: 5,
        projectsLimit: 1,
      })
      loadDashboardData()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to create user'
      toast.error(msg)
    } finally {
      setIsSubmittingUser(false)
    }
  }

  // User Quota Edit
  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    try {
      const updated = await adminService.updateUser(editingUser.id, {
        planTier: editingUser.planTier,
        maxRendersPerMonth: editingUser.maxRendersPerMonth,
        maxProjects: editingUser.maxProjects,
        subscriptionStatus: editingUser.subscriptionStatus,
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
      toast.success(`Updated quotas and plan for ${editingUser.name}`)
      setEditingUser(null)
      loadDashboardData()
    } catch {
      toast.error('Failed to update user parameters')
    }
  }

  // Quick Plan Change for User
  async function handleQuickPlanChange(user: AdminUser, newPlan: 'starter' | 'studio' | 'enterprise') {
    try {
      const defaultRenders = newPlan === 'studio' ? 100 : newPlan === 'enterprise' ? -1 : 5
      const defaultProjects = newPlan === 'studio' ? 15 : newPlan === 'enterprise' ? -1 : 1

      const updated = await adminService.updateUser(user.id, {
        planTier: newPlan,
        maxRendersPerMonth: defaultRenders,
        maxProjects: defaultProjects,
      })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)))
      toast.success(`Switched ${user.name} to ${newPlan.toUpperCase()} tier!`)
      loadDashboardData()
    } catch {
      toast.error('Failed to change plan')
    }
  }

  // Reset Quota for User
  async function handleResetUserQuota(user: AdminUser) {
    try {
      await adminService.resetQuota(user.id)
      toast.success(`Reset renders quota for ${user.name}`)
      loadDashboardData()
    } catch {
      toast.error('Failed to reset quota')
    }
  }

  // Delete User
  async function handleDeleteUser(user: AdminUser) {
    if (!confirm(`Are you sure you want to PERMANENTLY delete user ${user.name} (${user.email}) and ALL their projects/renders?`)) {
      return
    }

    try {
      await adminService.deleteUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      toast.success(`User ${user.email} purged successfully`)
      loadDashboardData()
    } catch {
      toast.error('Failed to delete user')
    }
  }

  // Delete Render
  async function handleDeleteRender(render: AdminRender) {
    if (!confirm(`Delete render "${render.title || 'Untitled'}"? This permanently removes the database record and image file.`)) {
      return
    }

    try {
      await adminService.deleteRender(render.id)
      setRenders((prev) => prev.filter((r) => r.id !== render.id))
      if (inspectRender?.id === render.id) setInspectRender(null)
      toast.success('Render removed from database and disk')
      loadDashboardData()
    } catch {
      toast.error('Failed to delete render')
    }
  }

  // Delete Project
  async function handleDeleteProject(project: AdminProject) {
    if (!confirm(`Delete project "${project.name}" and its associations?`)) {
      return
    }

    try {
      await adminService.deleteProject(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      toast.success(`Project "${project.name}" removed`)
      loadDashboardData()
    } catch {
      toast.error('Failed to delete project')
    }
  }

  // Grant Subscription
  async function handleGrantSubscription(e: React.FormEvent) {
    e.preventDefault()
    if (!grantSub.userId) {
      toast.error('Please select a user to grant a subscription to')
      return
    }

    setIsSubmittingGrant(true)
    try {
      await adminService.grantSubscription({
        userId: grantSub.userId,
        plan: grantSub.plan,
        days: grantSub.days,
      })
      toast.success(`Granted ${grantSub.plan.toUpperCase()} for ${grantSub.days} days!`)
      setIsGrantSubOpen(false)
      loadDashboardData()
    } catch {
      toast.error('Failed to grant subscription')
    } finally {
      setIsSubmittingGrant(false)
    }
  }

  // Cancel Subscription
  async function handleCancelSubscription(sub: AdminSubscription) {
    if (!confirm(`Cancel subscription for ${sub.user?.name || sub.userId}?`)) {
      return
    }

    try {
      await adminService.cancelSubscription(sub.userId)
      toast.success('Subscription canceled and downgraded to Starter')
      loadDashboardData()
    } catch {
      toast.error('Failed to cancel subscription')
    }
  }

  // -------------------------------------------------------------
  // 1. CINEMATIC PASSCODE LOCKSCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0c] px-4 text-white">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[140px]" />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="size-8" />
              <div className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Renderly Control Plane</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Restricted Administrative Terminal. Enter master verification passcode to gain system clearance.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor={passcodeInputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Master Security Passcode
              </label>
              <div className="relative mt-2">
                <input
                  id={passcodeInputId}
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value)
                    setAuthError(null)
                  }}
                  placeholder="Enter master passcode"
                  autoFocus
                  maxLength={12}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 pl-11 text-center font-mono text-xl tracking-[0.3em] text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <KeyRound className="absolute top-4 left-3.5 size-5 text-neutral-500" />
              </div>
              {authError && (
                <p className="mt-2 text-center text-xs font-medium text-rose-400">{authError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || !passcode}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 font-medium text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:from-emerald-400 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  <span>Verify Passcode & Access</span>
                </>
              )}
            </button>

            {/* Forgot Passcode Action */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasscodeOpen(!isForgotPasscodeOpen)
                  setRecoverySentMessage(null)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 transition-colors hover:text-emerald-400"
              >
                <Mail className="size-3.5" />
                <span>Forgot master passcode?</span>
              </button>
            </div>

            {/* Recovery Box */}
            {isForgotPasscodeOpen && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/50 p-4 text-left transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Reset & Email Passcode</span>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasscodeOpen(false)}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Sends the master passcode directly to the authorized admin email address:
                </p>

                {recoverySentMessage ? (
                  <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span>Passcode Dispatched</span>
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-400/90">{recoverySentMessage}</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="adithiruthiparambil12@gmail.com"
                      className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendRecoveryEmail}
                      disabled={isSendingRecovery}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {isSendingRecovery ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" />
                          <span>Sending email...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="size-3.5" />
                          <span>Dispatch Passcode to Email</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="mt-8 border-t border-white/5 pt-4 text-center">
            <Link
              to="/app"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              ← Return to Main Application
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesPlan = userPlanFilter === 'all' || u.planTier === userPlanFilter
    return matchesSearch && matchesPlan
  })

  const filteredRenders = renders.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(renderSearch.toLowerCase()) ||
      (r.prompt || '').toLowerCase().includes(renderSearch.toLowerCase()) ||
      (r.user?.email || '').toLowerCase().includes(renderSearch.toLowerCase())
    const matchesType = renderTypeFilter === 'all' || r.renderType === renderTypeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-[#08080a] text-neutral-200">
      {/* Top Telemetry Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08080a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Renderly Admin Control</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live MongoDB Cluster
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Complete Database Management & Control Plane</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              title="Re-query MongoDB database"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-sync DB</span>
            </button>

            <Link
              to="/app"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">App View</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Lock Terminal</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6">
          <nav className="flex space-x-1 py-1">
            {[
              { id: 'overview', label: 'Executive Overview', icon: Activity },
              { id: 'users', label: `Users (${users.length})`, icon: Users },
              { id: 'renders', label: `Renders (${renders.length})`, icon: ImageIcon },
              { id: 'projects', label: `Projects (${projects.length})`, icon: FolderKanban },
              { id: 'subscriptions', label: `Subscriptions (${subscriptions.length})`, icon: CreditCard },
              { id: 'system', label: 'Database & Diagnostics', icon: HardDrive },
            ].map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* MRR Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Est. Monthly Revenue</span>
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <CreditCard className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    ₹{(metrics?.kpis.monthlyRecurringRevenue || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">INR / mo</span>
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  {metrics?.kpis.paidSubscribers || 0} active paid subscribers in DB
                </div>
              </div>

              {/* Total Users */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Registered Creators</span>
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <Users className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {metrics?.kpis.totalUsers ?? users.length}
                  </span>
                  {metrics?.recent24h?.newUsers ? (
                    <span className="text-xs text-emerald-400 font-medium">
                      +{metrics.recent24h.newUsers} joined today
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  Managed via MongoDB `User` collection
                </div>
              </div>

              {/* Total Renders */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Synthesized Assets</span>
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                    <ImageIcon className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {metrics?.kpis.totalRenders ?? renders.length}
                  </span>
                  {metrics?.recent24h?.rendersCreated ? (
                    <span className="text-xs text-purple-400 font-medium">
                      +{metrics.recent24h.rendersCreated} today
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  Exterior, Interior & Flythrough assets
                </div>
              </div>

              {/* Total Projects */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Project Spaces</span>
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                    <FolderKanban className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {metrics?.kpis.totalProjects ?? projects.length}
                  </span>
                  <span className="text-xs text-neutral-400">scenes in DB</span>
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  Storage: {metrics?.storage?.uploadsFolderSizeFormatted || 'Calculating'}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
              <h3 className="text-base font-semibold text-white">Direct Administrative Actions</h3>
              <p className="mt-1 text-xs text-neutral-400">Quickly create creators, grant subscriptions, or purge caches</p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
                >
                  <UserPlus className="size-4" />
                  Create New User
                </button>

                <button
                  onClick={() => setIsGrantSubOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
                >
                  <Gift className="size-4" />
                  Grant Plan / Pro License
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10"
                >
                  <Users className="size-4" />
                  Manage All Creators ({users.length})
                </button>

                <button
                  onClick={() => setActiveTab('renders')}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10"
                >
                  <ImageIcon className="size-4" />
                  Inspect Renders Gallery ({renders.length})
                </button>
              </div>
            </div>

            {/* Plan Distribution & Telemetry */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Plan Distribution */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2">
                <h3 className="text-base font-semibold text-white">Database License Breakdown</h3>
                <p className="mt-1 text-xs text-neutral-400">Total accounts assigned to each subscription tier</p>

                <div className="mt-6 space-y-4">
                  {[
                    { tier: 'starter', label: 'Starter (₹2,900/mo - 5 renders)', barColor: 'bg-blue-500' },
                    { tier: 'studio', label: 'Studio (₹7,900/mo - 100 renders)', barColor: 'bg-emerald-500' },
                    { tier: 'enterprise', label: 'Enterprise (₹19,900/mo - Unlimited)', barColor: 'bg-amber-500' },
                  ].map((p) => {
                    const count = metrics?.planBreakdown?.[p.tier] ?? 0
                    const total = metrics?.kpis.totalUsers || 1
                    const pct = Math.round((count / total) * 100) || 0

                    return (
                      <div key={p.tier}>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-neutral-300">{p.label}</span>
                          <span className="text-neutral-400 font-mono">
                            {count} users ({pct}%)
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full ${p.barColor} transition-all duration-500`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Fast Operational Diagnostic */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-white">Live Database Telemetry</h3>
                <p className="mt-1 text-xs text-neutral-400">MongoDB cluster status & microservices</p>

                <div className="mt-6 space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3">
                    <div className="flex items-center gap-2">
                      <Database className="size-4 text-emerald-400" />
                      <span className="text-neutral-300">MongoDB State</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      {metrics?.database?.status || 'Connected'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-4 text-purple-400" />
                      <span className="text-neutral-300">AI Synthesis Core</span>
                    </div>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-400">
                      {metrics?.aiEngine?.activeProvider || 'Pollinations AI'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-blue-400" />
                      <span className="text-neutral-300">Razorpay Gateway</span>
                    </div>
                    <span className="font-mono text-[11px] text-blue-400">
                      rzp_test_Oks5Gpac...
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3">
                    <div className="flex items-center gap-2">
                      <HardDrive className="size-4 text-amber-400" />
                      <span className="text-neutral-300">Media Disk Storage</span>
                    </div>
                    <span className="font-mono text-neutral-300">
                      {metrics?.storage?.uploadsFolderSizeFormatted || '0 MB'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: USER DIRECTORY & QUOTA MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Registered Creators ({users.length})</h2>
                <p className="text-xs text-neutral-400">
                  Full CRUD: Add users, switch plan tiers, reset renders quotas, adjust project limits, or purge accounts
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400"
                >
                  <UserPlus className="size-3.5" />
                  Add User
                </button>

                <div className="relative">
                  <Search className="absolute top-2.5 left-3 size-4 text-neutral-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name or email..."
                    className="w-52 rounded-lg border border-white/10 bg-black/30 py-1.5 pr-3 pl-9 text-xs text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <select
                  value={userPlanFilter}
                  onChange={(e) => setUserPlanFilter(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#121215] px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="studio">Studio</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-semibold">Creator</th>
                    <th className="py-3.5 px-4 font-semibold">Active Plan</th>
                    <th className="py-3.5 px-4 font-semibold">Monthly Renders Quota</th>
                    <th className="py-3.5 px-4 font-semibold">Projects Quota</th>
                    <th className="py-3.5 px-4 font-semibold">Total in DB</th>
                    <th className="py-3.5 px-4 font-semibold">Created Date</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-500">
                        No users found in database matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const tierBadge = ({
                        free: 'border-neutral-500/30 bg-neutral-500/10 text-neutral-300',
                        starter: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
                        studio: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                        enterprise: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                      } as Record<string, string>)[u.planTier] || 'border-neutral-500/30 bg-neutral-500/10 text-neutral-300'

                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{u.name}</div>
                            <div className="text-neutral-400 text-[11px] font-mono">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tierBadge}`}>
                                {u.planTier}
                              </span>
                              {/* Quick switch dropdown */}
                              <select
                                value={u.planTier}
                                onChange={(e) => handleQuickPlanChange(u, e.target.value as any)}
                                className="rounded bg-black/40 border border-white/10 px-1.5 py-0.5 text-[10px] text-neutral-300 focus:outline-none"
                                title="1-click change plan"
                              >
                                <option value="starter">Starter</option>
                                <option value="studio">Studio</option>
                                <option value="enterprise">Enterprise</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{u.rendersThisMonth}</span>
                              <span className="text-neutral-500">
                                / {u.maxRendersPerMonth === -1 ? '∞' : u.maxRendersPerMonth}
                              </span>
                              <button
                                onClick={() => handleResetUserQuota(u)}
                                className="ml-1 rounded p-1 text-neutral-500 hover:text-emerald-400"
                                title="Reset monthly usage"
                              >
                                <RotateCcw className="size-3" />
                              </button>
                            </div>
                            <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full bg-emerald-500"
                                style={{
                                  width: `${u.maxRendersPerMonth === -1 ? 15 : Math.min(100, (u.rendersThisMonth / (u.maxRendersPerMonth || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-white">{u.totalProjects}</span>
                            <span className="text-neutral-500"> / {u.maxProjects === -1 ? '∞' : u.maxProjects}</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-300 font-mono">
                            {u.totalRenders} renders
                          </td>
                          <td className="py-3 px-4 text-neutral-400 text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingUser(u)}
                                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-neutral-300 hover:border-emerald-500 hover:text-emerald-400"
                                title="Edit quotas & plan details"
                              >
                                <Edit className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                                title="Permanently delete user"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: GLOBAL RENDERS REPOSITORY */}
        {/* ========================================================= */}
        {activeTab === 'renders' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">All Synthesized Assets ({renders.length})</h2>
                <p className="text-xs text-neutral-400">
                  Inspect prompt details, download HD renders, or permanently delete assets from disk & MongoDB
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute top-2.5 left-3 size-4 text-neutral-500" />
                  <input
                    type="text"
                    value={renderSearch}
                    onChange={(e) => setRenderSearch(e.target.value)}
                    placeholder="Search prompt, creator..."
                    className="w-56 rounded-lg border border-white/10 bg-black/30 py-1.5 pr-3 pl-9 text-xs text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <select
                  value={renderTypeFilter}
                  onChange={(e) => setRenderTypeFilter(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#121215] px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Styles</option>
                  <option value="exterior">Exterior</option>
                  <option value="interior">Interior</option>
                  <option value="walkthrough">Walkthrough</option>
                </select>
              </div>
            </div>

            {/* Renders Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredRenders.map((r) => (
                <div
                  key={r.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all hover:border-emerald-500/50"
                >
                  <div
                    onClick={() => setInspectRender(r)}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden bg-black/40"
                  >
                    <img
                      src={resolveImageUrl(r.imageUrl)}
                      alt={r.title || 'Render'}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {r.renderType || 'Exterior'}
                    </div>
                    {r.hdImageUrl && (
                      <div className="absolute top-2 right-2 rounded-md bg-amber-500/80 px-1.5 py-0.5 text-[9px] font-bold text-black backdrop-blur-sm">
                        HD 4K
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white text-xs truncate">{r.title || 'Untitled Render'}</h4>
                        <span className="text-[10px] text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-neutral-400">
                        {r.prompt || 'No prompt specified'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="text-[11px] text-neutral-400 truncate max-w-[130px]">
                        Creator: <span className="text-white">{r.user?.name || r.user?.email || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setInspectRender(r)}
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
                          title="Inspect details"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <a
                          href={resolveImageUrl(r.hdImageUrl || r.imageUrl)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
                          title="Download high-resolution image"
                        >
                          <Download className="size-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteRender(r)}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                          title="Delete render permanently"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PROJECTS MATRIX */}
        {/* ========================================================= */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Project Workspaces ({projects.length})</h2>
                <p className="text-xs text-neutral-400">
                  Architectural projects stored in MongoDB with creator attribution and render counts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl transition-colors hover:border-white/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{p.name}</h4>
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-400">
                        {p.description || 'No description provided'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(p)}
                      className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                      title="Delete project"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                    <div className="text-neutral-400">
                      Owner: <span className="font-medium text-white">{p.user?.name || 'Unknown'}</span>
                    </div>
                    <div className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      {p.renderCount || 0} renders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: FINANCIAL SUBSCRIPTIONS LEDGER */}
        {/* ========================================================= */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Subscriptions & Financial Ledger</h2>
                <p className="text-xs text-neutral-400">
                  Manage active licenses, grant promotions, and view payment records
                </p>
              </div>

              <button
                onClick={() => setIsGrantSubOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400"
              >
                <Gift className="size-3.5" />
                Grant Subscription
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-semibold">Subscriber</th>
                    <th className="py-3.5 px-4 font-semibold">Plan Tier</th>
                    <th className="py-3.5 px-4 font-semibold">Value</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Payment Reference</th>
                    <th className="py-3.5 px-4 font-semibold">Expires</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-500">
                        No active subscriptions in ledger. Click "Grant Subscription" to add a user.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{s.user?.name || 'Customer'}</div>
                          <div className="text-neutral-400 text-[11px] font-mono">{s.user?.email || s.userId}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold uppercase tracking-wider text-emerald-400">
                          {s.planTier}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          ₹{s.amount?.toLocaleString()} {s.currency?.toUpperCase() || 'INR'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                          {s.razorpayPaymentId || 'Direct Grant'}
                        </td>
                        <td className="py-3 px-4 text-neutral-400 text-[11px]">
                          {s.periodEnd ? new Date(s.periodEnd).toLocaleDateString() : 'Active Ongoing'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleCancelSubscription(s)}
                            className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20"
                            title="Cancel subscription"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: DATABASE & SYSTEM HEALTH */}
        {/* ========================================================= */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Database & Diagnostics</h2>
              <p className="text-xs text-neutral-400">
                Connected MongoDB instance, disk volumes, and security verification
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
                <h3 className="text-base font-semibold text-white">MongoDB Collections Inventory</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
                    <span className="text-neutral-300">User Documents</span>
                    <span className="font-mono font-semibold text-white">{users.length} accounts</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
                    <span className="text-neutral-300">Render Documents</span>
                    <span className="font-mono font-semibold text-white">{renders.length} assets</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
                    <span className="text-neutral-300">Project Documents</span>
                    <span className="font-mono font-semibold text-white">{projects.length} scenes</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
                    <span className="text-neutral-300">Physical Uploads Footprint</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {metrics?.storage?.uploadsFolderSizeFormatted || '0 MB'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
                <h3 className="text-base font-semibold text-white">Authentication Protocol</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Master passcode access control status
                </p>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <KeyRound className="size-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Master Security Code</div>
                      <div className="font-mono text-sm tracking-widest text-emerald-400">•••••••• (Protected in .env)</div>
                      <div className="mt-0.5 text-[11px] text-neutral-400">Recovery: adithiruthiparambil12@gmail.com</div>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                    Enforced & Masked
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: CREATE USER */}
      {/* ========================================================= */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create New Creator Account</h3>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-400">Instantly provision an account in MongoDB</p>

            <form onSubmit={handleCreateUser} className="mt-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-neutral-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Maya Architect"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Plan Tier</label>
                <select
                  value={newUser.plan}
                  onChange={(e) => {
                    const p = e.target.value as any
                    setNewUser({
                      ...newUser,
                      plan: p,
                      rendersLimit: p === 'studio' ? 100 : p === 'enterprise' ? -1 : 5,
                      projectsLimit: p === 'studio' ? 15 : p === 'enterprise' ? -1 : 1,
                    })
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="starter">Starter (5 renders, 1 project)</option>
                  <option value="studio">Studio (100 renders, 15 projects)</option>
                  <option value="enterprise">Enterprise (Unlimited)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-neutral-300">Renders Quota</label>
                  <input
                    type="number"
                    value={newUser.rendersLimit}
                    onChange={(e) => setNewUser({ ...newUser, rendersLimit: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300">Projects Limit</label>
                  <input
                    type="number"
                    value={newUser.projectsLimit}
                    onChange={(e) => setNewUser({ ...newUser, projectsLimit: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-neutral-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSubmittingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT USER */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit User Quotas & Tier</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-400">{editingUser.email}</p>

            <form onSubmit={handleSaveUser} className="mt-6 space-y-4 text-xs">
              <div>
                <label htmlFor={editTierId} className="block font-medium text-neutral-300">Plan Tier</label>
                <select
                  id={editTierId}
                  value={editingUser.planTier}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, planTier: e.target.value as any })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="starter">Starter Plan (₹2,900)</option>
                  <option value="studio">Studio Plan (₹7,900)</option>
                  <option value="enterprise">Enterprise Plan (₹19,900)</option>
                </select>
              </div>

              <div>
                <label htmlFor={editRendersId} className="block font-medium text-neutral-300">Monthly Render Quota (-1 for unlimited)</label>
                <input
                  id={editRendersId}
                  type="number"
                  value={editingUser.maxRendersPerMonth}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      maxRendersPerMonth: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor={editProjectsId} className="block font-medium text-neutral-300">Project Creation Limit (-1 for unlimited)</label>
                <input
                  id={editProjectsId}
                  type="number"
                  value={editingUser.maxProjects}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      maxProjects: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-neutral-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: GRANT SUBSCRIPTION */}
      {/* ========================================================= */}
      {isGrantSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Grant Subscription / Pro License</h3>
              <button
                onClick={() => setIsGrantSubOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-400">Manually activate a paid subscription for any user</p>

            <form onSubmit={handleGrantSubscription} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300">Select Creator</label>
                <select
                  required
                  value={grantSub.userId}
                  onChange={(e) => setGrantSub({ ...grantSub, userId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - Current: {u.planTier.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Grant License Tier</label>
                <select
                  value={grantSub.plan}
                  onChange={(e) => setGrantSub({ ...grantSub, plan: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="studio">Studio Plan (₹7,900/mo - 100 renders)</option>
                  <option value="enterprise">Enterprise Plan (₹19,900/mo - Unlimited)</option>
                  <option value="starter">Starter Plan (Reset to default)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-300">Duration (Days)</label>
                <select
                  value={grantSub.days}
                  onChange={(e) => setGrantSub({ ...grantSub, days: parseInt(e.target.value) || 30 })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value={7}>7 Days (Trial)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={90}>90 Days (Quarterly)</option>
                  <option value={365}>365 Days (Annual)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGrantSubOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-neutral-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrant}
                  className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-black hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmittingGrant ? 'Granting...' : 'Grant License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: RENDER INSPECTION */}
      {/* ========================================================= */}
      {inspectRender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121215] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="font-bold text-white">{inspectRender.title || 'Untitled Render'}</h3>
                <p className="text-xs text-neutral-400">
                  Creator: {inspectRender.user?.email || 'Unknown'} | Style: {inspectRender.renderType}
                </p>
              </div>
              <button
                onClick={() => setInspectRender(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-hidden rounded-xl bg-black">
                <img
                  src={resolveImageUrl(inspectRender.hdImageUrl || inspectRender.imageUrl)}
                  alt={inspectRender.title || 'Render'}
                  className="w-full max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="mt-6 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Synthesis Prompt</span>
                  <p className="mt-1 rounded-xl border border-white/5 bg-black/40 p-3 text-neutral-200">
                    {inspectRender.prompt || 'No prompt recorded'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4 text-neutral-400">
                    <div>
                      Resolution: <span className="text-white">{inspectRender.resolution || 'Standard'}</span>
                    </div>
                    <div>
                      Created: <span className="text-white">{new Date(inspectRender.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={resolveImageUrl(inspectRender.hdImageUrl || inspectRender.imageUrl)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-400"
                    >
                      <Download className="size-3.5" />
                      Download High-Res
                    </a>
                    <button
                      onClick={() => handleDeleteRender(inspectRender)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="size-3.5" />
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
