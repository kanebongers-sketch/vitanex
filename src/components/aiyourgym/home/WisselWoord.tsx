'use client'

import { useEffect, useState } from 'react'

// Het wisselende woord in de kop van de voorpagina ("Alles voor je gym ...").
// Alleen voor het oog: de kop zelf heeft voor schermlezers een vaste zin, dit
// blok is aria-hidden. Rustig: elke paar seconden zakt het woord weg en komt
// het volgende op (alleen opacity en transform). Bij prefers-reduced-motion,
// zonder JavaScript en voor de eerste wissel staat er gewoon `start`.

const WACHT_MS = 3200
const WEG_MS = 260

interface WisselWoordProps {
  start: string
  woorden: readonly string[]
}

export function WisselWoord({ start, woorden }: WisselWoordProps) {
  const [index, setIndex] = useState(-1)
  const [weg, setWeg] = useState(false)

  useEffect(() => {
    if (woorden.length === 0) return
    const rustig = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (rustig.matches) return
    let wissel: ReturnType<typeof setTimeout> | undefined
    const klok = setInterval(() => {
      if (document.hidden) return
      setWeg(true)
      wissel = setTimeout(() => {
        setIndex((i) => (i + 1) % woorden.length)
        setWeg(false)
      }, WEG_MS)
    }, WACHT_MS)
    const opWijziging = () => {
      if (!rustig.matches) return
      clearInterval(klok)
      setIndex(-1)
      setWeg(false)
    }
    rustig.addEventListener('change', opWijziging)
    return () => {
      clearInterval(klok)
      clearTimeout(wissel)
      rustig.removeEventListener('change', opWijziging)
    }
  }, [woorden])

  const woord = index < 0 ? start : woorden[index]
  return (
    <span className="ayg-wissel" aria-hidden="true">
      <span key={woord} className="ayg-wissel-woord" data-weg={weg ? '' : undefined}>
        {woord}
      </span>
    </span>
  )
}
