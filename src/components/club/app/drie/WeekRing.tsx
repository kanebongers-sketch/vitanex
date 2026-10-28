'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DiepteRing } from '@/components/club/ontwerp/DiepteRing'

// De weekring op de beginpagina van de ledenapp. Eerst (en altijd als vangnet)
// de SVG-ring met diepte; daarna, alleen in de browser, zonder reduced motion
// en met WebGL, de 3D-ring eroverheen (three.js wordt pas dan geladen).

const Ring3d = dynamic(() => import('./Ring3d').then((m) => m.Ring3d), { ssr: false, loading: () => null })

interface WeekRingProps {
  gedaan: number
  totaal: number
  label: string
  maat?: number
}

interface Kleuren {
  kleur: string
  spoor: string
}

function webglKan(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

export function WeekRing({ gedaan, totaal, label, maat = 148 }: WeekRingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [kleuren, setKleuren] = useState<Kleuren | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !webglKan()) return
    const stijl = getComputedStyle(el)
    const kleur = stijl.getPropertyValue('--brand').trim()
    const spoor = stijl.getPropertyValue('--bg-raised').trim()
    if (kleur && spoor) setKleuren({ kleur, spoor })
  }, [])
  const opFout = useCallback(() => setKleuren(null), [])
  const deel = totaal > 0 ? Math.min(1, gedaan / totaal) : 0
  return (
    <div ref={ref} className="club-weekring" data-3d={kleuren ? 'true' : undefined} style={{ width: maat, height: maat }}>
      <DiepteRing gedaan={gedaan} totaal={totaal} label={label} maat={maat} />
      {kleuren ? (
        <div className="club-weekring-3d" aria-hidden>
          <Ring3d deel={deel} kleur={kleuren.kleur} spoor={kleuren.spoor} maat={maat} opFout={opFout} />
        </div>
      ) : null}
    </div>
  )
}
