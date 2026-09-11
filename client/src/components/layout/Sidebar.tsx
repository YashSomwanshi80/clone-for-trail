import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Route as RouteIcon,
  Bell,
  BarChart3,
  UploadCloud,
  ShieldAlert,
  Radio,
  Sun,
  Moon,
  Server,
  ScanEye,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { SystemStatusBadge } from '@/components/ui/Badge'
import { camerasApi } from '@/lib/api/java'
import { setAccessToken } from '@/lib/api/http'
import type { SystemStatus } from '@/types'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    label: 'Monitoring',
    items: [
      { to: '/dashboard', label: 'Camera Map', icon: LayoutDashboard },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/trajectory', label: 'Trajectory Viewer', icon: RouteIcon },
      { to: '/alerts', label: 'Alert Console', icon: Bell },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/upload', label: 'Upload & Test', icon: UploadCloud },
      { to: '/blacklist', label: 'Blacklist', icon: ShieldAlert },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/nodes', label: 'Node Management', icon: Server },
      { to: '/review', label: 'Manual Review', icon: ScanEye },
    ],
  },
]

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('OPERATIONAL')

  // useQuery — reads from shared 'cameras' cache, no extra fetch if Dashboard loaded first
  const { data: cameras } = useQuery({ queryKey: ['cameras'], queryFn: camerasApi.list })

  useEffect(() => {
    if (!cameras || cameras.length === 0) return
    const onlineRatio = cameras.filter((c) => c.status === 'ONLINE' || c.status === 'ACTIVE').length / cameras.length
    if (onlineRatio > 0.8) setSystemStatus('OPERATIONAL')
    else if (onlineRatio > 0.5) setSystemStatus('DEGRADED')
    else setSystemStatus('PARTIAL_OUTAGE')
  }, [cameras])

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-border-soft bg-deep-graphite">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal/12 text-teal">
          <Radio className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-text-primary leading-tight truncate">City ANPR Platform</p>
          <p className="text-[10px] text-text-tertiary leading-tight">ANPR Operations</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {GROUPS.map((group) => {
          const visibleItems = group.items
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-3">
              <p className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-text-disabled">
                {group.label}
              </p>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                      isActive
                        ? 'bg-raised text-text-primary'
                        : 'text-text-secondary hover:bg-raised/60 hover:text-text-primary'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-teal" />}
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border-soft px-3 py-3 space-y-2">
        <div className="flex items-center justify-between rounded-md bg-raised px-2.5 py-2">
          <span className="text-[11px] text-text-tertiary">System</span>
          <SystemStatusBadge status={systemStatus} />
        </div>
        <button
          type="button"
          onClick={() => {
            setAccessToken(null);
            window.location.href = '/login';
          }}
          className="flex w-full items-center justify-between rounded-md bg-raised px-2.5 py-2 text-[11px] text-text-tertiary hover:text-critical transition-colors"
        >
          <span>Sign out</span>
          <LogOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-md bg-raised px-2.5 py-2 text-[11px] text-text-tertiary hover:text-text-primary transition-colors"
        >
          <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  )
}
