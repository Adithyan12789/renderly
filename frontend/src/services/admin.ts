import { api } from '@/lib/api'
import type { ApiSuccess } from '@/types'

export interface AdminMetrics {
  kpis: {
    totalUsers: number
    totalRenders: number
    totalProjects: number
    paidSubscribers: number
    monthlyRecurringRevenue: number
  }
  planBreakdown: Record<string, number>
  recent24h: {
    rendersCreated: number
    newUsers: number
  }
  storage: {
    uploadsFolderSizeBytes: number
    uploadsFolderSizeFormatted: string
  }
  aiEngine: {
    status: string
    activeProvider: string
  }
  database: {
    status: string
  }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  planTier: 'free' | 'starter' | 'studio' | 'enterprise'
  subscriptionStatus: string
  subscriptionCurrentPeriodEnd: string | null
  maxProjects: number
  maxRendersPerMonth: number
  rendersThisMonth: number
  totalProjects: number
  totalRenders: number
  createdAt: string
  updatedAt: string
}

export interface AdminRender {
  id: string
  title: string
  imageUrl: string
  hdImageUrl?: string | null
  videoUrl?: string | null
  hdVideoUrl?: string | null
  renderType: string
  resolution?: string
  status?: string
  prompt: string
  createdAt: string
  user: {
    id?: string
    name?: string
    email?: string
    planTier?: string
  } | null
  project?: {
    id?: string
    name?: string
  } | null
}

export interface AdminProject {
  id: string
  name: string
  description?: string
  status?: string
  renderCount: number
  createdAt: string
  user: {
    id?: string
    name?: string
    email?: string
    planTier?: string
  } | null
}

export interface AdminSubscription {
  id: string
  userId: string
  planTier: string
  status: string
  amount: number
  currency: string
  periodEnd: string | null
  razorpaySubscriptionId?: string
  razorpayPaymentId?: string
  createdAt: string
  user: {
    id?: string
    name?: string
    email?: string
  } | null
}

export const adminService = {
  auth: async (code: string) => {
    const res = await api.post<ApiSuccess<{ authenticated?: boolean; token?: string; message?: string }>>('/admin/auth', { code })
    const data = res.data.data
    const token = data.token || code
    localStorage.setItem('renderly_admin_token', token)
    sessionStorage.setItem('renderly_admin_code', code)
    return { authenticated: true, token }
  },

  logout: () => {
    localStorage.removeItem('renderly_admin_token')
    sessionStorage.removeItem('renderly_admin_code')
  },

  forgotPasscode: (email?: string) =>
    api
      .post<ApiSuccess<{ dispatched: boolean; recipient: string; message: string }>>('/admin/forgot-passcode', { email })
      .then((r) => r.data.data),

  getMetrics: async (): Promise<AdminMetrics> => {
    const res = await api.get<ApiSuccess<any>>('/admin/metrics')
    const raw = res.data.data || {}
    const overview = raw.overview || {}
    const plans = raw.plans || {}
    const activity = raw.activity || {}
    const system = raw.system || {}

    return {
      kpis: {
        totalUsers: overview.totalUsers ?? 0,
        totalRenders: overview.totalRenders ?? 0,
        totalProjects: overview.totalProjects ?? 0,
        paidSubscribers: (plans.studio || 0) + (plans.enterprise || 0),
        monthlyRecurringRevenue: overview.estimatedMonthlyRevenueInr ?? 0,
      },
      planBreakdown: plans,
      recent24h: {
        rendersCreated: activity.rendersToday ?? 0,
        newUsers: activity.usersToday ?? 0,
      },
      storage: {
        uploadsFolderSizeBytes: 0,
        uploadsFolderSizeFormatted: `${overview.storageMb || '0'} MB (${overview.uploadedFilesCount || 0} assets)`,
      },
      aiEngine: {
        status: 'Operational',
        activeProvider: system.aiProvider || 'Pollinations AI',
      },
      database: {
        status: system.database || 'Connected',
      },
    }
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get<ApiSuccess<{ users: any[] }>>('/admin/users')
    const list = res.data.data?.users || []
    return list.map((u) => ({
      id: u.id || u._id,
      name: u.name || 'Anonymous Creator',
      email: u.email,
      role: u.role || 'user',
      planTier: (u.plan || 'starter') as any,
      subscriptionStatus: u.subscriptionStatus || 'active',
      subscriptionCurrentPeriodEnd: u.subscriptionPeriodEnd || null,
      maxProjects: u.projectsLimit ?? 3,
      maxRendersPerMonth: u.rendersLimit ?? 10,
      rendersThisMonth: u.rendersCount ?? 0,
      totalProjects: u.projectsCount ?? 0,
      totalRenders: u.rendersCount ?? 0,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt || u.createdAt,
    }))
  },

  updateUser: async (id: string, payload: Partial<AdminUser>): Promise<AdminUser> => {
    const body: Record<string, any> = {}
    if (payload.planTier) {
      body.plan = payload.planTier === 'free' ? 'starter' : payload.planTier
    }
    if (payload.maxRendersPerMonth !== undefined) {
      body.rendersLimit = payload.maxRendersPerMonth
    }
    if (payload.maxProjects !== undefined) {
      body.projectsLimit = payload.maxProjects
    }
    if (payload.subscriptionStatus) {
      body.subscriptionStatus = payload.subscriptionStatus
    }

    const res = await api.patch<ApiSuccess<{ user: any }>>(`/admin/users/${id}`, body)
    const u = res.data.data.user
    return {
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      planTier: (u.plan || 'starter') as any,
      subscriptionStatus: u.subscriptionStatus || 'active',
      subscriptionCurrentPeriodEnd: u.subscriptionPeriodEnd || null,
      maxProjects: u.projectsLimit ?? payload.maxProjects ?? 3,
      maxRendersPerMonth: u.rendersLimit ?? payload.maxRendersPerMonth ?? 10,
      rendersThisMonth: u.rendersCount ?? payload.rendersThisMonth ?? 0,
      totalProjects: u.projectsCount ?? payload.totalProjects ?? 0,
      totalRenders: u.rendersCount ?? payload.totalRenders ?? 0,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt || u.createdAt,
    }
  },

  deleteUser: (id: string) =>
    api.delete<ApiSuccess<null>>(`/admin/users/${id}`).then((r) => r.data),

  getRenders: async (): Promise<AdminRender[]> => {
    const res = await api.get<ApiSuccess<{ renders: any[] }>>('/admin/renders')
    const list = res.data.data?.renders || []
    return list.map((r) => ({
      id: r.id || r._id,
      title: r.prompt?.split('·')[0]?.trim() || r.style || 'Architectural Render',
      imageUrl: r.imageUrl,
      hdImageUrl: r.hdImageUrl || r.imageUrl,
      videoUrl: r.videoUrl,
      hdVideoUrl: r.hdVideoUrl,
      renderType: r.renderType || (r.videoUrl ? 'walkthrough' : (r.style?.includes('interior') ? 'interior' : 'exterior')),
      resolution: r.resolution || (r.aspectRatio ? `${r.aspectRatio} UHD` : '4K Ultra'),
      status: r.status || 'completed',
      prompt: r.prompt || 'Architectural scene visualization',
      createdAt: r.createdAt,
      user: r.user ? {
        id: r.user.id || r.user._id,
        name: r.user.name,
        email: r.user.email,
        planTier: r.user.plan,
      } : null,
      project: r.projectId ? {
        id: r.projectId,
        name: 'Project Scene',
      } : null,
    }))
  },

  deleteRender: (id: string) =>
    api.delete<ApiSuccess<null>>(`/admin/renders/${id}`).then((r) => r.data),

  getProjects: async (): Promise<AdminProject[]> => {
    const res = await api.get<ApiSuccess<{ projects: any[] }>>('/admin/projects')
    const list = res.data.data?.projects || []
    return list.map((p) => ({
      id: p.id || p._id,
      name: p.name,
      description: p.description,
      status: p.status,
      renderCount: p.renderCount ?? 0,
      createdAt: p.createdAt,
      user: p.user ? {
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        planTier: p.user.plan,
      } : null,
    }))
  },

  deleteProject: (id: string) =>
    api.delete<ApiSuccess<null>>(`/admin/projects/${id}`).then((r) => r.data),

  createUser: async (payload: {
    name: string
    email: string
    password: string
    plan: 'starter' | 'studio' | 'enterprise'
    rendersLimit?: number
    projectsLimit?: number
  }): Promise<AdminUser> => {
    const res = await api.post<ApiSuccess<{ user: any }>>('/admin/users', payload)
    const u = res.data.data.user
    return {
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      planTier: (u.plan || 'starter') as any,
      subscriptionStatus: u.subscriptionStatus || 'active',
      subscriptionCurrentPeriodEnd: u.subscriptionPeriodEnd || null,
      maxProjects: u.projectsLimit ?? 1,
      maxRendersPerMonth: u.rendersLimit ?? 5,
      rendersThisMonth: 0,
      totalProjects: 0,
      totalRenders: 0,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt || u.createdAt,
    }
  },

  resetQuota: (userId: string) =>
    api.post<ApiSuccess<{ message: string }>>(`/admin/users/${userId}/reset-quota`).then((r) => r.data),

  grantSubscription: (payload: { userId: string; plan: string; days: number }) =>
    api.post<ApiSuccess<{ message: string }>>('/admin/subscriptions/grant', payload).then((r) => r.data),

  cancelSubscription: (userId: string) =>
    api.post<ApiSuccess<{ message: string }>>(`/admin/subscriptions/${userId}/cancel`).then((r) => r.data),

  getSubscriptions: async (): Promise<{ subscriptions: AdminSubscription[]; totalMonthlyRevenue: number }> => {
    const res = await api.get<ApiSuccess<{ subscriptions: any[]; totalMonthlyRevenue: number }>>('/admin/subscriptions')
    const data = res.data.data || { subscriptions: [], totalMonthlyRevenue: 0 }
    return {
      subscriptions: (data.subscriptions || []).map((s) => ({
        id: s.id || s._id,
        userId: s.userId,
        planTier: s.planTier || s.plan || 'starter',
        status: s.status || 'active',
        amount: s.amount ?? 0,
        currency: s.currency || 'INR',
        periodEnd: s.periodEnd || null,
        razorpaySubscriptionId: s.razorpaySubscriptionId,
        razorpayPaymentId: s.razorpayPaymentId,
        createdAt: s.createdAt,
        user: s.user ? {
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
        } : null,
      })),
      totalMonthlyRevenue: data.totalMonthlyRevenue ?? 0,
    }
  },
}
