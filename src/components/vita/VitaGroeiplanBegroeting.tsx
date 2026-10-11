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
import { useVertaling } from '@/lib/i18n/TaalProvider'

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
  const { t } = useVertaling()
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

  // Vaste opening + een staart die past bij de omvang van het plan.
  const staart = heeftActies
    ? aantalActies === 1
      ? t('vita.groeiplanBegroeting.actiesEen')
      : t('vita.groeiplanBegroeting.actiesMeer', { aantal: aantalActies })
    : aantalDoelen > 0
      ? t('vita.groeiplanBegroeting.koers')
      : ''
  const boodschap: ReactNode = (
    <>
      {t('vita.groeiplanBegroeting.ditIsVoor')}
      <strong style={{ fontWeight: 700 }}>{t('vita.groeiplanBegroeting.jouw')}</strong>
      {t('vita.groeiplanBegroeting.ditIsNa')}
      {staart}
    </>
  )

  return (
    <VitaBubbel emotion={emotion} animate={!reduceMotion} size={size}>
      {boodschap}
    </VitaBubbel>
  )
}
