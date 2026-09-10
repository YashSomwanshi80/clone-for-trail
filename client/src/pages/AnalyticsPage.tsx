import { useCallback, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { analyticsApi, camerasApi } from '@/lib/api/java'
import { useAnalyticsLive } from '@/hooks/useAnalyticsLive'
import { Metric } from '@/components/ui/Metric'
import { formatTime } from '@/lib/utils'
import { HeatmapMap } from '@/components/maps/DarkMap'
import type { AnalyticsSnapshot, HeatmapPoint, ODFlowEntry } from '@/types'

const TEAL = '#57C7B5'
const BRASS = '#B79A62'
const INFO = '#7196B8'

function chartTooltipStyle() {
  return {
    background: '#191C20',
    border: '1px solid #2C3138',
    borderRadius: 8,
    fontSize: 12,
    color: '#F0F1EE',
  }
}

export function AnalyticsPage() {
  const [range, setRange] = useState('6h')
  const [zone, setZone] = useState('all')
  const [zones, setZones] = useState<string[]>([])
  const [initial, setInitial] = useState<AnalyticsSnapshot[]>([])
  const [odFlowData, setOdFlowData] = useState<ODFlowEntry[]>([])
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([])
  const { history, status } = useAnalyticsLive(initial)

  const fetchData = useCallback(async () => {
    const [hist, od, heat] = await Promise.all([
      analyticsApi.history(range, zone),
      analyticsApi.odFlow(range, zone),
      analyticsApi.heatmap(range),
    ])
    setInitial(hist)
    setOdFlowData(od)
    setHeatmapPoints(heat)
  }, [range, zone])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    camerasApi.list().then((cams) => {
      setZones(Array.from(new Set(cams.map((c) => c.zone))))
    })
  }, [])

  const latest = history.length > 0 ? history[history.length - 1] : { volume: 0, avgSpeedKmh: 0, congestionIndex: 0, timestamp: '' }
  const prior = history.length > 1 ? history[history.length - 2] : latest
  const chartData = history.map((h) => ({ ...h, label: formatTime(h.timestamp) }))

  return (
    <AppShell title="Analytics Dashboard" wsStatus={status}>
      <Card className="mb-5">
        <CardBody className="pt-4 flex flex-wrap items-end gap-4">
          <Select label="Time range" value={range} onChange={(e) => setRange(e.target.value)} className="w-32">
            <option value="1h">Last 1h</option>
            <option value="6h">Last 6h</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
          </Select>
          <Select label="Zone / camera" value={zone} onChange={(e) => setZone(e.target.value)} className="w-48">
            <option value="all">All zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-[11px] text-text-tertiary">
            Filters update all panels via analyticsApi
          </span>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card>
          <CardBody className="pt-4">
            <Metric label="Traffic volume" value={latest.volume} unit="veh / 5min" delta={Math.round(((latest.volume - prior.volume) / prior.volume) * 100)} deltaLabel="vs prev." mono />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-4">
            <Metric label="Average speed" value={latest.avgSpeedKmh} unit="km/h" delta={Math.round(((latest.avgSpeedKmh - prior.avgSpeedKmh) / prior.avgSpeedKmh) * 100)} deltaLabel="vs prev." mono />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-4">
            <Metric label="Congestion index" value={latest.congestionIndex} unit="/ 100" delta={Math.round(((latest.congestionIndex - prior.congestionIndex) / prior.congestionIndex) * 100)} deltaLabel="vs prev." mono />
          </CardBody>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader title="Detection heatmap" subtitle="Geographic density from camera detection volume" />
        <CardBody>
          <HeatmapMap points={heatmapPoints} height={340} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Card>
          <CardHeader title="Traffic volume trend" subtitle="Live via /ws/analytics/live" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2C3138" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7E858D' }} axisLine={{ stroke: '#2C3138' }} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fontSize: 11, fill: '#7E858D' }} axisLine={false} tickLine={false} width={32} />
                <RTooltip contentStyle={chartTooltipStyle()} />
                <Area type="monotone" dataKey="volume" stroke={TEAL} fill="url(#volFill)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Average speed" subtitle="km/h across monitored zones" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2C3138" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7E858D' }} axisLine={{ stroke: '#2C3138' }} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fontSize: 11, fill: '#7E858D' }} axisLine={false} tickLine={false} width={32} />
                <RTooltip contentStyle={chartTooltipStyle()} />
                <Line type="monotone" dataKey="avgSpeedKmh" stroke={INFO} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Density / congestion" subtitle="Congestion index, 0–100" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="congFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRASS} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={BRASS} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2C3138" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7E858D' }} axisLine={{ stroke: '#2C3138' }} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fontSize: 11, fill: '#7E858D' }} axisLine={false} tickLine={false} width={32} />
                <RTooltip contentStyle={chartTooltipStyle()} />
                <Area type="monotone" dataKey="congestionIndex" stroke={BRASS} fill="url(#congFill)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Origin–destination flow" subtitle="Top zone-to-zone movement" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={odFlowData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="#2C3138" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#7E858D' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="origin"
                  tick={{ fontSize: 10, fill: '#7E858D' }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <RTooltip
                  contentStyle={chartTooltipStyle()}
                  formatter={(value, _name, item) => [value, `→ ${(item.payload as { destination: string }).destination}`]}
                />
                <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
