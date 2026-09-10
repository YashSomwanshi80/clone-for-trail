import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RequireAuth } from '@/routes/guards'
import { DashboardPage } from '@/pages/DashboardPage'
import { TrajectoryPage } from '@/pages/TrajectoryPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { UploadPage } from '@/pages/UploadPage'
import { BlacklistPage } from '@/pages/BlacklistPage'
import { queryClient } from '@/lib/query-client'

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route
                path="/trajectory"
                element={
                  <RequireAuth>
                    <TrajectoryPage />
                  </RequireAuth>
                }
              />
              <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
              <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
              <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
              <Route
                path="/blacklist"
                element={
                  <RequireAuth>
                    <BlacklistPage />
                  </RequireAuth>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  )
}
