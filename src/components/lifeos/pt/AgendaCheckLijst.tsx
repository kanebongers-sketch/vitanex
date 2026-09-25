import Link from 'next/link'
import { ArrowRight, ScanSearch } from 'lucide-react'
import type { MogelijkeTypfout, OnbekendePtSessie } from '@/lib/lifeos/pt-klant/klantstatus'

// Presentational: afspraken in je agenda die niet kloppen met je klanten (zie
// `pt-klant/klantstatus`). Twee soorten, één sectie:
//   - mogelijke typfout ("Kevnin" → bedoel je Kevin?): die sessie telt nu niet mee
//     voor die klant — even verbeteren in je agenda;
//   - PT-sessie met iemand die niet in je CRM staat: onzichtbaar voor je planning
//     en signalen tot je 'm toevoegt.
// LifeOS vraagt, het past niets zelf aan. Niets te melden → niets.

const LIMIET = 5
const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

interface Props {
  onbekend: readonly OnbekendePtSessie[]
  typfouten: readonly MogelijkeTypfout[]
}

const RIJ = { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, padding: '4px 0' } as const
const TITEL = { color: 'var(--text-1)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const
const META = { color: 'var(--text-3)', whiteSpace: 'nowrap' } as const

export function AgendaCheckLijst({ onbekend, typfouten }: Props) {
  if (onbekend.length === 0 && typfouten.length === 0) return null
  const fouten = typfouten.slice(0, LIMIET)
  const onbekenden = onbekend.slice(0, Math.max(0, LIMIET - fouten.length))
  const rest = typfouten.length + onbekend.length - fouten.length - onbekenden.length

  return (
    <section
      aria-labelledby="pt-agendacheck-kop"
      style={{ display: 'grid', gap: 8, paddingTop: 14, borderTop: '1px solid var(--line)' }}
    >
      <h3
        id="pt-agendacheck-kop"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, margin: 0,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        <ScanSearch size={14} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
        Check je agenda
      </h3>
      <ul style={{ display: 'grid', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
        {fouten.map((t) => (
          <li key={`typ-${t.titel}`} style={RIJ}>
            <span style={TITEL}>
              “{t.titel}” <span style={{ color: 'var(--text-3)' }}>— bedoel je {t.bedoeld}?</span>
            </span>
            <span style={META}>{DAG.format(new Date(t.op))}</span>
          </li>
        ))}
        {onbekenden.map((o) => (
          <li key={`onb-${o.titel}`} style={RIJ}>
            <span style={TITEL}>
              {o.titel} <span style={{ color: 'var(--text-3)' }}>— niet in je CRM</span>
            </span>
            <span style={META}>
              {o.aantal > 1 ? <><span className="os-cijfer">{o.aantal}×</span> · </> : null}
              {DAG.format(new Date(o.laatsteOp))}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>en nog {rest}</p> : null}
      {onbekend.length > 0 ? (
        <Link
          href="/lifeos/mensen"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, justifySelf: 'start',
            fontSize: 12.5, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none',
          }}
        >
          Klant toevoegen in Mensen
          <ArrowRight size={13} strokeWidth={2.2} aria-hidden />
        </Link>
      ) : null}
    </section>
  )
}
