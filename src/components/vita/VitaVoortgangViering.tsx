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

/** Bouwt Vita's boodschap + emotie voor de level-variant. */
function levelBoodschap(props: LevelViering): { emotion: EmotionState; tekst: ReactNode } {
  if (props.isMax) {
    return {
      emotion: 'proud',
      tekst: (
        <>
          Je staat op {cyaan(`Niveau ${props.level} — ${props.levelNaam}`)}, het hoogste dat er is.
          Ik ben oprecht trots op je. Blijf inchecken; ik blijf naast je staan.
        </>
      ),
    }
  }

  const volgende = props.volgendeNaam
  return {
    emotion: 'motivated',
    tekst: (
      <>
        Mooi bezig — je bent {cyaan(`Niveau ${props.level}, ${props.levelNaam}`)}. Nog{' '}
        {cyaan(`${props.xpTotVolgende.toLocaleString('nl-NL')} XP`)}
        {volgende ? <> tot {cyaan(volgende)}</> : <> tot je volgende niveau</>}. Dat haal je;
        ik geloof in je.
      </>
    ),
  }
}

/** Bouwt Vita's boodschap + emotie voor de badge-variant. */
function badgeBoodschap(props: BadgeViering): { emotion: EmotionState; tekst: ReactNode } {
  if (props.behaald === 0) {
    return {
      emotion: 'curious',
      tekst: props.volgendeBadge ? (
        <>
          Je eerste badge ligt binnen handbereik: {cyaan(props.volgendeBadge)}. Doe een check-in
          of log een training — dan vieren we die samen.
        </>
      ) : (
        <>
          Elke check-in en elk doel brengt je dichter bij je eerste badge. Klein beginnen mag —
          ik houd je vooruitgang bij.
        </>
      ),
    }
  }

  const meervoud = props.behaald > 1
  const behaaldZin: ReactNode = (
    <>
      Al {cyaan(`${props.behaald} ${meervoud ? 'badges' : 'badge'}`)} binnen — knap gedaan.
    </>
  )

  return {
    emotion: props.volgendeBadge ? 'motivated' : 'proud',
    tekst: props.volgendeBadge ? (
      <>
        {behaaldZin} Je volgende is {cyaan(props.volgendeBadge)}; die pakken we er ook bij.
      </>
    ) : (
      <>
        {behaaldZin} Je hebt ze allemaal — dat is echt bijzonder. Ik ben trots op je.
      </>
    ),
  }
}

export default function VitaVoortgangViering(props: VitaVoortgangVieringProps) {
  const reduceMotion = useReduceMotion()
  const { emotion, tekst } =
    props.variant === 'level' ? levelBoodschap(props) : badgeBoodschap(props)

  return (
    <VitaBubbel emotion={emotion} animate={!reduceMotion} size={props.size ?? 52}>
      {tekst}
    </VitaBubbel>
  )
}
