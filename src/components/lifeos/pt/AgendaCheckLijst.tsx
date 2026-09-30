'use client'

import { ScanSearch, UserPlus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import type { MogelijkeTypfout, OnbekendePtSessie } from '@/lib/lifeos/pt-klant/klantstatus'
import { useBevestig, type Schrijf } from './useBevestig'
import { KOP, LIJST, RIJ, SECTIE } from './lijstStijl'

// Afspraken in je agenda die niet kloppen met je CRM (zie `pt-klant/klantstatus`),
// elk met één tik op te lossen:
//   - mogelijke typfout ("Kevnin" → Kevin?): "Verbeter" hernoemt de afspraak(en)
//     in je Google Agenda, zodat de sessie weer meetelt;
//   - PT-sessie met iemand buiten je CRM: voeg toe als PT-klant of PT-team — jij
//     kiest, want uit de titel valt niet te lezen of iemand klant of trainer is.
// LifeOS doet niets zonder jouw tik. Niets te melden → niets.

const LIMIET = 5
const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })
const TITEL = { color: 'var(--text-1)', minWidth: 0, overflowWrap: 'anywhere' } as const
const META = { color: 'var(--text-3)' } as const

interface Props {
  onbekend: readonly OnbekendePtSessie[]
  typfouten: readonly MogelijkeTypfout[]
  onGewijzigd: () => Promise<void>
}

function hernoemen(t: MogelijkeTypfout): Schrijf[] {
  return t.eventIds.map((id) => ({ pad: `/api/lifeos/agenda/events/${encodeURIComponent(id)}`, methode: 'PATCH', body: { titel: t.nieuweTitel } }))
}

function toevoegen(naam: string, groep: 'pt_klant' | 'pt_team'): Schrijf[] {
  const status = groep === 'pt_klant' ? 'actieve_klant' : 'actief'
  return [{ pad: '/api/lifeos/crm/personen', methode: 'POST', body: { naam, groep, status } }]
}

export function AgendaCheckLijst({ onbekend, typfouten, onGewijzigd }: Props) {
  const { bezig, fout, voerUit } = useBevestig(onGewijzigd)
  if (onbekend.length === 0 && typfouten.length === 0) return null
  const fouten = typfouten.slice(0, LIMIET)
  const onbekenden = onbekend.slice(0, Math.max(0, LIMIET - fouten.length))
  const rest = typfouten.length + onbekend.length - fouten.length - onbekenden.length
  const uit = bezig !== null

  return (
    <section aria-labelledby="pt-agendacheck-kop" style={SECTIE}>
      <h3 id="pt-agendacheck-kop" style={KOP}>
        <ScanSearch size={14} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
        Check je agenda
      </h3>
      <ul style={LIJST}>
        {fouten.map((t) => {
          const kan = t.eventIds.length > 0 && t.nieuweTitel !== t.titel
          const sleutel = `typ-${t.titel}`
          return (
            <li key={sleutel} style={RIJ}>
              <span style={TITEL}>
                “{t.titel}” <span style={META}>· {DAG.format(new Date(t.op))} — bedoel je {t.bedoeld}?</span>
              </span>
              {kan ? (
                <Knop disabled={uit} onClick={() => void voerUit(sleutel, hernoemen(t))} aria-label={`Hernoem naar ${t.nieuweTitel}`}>
                  {bezig === sleutel ? 'Bezig…' : `Verbeter → “${t.nieuweTitel}”`}
                </Knop>
              ) : null}
            </li>
          )
        })}
        {onbekenden.map((o) => {
          const sleutel = `onb-${o.titel}`
          return (
            <li key={sleutel} style={RIJ}>
              <span style={TITEL}>
                {o.titel}{' '}
                <span style={META}>
                  · {o.aantal > 1 ? <><span className="os-cijfer">{o.aantal}×</span>, </> : null}
                  laatst {DAG.format(new Date(o.laatsteOp))} — niet in je CRM
                </span>
              </span>
              {o.naam ? (
                <span style={{ display: 'flex', gap: 6 }}>
                  <Knop disabled={uit} onClick={() => void voerUit(`${sleutel}-k`, toevoegen(o.naam, 'pt_klant'))} aria-label={`Voeg ${o.naam} toe als PT-klant`}>
                    <UserPlus size={13} strokeWidth={2.2} aria-hidden />
                    {bezig === `${sleutel}-k` ? 'Bezig…' : 'PT-klant'}
                  </Knop>
                  <Knop disabled={uit} onClick={() => void voerUit(`${sleutel}-t`, toevoegen(o.naam, 'pt_team'))} aria-label={`Voeg ${o.naam} toe aan het PT-team`}>
                    <UserPlus size={13} strokeWidth={2.2} aria-hidden />
                    {bezig === `${sleutel}-t` ? 'Bezig…' : 'PT-team'}
                  </Knop>
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
      {rest > 0 ? <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>en nog {rest}</p> : null}
      {fout ? <Foutmelding bericht={fout} /> : null}
    </section>
  )
}
