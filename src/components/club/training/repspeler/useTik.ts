'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SegmentSoort } from '@/lib/club/training/repspeler/typen'

// Een kort tikje bij elke nieuwe fase, met de Web Audio API (geen bestanden).
// Standaard uit; aanzetten gebeurt met een tik van het lid, zodat de browser
// geluid toestaat. Elke fase een eigen toonhoogte: zo hoor je zonder te kijken
// of je moet zakken, vasthouden of omhoog.

const TOON: Record<SegmentSoort, number> = { heen: 880, houden: 620, terug: 1040, rust: 520 }
const DUUR_SEC = 0.05

type AudioContextKlasse = typeof AudioContext

function audioKlasse(): AudioContextKlasse | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { webkitAudioContext?: AudioContextKlasse }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

export interface Tik {
  aan: boolean
  /** Geluid kan op dit toestel. */
  kan: boolean
  wissel: () => void
  tik: (segment: SegmentSoort) => void
}

export function useTik(): Tik {
  const [aan, setAan] = useState(false)
  const ctx = useRef<AudioContext | null>(null)
  const [kan] = useState(() => audioKlasse() !== null)

  useEffect(() => () => {
    ctx.current?.close().catch(() => undefined)
    ctx.current = null
  }, [])

  const wissel = useCallback(() => {
    const nu = !aan
    const Klasse = audioKlasse()
    if (nu && Klasse) {
      ctx.current = ctx.current ?? new Klasse()
      ctx.current.resume().catch(() => undefined)
    }
    setAan(nu)
  }, [aan])

  const tik = useCallback(
    (segment: SegmentSoort) => {
      const c = ctx.current
      if (!aan || !c || c.state !== 'running') return
      const begin = c.currentTime
      const osc = c.createOscillator()
      const volume = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(TOON[segment], begin)
      volume.gain.setValueAtTime(0.0001, begin)
      volume.gain.exponentialRampToValueAtTime(0.18, begin + 0.006)
      volume.gain.exponentialRampToValueAtTime(0.0001, begin + DUUR_SEC)
      osc.connect(volume).connect(c.destination)
      osc.start(begin)
      osc.stop(begin + DUUR_SEC + 0.01)
    },
    [aan],
  )

  return { aan, kan, wissel, tik }
}
