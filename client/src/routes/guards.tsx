import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'


export function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth()
  if (!authenticated) return <Navigate to="/" replace />
  return <>{children}</>
}
