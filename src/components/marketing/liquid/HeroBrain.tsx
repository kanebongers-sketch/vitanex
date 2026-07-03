'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const BrainCanvas = dynamic(() => import('../BrainCanvas'), { ssr: false, loading: () => null })

// Eén volledige heen-en-terug-tour langs de zes vlakken (0 → 1 → 0), in seconden.
const TOUR_SECONDS = 56

// Achtergrond-brein voor de hero: geen scroll, maar een trage automatische
// tour langs de zes vlakken. Cosinus-easing maakt de keerpunten snelheidsloos,
// zodat de lus naadloos oogt. Bij prefers-reduced-motion blijft het brein
// stilstaan op het uitgezoomde overzichtsbeeld (progress 0).
export default function HeroBrain() {
  const progressRef = useRef(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return () => cancelAnimationFrame(frame)

    let raf = 0
    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now
      const phase = ((now - start) / 1000 / TOUR_SECONDS) % 1
      progressRef.current = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="absolute inset-0 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <BrainCanvas progressRef={progressRef} />
    </div>
  )
}
