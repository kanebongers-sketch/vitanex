'use client'

// ════════════════════════════════════════════════════════════════════════════
// VitaVoortgangViering — Vita viert de voortgang van de gebruiker.
// Puur presentational: krijgt de ECHTE, reeds berekende voortgang binnen
// (level/XP op /niveau, badge-status op /achievements) en rendert Vita's
// gezicht (PandaFace via VitaBubbel) met een warme, oprechte NL-zin.
//
// Twee varianten:
//  • 'level'   — feliciteert met het bereikte Fit Level en moedigt aan naar het
//                volgende (of viert het maximum). Gebruikt uitsluitend het level,
//                de levelnaam en de nog benodigde XP die de pagina al kent.
//  • 'badges'  — erkent de behaalde badges en moedigt aan richting de eerste
//                nog-te-ontgrendelen badge. Gebruikt alleen echte badge-status.
//
// Eerlijkheid: nooit verzonnen cijfers of beloftes — alle waarden komen uit de
// props die de pagina zelf al berekende. Strikt navy + cyan (PandaFace is het
// enige meerkleurige element). Beweging is klein (fade + lichte translate) via
// VitaBubbel's .mf-fade-in en respecteert prefers-reduced-motion; de ademhaling
// op het gezicht zetten we uit bij reduce.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, type ReactNode } from 'react'
import VitaBubbel from './VitaBubbel'
import type { EmotionState } from './PandaFace'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import { rijkeTekst } from './rijkeTekst'

interface LevelViering {
  variant: 'level'
  /** Het huidige Fit Level (1–10) zoals de pagina het berekende. */
  level: number
  /** De naam van het huidige level (bv. 'Gedreven'). */
  levelNaam: string
  /** De naam van het volgende level, of `null` op het maximum. */
  volgendeNaam?: string | null
  /** Nog benodigde XP tot het volgende level (0 op het maximum). */
  xpTotVolgende: number
  /** `true` als het maximum (Level 10) bereikt is. */
  isMax: boolean
}

interface BadgeViering {
  variant: 'badges'
  /** Aantal reeds behaalde badges. */
  behaald: number
  /** Naam van de eerstvolgende nog te ontgrendelen badge, of `null`. */
  volgendeBadge?: string | null
}

type VitaVoortgangVieringProps = (LevelViering | BadgeViering) & {
  /** Grootte van Vita's gezicht in px. */
  size?: number
}

/** Detecteert prefers-reduced-motion en houdt het live bij. */
function useReduceMotion(): boolean {
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

  return reduceMotion
}

const cyaan = (tekst: ReactNode): ReactNode => (
  <strong style={{ fontWeight: 700, color: 'var(--mentaforce-primary)' }}>{tekst}</strong>
)

type Vertaal = (sleutel: string, params?: Record<string, string | number>) => string

/** Bouwt Vita's boodschap + emotie voor de level-variant. */
function levelBoodschap(props: LevelViering, t: Vertaal, locale: string): { emotion: EmotionState; tekst: ReactNode } {
  if (props.isMax) {
    return {
      emotion: 'proud',
      tekst: rijkeTekst(t('vita.viering.niveauMax'), {
        niveau: cyaan(t('vita.viering.niveauMaxLabel', { level: props.level, naam: props.levelNaam })),
      }),
    }
  }

  const volgende = props.volgendeNaam
  const delen = {
    niveau: cyaan(t('vita.viering.niveauLabel', { level: props.level, naam: props.levelNaam })),
    xp: cyaan(t('vita.viering.xp', { aantal: props.xpTotVolgende.toLocaleString(locale) })),
    volgende: volgende ? cyaan(volgende) : null,
  }
  return {
    emotion: 'motivated',
    tekst: rijkeTekst(t(volgende ? 'vita.viering.niveauBezigNaar' : 'vita.viering.niveauBezig'), delen),
  }
}

/** Bouwt Vita's boodschap + emotie voor de badge-variant. */
function badgeBoodschap(props: BadgeViering, t: Vertaal): { emotion: EmotionState; tekst: ReactNode } {
  if (props.behaald === 0) {
    return {
      emotion: 'curious',
      tekst: props.volgendeBadge
        ? rijkeTekst(t('vita.viering.eersteBadge'), { badge: cyaan(props.volgendeBadge) })
        : t('vita.viering.eersteBadgeAlgemeen'),
    }
  }

  const meervoud = props.behaald > 1
  const behaaldZin = rijkeTekst(t('vita.viering.behaaldEen'), {
    aantal: cyaan(t(meervoud ? 'vita.viering.badgeMeer' : 'vita.viering.badgeEen', { aantal: props.behaald })),
  })

  return {
    emotion: props.volgendeBadge ? 'motivated' : 'proud',
    tekst: props.volgendeBadge
      ? rijkeTekst(t('vita.viering.volgendeBadge'), { behaald: behaaldZin, badge: cyaan(props.volgendeBadge) })
      : rijkeTekst(t('vita.viering.alleBadges'), { behaald: behaaldZin }),
  }
}

export default function VitaVoortgangViering(props: VitaVoortgangVieringProps) {
  const reduceMotion = useReduceMotion()
  const { t, taal } = useVertaling()
  const { emotion, tekst } =
    props.variant === 'level' ? levelBoodschap(props, t, INTL_LOCALE[taal]) : badgeBoodschap(props, t)

  return (
    <VitaBubbel emotion={emotion} animate={!reduceMotion} size={props.size ?? 52}>
      {tekst}
    </VitaBubbel>
  )
}
