'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PandaFace, { type EmotionState } from '@/components/vita/PandaFace'
import { getTimeOfDay, emotionFromScore, type TimeOfDay } from '@/lib/vita/emotion-engine'

/**
 * VitaDagstart — Vita's warme, tijdsbewuste presence bovenaan de home.
 *
 * Presentational: alle data komt via props uit de home-pagina (die ze al
 * ophaalt). Verzint niets: zonder data nodigt Vita rustig uit om te beginnen.
 * Eén primaire suggestie — dagstart 's ochtends, aanmoediging overdag,
 * dagafsluiting 's avonds. Emotie volgt score + tijd.
 */

interface VitaDagstartProps {
  /** Voornaam van de gebruiker; leeg als (nog) onbekend. */
  voornaam: string
  /** Readiness 0–100, of null als er nog geen check-in is. */
  readiness: number | null
  /** Aantal afgeronde dagtaken. */
  gedaanCount: number
  /** Totaal aantal dagtaken. */
  totaal: number
  /** Streak in dagen. */
  streak: number
  /** Of de reflectie/dagafsluiting van vandaag al gedaan is. */
  reflectieGedaan: boolean
}

interface Suggestie {
  href: string
  label: string
}

/**
 * Volgt de reduced-motion-voorkeur van de gebruiker, zodat we Vita's
 * ademhalings-animatie kunnen uitzetten (accessibility.md / animation.md).
 * Start op false (SSR-veilig) en synchroniseert na mount.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

interface Boodschap {
  groet: string
  tekst: string
  suggestie: Suggestie
  emotie: EmotionState
}

/** Tijdsbewuste groet, consistent met de rest van de app. */
function groetVoor(tod: TimeOfDay): string {
  if (tod === 'morning') return 'Goedemorgen'
  if (tod === 'afternoon') return 'Goedemiddag'
  if (tod === 'evening') return 'Goedenavond'
  return 'Goedenacht'
}

/**
 * Bouwt Vita's boodschap op uit tijd + echte voortgang. De emotie volgt de
 * score (emotionFromScore); zonder score kiest Vita een rustige, nieuwsgierige
 * toon. Geen verzonnen cijfers — enkel wat de home al kent.
 */
function bouwBoodschap(
  tod: TimeOfDay,
  props: Pick<VitaDagstartProps, 'readiness' | 'gedaanCount' | 'totaal' | 'streak' | 'reflectieGedaan'>,
): Boodschap {
  const { readiness, gedaanCount, totaal, streak, reflectieGedaan } = props
  const groet = groetVoor(tod)
  const scoreEmotie: EmotionState = readiness !== null ? emotionFromScore(readiness) : 'curious'
  const allesGedaan = totaal > 0 && gedaanCount === totaal

  const checkinSuggestie: Suggestie = { href: '/checkin', label: 'Start je check-in' }
  const reflectieSuggestie: Suggestie = { href: '/reflectie', label: 'Sluit je dag af' }
  const dankbaarheidSuggestie: Suggestie = { href: '/dankbaarheid', label: 'Noteer één dankbaarheid' }
  const stemmingSuggestie: Suggestie = { href: '/stemming', label: 'Log je stemming' }

  // 's Avonds/'s nachts: uitnodigen tot reflectie, tenzij al gedaan.
  if (tod === 'evening' || tod === 'night') {
    if (reflectieGedaan) {
      return {
        groet,
        tekst: 'Je hebt je dag afgesloten. Rust goed uit — morgen ben ik er weer.',
        suggestie: dankbaarheidSuggestie,
        emotie: 'supportive',
      }
    }
    return {
      groet,
      tekst: 'Even terugblikken? Een korte reflectie helpt je de dag rustig af te ronden.',
      suggestie: reflectieSuggestie,
      emotie: 'supportive',
    }
  }

  // Geen data: eerlijk uitnodigen om te beginnen.
  if (readiness === null) {
    return {
      groet,
      tekst: 'Fijn dat je er bent. Begin met je check-in, dan leer ik jouw dag kennen.',
      suggestie: checkinSuggestie,
      emotie: 'curious',
    }
  }

  // Overdag met alles af: warme erkenning, zachte vervolgstap.
  if (allesGedaan) {
    return {
      groet,
      tekst: streak > 1
        ? `Alles afgerond — en ${streak} dagen op rij. Dat is echt sterk.`
        : 'Alles afgerond voor vandaag. Sterk gedaan.',
      suggestie: stemmingSuggestie,
      emotie: 'proud',
    }
  }

  // Ochtend met voortgang: warme dagstart die één kleine stap benoemt.
  if (tod === 'morning') {
    return {
      groet,
      tekst: gedaanCount > 0
        ? `Goede start — ${gedaanCount} van ${totaal} al gedaan. Zetten we de volgende?`
        : 'Klaar voor een nieuwe dag. We beginnen rustig met je check-in.',
      suggestie: checkinSuggestie,
      emotie: scoreEmotie,
    }
  }

  // Overdag: korte aanmoediging op basis van voortgang.
  return {
    groet,
    tekst: gedaanCount > 0
      ? `Je bent goed bezig — ${gedaanCount} van ${totaal} taken vandaag afgerond.`
      : 'Nog even de dag ingaan? Eén kleine stap zet de toon.',
    suggestie: gedaanCount > 0 ? stemmingSuggestie : checkinSuggestie,
    emotie: scoreEmotie,
  }
}

export default function VitaDagstart({
  voornaam,
  readiness,
  gedaanCount,
  totaal,
  streak,
  reflectieGedaan,
}: VitaDagstartProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const tod = getTimeOfDay()
  const naam = voornaam || 'je'
  const { groet, tekst, suggestie, emotie } = bouwBoodschap(tod, {
    readiness,
    gedaanCount,
    totaal,
    streak,
    reflectieGedaan,
  })

  return (
    <section aria-labelledby="vita-dagstart-titel" className="vita-dagstart">
      <div className="vita-dagstart-face" aria-hidden="true">
        <span className="vita-dagstart-glow" />
        <PandaFace emotion={emotie} size={64} animate={!prefersReducedMotion} />
      </div>

      <div className="vita-dagstart-body">
        <header>
          <p className="vita-dagstart-kicker">Vita · jouw begeleider</p>
          <h1 id="vita-dagstart-titel" className="vita-dagstart-groet">
            {groet}, {naam}
          </h1>
        </header>
        <p className="vita-dagstart-tekst">{tekst}</p>

        <Link href={suggestie.href} className="vita-dagstart-cta">
          <span>{suggestie.label}</span>
          <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>

      <style>{`
        .vita-dagstart {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          margin-bottom: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-sm);
        }
        .vita-dagstart-face {
          position: relative;
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vita-dagstart-glow {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--mentaforce-primary-light) 0%, transparent 70%);
          opacity: 0.9;
        }
        .vita-dagstart-body { flex: 1; min-width: 0; }
        .vita-dagstart-kicker {
          margin: 0 0 5px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--mentaforce-primary);
        }
        .vita-dagstart-groet {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: var(--text-1);
        }
        .vita-dagstart-tekst {
          margin: 8px 0 14px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-3);
          max-width: 46ch;
        }
        .vita-dagstart-cta {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 15px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--mentaforce-primary);
          background: var(--mentaforce-primary-light);
          border: 1px solid var(--border);
          border-radius: var(--radius-btn);
          text-decoration: none;
          transition: transform 0.18s var(--ease), border-color 0.18s var(--ease);
        }
        .vita-dagstart-cta svg {
          transition: transform 0.18s var(--ease);
        }
        .vita-dagstart-cta:hover {
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }
        .vita-dagstart-cta:hover svg { transform: translateX(2px); }
        .vita-dagstart-cta:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        @media (max-width: 420px) {
          .vita-dagstart { padding: 16px; gap: 13px; }
          .vita-dagstart-groet { font-size: 20px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vita-dagstart-cta,
          .vita-dagstart-cta svg { transition: none; }
          .vita-dagstart-cta:hover { transform: none; }
          .vita-dagstart-cta:hover svg { transform: none; }
        }
      `}</style>
    </section>
  )
}
