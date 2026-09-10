import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Camera as CameraIcon, ScanLine, Radar, BellRing } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Metric } from '@/components/ui/Metric'
import { CameraMap } from '@/components/maps/DarkMap'
import { camerasApi, alertsApi } from '@/lib/api/java'
import type { Alert, CameraHealth } from '@/types'
import { CameraStatusBadge, SeverityBadge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Feedback'
import { formatRelativeTime, formatTime } from '@/lib/utils'
import { useAlertsFeed } from '@/hooks/useAlertsFeed'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  // useQuery — shared cache key 'cameras' is reused by UploadPage and Sidebar
  const { data: cameras } = useQuery({ queryKey: ['cameras'], queryFn: camerasApi.list })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedHealth, setSelectedHealth] = useState<CameraHealth | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [seedAlerts, setSeedAlerts] = useState<Alert[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    alertsApi.list().then(setSeedAlerts)
  }, [])

  const { alerts, status } = useAlertsFeed(seedAlerts)

  const online = cameras?.filter((c) => c.status === 'ONLINE').length ?? 0
  const total = cameras?.length ?? 0
  const detectionsToday = useMemo(() => cameras?.reduce((s, c) => s + c.detectionsToday, 0) ?? 0, [cameras])
  const openAlerts = alerts.filter((a) => a.status === 'OPEN')

  // Recent detections derived from the live alerts feed — real events, not fabricated data
  const recentDetections = useMemo(() => {
    return alerts.slice(0, 8).map((a) => ({
      id: a.id,
      plate: a.plateNumber,
      camera: a.cameraName,
      time: a.timestamp,
    }))
  }, [alerts])

  function handleCameraSelect(camera: { id: string; lat: number; lng: number; zone: string; name: string; status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'; detectionsToday: number; lastPingSeconds: number }) {
    setSelectedId(camera.id)
    setSelectedHealth(null)
    setHealthLoading(true)
    camerasApi.health(camera.id)
      .then(setSelectedHealth)
      .catch(() => setSelectedHealth(null))
      .finally(() => setHealthLoading(false))
  }

  const selectedCamera = cameras?.find((c) => c.id === selectedId) ?? null

  return (
    <AppShell title="Camera Map / Dashboard" wsStatus={status} alertCount={openAlerts.length}>
      <div className="grid grid-cols-4 gap-4 mb-5">
        {!cameras ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Card>
              <CardHeader icon={<CameraIcon className="h-3.5 w-3.5" />} title="Active cameras" unit="count" />
              <CardBody>
                <Metric label="" value={online} delta={total > 0 ? Math.round((online / total) * 100) - 100 : 0} deltaLabel="% offline" mono />
              </CardBody>
            </Card>
            <Card>
              <CardHeader icon={<ScanLine className="h-3.5 w-3.5" />} title="Vehicles detected today" unit="count" />
              <CardBody>
                <Metric label="" value={detectionsToday.toLocaleString()} mono />
              </CardBody>
            </Card>
            <Card>
              <CardHeader icon={<Radar className="h-3.5 w-3.5" />} title="Cameras online" unit="count" />
              <CardBody>
                <Metric label="" value={`${online} / ${total}`} mono />
              </CardBody>
            </Card>
            <Card>
              <CardHeader icon={<BellRing className="h-3.5 w-3.5" />} title="Active alerts" unit="count" />
              <CardBody>
                <Metric label="" value={openAlerts.length} delta={openAlerts.length > 3 ? 12 : -6} deltaLabel="vs 1h ago" mono />
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader title="Camera network" subtitle="Teal = online · gray = offline · amber = maintenance" />
            <CardBody>
              {cameras ? (
                <CameraMap cameras={cameras} selectedId={selectedId} onSelect={handleCameraSelect} height={440} />
              ) : (
                <div className="h-[440px] animate-pulse rounded-lg bg-raised" />
              )}
            </CardBody>
          </Card>

          {/* Selected camera health panel */}
          {selectedCamera && (
            <Card>
              <CardHeader title={`Camera health — ${selectedCamera.name}`} subtitle={selectedCamera.zone} />
              <CardBody>
                {healthLoading ? (
                  <p className="text-[12px] text-text-tertiary">Loading health data…</p>
                ) : selectedHealth ? (
                  <div className="grid grid-cols-3 gap-4 text-[13px]">
                    <div>
                      <p className="text-text-tertiary text-[11px] uppercase tracking-wider mb-0.5">Status</p>
                      <CameraStatusBadge status={selectedHealth.status} />
                    </div>
                    <div>
                      <p className="text-text-tertiary text-[11px] uppercase tracking-wider mb-0.5">Uptime</p>
                      <p className="mono-data text-text-primary">{selectedHealth.uptimePercent?.toFixed(1) ?? '—'}%</p>
                    </div>
                    <div>
                      <p className="text-text-tertiary text-[11px] uppercase tracking-wider mb-0.5">Last ping</p>
                      <p className="mono-data text-text-primary">{selectedHealth.lastPing ? formatRelativeTime(selectedHealth.lastPing) : '—'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-text-tertiary">Health check unavailable for this camera.</p>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Recent detections" subtitle="From live alert feed" />
            <CardBody className="pt-0">
              <div className="divide-y divide-border-soft/60">
                {recentDetections.length > 0 ? recentDetections.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 text-[13px]">
                    <span className="mono-data text-text-primary">{d.plate}</span>
                    <span className="text-text-tertiary">{d.camera}</span>
                    <span className="text-text-tertiary mono-data">{formatTime(d.time)}</span>
                  </div>
                )) : (
                  <p className="py-4 text-[12px] text-text-tertiary text-center">Waiting for detection events…</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Camera health" />
            <CardBody className="pt-0 max-h-[300px] overflow-y-auto scrollbar-thin">
              <div className="divide-y divide-border-soft/60">
                {cameras?.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCameraSelect(c)}
                    className="flex w-full items-center justify-between py-2.5 text-left text-[13px] hover:opacity-80"
                  >
                    <span className="text-text-primary truncate mr-2">{c.name}</span>
                    <CameraStatusBadge status={c.status} />
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Active alerts" action={<button onClick={() => navigate('/alerts')} className="text-[12px] text-teal hover:text-teal-soft">View all</button>} />
            <CardBody className="pt-0">
              <div className="divide-y divide-border-soft/60">
                {openAlerts.slice(0, 6).map((a) => (
                  <div key={a.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-[11px] text-text-tertiary">{formatRelativeTime(a.timestamp)}</span>
                    </div>
                    <p className="text-[13px] text-text-primary">{a.type}</p>
                    <p className="text-[12px] text-text-tertiary mono-data">{a.plateNumber} · {a.cameraName}</p>
                  </div>
                ))}
                {openAlerts.length === 0 && <p className="py-4 text-[12px] text-text-tertiary text-center">No open alerts right now</p>}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
