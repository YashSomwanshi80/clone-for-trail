import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '@/lib/api/java'
import { clearSession, getSession, isAuthenticated, setSession, subscribeAuth } from '@/lib/auth-store'
interface AuthContextValue {
  authenticated: boolean
  userId: string | null
  login: (userId: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, forceRender] = useState(0)

  useEffect(() => {
    return subscribeAuth(() => forceRender((n) => n + 1))
  }, [])

  const session = getSession()

  async function login(userId: string, password: string) {
    const res = await authApi.login(userId, password)
    setSession(res)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        authenticated: isAuthenticated(),
        userId: session?.userId ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
