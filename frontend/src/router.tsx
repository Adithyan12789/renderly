import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { MarketingLayout } from '@/layouts/marketing-layout'
import { DashboardPage } from '@/pages/app/dashboard-page'
import { NewProjectPage } from '@/pages/app/new-project-page'
import { ProjectEditPage } from '@/pages/app/project-edit-page'
import { ProjectsPage } from '@/pages/app/projects-page'
import { RenderStudioPage } from '@/pages/app/render-studio-page'
import { RendersPage } from '@/pages/app/renders-page'
import { SettingsPage } from '@/pages/app/section-pages'
import { SubscriptionPage } from '@/pages/app/subscription-page'
import { WalkthroughsPage } from '@/pages/app/walkthroughs-page'
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page'
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { LandingPage } from '@/pages/landing-page'
import { LegalPage } from '@/pages/legal-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'privacy', element: <LegalPage kind="privacy" /> },
      { path: 'terms', element: <LegalPage kind="terms" /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: 'app',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/new', element: <NewProjectPage /> },
      { path: 'projects/:id', element: <ProjectEditPage /> },
      { path: 'projects/:id/edit', element: <ProjectEditPage /> },
      { path: 'exterior', element: <RendersPage mode="exterior" /> },
      { path: 'interior', element: <RendersPage mode="interior" /> },
      { path: 'renders', element: <Navigate to="/app/exterior" replace /> },
      { path: 'renders/:id', element: <RenderStudioPage /> },
      { path: 'renders/:id/edit', element: <RenderStudioPage /> },
      { path: 'editor/:id', element: <RenderStudioPage /> },
      { path: 'walkthroughs', element: <WalkthroughsPage /> },
      { path: 'walkthrough', element: <Navigate to="/app/walkthroughs" replace /> },
      { path: 'subscription', element: <SubscriptionPage /> },
      { path: 'plans', element: <Navigate to="/app/subscription" replace /> },
      { path: 'pricing', element: <Navigate to="/app/subscription" replace /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
