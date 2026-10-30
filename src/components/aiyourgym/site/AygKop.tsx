'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { KOP } from '@/lib/aiyourgym/taal/woorden/website/kop'
import { AygNav } from './AygNav'
import { aygPad } from './paden'
import { scrollPositie, volgScroll } from './scrollpositie'

// Kop van de verkoopwebsite: logo, de hoofdpagina's, de demo en "Aanmelden".
// Bovenaan de pagina valt de kop weg in het papier (data-bovenaan); zodra je
// scrolt krijgt hij een licht kalkwit vlak met een fijne lijn en zachte blur.
// Let op: de body scrolt, niet het venster (zie scrollpositie.ts). Zonder JavaScript
// (of voor het eerste effect) staat de achtergrond er gewoon.
// Inloggen staat in de voet en verwijst naar /inloggen op de website zelf.
// Tekst en links in de taal van de pagina (src/lib/aiyourgym/taal, woordenboek KOP).

const DREMPEL_PX = 8

export function AygKop() {
  const taal = useTaal()
  const [bovenaan, setBovenaan] = useState(false)

  useEffect(() => {
    const kijk = () => setBovenaan(scrollPositie().y <= DREMPEL_PX)
    kijk()
    return volgScroll(kijk)
  }, [])

  return (
    <header className="ayg-kop" data-bovenaan={bovenaan ? '' : undefined}>
      <div className="ayg-wrap ayg-kop-rij">
        <Link href={aygPad()} className="ayg-kop-logo" aria-label={KOP[taal].logoLabel}>
          <AygLogo iron sier />
        </Link>
        <AygNav />
      </div>
    </header>
  )
}
