'use client'

import { useEffect, useRef, useState } from 'react'
import '@/components/club/training/illustratie/illustratie.css'
import type { Stand3d } from '@/components/club/training/drie/Oefening3d'
import { Oefening3dLazy } from '@/components/club/training/drie/Oefening3dLazy'

// Een oefening als eigen 3D-figuur op de website. three.js wordt pas geladen
// als het beeld bijna in beeld komt (daarvoor staat er een rustig vlak), en het
// doek zelf bestaat alleen zolang het in de buurt van het scherm is. Bij
// prefers-reduced-motion staat het figuur stil (dat regelt Oefening3d).
// Zonder accent volgt het figuur --brand van het productbeeld eromheen.

interface Oefenbeeld3dProps {
  /** Naam exact zoals in de oefenbibliotheek (src/lib/club/training/3d). */
  naam: string
  /** Beschrijving voor schermlezers. */
  label: string
  stand?: Stand3d
  thema?: 'licht' | 'donker'
  /** Accentkleur als #rrggbb voor de werkende spieren. */
  accent?: string
  className?: string
  /** Figuur over de hele beweging passend in het doek (hoofd tot voeten altijd in beeld). */
  passend?: boolean
}

/** Hoe ver van het scherm we three.js alvast ophalen. */
const VOORLADEN = '240px 0px'

export function Oefenbeeld3d({ naam, label, stand = 'speelt', thema = 'donker', accent, className, passend = false }: Oefenbeeld3dProps) {
  const vak = useRef<HTMLDivElement>(null)
  const [laden, setLaden] = useState(false)

  useEffect(() => {
    const el = vak.current
    if (!el || laden) return
    const kijker = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setLaden(true)
        kijker.disconnect()
      },
      { rootMargin: VOORLADEN },
    )
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [laden])

  const vlak = `club-ill club-ill-3d club-ill-3d--laden${thema === 'licht' ? ' club-ill--licht' : ''}`
  return (
    <div ref={vak} className={className ? `ayg-3d ${className}` : 'ayg-3d'}>
      {laden ? (
        <Oefening3dLazy naam={naam} stand={stand} thema={thema} accent={accent} label={label} passend={passend} />
      ) : (
        <div className={vlak} role="img" aria-label={label} />
      )}
    </div>
  )
}
