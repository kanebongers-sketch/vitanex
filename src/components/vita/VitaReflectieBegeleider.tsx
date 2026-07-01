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
const OPENING_ZIN =
  'Even terugblikken samen. Geen goed of fout — gewoon eerlijk voor jezelf. Neem de tijd; wat je hier deelt blijft van jou.'

// Korte begeleiding per reflectievraag: één zin die het moment menselijk maakt.
// Sluit aan op de vraag-id's uit reflectie/page.tsx.
const VRAAG_ZINNEN: Record<string, string> = {
  hoogtepunt:    'Begin luchtig — welk moment liet je even opleven?',
  uitdaging:     'En het zwaardere: benoemen mag, dat maakt het lichter.',
  leermoment:    'Soms zit de winst in wat je over jezelf ontdekte.',
  energie:       'Merk je waar je energie heen ging — en waar ze wegliep?',
  volgende_week: 'Eén klein iets voor volgende week is al genoeg.',
  dankbaarheid:  'Sluit zacht af — waar was je stiekem blij mee?',
}

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

const AFROND_ZIN =
  'Fijn dat je dit deed. Dit soort momenten leren mij je het beste kennen — en helpen jou de week scherper in te gaan.'

export default function VitaReflectieBegeleider({
  fase,
  vraagId,
  size = 48,
}: VitaReflectieBegeleiderProps) {
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
        {AFROND_ZIN}
      </VitaBubbel>
    )
  }

  if (fase === 'vraag') {
    const zin = (vraagId && VRAAG_ZINNEN[vraagId]) ?? 'Neem even de tijd voor deze.'
    const emotie = (vraagId && VRAAG_EMOTIE[vraagId]) ?? 'supportive'
    return (
      <VitaBubbel emotion={emotie} animate={!reduceMotion} size={size}>
        {zin}
      </VitaBubbel>
    )
  }

  // fase === 'opening'
  return (
    <VitaBubbel emotion="calm" animate={!reduceMotion} size={size + 8}>
      {OPENING_ZIN}
    </VitaBubbel>
  )
}
