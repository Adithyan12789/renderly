import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from './components/ui/toaster'
import { router } from './router'
import { useAuthStore } from './stores/auth-store'
import './index.css'

// Verify active session with the backend
useAuthStore.getState().checkAuth().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </StrictMode>,
)
