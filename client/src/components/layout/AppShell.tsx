import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell({
  title,
  wsStatus,
  alertCount,
  children,
}: {
  title: string
  wsStatus?: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'RECONNECTING'
  alertCount?: number
  children: ReactNode
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-obsidian">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} wsStatus={wsStatus} alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">{children}</main>
      </div>
    </div>
  )
}
