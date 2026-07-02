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
const UITNODIGING_ZIN =
  'Hoe voel je je nu? Eén tik, meer niet — ik houd het even bij voor je.'

// Empathische reactie per stemmingswaarde. Steunend en erkennend bij laag (nooit
// toxisch-positief), meelevend-blij bij hoog. Eerlijk en menselijk, één zin.
const REACTIE_ZIN: Record<number, string> = {
  1: 'Zwaar moment? Ik ben er. Fijn dat je het toch even aangaf — dat telt.',
  2: 'Niet je beste dag, hoor ik. Dank dat je het deelt; je hoeft het niet weg te lachen.',
  3: 'Gewoon oké mag ook. Fijn dat je even incheckte.',
  4: 'Mooi dat het goed zit vandaag. Geniet er rustig van.',
  5: 'Wat fijn dat je je zo voelt — koester dit moment even.',
}

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
    const zin = (stemming ? REACTIE_ZIN[stemming] : undefined) ?? 'Fijn dat je even incheckte.'
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
      {UITNODIGING_ZIN}
    </VitaBubbel>
  )
}
