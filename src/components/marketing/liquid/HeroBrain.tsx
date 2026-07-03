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
  const wrapRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)

  // Renderlus stilzetten zodra de hero (ruim) uit beeld is — scheelt GPU/batterij.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { rootMargin: '160px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    let raf = 0
    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now
      const phase = ((now - start) / 1000 / TOUR_SECONDS) % 1
      progressRef.current = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2)
      raf = requestAnimationFrame(tick)
    }
    // Volg de systeemvoorkeur live: tour stoppen (terug naar het statische
    // overzichtsbeeld) of hervatten zodra de gebruiker de instelling wijzigt.
    const zetTour = () => {
      cancelAnimationFrame(raf)
      start = null
      if (media.matches) {
        progressRef.current = 0
      } else {
        raf = requestAnimationFrame(tick)
      }
    }
    zetTour()
    media.addEventListener('change', zetTour)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(raf)
      media.removeEventListener('change', zetTour)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="absolute inset-0 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <BrainCanvas progressRef={progressRef} paused={paused} />
    </div>
  )
}
