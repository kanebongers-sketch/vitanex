import { PIJLERS } from '@/lib/coaching/pijlers'
import type { TrajectMetFases } from '@/lib/coaching/traject'
import { PijlerBadge } from './PijlerBadge'

// Presentational: toont de fases van een traject als verticale tijdlijn met
// pijler-accenten en markeert de fase die nu loopt. Puur (props in → UI uit).

function weekLabel(van: number | null, tot: number | null): string | null {
  if (van === null && tot === null) return null
  if (van !== null && tot !== null) return `Week ${van}–${tot}`
  return van !== null ? `Vanaf week ${van}` : `Tot week ${tot}`
}

export interface TrajectTijdlijnProps {
  data: TrajectMetFases
}

export function TrajectTijdlijn({ data }: TrajectTijdlijnProps) {
  const { fases, huidige_fase_id } = data

  return (
    <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
      {fases.map((fase, i) => {
        const info = PIJLERS[fase.pijler]
        const isNu = fase.id === huidige_fase_id
        const isLaatste = i === fases.length - 1
        const week = weekLabel(fase.week_van, fase.week_tot)

        return (
          <li key={fase.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
            {/* Rail: gekleurde stip + verbindingslijn */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span
                aria-hidden
                style={{
                  width: 16, height: 16, borderRadius: '50%', marginTop: 22,
                  background: isNu ? info.kleurToken : 'var(--bg-card)',
                  border: `2.5px solid ${info.kleurToken}`,
                  boxShadow: isNu
                    ? `0 0 0 4px ${info.accentBgToken}, 0 0 16px -1px color-mix(in srgb, ${info.kleurToken} 65%, transparent)`
                    : 'none',
                }}
              />
              {!isLaatste && <span aria-hidden style={{ flex: 1, width: 2, background: 'var(--border)', minHeight: 24 }} />}
            </div>

            {/* Fase-kaart — de lopende fase krijgt een subtiele pijler-glow + ring */}
            <div
              style={{
                flex: 1, marginBottom: isLaatste ? 0 : 12, padding: '16px 18px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isNu ? info.kleurToken : 'var(--border)'}`,
                boxShadow: isNu
                  ? `0 0 0 1px ${info.kleurToken}, 0 10px 30px -12px color-mix(in srgb, ${info.kleurToken} 50%, transparent)`
                  : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
                  FASE {fase.volgorde}
                </span>
                <PijlerBadge pijler={fase.pijler} />
                {week && <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{week}</span>}
                {isNu && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: info.kleurToken, background: info.accentBgToken, padding: '2px 8px', borderRadius: 100 }}>
                    Nu bezig
                  </span>
                )}
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{fase.titel}</p>
              {fase.focus && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>{fase.focus}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
