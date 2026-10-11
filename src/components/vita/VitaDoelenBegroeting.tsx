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
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

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

/** Voegt labels samen tot een natuurlijke opsomming: "Slaap, Stress en Energie". */
function voegLabelsSamen(labels: readonly string[], locale: string): string {
  if (labels.length === 0) return ''
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(labels)
}

export default function VitaDoelenBegroeting({
  aantalDoelen,
  aantalGelogd,
  aantalGehaald,
  vlakLabels,
  size = 52,
}: VitaDoelenBegroetingProps) {
  const { t, taal } = useVertaling()
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
  const labelZin = voegLabelsSamen(vlakLabels, INTL_LOCALE[taal])

  const emotion: EmotionState = allesGehaald
    ? 'proud'
    : nogNietsGelogd
      ? 'supportive'
      : 'motivated'

  let boodschap: ReactNode
  if (allesGehaald) {
    boodschap = (
<>{t('vita.doelenBegroeting.allesGehaald')}</>
    )
  } else if (nogNietsGelogd) {
    boodschap = labelZin ? (
      <>
        {t('vita.doelenBegroeting.werkenAanVoor')}
        <strong style={{ fontWeight: 700 }}>{labelZin}</strong>
        {t('vita.doelenBegroeting.werkenAanNa')}
      </>
    ) : (
<>{t('vita.doelenBegroeting.klaar')}</>
    )
  } else {
    const resterend = aantalDoelen - aantalGehaald
    boodschap = (
<>{t('vita.doelenBegroeting.bezig', { gehaald: aantalGehaald, totaal: aantalDoelen, resterend })}</>
    )
  }

  return (
    <VitaBubbel emotion={emotion} animate={!reduceMotion} size={size}>
      {boodschap}
    </VitaBubbel>
  )
}
