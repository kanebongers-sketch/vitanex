'use client'

import { Play, Square } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { ADEM, ADEM_ADVIES, type AdemTab } from './focus-data'
import type { AdemEngine } from './useAdemEngine'

const MAX_R = 80
const MIN_R = 45

interface AdemSectieProps {
  engine: AdemEngine
}

/**
 * Ademhalingstab: techniekkeuze, uitleg, pulserende oefencirkel en
 * advies-kaart. Presentational — alle state komt uit de AdemEngine.
 */
export default function AdemSectie({ engine }: AdemSectieProps) {
  const { t } = useVertaling()
  const { ademTab, actief, faseIdx, teller, ronden, kiesTechniek, start, stop } = engine
  const naamVan = (k: AdemTab) => t(`mentaal.focus.adem.${k}.naam`)
  const huidigeFase = ADEM[ademTab].fases[faseIdx]

  const faseLabel = huidigeFase ? t(`mentaal.focus.fase.${huidigeFase.soort}`) : ''
  const voordelen = Array.from({ length: ADEM[ademTab].aantalVoordelen }, (_, i) => t(`mentaal.focus.adem.${ademTab}.voordeel${i + 1}`))

  const pulsR = huidigeFase?.soort === 'uitademen' || huidigeFase?.soort === 'vasthouden'
    ? MAX_R - ((MAX_R - MIN_R) * (1 - teller / (huidigeFase?.duur ?? 1)))
    : MIN_R + ((MAX_R - MIN_R) * (1 - teller / (huidigeFase?.duur ?? 1)))

  return (
    <>
      <style>{`
        .mf-adem-cirkel { transition: r 0.9s ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .mf-adem-cirkel { transition: none; }
        }
      `}</style>
      <div className="rounded-2xl border p-5 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>{t('mentaal.focus.kiesTechniek')}</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(Object.keys(ADEM) as AdemTab[]).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => kiesTechniek(k)}
              disabled={actief}
              aria-pressed={ademTab === k}
              aria-label={t('mentaal.focus.kiesLabel', { naam: naamVan(k) })}
              className="mf-pressable py-2.5 px-3 rounded-xl text-xs font-medium border transition text-left"
              style={{
                background: ademTab === k ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                borderColor: ademTab === k ? 'var(--mentaforce-primary)' : 'var(--border)',
                color: ademTab === k ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                opacity: actief && ademTab !== k ? 0.4 : 1,
              }}
            >
              <span className="font-semibold block">{naamVan(k)}</span>
              <span className="opacity-70">{ADEM[k].fases.map(f => f.duur).join('-')}s</span>
            </button>
          ))}
        </div>

        {!actief && (
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>{t(`mentaal.focus.adem.${ademTab}.beschrijving`)}</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {ADEM[ademTab].fases.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: `color-mix(in srgb, ${f.kleur} 12%, transparent)`, color: f.kleur }}>
                  <span className="font-bold">{f.duur}s</span>
                  <span>{t(`mentaal.focus.fase.${f.soort}`)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>{t('mentaal.focus.voordelen')}</p>
            <div className="flex flex-wrap gap-1.5">
              {voordelen.map(v => (
                <span key={v} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green-dark)' }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {actief && huidigeFase && (
          <div className="flex flex-col items-center py-4">
            <div
              role="img"
              aria-label={t('mentaal.focus.faseLabel', { fase: faseLabel, seconden: teller })}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${huidigeFase.kleur} 18%, transparent) 0%, transparent 70%)` }} />
              <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden focusable="false" style={{ position: 'relative', zIndex: 1 }}>
                <circle cx="100" cy="100" r={pulsR + 12} fill={huidigeFase.kleur} opacity="0.07" />
                <circle
                  className="mf-adem-cirkel"
                  cx="100" cy="100" r={pulsR}
                  fill={huidigeFase.kleur}
                  opacity="0.88"
                />
                <text x="100" y="94" textAnchor="middle" fill="var(--bg-app)" fontSize="13" fontWeight="600">
                  {faseLabel}
                </text>
                <text x="100" y="118" textAnchor="middle" fill="var(--bg-app)" fontSize="28" fontWeight="800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {teller}
                </text>
              </svg>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }} aria-live="polite">
              {t(ronden === 1 ? 'mentaal.focus.rondeVoltooid' : 'mentaal.focus.rondenVoltooid', { aantal: ronden })}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => actief ? stop() : start()}
          aria-label={actief ? t('mentaal.focus.ademStoppen') : t('mentaal.focus.ademStarten')}
          className="mf-pressable w-full py-3.5 rounded-xl font-semibold text-sm transition"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: actief ? 'var(--mf-red)' : 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}
        >
          {actief
            ? (<><Square size={14} aria-hidden /><span>{t('mentaal.focus.stop')}</span></>)
            : (<><Play size={14} aria-hidden /><span>{t('mentaal.focus.startAdem')}</span></>)}
        </button>
      </div>

      <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>{t('mentaal.focus.wanneer')}</p>
        {ADEM_ADVIES.map(r => (
          <div key={r.sleutel} className="mf-divider-row flex gap-3 py-3">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--mentaforce-primary)' }} />
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-4)' }}>{t(`mentaal.focus.advies.${r.sleutel}.wanneer`)}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{naamVan(r.techniek)}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(`mentaal.focus.advies.${r.sleutel}.reden`)}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
