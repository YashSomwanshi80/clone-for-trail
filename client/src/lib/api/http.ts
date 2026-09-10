import { clearSession, getAccessToken } from '@/lib/auth-store'

export const JAVA_BASE_URL = import.meta.env.VITE_JAVA_API_BASE_URL ?? 'http://localhost:8080'
export const PYTHON_BASE_URL = import.meta.env.VITE_PYTHON_API_BASE_URL ?? 'http://localhost:8000'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean
}

async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  }
  if (auth) {
    const token = getAccessToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${baseUrl}${path}`, { ...rest, headers: finalHeaders })
  if (!res.ok) {
    // 401 Unauthorized → session is invalid/expired — clear it immediately so the
    // app's auth guard redirects to login reactively rather than showing a generic error.
    if (res.status === 401 && auth) {
      clearSession()
    }
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

export function javaGet<T>(path: string, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, { ...options, method: 'GET' })
}
export function javaPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
export function javaPut<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
export function javaDelete<T>(path: string, options?: RequestOptions) {
  return request<T>(JAVA_BASE_URL, path, { ...options, method: 'DELETE' })
}

export function pythonPostForm<T>(path: string, form: FormData, options?: RequestOptions) {
  return request<T>(PYTHON_BASE_URL, path, { ...options, method: 'POST', body: form })
}
// pythonGet removed — was exported but never called anywhere in the codebase

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
