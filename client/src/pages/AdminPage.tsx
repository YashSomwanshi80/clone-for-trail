import { useEffect, useState } from 'react'
import { Users, Info, Plus, UserCog } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/Table'
import { Dialog, ConfirmationDialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import type { User, Role } from '@/types'
import { usersApi } from '@/lib/api/java'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [addOpen, setAddOpen] = useState(false)
  const [userIdInput, setUserIdInput] = useState('')
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [roleInput, setRoleInput] = useState<Role>('OPERATOR')
  const [formError, setFormError] = useState<string | null>(null)
  
  const [pendingStatusToggle, setPendingStatusToggle] = useState<{ id: string; currentStatus: 'ACTIVE' | 'DISABLED' } | null>(null)
  const { push } = useToast()

  function load() {
    setLoading(true)
    setError(null)
    usersApi
      .list()
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load users'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd() {
    if (!userIdInput.trim() || !displayNameInput.trim()) {
      setFormError('User ID and Display Name are required')
      return
    }
    if (users.some((u) => u.userId === userIdInput.trim())) {
      setFormError('User ID already exists')
      return
    }
    try {
      const newUser = await usersApi.create({
        userId: userIdInput.trim(),
        displayName: displayNameInput.trim(),
        role: roleInput,
        status: 'ACTIVE'
      })
      setUsers((prev) => [...prev, newUser])
      setAddOpen(false)
      setUserIdInput('')
      setDisplayNameInput('')
      setRoleInput('OPERATOR')
      setFormError(null)
      push('success', `User ${newUser.userId} created`)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create user')
    }
  }

  async function handleRoleChange(id: string, role: Role) {
    try {
      const updated = await usersApi.updateRole(id, role)
      setUsers((prev) => prev.map((u) => u.id === id ? updated : u))
      push('success', `Role updated to ${role}`)
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Failed to update role')
    }
  }

  async function handleStatusToggle(id: string, newStatus: 'ACTIVE' | 'DISABLED') {
    try {
      const updated = await usersApi.setStatus(id, newStatus)
      setUsers((prev) => prev.map((u) => u.id === id ? updated : u))
      push('info', `User status changed to ${newStatus === 'ACTIVE' ? 'Active' : 'Disabled'}`)
      setPendingStatusToggle(null)
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Failed to update status')
    }
  }

  const columns: Column<User>[] = [
    { key: 'userId', header: 'User ID', render: (r) => <span className="mono-data text-text-primary">{r.userId}</span>, sortValue: (r) => r.userId },
    { key: 'name', header: 'Name', render: (r) => r.displayName, sortValue: (r) => r.displayName },
    { 
      key: 'role', 
      header: 'Role', 
      render: (r) => (
        <Select 
          value={r.role} 
          onChange={(e) => handleRoleChange(r.id, e.target.value as Role)}
        >
          <option value="ADMIN">ADMIN</option>
          <option value="OPERATOR">OPERATOR</option>
          <option value="VIEWER">VIEWER</option>
        </Select>
      ), 
      sortValue: (r) => r.role 
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status === 'ACTIVE' ? 'Active' : 'Disabled'}</Badge>,
      sortValue: (r) => r.status,
    },
    { key: 'lastActive', header: 'Last active', render: (r) => formatRelativeTime(r.lastActive), sortValue: (r) => r.lastActive },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <IconButton label={`Toggle Status for ${r.userId}`} variant={r.status === 'ACTIVE' ? 'danger' : 'primary'} onClick={() => setPendingStatusToggle({ id: r.id, currentStatus: r.status })}>
          <UserCog className="h-3.5 w-3.5" />
        </IconButton>
      ),
    },
  ]

  return (
    <AppShell title="User / Role Admin">
      <Card className="mb-4">
        <CardBody className="pt-4 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-tertiary">
            Role changes shown here drive the role-aware UI elsewhere in the app (hiding trajectory search and
            blacklist management for roles without access). This page is UX only — the real access-control
            boundary is enforced server-side by Java's RBAC.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader 
          icon={<Users className="h-3.5 w-3.5" />} 
          title="Users" 
          subtitle={`${users.length} accounts`} 
          action={
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add user
            </Button>
          }
        />
        <CardBody className="pt-0">
          <DataTable
            columns={columns}
            rows={users}
            rowKey={(r) => r.id}
            loading={loading}
            error={error}
            onRetry={load}
            emptyTitle="No users found"
          />
        </CardBody>
      </Card>

      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          setFormError(null)
        }}
        title="Add user"
        description="Create a new user account with role-based access."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              Create user
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="User ID" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} placeholder="e.g. j.doe" error={formError ?? undefined} />
          <Input label="Display Name" value={displayNameInput} onChange={(e) => setDisplayNameInput(e.target.value)} placeholder="e.g. John Doe" />
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-tertiary mb-1.5 font-medium">Role</label>
            <Select value={roleInput} onChange={(e) => setRoleInput(e.target.value as Role)} className="w-full">
              <option value="ADMIN">ADMIN</option>
              <option value="OPERATOR">OPERATOR</option>
              <option value="VIEWER">VIEWER</option>
            </Select>
          </div>
        </div>
      </Dialog>

      <ConfirmationDialog
        open={!!pendingStatusToggle}
        onClose={() => setPendingStatusToggle(null)}
        onConfirm={() => pendingStatusToggle && handleStatusToggle(pendingStatusToggle.id, pendingStatusToggle.currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
        title={pendingStatusToggle?.currentStatus === 'ACTIVE' ? "Disable user?" : "Enable user?"}
        description={pendingStatusToggle?.currentStatus === 'ACTIVE' ? "This user will immediately lose access to the system." : "This user will regain access to the system."}
        confirmLabel={pendingStatusToggle?.currentStatus === 'ACTIVE' ? "Disable" : "Enable"}
      />
    </AppShell>
  )
}
