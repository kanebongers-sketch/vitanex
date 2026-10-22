'use client'

import type { Actie, Overgeslagen, Resultaat, Samenvatting, Voorstel } from '@/lib/lifeos/pt-gesprek/verplaatsen'

// Presentational: de voorvertoning (met vinkjes), wat overgeslagen wordt, en de
// samenvatting na uitvoeren. Geen data-laden hier; dat doet CoachgesprekkenVerplaatsen.

export const ACTIE_LABEL: Record<Actie, string> = {
  verplaatsen: 'Verplaatsen',
  hernoemen: 'Hernoemen en verplaatsen',
  splitsen: 'Splitsen',
  dubbel: 'Dubbel verwijderen',
}

export function datumTijd(iso: string): { datum: string; tijd: string } {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { datum: '', tijd: '' }
  return {
    datum: d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    tijd: d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
  }
}

const klein: React.CSSProperties = { margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45 }
const rij: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderTop: '1px solid var(--border)' }
const lijst: React.CSSProperties = { display: 'grid', listStyle: 'none', padding: 0, margin: 0 }

function nieuweTitel(v: Voorstel): string {
  if (v.actie === 'dubbel') return 'Wordt verwijderd'
  if (v.actie === 'splitsen') return v.nieuw.map((n) => `${n.titel} (${datumTijd(n.startOp).tijd})`).join(' + ')
  return v.nieuweTitel ?? v.oudeTitel
}

interface VoorstelLijstProps {
  voorstellen: readonly Voorstel[]
  aangevinkt: ReadonlySet<string>
  onWissel: (sleutel: string) => void
  uit: boolean
}

export function VoorstelLijst({ voorstellen, aangevinkt, onWissel, uit }: VoorstelLijstProps) {
  return (
    <ul style={lijst}>
      {voorstellen.map((v) => {
        const { datum, tijd } = datumTijd(v.startOp)
        const id = `verplaats-${v.sleutel}`
        return (
          <li key={v.sleutel} style={rij}>
            <input id={id} type="checkbox" checked={aangevinkt.has(v.sleutel)} onChange={() => onWissel(v.sleutel)} disabled={uit} style={{ marginTop: 3, accentColor: 'var(--brand)' }} />
            <label htmlFor={id} style={{ display: 'grid', gap: 2, minWidth: 0, cursor: uit ? 'default' : 'pointer' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>
                {datum} · {tijd} ·{' '}
                <span style={{ color: v.actie === 'dubbel' ? 'var(--status-danger)' : 'var(--brand)', fontWeight: 600 }}>{ACTIE_LABEL[v.actie]}</span>
              </span>
              <span style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 600, overflowWrap: 'anywhere' }}>{v.oudeTitel || '(zonder titel)'}</span>
              <span style={{ ...klein, overflowWrap: 'anywhere' }}>Wordt: {nieuweTitel(v)}</span>
              {v.toelichting ? <span style={klein}>{v.toelichting}</span> : null}
            </label>
          </li>
        )
      })}
    </ul>
  )
}

export function OvergeslagenLijst({ items }: { items: readonly Overgeslagen[] }) {
  if (items.length === 0) return null
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <p style={{ ...klein, fontWeight: 600, color: 'var(--text-2)' }}>Niet aangeraakt · {items.length}</p>
      <ul style={lijst}>
        {items.map((o) => {
          const { datum, tijd } = datumTijd(o.startOp)
          return (
            <li key={o.eventId} style={{ ...rij, display: 'grid', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{datum} · {tijd}</span>
              <span style={{ fontSize: 13, color: 'var(--text-2)', overflowWrap: 'anywhere' }}>{o.titel || '(zonder titel)'}</span>
              <span style={klein}>{o.reden}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function SamenvattingBlok({ samenvatting }: { samenvatting: Samenvatting }) {
  const { verplaatst, hernoemd, gesplitst, verwijderd, mislukt } = samenvatting
  const tellers: [string, number][] = [
    ['verplaatst', verplaatst],
    ['hernoemd en verplaatst', hernoemd],
    ['gesplitst', gesplitst],
    ['dubbel verwijderd', verwijderd],
  ]
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <ul style={{ ...lijst, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {tellers.map(([label, aantal]) => (
          <li key={label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-raised)' }}>
            <p className="os-cijfer" style={{ margin: 0, fontSize: 24, lineHeight: 1, color: 'var(--brand)' }}>{aantal}</p>
            <p style={{ ...klein, marginTop: 4 }}>{label}</p>
          </li>
        ))}
      </ul>
      {mislukt.length > 0 ? <MisluktLijst items={mislukt} /> : <p style={klein}>Alles is gelukt.</p>}
    </div>
  )
}

function MisluktLijst({ items }: { items: readonly Resultaat[] }) {
  return (
    <div role="alert" style={{ display: 'grid', gap: 4 }}>
      <p style={{ ...klein, fontWeight: 600, color: 'var(--status-danger)' }}>Mislukt · {items.length}</p>
      <ul style={lijst}>
        {items.map((r) => {
          const { datum, tijd } = datumTijd(r.startOp)
          return (
            <li key={r.sleutel} style={{ ...rij, display: 'grid', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>
                {r.oudeTitel ? `${datum} · ${tijd} · ` : ''}{ACTIE_LABEL[r.actie]}
              </span>
              {r.oudeTitel ? <span style={{ fontSize: 13, color: 'var(--text-1)', overflowWrap: 'anywhere' }}>{r.oudeTitel}</span> : null}
              <span style={klein}>{r.reden ?? 'Onbekende reden.'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
