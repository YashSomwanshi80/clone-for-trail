import { useEffect, useState } from 'react'
import { ShieldAlert, Plus, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/Table'
import { Dialog, ConfirmationDialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import type { BlacklistEntry } from '@/types'
import { blacklistApi } from '@/lib/api/java'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [plateInput, setPlateInput] = useState('')
  const [reasonInput, setReasonInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const { push } = useToast()

  function load() {
    setLoading(true)
    setError(null)
    blacklistApi
      .list()
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load blacklist'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd() {
    if (!plateInput.trim()) {
      setFormError('Plate number is required')
      return
    }
    if (entries.some((e) => e.plateNumber === plateInput.trim().toUpperCase())) {
      setFormError('This plate is already on the blacklist')
      return
    }
    const entry: BlacklistEntry = {
      plateNumber: plateInput.trim().toUpperCase(),
      reason: reasonInput.trim() || 'No reason provided',
      addedBy: 'ops.singh',
      addedAt: new Date().toISOString(),
    }
    await blacklistApi.create(entry)
    setEntries((prev) => [entry, ...prev])
    setAddOpen(false)
    setPlateInput('')
    setReasonInput('')
    setFormError(null)
    push('success', `${entry.plateNumber} added to blacklist`)
  }

  async function handleDelete(plate: string) {
    await blacklistApi.remove(plate)
    setEntries((prev) => prev.filter((e) => e.plateNumber !== plate))
    push('info', `${plate} removed from blacklist`)
  }

  const columns: Column<BlacklistEntry>[] = [
    { key: 'plate', header: 'Plate', render: (r) => <span className="mono-data text-text-primary">{r.plateNumber}</span>, sortValue: (r) => r.plateNumber },
    { key: 'reason', header: 'Reason', render: (r) => r.reason },
    { key: 'addedBy', header: 'Added by', render: (r) => r.addedBy, sortValue: (r) => r.addedBy },
    { key: 'addedAt', header: 'Added', render: (r) => <span className="mono-data text-[12px]">{formatDateTime(r.addedAt)}</span>, sortValue: (r) => r.addedAt },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <IconButton label={`Remove ${r.plateNumber}`} variant="danger" onClick={() => setPendingDelete(r.plateNumber)}>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      ),
    },
  ]

  return (
    <AppShell title="Blacklist Management">
      <Card>
        <CardHeader
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
          title="Blacklisted plates"
          subtitle={`${entries.length} entries`}
          action={
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add plate
            </Button>
          }
        />
        <CardBody className="pt-0">
          <DataTable
            columns={columns}
            rows={entries}
            rowKey={(r) => r.plateNumber}
            loading={loading}
            error={error}
            onRetry={load}
            emptyTitle="No plates blacklisted"
            emptyDescription="Add a plate number to start flagging it across the camera network."
          />
        </CardBody>
      </Card>

      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          setFormError(null)
        }}
        title="Add plate to blacklist"
        description="This plate will trigger a Critical alert wherever it's detected."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              Add to blacklist
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Plate number" value={plateInput} onChange={(e) => setPlateInput(e.target.value)} placeholder="e.g. MH12AB1234" error={formError ?? undefined} />
          <Input label="Reason" value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} placeholder="e.g. Reported stolen" />
        </div>
      </Dialog>

      <ConfirmationDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        title="Remove from blacklist?"
        description={`${pendingDelete} will stop triggering blacklist-match alerts immediately.`}
        confirmLabel="Remove"
      />
    </AppShell>
  )
}
