import { useNavigate } from 'react-router-dom'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { SearchInput } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
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
      </div>
    </header>
  )
}
