import Link from 'next/link'
import { ArrowRight, UserPlus } from 'lucide-react'
import type { OnbekendePtSessie } from '@/lib/lifeos/pt-klant/klantstatus'

// Presentational: PT-sessies in je agenda met iemand die niet in je CRM staat
// (zie `pt-klant/klantstatus`). Zo'n klant is onzichtbaar voor je weekplanning en
// signalen tot je 'm toevoegt. Niemand → niets.

const LIMIET = 5
const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

export function OnbekendLijst({ onbekend }: { onbekend: readonly OnbekendePtSessie[] }) {
  if (onbekend.length === 0) return null
  const zichtbaar = onbekend.slice(0, LIMIET)
  const rest = onbekend.length - zichtbaar.length

  return (
    <section
      aria-labelledby="pt-onbekend-kop"
      style={{ display: 'grid', gap: 8, paddingTop: 14, borderTop: '1px solid var(--line)' }}
    >
      <h3
        id="pt-onbekend-kop"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, margin: 0,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        <UserPlus size={14} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
        Niet in je CRM
      </h3>
      <ul style={{ display: 'grid', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
        {zichtbaar.map((o) => (
          <li
            key={o.titel}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, padding: '4px 0' }}
          >
            <span style={{ color: 'var(--text-1)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {o.titel}
            </span>
            <span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
              {o.aantal > 1 ? <><span className="os-cijfer">{o.aantal}×</span> · </> : null}
              {DAG.format(new Date(o.laatsteOp))}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>en nog {rest}</p>
      ) : null}
      <Link
        href="/lifeos/mensen"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, justifySelf: 'start',
          fontSize: 12.5, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none',
        }}
      >
        Toevoegen in Mensen
        <ArrowRight size={13} strokeWidth={2.2} aria-hidden />
      </Link>
    </section>
  )
}
