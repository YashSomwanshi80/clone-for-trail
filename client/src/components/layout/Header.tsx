import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, User, Wifi, WifiOff } from 'lucide-react'
import { SearchInput } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Header({
  title,
  wsStatus,
  alertCount,
}: {
  title: string
  wsStatus?: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING'
  alertCount?: number
}) {
  const { userId, role, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function handleSearch() {
    if (!search.trim()) return
    // Plate-shaped query -> trajectory search; otherwise leave the query staged for the operator
    navigate(`/trajectory?plate=${encodeURIComponent(search.trim().toUpperCase())}`)
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border-soft bg-deep-graphite px-5">
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="text-[15px] font-medium text-text-primary whitespace-nowrap">{title}</h1>
        <Badge tone="neutral" className="whitespace-nowrap">LOCAL DEV</Badge>
      </div>

      <div className="hidden md:block w-full max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          onSubmit={handleSearch}
          placeholder="Search plates, cameras, alerts..."
        />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {wsStatus && (
          <span
            className={cn(
              'hidden lg:inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px]',
              wsStatus === 'OPEN' ? 'border-teal/30 text-teal bg-teal/10' : 'border-warning/30 text-warning bg-warning/10'
            )}
          >
            {wsStatus === 'OPEN' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {wsStatus === 'OPEN' ? 'Live' : wsStatus === 'RECONNECTING' ? 'Reconnecting…' : 'Connecting…'}
          </span>
        )}

        <div className="relative">
          <IconButton label="Notifications" onClick={() => navigate('/alerts')}>
            <Bell className="h-4 w-4" />
          </IconButton>
          {!!alertCount && alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-critical px-1 text-[9px] font-semibold text-text-primary">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </div>

        <Dropdown
          align="end"
          trigger={
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-raised">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-raised text-text-secondary">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] leading-tight text-text-primary">{userId}</p>
                <p className="text-[10px] leading-tight text-text-tertiary">{role}</p>
              </div>
            </button>
          }
          items={[{ label: 'Log out', icon: <LogOut className="h-3.5 w-3.5" />, onSelect: () => void logout(), danger: true }]}
        />
      </div>
    </header>
  )
}
