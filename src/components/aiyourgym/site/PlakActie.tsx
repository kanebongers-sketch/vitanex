'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { AANMELDEN, DEMO_AANVRAGEN } from './paden'
import { scrollPositie, volgScroll } from './scrollpositie'

// Op de telefoon: na het eerste scherm een vaste aanmeldknop onderin, zodat de
// volgende stap altijd een duim ver weg is. Hij verdwijnt weer bij de voet,
// waar de aanmeldband en de voet zelf de knoppen al tonen. Op brede schermen
// staat de knop al in de kop (css verbergt dit blok vanaf 900px).

const VANAF_SCHERMEN = 0.9
const VOET_MARGE_PX = 640

export function PlakActie() {
  const [zichtbaar, setZichtbaar] = useState(false)

  useEffect(() => {
    const kijk = () => {
      const { y, rest, scherm } = scrollPositie()
      setZichtbaar(y > scherm * VANAF_SCHERMEN && rest > VOET_MARGE_PX)
    }
    kijk()
    return volgScroll(kijk)
  }, [])

  return (
    <div className="ayg-plak" data-zichtbaar={zichtbaar ? '' : undefined} aria-hidden={!zichtbaar} inert={!zichtbaar}>
      <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
        Probeer {PROEFDAGEN} dagen gratis
      </Link>
      <Link href={DEMO_AANVRAGEN} className="ayg-plak-demo">
        Plan demo
      </Link>
    </div>
  )
}
