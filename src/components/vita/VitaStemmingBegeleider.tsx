'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaStemmingBegeleider — Vita zit naast je bij de dagelijkse stemming-log.
// Puur presentational: krijgt een fase (+ de gekozen stemmingswaarde 1..5) binnen
// en rendert Vita's gezicht (PandaFace via VitaBubbel) met een warme, korte NL-zin
// die past bij dat moment.
//
// Twee fasen:
//  • 'uitnodiging' — rustige, korte uitnodiging om je stemming te delen (één tik)
//  • 'reactie'     — empathische reactie ná het opslaan, passend bij de stemming
//
// Empathie boven toxische positiviteit: bij een lage stemming is Vita steunend en
// erkennend (nooit "kop op!"), bij een hoge meelevend-blij. Haar gezichtsemotie
// beweegt mee met de gekozen stemming (supportive/concerned bij laag, proud/
// motivated bij hoog).
//
// Strikt navy + cyan (PandaFace is het enige meerkleurige element). Beweging is
// klein (fade + lichte translate) via VitaBubbel's .mf-fade-in en respecteert
// prefers-reduced-motion; de ademhaling op het gezicht zetten we uit bij reduce.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import VitaBubbel from './VitaBubbel'
import { type EmotionState } from './PandaFace'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export type StemmingFase = 'uitnodiging' | 'reactie'

interface VitaStemmingBegeleiderProps {
  /** Welk moment in de stemming-log Vita begeleidt. */
  fase: StemmingFase
  /** De gekozen stemmingswaarde 1..5 — alleen relevant bij fase 'reactie'. */
  stemming?: number
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

// Rustige, korte uitnodiging. Eén tik, geen druk. Geen jargon, geen emoji.

// Empathische reactie per stemmingswaarde. Steunend en erkennend bij laag (nooit
// toxisch-positief), meelevend-blij bij hoog. Eerlijk en menselijk, één zin.

// Vita's gezichtsemotie beweegt mee met de stemming: steunend/bezorgd bij laag,
// motiverend/trots bij hoog.
const REACTIE_EMOTIE: Record<number, EmotionState> = {
  1: 'concerned',
  2: 'supportive',
  3: 'calm',
  4: 'motivated',
  5: 'proud',
}

export default function VitaStemmingBegeleider({
  fase,
  stemming,
  size = 48,
}: VitaStemmingBegeleiderProps) {
  const { t } = useVertaling()
  // Lazy init: op de client meteen de juiste waarde (voorkomt een frame breathing
  // onder reduce). Op de server is matchMedia niet beschikbaar → false; .mf-fade-in
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

  if (fase === 'reactie') {
    // Reactiezinnen per stemming 1..5 staan in vita.stemming.reactie.*
    const zin = stemming && REACTIE_EMOTIE[stemming]
      ? t(`vita.stemming.reactie.${stemming}`)
      : t('vita.stemming.reactieStandaard')
    const emotie = (stemming ? REACTIE_EMOTIE[stemming] : undefined) ?? 'supportive'
    return (
      <VitaBubbel emotion={emotie} animate={!reduceMotion} size={size + 8}>
        {zin}
      </VitaBubbel>
    )
  }

  // fase === 'uitnodiging'
  return (
    <VitaBubbel emotion="curious" animate={!reduceMotion} size={size}>
      {t('vita.stemming.uitnodiging')}
    </VitaBubbel>
  )
}
