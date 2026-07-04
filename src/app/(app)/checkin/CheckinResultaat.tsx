'use client'

// ─── CheckinResultaat — presentational ───────────────────────────────────────
// Kalm resultaatmoment ná het opslaan van de check-in: het weekbeeld over de
// zes vlakken, berekend uit de zojuist ingevulde domeinscores (4–20 per vlak,
// dezelfde normalisatie als CheckinInsight op de doelkeuze-pagina). Eén rustige
// CTA door naar de doelkeuze — geen confetti, geen extra beslissingen.

import { useEffect, useRef } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import VitaCheckinBegeleider from '@/components/vita/VitaCheckinBegeleider'

export interface PijlerInfo {
  id:    string
  label: string
  kleur: string
}

interface CheckinResultaatProps {
  pijlers:  PijlerInfo[]
  /** Domeinscores 4–20 per vlak — exact wat ook naar /doelkeuze gaat. */
  scores:   Record<string, number>
  onVerder: () => void
}

/** 4–20 → 0–100%, zelfde schaal als CheckinInsight (doelkeuze). */
function naarPct(score: number): number {
  return Math.max(0, Math.min(100, Math.round(((score - 4) / 16) * 100)))
}

export default function CheckinResultaat({ pijlers, scores, onVerder }: CheckinResultaatProps) {
  const laatste = pijlers[pijlers.length - 1]

  // De hele view wisselt hiernaartoe: zet focus op de kop zodat toetsenbord-
  // en screenreader-gebruikers het completion-moment direct meekrijgen.
  const kopRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    kopRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section className="max-w-md w-full mf-animate-up" aria-label="Resultaat van je check-in">
      {/* Vita's warme afronding — bestaand completion-moment, geen nieuwe copy */}
      <div className="mb-6">
        <VitaCheckinBegeleider
          fase="afronden"
          pijlerId={laatste.id}
          pijlerLabel={laatste.label}
          sectieIdx={pijlers.length - 1}
          totaalSecties={pijlers.length}
        />
      </div>

      <div className="rounded-2xl border p-8"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--mf-green-light)' }}>
          <Check size={24} strokeWidth={2.5} aria-hidden="true" style={{ color: 'var(--mf-green)' }} />
        </div>
        <h1 ref={kopRef} tabIndex={-1} className="text-xl font-semibold text-center mb-1"
          style={{ color: 'var(--text-1)', outline: 'none' }}>
          Check-in compleet
        </h1>
        <p className="text-sm text-center mb-7 leading-relaxed" style={{ color: 'var(--text-3)' }}>
          Dit is je weekbeeld — zo stond je er de afgelopen week voor.
        </p>

        {/* Weekbeeld: per vlak een rustige balk + percentage (echte scores) */}
        <ul className="flex flex-col gap-3.5 mb-8" aria-label="Jouw score per vlak">
          {pijlers.map(p => {
            const breedte = naarPct(scores[p.id] ?? 4)
            return (
              <li key={p.id} className="flex items-center gap-3">
                <span className="w-20 flex-shrink-0 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                  {p.label}
                </span>
                <span aria-hidden="true" className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-subtle)' }}>
                  <span className="block h-full rounded-full" style={{ width: `${breedte}%`, background: p.kleur }} />
                </span>
                <span className="w-9 flex-shrink-0 text-right text-xs font-semibold tabular-nums"
                  style={{ color: 'var(--text-2)' }}>
                  {breedte}%
                </span>
              </li>
            )
          })}
        </ul>

        <button type="button" onClick={onVerder}
          className="mf-resultaat-cta w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', boxShadow: 'var(--shadow-md)' }}>
          Kies je focus voor deze week
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-4)' }}>
          Je antwoorden zijn beveiligd opgeslagen.
        </p>
      </div>

      <style>{`
        .mf-resultaat-cta {
          transition: transform 0.15s var(--ease), filter 0.15s var(--ease);
        }
        .mf-resultaat-cta:hover  { filter: brightness(1.08); }
        .mf-resultaat-cta:active { transform: scale(0.98); }
        .mf-resultaat-cta:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-resultaat-cta { transition: none; }
        }
      `}</style>
    </section>
  )
}
