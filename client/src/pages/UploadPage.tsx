import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, Check, Loader2, CircleDashed, Image as ImageIcon, AlertCircle, Route as RouteIcon } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Feedback'
import { camerasApi, mediaApi } from '@/lib/api/java'
import { inferenceApi, cropImageUrl } from '@/lib/api/python'
import { useMediaResult } from '@/hooks/useMediaResult'
import type { MediaJob } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

type Step = 'idle' | 'registering' | 'inferring' | 'awaiting' | 'done'

export function UploadPage() {
  // Shared cache — 'cameras' key reused across Dashboard, Sidebar, and here
  const { data: cameraList = [] } = useQuery({ queryKey: ['cameras'], queryFn: camerasApi.list })
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [cameraId, setCameraId] = useState('')
  const [manualLat, setManualLat] = useState('17.400')
  const [manualLng, setManualLng] = useState('78.480')
  const [step, setStep] = useState<Step>('idle')
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null)
  const [history, setHistory] = useState<MediaJob[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    refreshHistory()
  }, [])

  function refreshHistory() {
    mediaApi.listUploads().then(setHistory)
  }

  // Behind a single hook (A5 §3): swapping poll->WS later is a one-place change.
  const { job, error: pollError } = useMediaResult(activeMediaId)

  useEffect(() => {
    if (job?.status === 'COMPLETED' || job?.status === 'FAILED') {
      setStep('done')
      refreshHistory()
    } else if (job?.status === 'PROCESSING') {
      setStep('inferring')
    }
  }, [job?.status])

  async function handleSubmit() {
    if (!file) {
      setSubmitError('Choose an image or video file first')
      return
    }
    if (mode === 'camera' && !cameraId) {
      setSubmitError('Choose a camera, or switch to manual geo-tag')
      return
    }
    setSubmitError(null)
    setStep('registering')
    try {
      // Step 1 — Java registers media metadata, returns mediaId
      const media = await mediaApi.create({
        fileName: file.name,
        fileType: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
        cameraId: mode === 'camera' ? cameraId : null,
        manualGeoTag: mode === 'manual' ? { lat: parseFloat(manualLat), lng: parseFloat(manualLng) } : null,
      })
      setStep('inferring')

      // Step 2 — raw bytes sent directly to Python, never through Java
      if (media.fileType === 'VIDEO') {
        await inferenceApi.inferVideo(file, media.mediaId)
      } else {
        await inferenceApi.inferImage(file, media.mediaId)
      }

      // Step 3 — poll/subscribe Java for the result
      setStep('awaiting')
      setActiveMediaId(media.mediaId)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Upload failed')
      setStep('idle')
    }
  }

  function reset() {
    setFile(null)
    setActiveMediaId(null)
    setStep('idle')
    setSubmitError(null)
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'registering', label: '1. Registering media (Java)' },
    { key: 'inferring', label: '2. Running inference (Python)' },
    { key: 'awaiting', label: '3. Awaiting result' },
  ]
  const stepOrder: Step[] = ['registering', 'inferring', 'awaiting', 'done']
  const currentIndex = stepOrder.indexOf(step)

  return (
    <AppShell title="Upload & Test Portal">
      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <CardHeader
            icon={<UploadCloud className="h-3.5 w-3.5" />}
            title="Upload & Test Portal"
            subtitle="Demonstrate the detection pipeline end-to-end without live camera hardware (FR-8)"
          />
          <CardBody className="space-y-5">
            {step === 'idle' ? (
              <>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-soft bg-raised/40 py-10 text-center cursor-pointer hover:border-teal/50 transition-colors"
                >
                  <UploadCloud className="h-6 w-6 text-text-tertiary" />
                  <p className="text-[13px] text-text-primary">{file ? file.name : 'Click to choose an image or video'}</p>
                  <p className="text-[11px] text-text-tertiary">JPG, PNG, MP4 — used only for local demo/testing</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMode('camera')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-[12px] border transition-colors',
                      mode === 'camera' ? 'border-teal text-teal bg-teal/10' : 'border-border-soft text-text-tertiary'
                    )}
                  >
                    Attach to camera
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-[12px] border transition-colors',
                      mode === 'manual' ? 'border-teal text-teal bg-teal/10' : 'border-border-soft text-text-tertiary'
                    )}
                  >
                    Manual test — no camera
                  </button>
                </div>

                {mode === 'camera' ? (
                  <Select label="Camera" value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
                    <option value="">Select a camera…</option>
                    {cameraList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Manual latitude" value={manualLat} onChange={(e) => setManualLat(e.target.value)} />
                    <Input label="Manual longitude" value={manualLng} onChange={(e) => setManualLng(e.target.value)} />
                  </div>
                )}

                {submitError && (
                  <p className="flex items-center gap-1.5 text-[12px] text-critical">
                    <AlertCircle className="h-3.5 w-3.5" /> {submitError}
                  </p>
                )}

                <Button variant="primary" onClick={handleSubmit} disabled={!file}>
                  Run detection
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  {steps.map((s, i) => {
                    const done = i < currentIndex || step === 'done'
                    const active = stepOrder[currentIndex] === s.key
                    return (
                      <div key={s.key} className="flex items-center gap-2.5">
                        {done ? (
                          <Check className="h-4 w-4 text-success shrink-0" />
                        ) : active ? (
                          <Loader2 className="h-4 w-4 text-teal animate-spin shrink-0" />
                        ) : (
                          <CircleDashed className="h-4 w-4 text-text-disabled shrink-0" />
                        )}
                        <span className={cn('text-[13px]', done ? 'text-text-secondary' : active ? 'text-text-primary' : 'text-text-disabled')}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {pollError && (
                  <p className="flex items-center gap-1.5 text-[12px] text-critical">
                    <AlertCircle className="h-3.5 w-3.5" /> {pollError}
                  </p>
                )}

                {step === 'done' && job && (
                  <div className="rounded-lg border border-border-soft bg-raised/40 p-4">
                    {job.status === 'FAILED' ? (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-critical shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[13px] font-medium text-text-primary">Detection failed</p>
                          <p className="mt-1 text-[12px] text-text-tertiary">{job.result?.errorMessage ?? 'Unknown error from Python inference service'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-border-soft bg-graphite overflow-hidden">
                          {job.result?.cropFilename ? (
                            <img
                              src={cropImageUrl(job.result.cropFilename)}
                              alt="Detected plate crop"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-text-tertiary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div>
                            <p className="text-[11px] text-text-tertiary">Detected plate</p>
                            <p className="mono-data text-lg text-text-primary">{job.result?.plateNumber}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge tone="success">{((job.result?.confidence ?? 0) * 100).toFixed(0)}% confidence</Badge>
                            {job.result?.hasPriorSightings && <Badge tone="teal">Prior sightings found</Badge>}
                          </div>
                          {job.result?.hasPriorSightings && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => navigate(`/trajectory?plate=${job.result?.plateNumber}`)}
                            >
                              <RouteIcon className="h-3.5 w-3.5" /> View trajectory
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 'done' && (
                  <Button variant="ghost" onClick={reset}>
                    Run another test
                  </Button>
                )}
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Upload history" subtitle="Past manual test uploads" />
          <CardBody className="pt-0 max-h-[560px] overflow-y-auto scrollbar-thin">
            {history.length === 0 ? (
              <EmptyState title="No test uploads yet" description="Run a detection above to see it listed here." />
            ) : (
              <div className="divide-y divide-border-soft/60">
                {history.map((h) => (
                  <div key={h.mediaId} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-text-primary truncate">{h.fileName}</span>
                      <Badge
                        tone={h.status === 'COMPLETED' ? 'success' : h.status === 'FAILED' ? 'critical' : 'info'}
                      >
                        {h.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-text-tertiary">
                      <span className="mono-data">{h.result?.plateNumber || '—'}</span>
                      <span>{formatDateTime(h.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
