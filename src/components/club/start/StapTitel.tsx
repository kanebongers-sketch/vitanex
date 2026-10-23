'use client'

import { useEffect, useRef } from 'react'

// De kop van een stap. Ga je naar een andere stap, dan krijgt de kop de focus:
// wie met het toetsenbord of een schermlezer werkt, begint zo bovenaan de
// nieuwe stap in plaats van nergens (de knop die je indrukte is weg).

interface StapTitelProps {
  titel: string
  huidig: number
}

export function StapTitel({ titel, huidig }: StapTitelProps) {
  const kop = useRef<HTMLHeadingElement>(null)
  const vorige = useRef(huidig)

  useEffect(() => {
    if (vorige.current === huidig) return
    vorige.current = huidig
    kop.current?.focus({ preventScroll: true })
  }, [huidig])

  return (
    <h1 ref={kop} tabIndex={-1} key={huidig}>
      {titel}
    </h1>
  )
}
