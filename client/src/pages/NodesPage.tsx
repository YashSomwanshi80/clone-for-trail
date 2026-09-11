import { useEffect, useState } from 'react'
import { Server, Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/Table'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import type { NodeInfo } from '@/types'
import { nodesApi } from '@/lib/api/java'
import { useToast } from '@/components/ui/Toast'
import { DEFAULT_CITY_ID } from '@/lib/api/http'

export function NodesPage() {
  const [nodes, setNodes] = useState<NodeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { push } = useToast()

  // Form fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nodeName, setNodeName] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [cityId, setCityId] = useState(DEFAULT_CITY_ID)
  const [stateId, setStateId] = useState('')

  function load() {
    setLoading(true)
    setError(null)
    nodesApi
      .list()
      .then(setNodes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load nodes'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd() {
    if (!username.trim() || !password.trim() || !nodeName.trim()) {
      setFormError('Username, password, and node name are required')
      return
    }
    if (!lat.trim() || !lng.trim()) {
      setFormError('Latitude and longitude are required')
      return
    }
    if (!stateId.trim()) {
      setFormError('State ID is required')
      return
    }
    try {
      const node = await nodesApi.create({
        username: username.trim(),
        password: password.trim(),
        nodeName: nodeName.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        cityId: cityId.trim() || DEFAULT_CITY_ID,
        stateId: stateId.trim(),
      })
      setNodes((prev) => [node, ...prev])
      setAddOpen(false)
      resetForm()
      push('success', `Node "${node.nodeName}" created`)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create node')
    }
  }

  function resetForm() {
    setUsername('')
    setPassword('')
    setNodeName('')
    setLat('')
    setLng('')
    setCityId(DEFAULT_CITY_ID)
    setStateId('')
    setFormError(null)
  }

  const columns: Column<NodeInfo>[] = [
    { key: 'nodeName', header: 'Node Name', render: (r) => <span className="text-text-primary font-medium">{r.nodeName}</span>, sortValue: (r) => r.nodeName },
    { key: 'username', header: 'Username', render: (r) => <span className="mono-data">{r.username}</span>, sortValue: (r) => r.username },
    { key: 'cameraId', header: 'Camera ID', render: (r) => <span className="mono-data text-[12px]">{r.cameraId}</span> },
    { key: 'cityId', header: 'City', render: (r) => r.cityId, sortValue: (r) => r.cityId },
    { key: 'coords', header: 'Location', render: (r) => <span className="mono-data text-[12px]">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</span> },
  ]

  return (
    <AppShell title="Node Management">
      <Card>
        <CardHeader
          icon={<Server className="h-3.5 w-3.5" />}
          title="Camera nodes"
          subtitle={`${nodes.length} nodes`}
          action={
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Create node
            </Button>
          }
        />
        <CardBody className="pt-0">
          <DataTable
            columns={columns}
            rows={nodes}
            rowKey={(r) => r.userId}
            loading={loading}
            error={error}
            onRetry={load}
            emptyTitle="No nodes created"
            emptyDescription="Create a node to provision a camera-operator login."
          />
        </CardBody>
      </Card>

      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          resetForm()
        }}
        title="Create camera node"
        description="This creates both a camera identity and a login tied to it."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setAddOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              Create node
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Node name" value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="e.g. CAM-MH12-001" />
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Login username for this node" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Login password" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 19.0760" />
            <Input label="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 72.8777" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="City ID" value={cityId} onChange={(e) => setCityId(e.target.value)} placeholder="e.g. mumbai" />
            <Input label="State ID" value={stateId} onChange={(e) => setStateId(e.target.value)} placeholder="e.g. maharashtra" />
          </div>
          {formError && <p className="text-[11px] text-critical">{formError}</p>}
        </div>
      </Dialog>
    </AppShell>
  )
}
