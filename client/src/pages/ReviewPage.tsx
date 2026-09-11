import { useEffect, useState } from 'react'
import { ScanEye, Check, PencilLine } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/Feedback'
import type { ReviewItem } from '@/types'
import { reviewApi } from '@/lib/api/java'
import { useToast } from '@/components/ui/Toast'
import { DEFAULT_CITY_ID, pythonMediaUrl } from '@/lib/api/http'
import { formatDateTime } from '@/lib/utils'

export function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [correctedPlate, setCorrectedPlate] = useState('')
  const { push } = useToast()

  function load() {
    setLoading(true)
    setError(null)
    reviewApi
      .listPending(DEFAULT_CITY_ID)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load review queue'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleConfirm(item: ReviewItem) {
    try {
      await reviewApi.verify(item.detectionId, { verifiedBy: 'web-admin' })
      setItems((prev) => prev.filter((i) => i.detectionId !== item.detectionId))
      push('success', `Plate ${item.plateNumber} confirmed`)
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Verification failed')
    }
  }

  async function handleCorrect(item: ReviewItem) {
    if (!correctedPlate.trim()) {
      push('error', 'Enter the corrected plate number')
      return
    }
    try {
      await reviewApi.verify(item.detectionId, {
        correctedPlateNumber: correctedPlate.trim().toUpperCase(),
        verifiedBy: 'web-admin',
      })
      setItems((prev) => prev.filter((i) => i.detectionId !== item.detectionId))
      setEditingId(null)
      setCorrectedPlate('')
      push('success', `Plate corrected to ${correctedPlate.trim().toUpperCase()}`)
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Correction failed')
    }
  }

  function extractFilename(path: string | null): string | null {
    if (!path) return null
    const parts = path.split('/')
    return parts[parts.length - 1]
  }

  return (
    <AppShell title="Manual Review">
      <Card>
        <CardHeader
          icon={<ScanEye className="h-3.5 w-3.5" />}
          title="Low-confidence detections"
          subtitle={`${items.length} pending review`}
          action={
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              Refresh
            </Button>
          }
        />
        <CardBody className="pt-0">
          {loading ? (
            <div className="py-12 text-center text-[13px] text-text-tertiary">Loading…</div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-critical">{error}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={load}>Retry</Button>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ScanEye className="h-7 w-7" />}
              title="Review queue empty"
              description="All detections above the confidence threshold — nothing to review."
            />
          ) : (
            <div className="divide-y divide-border-soft/60">
              {items.map((item) => {
                const filename = extractFilename(item.croppedImagePath)
                const isEditing = editingId === item.detectionId

                return (
                  <div key={item.detectionId} className="flex items-center gap-4 py-3">
                    {/* Cropped plate image */}
                    <div className="w-28 h-14 shrink-0 rounded border border-border-soft bg-graphite overflow-hidden flex items-center justify-center">
                      {filename ? (
                        <img
                          src={pythonMediaUrl(filename)}
                          alt={`Plate crop ${item.plateNumber}`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-text-disabled">No image</span>
                      )}
                    </div>

                    {/* Plate number */}
                    <div className="w-32 shrink-0">
                      <p className="mono-data text-[15px] text-text-primary font-semibold">{item.plateNumber}</p>
                      <p className="text-[11px] text-text-tertiary">Detected plate</p>
                    </div>

                    {/* Confidence */}
                    <div className="w-20 shrink-0">
                      <p className={`text-[13px] font-medium ${item.confidence < 0.7 ? 'text-critical' : 'text-warning'}`}>
                        {(item.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-[11px] text-text-tertiary">Confidence</p>
                    </div>

                    {/* Camera & time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-text-secondary truncate">{item.cameraId ?? 'Unknown camera'}</p>
                      <p className="text-[11px] text-text-tertiary mono-data">{formatDateTime(item.timestamp)}</p>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={correctedPlate}
                            onChange={(e) => setCorrectedPlate(e.target.value)}
                            placeholder="Corrected plate"
                            className="w-36 h-8 text-[12px]"
                          />
                          <Button variant="primary" size="sm" onClick={() => handleCorrect(item)}>
                            <Check className="h-3.5 w-3.5" /> Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setCorrectedPlate('') }}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleConfirm(item)}>
                            <Check className="h-3.5 w-3.5" /> Confirm
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => { setEditingId(item.detectionId); setCorrectedPlate(item.plateNumber) }}>
                            <PencilLine className="h-3.5 w-3.5" /> Correct
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </AppShell>
  )
}
