'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaReflectieBegeleider — Vita zit naast je bij de wekelijkse reflectie.
// Puur presentational: krijgt een fase (+ evt. vraag-id) binnen en rendert Vita's
// gezicht (PandaFace via VitaBubbel) met een warme, korte NL-zin die past bij het
// dagafsluiting-/terugblik-moment.
//
// Drie fasen:
//  • 'opening'  — rustige uitnodiging om even stil te staan bij de week
//  • 'vraag'    — korte, menselijke begeleiding bij een specifieke reflectievraag
//  • 'afronden' — oprecht viering-/erkenningsmoment op de afrondactie
//
// Strikt navy + cyan (PandaFace is het enige meerkleurige element). Beweging is
// klein (fade + lichte translate) via VitaBubbel's .mf-fade-in en respecteert
// prefers-reduced-motion; de ademhaling op het gezicht zetten we uit bij reduce.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import VitaBubbel from './VitaBubbel'
import { type EmotionState } from './PandaFace'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export type ReflectieFase = 'opening' | 'vraag' | 'afronden'

interface VitaReflectieBegeleiderProps {
  /** Welk moment in de reflectie Vita begeleidt. */
  fase: ReflectieFase
  /** Id van de reflectievraag — alleen relevant bij fase 'vraag'. */
  vraagId?: string
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

// Warme, menselijke openingszin. Geen goed of fout — Vita nodigt uit tot eerlijk
// terugblikken. Geen verzonnen cijfers, geen jargon, geen emoji.

// Korte begeleiding per reflectievraag: één zin die het moment menselijk maakt.
// Sluit aan op de vraag-id's uit reflectie/page.tsx.
/** Vragen met een eigen begeleidende zin (vita.reflectie.vraag.*). */
const VRAGEN_MET_ZIN = new Set(['hoogtepunt', 'uitdaging', 'leermoment', 'energie', 'volgende_week', 'dankbaarheid'])

// Rustige, passende emotie per vraag. Kalm en steunend, met een net iets warmere
// blik op het slot (dankbaarheid).
const VRAAG_EMOTIE: Record<string, EmotionState> = {
  hoogtepunt:    'calm',
  uitdaging:     'supportive',
  leermoment:    'curious',
  energie:       'calm',
  volgende_week: 'motivated',
  dankbaarheid:  'supportive',
}


export default function VitaReflectieBegeleider({
  fase,
  vraagId,
  size = 48,
}: VitaReflectieBegeleiderProps) {
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

  if (fase === 'afronden') {
    return (
      <VitaBubbel emotion="proud" animate={!reduceMotion} size={size + 8}>
        {t('vita.reflectie.afronden')}
      </VitaBubbel>
    )
  }

  if (fase === 'vraag') {
    const zin = vraagId && VRAGEN_MET_ZIN.has(vraagId)
      ? t(`vita.reflectie.vraag.${vraagId}`)
      : t('vita.reflectie.vraagStandaard')
    const emotie = (vraagId ? VRAAG_EMOTIE[vraagId] : undefined) ?? 'supportive'
    return (
      <VitaBubbel emotion={emotie} animate={!reduceMotion} size={size}>
        {zin}
      </VitaBubbel>
    )
  }

  // fase === 'opening'
  return (
    <VitaBubbel emotion="calm" animate={!reduceMotion} size={size + 8}>
      {t('vita.reflectie.opening')}
    </VitaBubbel>
  )
}
