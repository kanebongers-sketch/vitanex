'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

// De weekring van de ledenapp op de website. Eerst (en altijd als vangnet) een
// SVG-ring met diepte; pas als de ring in beeld komt, zonder reduced motion en met
// WebGL, laadt de 3D-ring van de ledenapp zelf (Ring3d, three.js) en legt zich
// eroverheen. Zo kost hij niets voor de eerste weergave (LCP) en blijft hij
// zonder JavaScript of WebGL gewoon staan. Puur decoratief: de betekenis staat
// in het label van het productbeeld en in de tekst ernaast.

const Ring3d = dynamic(() => import('@/components/club/app/drie/Ring3d').then((m) => m.Ring3d), { ssr: false, loading: () => null })

interface Props {
  gedaan: number
  totaal: number
  maat: number
  /** Wat in het midden staat, onder het getal. */
  onder: string
}

interface Kleuren {
  kleur: string
  spoor: string
}

const STRAAL = 42
const OMTREK = 2 * Math.PI * STRAAL

function webglKan(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

export function WeekRing({ gedaan, totaal, maat, onder }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [kleuren, setKleuren] = useState<Kleuren | null>(null)
  const deel = totaal > 0 ? Math.min(1, gedaan / totaal) : 0

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !webglKan()) return
    const kijker = new IntersectionObserver(
      (items) => {
        if (!items.some((i) => i.isIntersecting)) return
        kijker.disconnect()
        const stijl = getComputedStyle(el)
        const kleur = stijl.getPropertyValue('--brand').trim()
        const spoor = stijl.getPropertyValue('--bg-raised').trim()
        if (kleur && spoor) setKleuren({ kleur, spoor })
      },
      { rootMargin: '200px 0px' },
    )
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [])

  const opFout = useCallback(() => setKleuren(null), [])

  return (
    <div ref={ref} className="aygp-ring" data-3d={kleuren ? '' : undefined} style={{ width: maat, height: maat }}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="aygp-ring-spoor" cx="50" cy="50" r={STRAAL} />
        <circle className="aygp-ring-boog" cx="50" cy="50" r={STRAAL} strokeDasharray={`${OMTREK * deel} ${OMTREK}`} />
      </svg>
      {kleuren ? (
        <div className="aygp-ring-3d" aria-hidden>
          <Ring3d deel={deel} kleur={kleuren.kleur} spoor={kleuren.spoor} maat={maat} opFout={opFout} />
        </div>
      ) : null}
      <span className="aygp-ring-midden" aria-hidden>
        <strong>
          {gedaan}
          <span>/{totaal}</span>
        </strong>
        <small>{onder}</small>
      </span>
    </div>
  )
}
