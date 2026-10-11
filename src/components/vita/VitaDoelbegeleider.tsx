'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaDoelbegeleider — Vita begeleidt het weekdoelen-kiezen ná de check-in.
// Puur presentational: krijgt de fase + wat context binnen en rendert Vita's
// gezicht (PandaFace via VitaBubbel) met een warme, eerlijke NL-zin.
//
// Twee fasen:
//  • 'intro'     — Vita introduceert het moment: benoemt kort het laagste vlak
//                  uit de check-in en waarom kleine, haalbare doelen werken.
//                  Moedigt de keuze aan zonder te betuttelen.
//  • 'bevestigd' — korte, oprechte bevestiging nadat de doelen zijn opgeslagen.
//
// Alleen scores die de pagina al binnenkreeg worden gebruikt — geen verzonnen
// cijfers. Strikt navy + cyan (PandaFace is het enige meerkleurige element).
// Beweging is klein (fade + lichte translate) via VitaBubbel's .mf-fade-in en
// respecteert prefers-reduced-motion; de ademhaling op het gezicht zetten we
// uit bij reduce.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, type ReactNode } from 'react'
import VitaBubbel from './VitaBubbel'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export type DoelbegeleiderFase = 'intro' | 'bevestigd'

interface VitaDoelbegeleiderProps {
  /** Welk moment in de doel-flow Vita begeleidt. */
  fase: DoelbegeleiderFase
  /**
   * Zichtbaar label van het laagst scorende vlak uit de check-in (bv. 'Slaap').
   * `null` als er geen geldige scores zijn — dan houdt Vita het algemeen.
   */
  focusLabel?: string | null
  /** Hoeveel aandachtsgebieden er te kiezen zijn (voor natuurlijke aanmoediging). */
  aantalGebieden?: number
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

export default function VitaDoelbegeleider({
  fase,
  focusLabel = null,
  aantalGebieden = 0,
  size = 52,
}: VitaDoelbegeleiderProps) {
  const { t } = useVertaling()
  // Lazy init: op de client meteen de juiste waarde (voorkomt een frame
  // breathing onder reduce). Op de server is matchMedia niet beschikbaar → false;
  // .mf-fade-in dekt de translate/fade al af via CSS.
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (fase === 'bevestigd') {
    return (
      <VitaBubbel emotion="proud" animate={!reduceMotion} size={size}>
        {t('vita.doelbegeleider.bevestigd')}
      </VitaBubbel>
    )
  }

  // fase === 'intro'
  const meervoud = aantalGebieden > 1
  const keuzeZin = meervoud
    ? t('vita.doelbegeleider.keuzeMeer')
    : t('vita.doelbegeleider.keuzeEen')

  // Benoem het laagste vlak alleen als we het echt uit de check-in kennen.
  const opening: ReactNode = focusLabel
    ? (
      <>
        {t('vita.doelbegeleider.openingVoor')}<strong style={{ fontWeight: 700 }}>{focusLabel.toLowerCase()}</strong>
        {t('vita.doelbegeleider.openingNa', { keuze: keuzeZin })}
      </>
    )
    : (
      <>
        {t('vita.doelbegeleider.openingAlgemeen', { keuze: keuzeZin })}
      </>
    )

  return (
    <VitaBubbel emotion="supportive" animate={!reduceMotion} size={size}>
      {opening}
    </VitaBubbel>
  )
}
