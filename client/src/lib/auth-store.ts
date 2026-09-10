import type { Role } from '@/types'

// Per A7: access token is kept in memory only, never in localStorage.
// A page refresh in this demo build will require re-login — acceptable
// for local/demo use, called out explicitly rather than silently
// "solved" with an insecure persistence shortcut.

interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userId: string
  role: Role
}

let session: Session | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSession() {
  return session
}

export function isAuthenticated() {
  return session !== null && session.expiresAt > Date.now()
}

export function setSession(next: Session) {
  session = next
  scheduleRefresh()
  notify()
}

export function clearSession() {
  session = null
  if (refreshTimer) clearTimeout(refreshTimer)
  notify()
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer)
  if (!session) return
  // Refresh 60s before expiry rather than forcing a re-login mid-session (A7)
  const delay = Math.max(session.expiresAt - Date.now() - 60_000, 5_000)
  refreshTimer = setTimeout(() => {
    void refreshSession()
  }, delay)
}

async function refreshSession() {
  if (!session) return
  try {
    const { authApi } = await import('@/lib/api/java')
    const next = await authApi.refresh(session.refreshToken)
    setSession(next)
  } catch {
    clearSession()
  }
}

export function getAccessToken() {
  return session?.accessToken ?? null
}
