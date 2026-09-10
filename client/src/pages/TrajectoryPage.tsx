import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Route as RouteIcon, MapPin, Clock, Gauge, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/Input'
import { TrajectoryMap } from '@/components/maps/DarkMap'
import { trajectoryApi } from '@/lib/api/java'
import type { Trajectory } from '@/types'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Metric } from '@/components/ui/Metric'

export function TrajectoryPage() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('plate') ?? '')
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search(plate: string) {
    if (!plate.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await trajectoryApi.search(plate)
      setTrajectory(result)
      setSelectedIndex(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch trajectory')
      setTrajectory(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.get('plate')) search(params.get('plate')!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppShell title="Trajectory Viewer">
      <Card className="mb-5">
        <CardBody className="pt-4">
          <div className="flex items-center gap-3">
            <RouteIcon className="h-4 w-4 text-text-tertiary" />
            <SearchInput
              value={query}
              onChange={setQuery}
              onSubmit={() => search(query)}
              placeholder="Search a plate number, e.g. MH12AB1234"
              loading={loading}
              className="max-w-md"
            />
          </div>
        </CardBody>
      </Card>

      {!trajectory && !loading && !error && (
        <Card>
          <CardBody>
            <EmptyState
              icon={<RouteIcon className="h-7 w-7" />}
              title="Search a plate to view its trajectory"
              description="Enter a plate number above to render its multi-camera route chronologically on the map."
            />
          </CardBody>
        </Card>
      )}

      {error && (
        <Card>
          <CardBody>
            <ErrorState message={error} onRetry={() => search(query)} />
          </CardBody>
        </Card>
      )}

      {trajectory && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-5">
            <Card>
              <CardBody className="pt-4">
                <Metric label="Plate" value={<span className="mono-data">{trajectory.plateNumber}</span>} />
              </CardBody>
            </Card>
            <Card>
              <CardBody className="pt-4">
                <Metric label="Cameras" value={trajectory.totalCameras} mono />
              </CardBody>
            </Card>
            <Card>
              <CardBody className="pt-4">
                <Metric label="Distance" value={trajectory.distanceKm} unit="km" mono />
              </CardBody>
            </Card>
            <Card>
              <CardBody className="pt-4">
                <Metric label="Duration" value={trajectory.durationMinutes} unit="min" mono />
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <Card className="col-span-2">
              <CardHeader title="Route" subtitle="Mineral teal = path · brass = selected stop · crimson = anomaly" />
              <CardBody>
                <TrajectoryMap points={trajectory.points} selectedIndex={selectedIndex} height={520} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Timeline" subtitle={`${trajectory.points.length} chronological stops`} />
              <CardBody className="pt-0 max-h-[560px] overflow-y-auto scrollbar-thin">
                <ol className="relative border-l border-border-soft ml-2">
                  {trajectory.points.map((p, i) => {
                    const selected = i === selectedIndex
                    return (
                      <li key={`${p.cameraId}-${p.timestamp}`} className="mb-1 ml-4">
                        <span
                          className={cn(
                            'absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-deep-graphite',
                            p.isAnomaly ? 'bg-critical' : selected ? 'bg-brass' : 'bg-teal'
                          )}
                        />
                        <button
                          onClick={() => setSelectedIndex(i)}
                          className={cn(
                            'w-full rounded-md px-2.5 py-2 text-left transition-colors',
                            selected ? 'bg-raised' : 'hover:bg-raised/60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[13px] text-text-primary">
                              <MapPin className="h-3 w-3 text-text-tertiary" />
                              {p.cameraName}
                            </span>
                            {p.isAnomaly && <AlertTriangle className="h-3.5 w-3.5 text-critical" />}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-text-tertiary">
                            <span className="flex items-center gap-1 mono-data">
                              <Clock className="h-3 w-3" /> {formatDateTime(p.timestamp)}
                            </span>
                            <span className="flex items-center gap-1 mono-data">
                              <Gauge className="h-3 w-3" /> {(p.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  )
}
