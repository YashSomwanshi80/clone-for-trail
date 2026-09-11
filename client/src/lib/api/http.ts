
export const JAVA_BASE_URL = import.meta.env.VITE_JAVA_API_BASE_URL ?? 'http://localhost:8080'
export const PYTHON_BASE_URL = import.meta.env.VITE_PYTHON_API_BASE_URL ?? 'http://localhost:8000'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'
export const DEFAULT_CITY_ID: string = import.meta.env.VITE_DEFAULT_CITY_ID ?? 'default'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// ---------------------------------------------------------------------------
// Token storage helpers
// ---------------------------------------------------------------------------
// Java issues a JWT access token on POST /api/v1/auth/login and every refresh.
// All /api/v1/** routes (except /api/v1/auth/**) require:
//   Authorization: Bearer <accessToken>
// Mutable so the auth service can update after login / refresh without a
// module reload.
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

// ---------------------------------------------------------------------------
// CSRF helper
// ---------------------------------------------------------------------------
// Java uses CookieCsrfTokenRepository (withHttpOnlyFalse), which writes an
// XSRF-TOKEN cookie.  Spring Security expects that value echoed back as the
// X-XSRF-TOKEN request header on any state-changing method (POST, PUT, DELETE).
// /api/internal/** and /api/v1/auth/** are exempted in SecurityConfig.
//
// The cookie is set by the first authenticated GET.  We just read it from
// document.cookie on every write — no store needed.
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// ---------------------------------------------------------------------------
// Core fetcher
// ---------------------------------------------------------------------------
interface RequestOptions extends RequestInit {
  auth?: boolean
  csrf?: boolean
}

async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, csrf = false, headers, ...rest } = options
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  }

  // Attach Bearer token to every Java request that requires auth.
  // auth=false is only used for /api/v1/auth/** calls (login, refresh, logout).
  if (auth && _accessToken) {
    finalHeaders['Authorization'] = `Bearer ${_accessToken}`
  }

  // Attach CSRF token for state-changing requests to /api/v1/** (POST/PUT/DELETE).
  // The cookie is only present after the first authenticated request that
  // triggers Spring Security's deferred token emission.
  if (csrf) {
    const csrfToken = getCsrfToken()
    if (csrfToken) finalHeaders['X-XSRF-TOKEN'] = csrfToken
  }

  const res = await fetch(`${baseUrl}${path}`, { ...rest, headers: finalHeaders })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body?.message ?? message
    } catch {
      // ignore body parse failure
    }
    throw new ApiError(message, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Java convenience wrappers
// ---------------------------------------------------------------------------
export function javaGet<T>(path: string, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, { ...options, method: 'GET', auth: true, csrf: false })
}
export function javaPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, {
    ...options,
    method: 'POST',
    auth: true,
    csrf: true,  // POST to /api/v1/** requires XSRF-TOKEN
    headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
export function javaPost_noAuth<T>(path: string, body?: unknown, options?: RequestOptions) {
  // For /api/v1/auth/** only — no JWT, no CSRF (both exempted in SecurityConfig).
  return request<T>(JAVA_BASE_URL, path, {
    ...options,
    method: 'POST',
    auth: false,
    csrf: false,
    headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
export function javaPut<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, {
    ...options,
    method: 'PUT',
    auth: true,
    csrf: true,  // PUT to /api/v1/** requires XSRF-TOKEN
    headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
export function javaDelete<T>(path: string, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, {
    ...options,
    method: 'DELETE',
    auth: true,
    csrf: true,  // DELETE to /api/v1/** requires XSRF-TOKEN
  })
}

// ---------------------------------------------------------------------------
// Python convenience wrappers (no JWT, no CSRF — Python service is internal)
// ---------------------------------------------------------------------------
export function pythonPostForm<T>(path: string, form: FormData, options?: RequestOptions) {
  return request<T>(PYTHON_BASE_URL, path, {
    ...options,
    method: 'POST',
    auth: false,
    csrf: false,
    body: form,
  })
}

export function pythonMediaUrl(filename: string) {
  return `${PYTHON_BASE_URL}/media/crops/${filename}`
}

export function wsUrl(kind: 'alerts' | 'analytics') {
  const url =
    kind === 'alerts'
      ? (import.meta.env.VITE_JAVA_WS_ALERTS_URL as string | undefined)
      : (import.meta.env.VITE_JAVA_WS_ANALYTICS_URL as string | undefined)
  return url ?? `ws://localhost:8080/ws/${kind === 'alerts' ? 'alerts' : 'analytics/live'}`
}

export function mockDelay<T>(value: T, ms = 400 + Math.random() * 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

/**
 * Fires a cheap GET to an authenticated Java endpoint so Spring Security
 * emits the XSRF-TOKEN cookie before any state-changing request (POST/PUT/DELETE).
 *
 * Call this once on app mount (see App.tsx).  Without it there is a race window
 * where a fast POST issued before the first GET response arrives would find
 * getCsrfToken() returning null, causing Spring to reject with 403 Forbidden.
 *
 * Uses GET /api/v1/cameras — already fetched by Dashboard/Sidebar on mount,
 * so this is a no-op in the common case (browser cache / React Query deduplication).
 * In mock mode it is skipped entirely.
 */
export async function prefetchCsrf(): Promise<void> {
  if (USE_MOCKS || !_accessToken) return
  try {
    await javaGet<unknown>('/api/v1/cameras')
  } catch {
    // Ignore — this is a best-effort warm-up; the cookie will arrive on the
    // next successful GET if this one fails (e.g. network not up yet).
  }
}
