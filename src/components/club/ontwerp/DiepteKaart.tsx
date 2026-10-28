'use client'

import { useCallback, useRef, type PointerEvent, type ReactNode } from 'react'

// Een kaart met licht: een zachte glans die de aanwijzer volgt, zodat de kaart
// een oppervlak lijkt in plaats van een plat vlak. Alleen twee CSS-variabelen
// per beweging (geen React-state, geen layout); op een touchscherm en bij
// reduced motion blijft de glans stil op zijn vaste plek bovenaan.

interface DiepteKaartProps {
  children: ReactNode
  className?: string
}

export function DiepteKaart({ children, className }: DiepteKaartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const beweeg = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const vak = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--licht-x', `${(((e.clientX - vak.left) / vak.width) * 100).toFixed(1)}%`)
    ref.current.style.setProperty('--licht-y', `${(((e.clientY - vak.top) / vak.height) * 100).toFixed(1)}%`)
    ref.current.style.setProperty('--licht-aan', '1')
  }, [])
  const weg = useCallback(() => {
    ref.current?.style.removeProperty('--licht-aan')
  }, [])
  return (
    <div ref={ref} className={`club-diepte ${className ?? ''}`} onPointerMove={beweeg} onPointerLeave={weg}>
      {children}
    </div>
  )
}
