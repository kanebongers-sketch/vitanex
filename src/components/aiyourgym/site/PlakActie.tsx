'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { AANMELDEN, DEMO } from './paden'

// Op de telefoon: na het eerste scherm een vaste aanmeldknop onderin, zodat de
// volgende stap altijd een duim ver weg is. Hij verdwijnt weer bij de voet,
// waar de aanmeldband en de voet zelf de knoppen al tonen. Op brede schermen
// staat de knop al in de kop (css verbergt dit blok vanaf 900px).

const VANAF_SCHERMEN = 0.9
const VOET_MARGE_PX = 640

export function PlakActie() {
  const [zichtbaar, setZichtbaar] = useState(false)

  useEffect(() => {
    let frame = 0
    const kijk = () => {
      frame = 0
      const y = window.scrollY
      const onder = document.documentElement.scrollHeight - (y + window.innerHeight)
      setZichtbaar(y > window.innerHeight * VANAF_SCHERMEN && onder > VOET_MARGE_PX)
    }
    const opScroll = () => {
      if (!frame) frame = requestAnimationFrame(kijk)
    }
    kijk()
    window.addEventListener('scroll', opScroll, { passive: true })
    window.addEventListener('resize', opScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', opScroll)
      window.removeEventListener('resize', opScroll)
    }
  }, [])

  return (
    <div className="ayg-plak" data-zichtbaar={zichtbaar ? '' : undefined} aria-hidden={!zichtbaar} inert={!zichtbaar}>
      <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
        Probeer {PROEFDAGEN} dagen gratis
      </Link>
      <Link href={DEMO} className="ayg-plak-demo">
        Demo
      </Link>
    </div>
  )
}
