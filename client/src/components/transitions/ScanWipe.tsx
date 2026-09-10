import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Phase = 'idle' | 'covered' | 'revealing'

interface ScanWipeApi {
  /**
   * Paints a full-screen opaque cover instantly, then resolves once the
   * browser has actually painted it (double rAF) — so the caller can safely
   * swap routes underneath without a visible flash of the old page.
   */
  cover: () => Promise<void>
  /** Slowly fades the cover away to reveal whatever is now mounted underneath. */
  reveal: () => void
}

const ScanWipeContext = createContext<ScanWipeApi | null>(null)

const DURATION_MS = 1100

function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2)
}

export function ScanWipeProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0) // 0 = fully covered, 1 = fully revealed
  const rafRef = useRef<number | null>(null)

  const cover = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    setProgress(0)
    setPhase('covered')
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  }, [])

  const reveal = useCallback(() => {
    setPhase('revealing')
    const start = performance.now()
    function tick(now: number) {
      const t = Math.min(1, (now - start) / DURATION_MS)
      setProgress(easeOutSine(t))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        setPhase('idle')
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const active = phase !== 'idle'
  const opacity = 1 - progress

  return (
    <ScanWipeContext.Provider value={{ cover, reveal }}>
      {children}
      {active && (
        <div
          className="fixed inset-0 z-[200] bg-obsidian"
          style={{ opacity }}
          aria-hidden="true"
        />
      )}
    </ScanWipeContext.Provider>
  )
}

export function useScanWipe() {
  const ctx = useContext(ScanWipeContext)
  if (!ctx) throw new Error('useScanWipe must be used within a ScanWipeProvider')
  return ctx
}
