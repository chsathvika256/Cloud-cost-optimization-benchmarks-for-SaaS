import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

export const Dashboard = lazy(() => window.location.pathname.startsWith('/mba') ? import('./MBAApp.tsx') : import('./App.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  </StrictMode>,
)
