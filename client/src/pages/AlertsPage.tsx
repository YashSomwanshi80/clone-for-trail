import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardBody } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { SeverityBadge, AlertStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { alertsApi } from '@/lib/api/java'
import { useAlertsFeed } from '@/hooks/useAlertsFeed'
import type { Alert } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'
import { BellOff } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
]

export function AlertsPage() {
  const [seed, setSeed] = useState<Alert[]>([])
  const [filter, setFilter] = useState('all')
  const { push } = useToast()

  useEffect(() => {
    alertsApi.list().then(setSeed)
  }, [])

  const { alerts, status, acknowledge } = useAlertsFeed(seed)

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts
    if (filter === 'ACKNOWLEDGED') return alerts.filter((a) => a.status === 'ACKNOWLEDGED')
    return alerts.filter((a) => a.severity === filter)
  }, [alerts, filter])

  const counts = {
    all: alerts.length,
    CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL').length,
    HIGH: alerts.filter((a) => a.severity === 'HIGH').length,
    MEDIUM: alerts.filter((a) => a.severity === 'MEDIUM').length,
    ACKNOWLEDGED: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length,
  }

  function handleAcknowledge(id: string) {
    acknowledge(id)
    alertsApi.acknowledge(id).catch(() => undefined)
    push('success', 'Alert acknowledged')
  }

  return (
    <AppShell title="Alert Console" wsStatus={status}>
      <Card>
        <div className="px-4 pt-3">
          <Tabs
            items={FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value as keyof typeof counts] }))}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <CardBody className="pt-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<BellOff className="h-7 w-7" />}
              title="No alerts match this filter"
              description="Try a different severity tab, or check back as new detections arrive."
              action={{ label: 'Show all alerts', onClick: () => setFilter('all') }}
            />
          ) : (
            <div className="divide-y divide-border-soft/60">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center gap-4 py-3">
                  <SeverityBadge severity={a.severity} />
                  <div className="w-40 shrink-0">
                    <p className="text-[13px] text-text-primary truncate">{a.type}</p>
                  </div>
                  <span className="w-32 shrink-0 mono-data text-[13px] text-text-secondary">{a.plateNumber}</span>
                  <span className="flex-1 min-w-0 text-[13px] text-text-tertiary truncate">{a.cameraName}</span>
                  <span className="w-36 shrink-0 text-[11px] text-text-tertiary mono-data">{formatDateTime(a.timestamp)}</span>
                  <div className="w-32 shrink-0 flex justify-end">
                    <AlertStatusBadge status={a.status} />
                  </div>
                  <div className="w-28 shrink-0 flex justify-end">
                    {a.status === 'OPEN' ? (
                      <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(a.id)}>
                        Acknowledge
                      </Button>
                    ) : (
                      <span className={cn('text-[11px] text-text-disabled')}>Handled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </AppShell>
  )
}
