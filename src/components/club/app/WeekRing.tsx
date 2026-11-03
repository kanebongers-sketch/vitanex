'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DiepteRing } from '@/components/club/ontwerp/DiepteRing'
import { ringDeel } from '@/lib/club/ontwerp/reeks'

// De weekring op Home in de ledenapp (EENVOUD-10-MINUTEN.md, hoofdstuk 5): altijd
// eerst de SVG-ring (DiepteRing), die zonder JavaScript en WebGL werkt. Pas als
// de app helemaal geladen is en het toestel even niets te doen heeft, zonder
// databesparing (saveData), zonder reduced motion en met WebGL, legt de 3D-ring
// (Ring3d, three.js) zich eroverheen. Zo kost hij niets bij het openen van de
// app aan de deur. Lukt WebGL niet, dan blijft de SVG-ring gewoon staan.

const Ring3d = dynamic(() => import('./drie/Ring3d').then((m) => m.Ring3d), { ssr: false, loading: () => null })

interface WeekRingProps {
  gedaan: number
  totaal: number
  label: string
  maat: number
}

interface Kleuren {
  kleur: string
  spoor: string
}

interface Verbinding {
  saveData?: boolean
}

function magDrieD(): boolean {
  const verbinding = (navigator as Navigator & { connection?: Verbinding }).connection
  if (verbinding?.saveData === true) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Wacht tot de pagina geladen is en het toestel even rust heeft. */
function naHetLaden(doe: () => void): () => void {
  let idle = 0
  let tijd: ReturnType<typeof setTimeout> | null = null
  const plan = () => {
    if ('requestIdleCallback' in window) idle = window.requestIdleCallback(doe, { timeout: 3000 })
    else tijd = setTimeout(doe, 800)
  }
  if (document.readyState === 'complete') plan()
  else window.addEventListener('load', plan, { once: true })
  return () => {
    window.removeEventListener('load', plan)
    if (idle) window.cancelIdleCallback(idle)
    if (tijd) clearTimeout(tijd)
  }
}

export function WeekRing({ gedaan, totaal, label, maat }: WeekRingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [kleuren, setKleuren] = useState<Kleuren | null>(null)

  useEffect(() => {
    return naHetLaden(() => {
      const el = ref.current
      if (!el || !magDrieD()) return
      const stijl = getComputedStyle(el)
      const kleur = stijl.getPropertyValue('--brand').trim()
      const spoor = stijl.getPropertyValue('--bg-raised').trim()
      if (kleur && spoor) setKleuren({ kleur, spoor })
    })
  }, [])

  const opFout = useCallback(() => setKleuren(null), [])

  return (
    <div ref={ref} className="club-lidapp-weekring" data-3d={kleuren ? '' : undefined}>
      <DiepteRing gedaan={gedaan} totaal={totaal} label={label} maat={maat} />
      {kleuren && (
        <div className="club-lidapp-weekring-3d" aria-hidden>
          <Ring3d deel={ringDeel(gedaan, totaal)} kleur={kleuren.kleur} spoor={kleuren.spoor} maat={maat} opFout={opFout} />
        </div>
      )}
    </div>
  )
}
