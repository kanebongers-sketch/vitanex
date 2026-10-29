'use client'

import type { Lead, LeadStatus } from '@/lib/club/leads/model'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { opvolgStatus, toonDag, toonMoment } from '@/lib/club/leads/regels'

interface LeadsLijstProps {
  leads: Lead[]
  medewerkers: Map<string, string>
  vandaag: string
  onOpen: (id: string) => void
}

const STATUS_CHIP: Record<LeadStatus, string> = {
  nieuw: 'club-chip--info',
  contact: 'club-chip--uit',
  proefles: 'club-chip--merk',
  proefles_geweest: 'club-chip--merk',
  lid: 'club-chip--ok',
  verloren: 'club-chip--uit',
}

function Opvolgen({ lead, vandaag }: { lead: Lead; vandaag: string }) {
  const taal = useTaal()
  const t = useTekst(LEADS).lijst
  if (lead.status === 'proefles' && lead.proeflesOp) return <span>{t.proefles(toonMoment(lead.proeflesOp, taal))}</span>
  const stand = opvolgStatus(lead, vandaag)
  if (stand === 'geen' || !lead.opvolgenOp) return <span className="club-zacht">{t.geenOpvolging}</span>
  const dag = toonDag(lead.opvolgenOp.slice(0, 10), vandaag, taal)
  return <span className={stand === 'te_laat' ? 'club-leads-telaat' : undefined}>{stand === 'te_laat' ? t.teLaat(dag) : dag}</span>
}

// De lijstweergave: alle leads in een tabel, voor wie wil sorteren met de ogen
// of snel een naam zoekt (Ctrl+F). Klik op een naam voor het zijpaneel.
export function LeadsLijst({ leads, medewerkers, vandaag, onOpen }: LeadsLijstProps) {
  const taal = useTaal()
  const tekst = useTekst(LEADS)
  const t = tekst.lijst
  if (leads.length === 0) return <p className="club-leeg">{t.geen}</p>
  return (
    <div className="club-tabel-wrap">
      <table className="club-tabel">
        <caption className="club-sr">{tekst.werkvlak.alleLeads}</caption>
        <thead>
          <tr>
            <th scope="col">{t.naam}</th>
            <th scope="col">{t.status}</th>
            <th scope="col">{t.opvolgen}</th>
            <th scope="col">{t.bron}</th>
            <th scope="col">{t.interesse}</th>
            <th scope="col">{t.medewerker}</th>
            <th scope="col">{t.binnen}</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <button type="button" className="club-leads-naamknop" onClick={() => onOpen(lead.id)}>
                  {lead.naam}
                </button>
              </td>
              <td>
                <span className={`club-chip ${STATUS_CHIP[lead.status]}`}>{tekst.status[lead.status]}</span>
              </td>
              <td>
                <Opvolgen lead={lead} vandaag={vandaag} />
              </td>
              <td>{tekst.bron[lead.bron]}</td>
              <td className="club-zacht">{lead.interesse ?? ''}</td>
              <td>{lead.medewerkerId ? (medewerkers.get(lead.medewerkerId) ?? '') : <span className="club-zacht">{t.niemand}</span>}</td>
              <td className="club-getal club-zacht">{toonDag(lead.aangemaaktOp.slice(0, 10), vandaag, taal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
