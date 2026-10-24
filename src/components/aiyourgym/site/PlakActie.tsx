'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { PLAK_ACTIE } from '@/lib/aiyourgym/taal/woorden/website/contact'
import { sitePaden } from './paden'
import { scrollPositie, volgScroll } from './scrollpositie'

// Op de telefoon: na het eerste scherm een vaste aanmeldknop onderin, zodat de
// volgende stap altijd een duim ver weg is. Hij verdwijnt weer bij de voet,
// waar de aanmeldband en de voet zelf de knoppen al tonen. Op brede schermen
// staat de knop al in de kop (css verbergt dit blok vanaf 1024px).
// Teksten en links in de taal van de pagina (ACTIE en PLAK_ACTIE).

const VANAF_SCHERMEN = 0.9
const VOET_MARGE_PX = 640

export function PlakActie() {
  const taal = useTaal()
  const { AANMELDEN, DEMO_AANVRAGEN } = sitePaden(taal)
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
        {ACTIE[taal].probeerDagen(PROEFDAGEN)}
      </Link>
      <Link href={DEMO_AANVRAGEN} className="ayg-plak-demo">
        {PLAK_ACTIE[taal].planDemo}
      </Link>
    </div>
  )
}
