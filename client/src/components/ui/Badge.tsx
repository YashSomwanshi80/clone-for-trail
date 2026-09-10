import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Circle, AlertTriangle, AlertOctagon, CheckCircle2, Info, Wrench } from 'lucide-react'

type Tone = 'teal' | 'brass' | 'critical' | 'warning' | 'success' | 'info' | 'neutral'

const toneClasses: Record<Tone, string> = {
  teal: 'bg-teal/12 text-teal border-teal/30',
  brass: 'bg-brass/12 text-brass-soft border-brass/30',
  critical: 'bg-critical/12 text-critical border-critical/35',
  warning: 'bg-warning/12 text-warning border-warning/35',
  success: 'bg-success/12 text-success border-success/35',
  info: 'bg-info/12 text-info border-info/35',
  neutral: 'bg-raised text-text-secondary border-border-soft',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

const CAMERA_STATUS_MAP = {
  ONLINE: { tone: 'teal' as Tone, label: 'Online', Icon: Circle },
  OFFLINE: { tone: 'neutral' as Tone, label: 'Offline', Icon: Circle },
  MAINTENANCE: { tone: 'warning' as Tone, label: 'Maintenance', Icon: Wrench },
}

export function CameraStatusBadge({ status }: { status: keyof typeof CAMERA_STATUS_MAP }) {
  const { tone, label, Icon } = CAMERA_STATUS_MAP[status]
  return (
    <Badge tone={tone}>
      <Icon className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
      {label}
    </Badge>
  )
}

const SEVERITY_MAP = {
  CRITICAL: { tone: 'critical' as Tone, label: 'Critical', Icon: AlertOctagon },
  HIGH: { tone: 'warning' as Tone, label: 'High', Icon: AlertTriangle },
  MEDIUM: { tone: 'info' as Tone, label: 'Medium', Icon: Info },
  LOW: { tone: 'neutral' as Tone, label: 'Low', Icon: Info },
}

export function SeverityBadge({ severity }: { severity: keyof typeof SEVERITY_MAP }) {
  const { tone, label, Icon } = SEVERITY_MAP[severity]
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

const ALERT_STATUS_MAP = {
  OPEN: { tone: 'critical' as Tone, label: 'Open' },
  ACKNOWLEDGED: { tone: 'info' as Tone, label: 'Acknowledged' },
  RESOLVED: { tone: 'success' as Tone, label: 'Resolved' },
}

export function AlertStatusBadge({ status }: { status: keyof typeof ALERT_STATUS_MAP }) {
  const { tone, label } = ALERT_STATUS_MAP[status]
  const Icon = status === 'RESOLVED' ? CheckCircle2 : status === 'ACKNOWLEDGED' ? CheckCircle2 : AlertOctagon
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

const SYSTEM_STATUS_MAP = {
  OPERATIONAL: { tone: 'teal' as Tone, label: 'Operational' },
  DEGRADED: { tone: 'warning' as Tone, label: 'Degraded' },
  PARTIAL_OUTAGE: { tone: 'critical' as Tone, label: 'Partial outage' },
  MAINTENANCE: { tone: 'info' as Tone, label: 'Maintenance' },
}

export function SystemStatusBadge({ status }: { status: keyof typeof SYSTEM_STATUS_MAP }) {
  const { tone, label } = SYSTEM_STATUS_MAP[status]
  return (
    <Badge tone={tone}>
      <Circle className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
      {label}
    </Badge>
  )
}
