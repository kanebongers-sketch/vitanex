'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { AygNav } from './AygNav'
import { aygPad } from './paden'

// Kop van de verkoopwebsite: logo, de hoofdpagina's, de demo en "Probeer gratis".
// Bovenaan de pagina valt de kop weg in het papier (data-bovenaan); zodra je
// scrolt krijgt hij een lichte achtergrond met een dunne lijn. Zonder JavaScript
// (of voor het eerste effect) staat de achtergrond er gewoon.
// Inloggen komt erbij zodra /clubinloggen voor sportscholen open is.

const DREMPEL_PX = 8

export function AygKop() {
  const [bovenaan, setBovenaan] = useState(false)

  useEffect(() => {
    const kijk = () => setBovenaan(window.scrollY <= DREMPEL_PX)
    kijk()
    window.addEventListener('scroll', kijk, { passive: true })
    return () => window.removeEventListener('scroll', kijk)
  }, [])

  return (
    <header className="ayg-kop" data-bovenaan={bovenaan ? '' : undefined}>
      <div className="ayg-wrap ayg-kop-rij">
        <Link href={aygPad()} className="ayg-kop-logo" aria-label="AI Your Gym, naar de voorpagina">
          <AygLogo />
        </Link>
        <AygNav />
      </div>
    </header>
  )
}
