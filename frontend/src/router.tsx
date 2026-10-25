import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { MarketingLayout } from '@/layouts/marketing-layout'
import { DashboardPage } from '@/pages/app/dashboard-page'
import { NewProjectPage } from '@/pages/app/new-project-page'
import { ProjectsPage } from '@/pages/app/projects-page'
import { RendersPage } from '@/pages/app/renders-page'
import { PresentationsPage, SettingsPage, WalkthroughsPage } from '@/pages/app/section-pages'
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
      { path: 'renders', element: <RendersPage /> },
      { path: 'walkthroughs', element: <WalkthroughsPage /> },
      { path: 'presentations', element: <PresentationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
