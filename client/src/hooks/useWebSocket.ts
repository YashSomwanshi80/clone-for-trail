import { useEffect, useRef, useState } from 'react'

export type WsConnectionStatus = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING'

interface Options<T> {
  enabled?: boolean
  onMessage: (data: T) => void
  /** Mock mode: when set, no real socket is opened — this function is called to simulate arrivals. */
  mockSimulator?: (push: (data: T) => void) => () => void
}

const MAX_BACKOFF_MS = 15_000
const BASE_BACKOFF_MS = 1000

export function useWebSocket<T>(url: string, options: Options<T>) {
  const { enabled = true, onMessage, mockSimulator } = options
  const [status, setStatus] = useState<WsConnectionStatus>('CONNECTING')
  const attemptRef = useRef(0)
  const socketRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!enabled) return

    if (mockSimulator) {
      setStatus('OPEN')
      const stop = mockSimulator((data) => onMessageRef.current(data))
      return () => stop()
    }

    let cancelled = false

    function connect() {
      setStatus(attemptRef.current === 0 ? 'CONNECTING' : 'RECONNECTING')
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        if (cancelled) return
        attemptRef.current = 0
        setStatus('OPEN')
      }
      ws.onmessage = (evt) => {
        if (cancelled) return
        try {
          onMessageRef.current(JSON.parse(evt.data))
        } catch {
          // ignore malformed frame
        }
      }
      ws.onclose = () => {
        if (cancelled) return
        setStatus('CLOSED')
        scheduleReconnect()
      }
      ws.onerror = () => {
        ws.close()
      }
    }

    function scheduleReconnect() {
      const delay = Math.min(BASE_BACKOFF_MS * 2 ** attemptRef.current, MAX_BACKOFF_MS)
      attemptRef.current += 1
      timerRef.current = setTimeout(() => {
        if (!cancelled) connect()
      }, delay)
    }

    connect()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      socketRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, !!mockSimulator])

  return { status }
}
