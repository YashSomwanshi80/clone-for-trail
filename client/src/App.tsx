import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui/Toast'
import { ScanWipeProvider } from '@/components/transitions/ScanWipe'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DashboardPage } from '@/pages/DashboardPage'
import { TrajectoryPage } from '@/pages/TrajectoryPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { UploadPage } from '@/pages/UploadPage'
import { BlacklistPage } from '@/pages/BlacklistPage'
import { queryClient } from '@/lib/query-client'
import { NodesPage } from '@/pages/NodesPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { LoginPage } from '@/pages/LoginPage'
import { RequireAuth } from '@/routes/guards'

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ThemeProvider>
            <ScanWipeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                <Route path="/trajectory" element={<RequireAuth><TrajectoryPage /></RequireAuth>} />
                <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
                <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
                <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
                <Route path="/blacklist" element={<RequireAuth><BlacklistPage /></RequireAuth>} />
                <Route path="/nodes" element={<RequireAuth><NodesPage /></RequireAuth>} />
                <Route path="/review" element={<RequireAuth><ReviewPage /></RequireAuth>} />
                
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
            </ScanWipeProvider>
          </ThemeProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
