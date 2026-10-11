'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaCheckinBegeleider — Vita loopt met de gebruiker mee door de check-in.
// Puur presentational: krijgt een fase + pijler binnen, rendert Vita's gezicht
// (PandaFace via VitaBubbel) met een warme, korte NL-zin die past bij het moment.
//
// Drie fasen:
//  • 'vraag'    — rustige aanmoediging bij de huidige pijler ("Even over je slaap…")
//  • 'reactie'  — korte bemoediging als een sectie net compleet is en de flow
//                 doorschuift (subtiel, niet bij elke tik)
//  • 'afronden' — warm viering-moment op de afrondactie / 'alIngevuld'-bevestiging
//
// Strikt navy + cyan (PandaFace is het enige meerkleurige element). Beweging is
// klein (fade + lichte translate) via VitaBubbel's .mf-fade-in en respecteert
// prefers-reduced-motion; de ademhaling op het gezicht zetten we uit bij reduce.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import VitaBubbel from './VitaBubbel'
import { type EmotionState } from './PandaFace'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export type BegeleiderFase = 'vraag' | 'reactie' | 'afronden'

interface VitaCheckinBegeleiderProps {
  /** Welk moment in de flow Vita begeleidt. */
  fase: BegeleiderFase
  /** Id van de huidige pijler (slaap, stress, energie, focus, balans, motivatie). */
  pijlerId: string
  /** Zichtbaar label van de huidige pijler, voor natuurlijke zinnen. */
  pijlerLabel: string
  /** Index van de huidige sectie (0-based) — bepaalt de openingszin. */
  sectieIdx: number
  /** Totaal aantal secties — voor "laatste pijler"-nuance. */
  totaalSecties: number
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

// Warme, menselijke openingszinnen per pijler (woordenboek: vita.checkin.vraag.*).
// Geen jargon, geen emoji, geen verzonnen cijfers; Vita vraagt oprecht naar de week.
const PIJLERS_MET_ZIN = new Set(['slaap', 'stress', 'energie', 'focus', 'balans', 'motivatie'])

// Emotie per pijler: rustig-nieuwsgierig, met een net iets warmere blik op het slot.
const VRAAG_EMOTIE: Record<string, EmotionState> = {
  slaap:     'calm',
  stress:    'supportive',
  energie:   'curious',
  focus:     'focused',
  balans:    'calm',
  motivatie: 'motivated',
}

// Korte bemoediging als een sectie net compleet is (vita.checkin.reactie.*).
// Bewust neutraal-positief: Vita beoordeelt de antwoorden niet.

export default function VitaCheckinBegeleider({
  fase,
  pijlerId,
  pijlerLabel,
  sectieIdx,
  totaalSecties,
  size = 48,
}: VitaCheckinBegeleiderProps) {
  const { t } = useVertaling()
  // Lazy init: op de client meteen de juiste waarde (voorkomt een frame breathing
  // onder reduce). Op de server matchMedia niet beschikbaar → false, .mf-fade-in
  // dekt de rest van de beweging al af via CSS.
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

  const isLaatste = sectieIdx === totaalSecties - 1

  if (fase === 'afronden') {
    return (
      <VitaBubbel emotion="proud" animate={!reduceMotion} size={size + 8}>
        {t('vita.checkin.afronden')}
      </VitaBubbel>
    )
  }

  if (fase === 'reactie') {
    const zin = PIJLERS_MET_ZIN.has(pijlerId)
      ? t(`vita.checkin.reactie.${pijlerId}`)
      : t('vita.checkin.reactieStandaard')
    return (
      <VitaBubbel emotion="proud" animate={!reduceMotion} size={size}>
        {zin}
      </VitaBubbel>
    )
  }

  // fase === 'vraag'
  const basisZin = PIJLERS_MET_ZIN.has(pijlerId)
    ? t(`vita.checkin.vraag.${pijlerId}`)
    : t('vita.checkin.vraagStandaard', { pijler: pijlerLabel.toLowerCase() })
  const emotie = VRAAG_EMOTIE[pijlerId] ?? (isLaatste ? 'motivated' : 'curious')

  return (
    <VitaBubbel emotion={emotie} animate={!reduceMotion} size={size}>
      {basisZin}
    </VitaBubbel>
  )
}
