'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaDoelenBegroeting — Vita staat naast je weekdoelen.
// Puur presentational: krijgt de échte voortgang binnen (aantal doelen, hoeveel
// vandaag gelogd/gehaald, de vlak-labels van deze week) en rendert één warme,
// eerlijke NL-zin via VitaBubbel. Geen data-loading, geen verzonnen cijfers —
// alleen wat de pagina al weet.
//
// Emotie beweegt mee met de voortgang:
//  • 'proud'      — alle doelen van vandaag gehaald (viering-moment).
//  • 'motivated'  — nog open doelen, of net iets afgevinkt.
//  • 'supportive' — nog niets gelogd vandaag: rustig aanmoedigen, klein beginnen.
//
// Strikt navy + cyan via tokens; PandaFace (in VitaBubbel) is het enige
// meerkleurige element. Beweging is klein (fade + lichte translate via
// VitaBubbel's .mf-fade-in) en de ademhaling op het gezicht gaat uit bij
// prefers-reduced-motion.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, type ReactNode } from 'react'
import type { EmotionState } from './PandaFace'
import VitaBubbel from './VitaBubbel'

interface VitaDoelenBegroetingProps {
  /** Totaal aantal actieve weekdoelen. */
  aantalDoelen: number
  /** Hoeveel doelen vandaag zijn gelogd (gehaald óf niet-gehaald). */
  aantalGelogd: number
  /** Hoeveel doelen vandaag als gehaald zijn gemarkeerd. */
  aantalGehaald: number
  /** Zichtbare labels van de vlakken deze week (bv. 'Slaap', 'Stress'). */
  vlakLabels: readonly string[]
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

/** Voegt labels samen tot natuurlijk NL: "Slaap, Stress en Energie". */
function voegLabelsSamen(labels: readonly string[]): string {
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  const kop = labels.slice(0, -1).join(', ')
  const staart = labels[labels.length - 1]
  return `${kop} en ${staart}`
}

export default function VitaDoelenBegroeting({
  aantalDoelen,
  aantalGelogd,
  aantalGehaald,
  vlakLabels,
  size = 52,
}: VitaDoelenBegroetingProps) {
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

  const allesGehaald = aantalDoelen > 0 && aantalGehaald === aantalDoelen
  const nogNietsGelogd = aantalGelogd === 0
  const labelZin = voegLabelsSamen(vlakLabels)

  const emotion: EmotionState = allesGehaald
    ? 'proud'
    : nogNietsGelogd
      ? 'supportive'
      : 'motivated'

  let boodschap: ReactNode
  if (allesGehaald) {
    boodschap = (
      <>
        Alle doelen van vandaag afgevinkt. Precies zo bouw je vooruitgang op —
        rustig trots op jezelf.
      </>
    )
  } else if (nogNietsGelogd) {
    boodschap = labelZin ? (
      <>
        Deze week werken we aan{' '}
        <strong style={{ fontWeight: 700 }}>{labelZin}</strong>. Begin klein: één
        doel afvinken is al winst. Ik hou het samen met je bij.
      </>
    ) : (
      <>
        Deze week staan je doelen klaar. Begin klein: één doel afvinken is al
        winst. Ik hou het samen met je bij.
      </>
    )
  } else {
    const resterend = aantalDoelen - aantalGehaald
    boodschap = (
      <>
        Mooi bezig — {aantalGehaald} van {aantalDoelen} gehaald vandaag. Nog{' '}
        {resterend} te gaan, maar geen druk: elke stap telt.
      </>
    )
  }

  return (
    <VitaBubbel emotion={emotion} animate={!reduceMotion} size={size}>
      {boodschap}
    </VitaBubbel>
  )
}
