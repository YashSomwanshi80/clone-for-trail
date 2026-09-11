import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getAccessToken } from '@/lib/api/http'

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = getAccessToken()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
