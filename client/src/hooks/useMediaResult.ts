import { useEffect, useRef, useState } from 'react'
import { mediaApi } from '@/lib/api/java'
import type { MediaJob } from '@/types'

/**
 * Result-fetch strategy for the Upload & Test Portal (A5 §3).
 *
 * The master SRS leaves polling-vs-WS an open decision. This hook is the
 * single abstraction point: everything else in the app calls
 * `useMediaResult(mediaId)` and doesn't know or care which transport is
 * used underneath. Today it polls `GET /api/v1/media/{mediaId}`; switching
 * to a WS push later means rewriting the body of this hook only.
 */
const POLL_INTERVAL_MS = 1200

export function useMediaResult(mediaId: string | null) {
  const [job, setJob] = useState<MediaJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setJob(null)
    setError(null)
    if (!mediaId) return

    let cancelled = false

    async function tick() {
      try {
        const result = await mediaApi.get(mediaId!)
        if (cancelled) return
        setJob(result)
        if (result.status === 'COMPLETED' || result.status === 'FAILED') {
          return
        }
        timerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Could not fetch media status')
      }
    }

    tick()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [mediaId])

  return { job, error }
}
