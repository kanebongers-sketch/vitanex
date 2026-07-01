'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaGroeiplanBegroeting — Vita introduceert het persoonlijke groeiplan.
// Puur presentational: krijgt de échte omvang van het plan binnen (aantal doelen,
// sterke punten, aandachtspunten, acties) en rendert één warme, eerlijke NL-zin
// via VitaBubbel. Geen data-loading, geen verzonnen inhoud of cijfers — alleen
// wat de pagina/AI al genereerde. Vita presenteert het plan als iets dat jullie
// samen opbouwen ("Dit is jouw plan — ik stel het bij naarmate ik je beter
// leer kennen").
//
// Emotie:
//  • 'focused'   — een frisser plan met veel richting (weinig gelogde historie):
//                  rustig samen de koers uitzetten.
//  • 'motivated' — een plan met concrete acties om mee aan de slag te gaan.
//
// Strikt navy + cyan via tokens; PandaFace (in VitaBubbel) is het enige
// meerkleurige element. Beweging is klein (fade + lichte translate via
// VitaBubbel's .mf-fade-in) en de ademhaling op het gezicht gaat uit bij
// prefers-reduced-motion.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, type ReactNode } from 'react'
import type { EmotionState } from './PandaFace'
import VitaBubbel from './VitaBubbel'

interface VitaGroeiplanBegroetingProps {
  /** Aantal doelen in het plan. */
  aantalDoelen: number
  /** Aantal concrete acties in het plan. */
  aantalActies: number
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

export default function VitaGroeiplanBegroeting({
  aantalDoelen,
  aantalActies,
  size = 52,
}: VitaGroeiplanBegroetingProps) {
  // Lazy init zodat er geen ademhalings-frame gebeurt onder reduce. Op de server
  // is matchMedia niet beschikbaar → false; .mf-fade-in dekt fade/translate af.
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

  const heeftActies = aantalActies > 0
  const emotion: EmotionState = heeftActies ? 'motivated' : 'focused'

  let boodschap: ReactNode
  if (heeftActies) {
    boodschap = (
      <>
        Dit is <strong style={{ fontWeight: 700 }}>jouw</strong> groeiplan — geen
        vast document, maar iets dat we samen opbouwen. Ik stel het bij naarmate
        ik je beter leer kennen. Beneden staan{' '}
        {aantalActies === 1 ? 'een concrete actie' : `${aantalActies} concrete acties`}{' '}
        om mee te beginnen. Geen druk: één stap tegelijk.
      </>
    )
  } else if (aantalDoelen > 0) {
    boodschap = (
      <>
        Dit is <strong style={{ fontWeight: 700 }}>jouw</strong> groeiplan — geen
        vast document, maar iets dat we samen opbouwen. Ik stel het bij naarmate
        ik je beter leer kennen. We zetten samen de koers uit; jij bepaalt het
        tempo.
      </>
    )
  } else {
    boodschap = (
      <>
        Dit is <strong style={{ fontWeight: 700 }}>jouw</strong> groeiplan — geen
        vast document, maar iets dat we samen opbouwen. Ik stel het bij naarmate
        ik je beter leer kennen.
      </>
    )
  }

  return (
    <VitaBubbel emotion={emotion} animate={!reduceMotion} size={size}>
      {boodschap}
    </VitaBubbel>
  )
}
