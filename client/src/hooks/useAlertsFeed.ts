import { useCallback, useState } from 'react'
import { useWebSocket } from './useWebSocket'
import { wsUrl, USE_MOCKS } from '@/lib/api/http'
import type { Alert, AlertSeverity } from '@/types'
import { cameras } from '@/mocks/data'

const ALERT_TYPES = ['Blacklist match', 'Speed anomaly', 'Wrong-direction travel', 'Duplicate plate detected']
const SEVERITIES: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export function useAlertsFeed(initial: Alert[]) {
  const [alerts, setAlerts] = useState<Alert[]>(initial)

  const onMessage = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 200))
  }, [])

  const { status } = useWebSocket<Alert>(wsUrl('alerts'), {
    onMessage,
    mockSimulator: USE_MOCKS
      ? (push) => {
          const interval = setInterval(() => {
            const cam = cameras[Math.floor(Math.random() * cameras.length)]
            push({
              id: `ALT-${Date.now()}`,
              severity: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
              status: 'OPEN',
              type: ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)],
              plateNumber: `MH${Math.floor(Math.random() * 90 + 10)}XY${Math.floor(Math.random() * 9000 + 1000)}`,
              cameraId: cam.id,
              cameraName: cam.name,
              timestamp: new Date().toISOString(),
            })
          }, 9000 + Math.random() * 6000)
          return () => clearInterval(interval)
        }
      : undefined,
  })

  const acknowledge = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)))
  }, [])

  return { alerts, status, acknowledge }
}
