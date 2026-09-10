import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from './useWebSocket'
import { wsUrl, USE_MOCKS } from '@/lib/api/http'
import type { AnalyticsSnapshot } from '@/types'

// Max number of data points to keep in the rolling window
const WINDOW_SIZE = 96

export function useAnalyticsLive(initial: AnalyticsSnapshot[]) {
  const [history, setHistory] = useState<AnalyticsSnapshot[]>(initial)
  // Track whether we've ever received a WS push so we don't clobber live data
  // when the parent re-fetches history after a filter change
  const hasLiveData = useRef(false)

  // Sync when the parent re-fetches (filter change or mount) — only if no live
  // WS data has arrived yet, to avoid a jarring chart reset mid-session
  useEffect(() => {
    if (!hasLiveData.current) {
      setHistory(initial)
    }
  }, [initial])

  const onMessage = useCallback((snapshot: AnalyticsSnapshot) => {
    hasLiveData.current = true
    setHistory((prev) => {
      const next = [...prev, snapshot]
      // Keep a rolling window — drop oldest when over limit
      return next.length > WINDOW_SIZE ? next.slice(next.length - WINDOW_SIZE) : next
    })
  }, [])

  const { status } = useWebSocket<AnalyticsSnapshot>(wsUrl('analytics'), {
    onMessage,
    mockSimulator: USE_MOCKS
      ? (push) => {
          const interval = setInterval(() => {
            const hour = new Date().getHours()
            const hourFactor = 0.5 + Math.sin((hour / 24) * Math.PI * 2) * 0.3
            push({
              timestamp: new Date().toISOString(),
              volume: Math.round(120 + hourFactor * 280 + Math.random() * 40),
              avgSpeedKmh: Math.round(28 + (1 - hourFactor) * 30 + Math.random() * 6),
              congestionIndex: Math.round((hourFactor * 70 + Math.random() * 15) * 10) / 10,
            })
          }, 5000)
          return () => clearInterval(interval)
        }
      : undefined,
  })

  return { history, status }
}
