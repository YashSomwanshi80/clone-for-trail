import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RequireAuth, RequireRole } from '@/routes/guards'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TrajectoryPage } from '@/pages/TrajectoryPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { UploadPage } from '@/pages/UploadPage'
import { BlacklistPage } from '@/pages/BlacklistPage'
import { AdminPage } from '@/pages/AdminPage'
import { queryClient } from '@/lib/query-client'

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route
                path="/trajectory"
                element={
                  <RequireAuth>
                    <RequireRole roles={['ADMIN', 'OPERATOR']}>
                      <TrajectoryPage />
                    </RequireRole>
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
                    <RequireRole roles={['ADMIN', 'OPERATOR']}>
                      <BlacklistPage />
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <RequireRole roles={['ADMIN']}>
                      <AdminPage />
                    </RequireRole>
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
