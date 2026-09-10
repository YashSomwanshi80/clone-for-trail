import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NeonRevealProps {
  children: ReactNode
  revealDelay?: number // ms before the glow starts descending
  revealDuration?: number // ms for the glow to reach full spread
  hue?: number // 0-360
  intensity?: number // relative glow brightness, ~1.0 = default
  onComplete?: () => void
  className?: string
}

const noiseUrl =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

/**
 * Full-screen neon spotlight: light originates at the very top of the
 * viewport (not the top of any inner card) and grows/descends toward the
 * middle of the screen. Everything passed as `children` stays fully
 * invisible until the glow has finished descending — it doesn't sit there
 * dimmed the whole time, it isn't there at all until the light "reaches" it.
 */
export function NeonReveal({
  children,
  revealDelay = 250,
  revealDuration = 1400,
  hue = 172,
  intensity = 1,
  onComplete,
  className,
}: NeonRevealProps) {
  const [glowing, setGlowing] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setGlowing(true)
      setRevealed(true)
      onComplete?.()
      return
    }
    const growTimer = setTimeout(() => setGlowing(true), revealDelay)
    const doneTimer = setTimeout(() => {
      setRevealed(true)
      onComplete?.()
    }, revealDelay + revealDuration)
    return () => {
      clearTimeout(growTimer)
      clearTimeout(doneTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealDelay, revealDuration])

  const glowAlpha = 0.6 * intensity

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      {/* grain texture across the whole screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: noiseUrl }}
      />

      {/* spotlight — anchored to the actual top of the viewport, grows downward */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-0 origin-top transition-[transform,opacity] ease-out"
        style={{
          width: '160%',
          height: '70vh',
          background: `radial-gradient(ellipse 55% 100% at 50% 0%, hsla(${hue},85%,65%,${glowAlpha}), hsla(${hue},85%,55%,${glowAlpha * 0.35}) 45%, transparent 75%)`,
          opacity: glowing ? 1 : 0,
          transform: glowing ? 'translateX(-50%) scaleY(1)' : 'translateX(-50%) scaleY(0.1)',
          transitionDuration: `${revealDuration}ms`,
        }}
      />

      {/* bright edge line at the very top of the screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-0 h-[2px] -translate-x-1/2 rounded-full transition-[width,opacity] ease-out"
        style={{
          width: glowing ? '100%' : '8%',
          opacity: glowing ? 0.9 : 0,
          background: `hsl(${hue}, 90%, 70%)`,
          boxShadow: `0 0 ${20 * intensity}px ${6 * intensity}px hsla(${hue},90%,65%,0.85)`,
          transitionDuration: `${revealDuration}ms`,
        }}
      />

      {/* content — fully absent (not just dim) until the glow has reached it */}
      <div
        className={cn(
          'relative z-10 transition-all duration-500 ease-out',
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        )}
      >
        {children}
      </div>
    </div>
  )
}
