import { api } from '@/lib/api'
import type {
  ApiSuccess,
  RazorpayOrderData,
  SubscriptionPlan,
  UsageData,
  User,
} from '@/types'

export const subscriptionsService = {
  getPlans: () =>
    api
      .get<ApiSuccess<{ plans: SubscriptionPlan[]; currency: string; razorpayKeyId: string }>>(
        '/subscriptions/plans',
      )
      .then((r) => r.data.data),

  getUsage: () =>
    api
      .get<ApiSuccess<UsageData>>('/subscriptions/usage')
      .then((r) => r.data.data),

  createOrder: (payload: { plan: 'studio' | 'enterprise'; billingCycle: 'monthly' | 'annual' }) =>
    api
      .post<ApiSuccess<RazorpayOrderData>>('/subscriptions/create-order', payload)
      .then((r) => r.data.data),

  verifyPayment: (payload: {
    razorpay_order_id?: string
    razorpay_payment_id: string
    razorpay_signature?: string
    plan: 'studio' | 'enterprise'
    billingCycle: 'monthly' | 'annual'
  }) =>
    api
      .post<ApiSuccess<{ user: User; message: string }>>('/subscriptions/verify-payment', payload)
      .then((r) => r.data.data),
}
