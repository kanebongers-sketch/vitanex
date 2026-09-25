import Link from 'next/link'
import { ArrowRight, UserCheck } from 'lucide-react'
import type { PtStatusHint } from '@/lib/lifeos/pt-klant/klantstatus'

// Presentational: klanten die al trainen maar in je CRM nog als prospect staan
// (zie `pt-klant/klantstatus`). Zolang de status niet klopt, tellen ze niet mee in
// je weekplanning — daarom staat dit op dezelfde kaart. LifeOS stelt voor; jij
// past de status aan op het Mensen-bord. Niemand → niets.

const LIMIET = 5

export function StatusHintLijst({ hints }: { hints: readonly PtStatusHint[] }) {
  if (hints.length === 0) return null
  const zichtbaar = hints.slice(0, LIMIET)
  const rest = hints.length - zichtbaar.length

  return (
    <section
      aria-labelledby="pt-statushint-kop"
      style={{ display: 'grid', gap: 8, paddingTop: 14, borderTop: '1px solid var(--line)' }}
    >
      <h3
        id="pt-statushint-kop"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, margin: 0,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        <UserCheck size={14} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
        Traint al, staat als prospect
      </h3>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-3)' }}>
        Deze klanten tellen niet mee in je weekplanning tot je ze op Actieve klant zet.
      </p>
      <ul style={{ display: 'grid', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
        {zichtbaar.map((h) => (
          <li
            key={h.id}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, padding: '4px 0' }}
          >
            <span style={{ color: 'var(--text-1)' }}>{h.naam}</span>
            <span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
              <span className="os-cijfer">{h.sessies}×</span> · {h.statusLabel}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
          en nog {rest} {rest === 1 ? 'klant' : 'klanten'}
        </p>
      ) : null}
      <Link
        href="/lifeos/mensen"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, justifySelf: 'start',
          fontSize: 12.5, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none',
        }}
      >
        Status aanpassen in Mensen
        <ArrowRight size={13} strokeWidth={2.2} aria-hidden />
      </Link>
    </section>
  )
}
