'use client'

import { CheckCircle2 } from 'lucide-react'
import { TIMERS, MICRO_IDEEEN, POMODORO_BLOKKEN, formatTijd, type TimerTab } from './focus-data'
import type { FocusTimerEngine } from './useFocusTimer'

const RING_R = 88
const RING_OMTREK = 2 * Math.PI * RING_R

const POMODORO_STIJL: Record<'focus' | 'pauze' | 'lang', { bg: string; kleur: string }> = {
  focus: { bg: 'var(--mf-green-light)', kleur: 'var(--mf-green-dark)' },
  pauze: { bg: 'var(--mf-blue-light)', kleur: 'var(--mf-blue)' },
  lang: { bg: 'var(--mf-purple-light)', kleur: 'var(--mf-purple)' },
}

interface FocusTimerProps {
  engine: FocusTimerEngine
  vandaagMinuten: number
  vandaagSessies: number
}

/**
 * Timertab: één primaire start-CTA, kalm afleidingsvrij beeld tijdens de
 * sessie en een rustig completion-moment met echte cijfers van vandaag.
 * Presentational — alle state komt uit de FocusTimerEngine.
 */
export default function FocusTimer({ engine, vandaagMinuten, vandaagSessies }: FocusTimerProps) {
  const { timerTab, actief, rest, klaar, voltooideMinuten, wisselTab, toggle, reset } = engine
  const config = TIMERS[timerTab]
  const voortgang = 1 - rest / config.duur
  const onaangeraakt = rest === config.duur && !klaar

  return (
    <>
      <style>{`
        .mf-timer-ring { transition: stroke-dashoffset 1s linear; }
        .mf-voltooid { animation: mf-voltooid-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes mf-voltooid-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-timer-ring { transition: none; }
          .mf-voltooid { animation: none; }
        }
      `}</style>
      {/* Presets — secundair, verborgen tijdens de sessie voor een kalm beeld */}
      {!actief && (
        <div className="flex gap-2 mb-5">
          {(Object.keys(TIMERS) as TimerTab[]).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => wisselTab(k)}
              aria-pressed={timerTab === k}
              aria-label={`${TIMERS[k].naam}, ${formatTijd(TIMERS[k].duur)}`}
              className="mf-pressable flex-1 py-3 rounded-xl text-xs font-medium border transition flex flex-col items-center gap-1"
              style={{
                background: timerTab === k ? 'var(--mentaforce-primary-light)' : 'var(--bg-card)',
                borderColor: timerTab === k ? 'var(--mentaforce-primary)' : 'var(--border)',
                color: timerTab === k ? 'var(--mentaforce-primary)' : 'var(--text-3)',
              }}
            >
              <span className="text-xs font-bold opacity-60">{TIMERS[k].afk}</span>
              <span className="font-medium">{TIMERS[k].naam}</span>
              <span style={{ opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>{formatTijd(TIMERS[k].duur)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border p-6 mb-4 flex flex-col items-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div
          role="img"
          aria-label={`${config.naam}: ${formatTijd(rest)} resterend`}
          style={{ position: 'relative', width: 200, height: 200 }}
        >
          <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${config.kleur} 18%, transparent) 0%, transparent 70%)` }} />
          <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden focusable="false" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
            <circle cx="100" cy="100" r={RING_R} fill="none" style={{ stroke: 'var(--border-strong)' }} strokeWidth="8" />
            <circle
              className="mf-timer-ring"
              cx="100" cy="100" r={RING_R}
              fill="none"
              stroke={config.kleur}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${RING_OMTREK}`}
              strokeDashoffset={`${RING_OMTREK * (1 - voortgang)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2 }} aria-hidden>
            <span className="text-4xl font-bold" style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{formatTijd(rest)}</span>
            <span className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{config.naam}</span>
          </div>
        </div>

        {/* Completion-moment: rustig, met wat de sessie écht bijdroeg */}
        {klaar && (
          <div className="mf-voltooid mt-5 w-full max-w-sm rounded-xl border p-4 text-center" role="status" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
            <div className="flex justify-center mb-1.5" style={{ color: 'var(--mf-green)' }}>
              <CheckCircle2 size={32} aria-hidden strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{config.naam} voltooid</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              +{voltooideMinuten} min · vandaag {vandaagMinuten} min in {vandaagSessies} sessie{vandaagSessies === 1 ? '' : 's'}
            </p>
          </div>
        )}

        <p className="text-xs text-center mt-4 max-w-xs" style={{ color: 'var(--text-4)' }}>{config.tip}</p>
      </div>

      {/* Eén duidelijke primaire actie; reset alleen tonen als die zin heeft */}
      <div className="flex gap-3 mb-5">
        <button
          type="button"
          onClick={() => { if (klaar) { reset() } else { toggle() } }}
          aria-label={klaar ? 'Nieuwe sessie starten' : actief ? 'Timer pauzeren' : onaangeraakt ? `${config.naam} starten` : 'Timer hervatten'}
          className="mf-pressable flex-1 py-3.5 rounded-xl font-semibold text-sm transition"
          style={{ background: actief ? 'var(--mf-amber)' : config.kleur, color: 'var(--bg-app)' }}
        >
          {klaar ? 'Nieuwe sessie' : actief ? 'Pauzeer' : onaangeraakt ? `Start ${config.naam.toLowerCase()}` : 'Hervat'}
        </button>
        {!onaangeraakt && !klaar && (
          <button
            type="button"
            onClick={reset}
            aria-label="Timer resetten"
            className="mf-pressable mf-reset-btn px-5 py-3.5 rounded-xl text-sm border transition"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-3)' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Verdieping — alleen buiten een lopende sessie */}
      {!actief && (
        <>
          {timerTab === 'micro' && (
            <div className="rounded-2xl border p-5 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Ideeën voor je micro-break</p>
              {MICRO_IDEEEN.map(s => (
                <div key={s} className="mf-divider-row flex items-center gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--mf-purple)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>{s}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Pomodoro methode</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
              Werk in blokken van 25 minuten gefocust werk, gevolgd door 5 minuten pauze. Na 4 blokken een lange pauze van 15-30 minuten.
            </p>
            <div className="flex gap-2 items-center flex-wrap">
              {POMODORO_BLOKKEN.map((b, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: POMODORO_STIJL[b.soort].bg, color: POMODORO_STIJL[b.soort].kleur }}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
