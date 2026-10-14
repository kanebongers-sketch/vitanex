'use client'

import { LEAD_BRON_LABEL, LEAD_STATUS_LABEL, type Lead, type LeadStatus } from '@/lib/club/leads/model'
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
  if (lead.status === 'proefles' && lead.proeflesOp) return <span>Proefles {toonMoment(lead.proeflesOp)}</span>
  const stand = opvolgStatus(lead, vandaag)
  if (stand === 'geen' || !lead.opvolgenOp) return <span className="club-zacht">Geen</span>
  const dag = toonDag(lead.opvolgenOp.slice(0, 10), vandaag)
  return <span className={stand === 'te_laat' ? 'club-leads-telaat' : undefined}>{stand === 'te_laat' ? `Te laat, ${dag}` : dag}</span>
}

// De lijstweergave: alle leads in een tabel, voor wie wil sorteren met de ogen
// of snel een naam zoekt (Ctrl+F). Klik op een naam voor het zijpaneel.
export function LeadsLijst({ leads, medewerkers, vandaag, onOpen }: LeadsLijstProps) {
  if (leads.length === 0) return <p className="club-leeg">Geen leads met deze filters.</p>
  return (
    <div className="club-tabel-wrap">
      <table className="club-tabel">
        <caption className="club-sr">Alle leads</caption>
        <thead>
          <tr>
            <th scope="col">Naam</th>
            <th scope="col">Status</th>
            <th scope="col">Opvolgen</th>
            <th scope="col">Bron</th>
            <th scope="col">Interesse</th>
            <th scope="col">Medewerker</th>
            <th scope="col">Binnen</th>
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
                <span className={`club-chip ${STATUS_CHIP[lead.status]}`}>{LEAD_STATUS_LABEL[lead.status]}</span>
              </td>
              <td>
                <Opvolgen lead={lead} vandaag={vandaag} />
              </td>
              <td>{LEAD_BRON_LABEL[lead.bron]}</td>
              <td className="club-zacht">{lead.interesse ?? ''}</td>
              <td>{lead.medewerkerId ? (medewerkers.get(lead.medewerkerId) ?? '') : <span className="club-zacht">Niemand</span>}</td>
              <td className="club-getal club-zacht">{toonDag(lead.aangemaaktOp.slice(0, 10), vandaag)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
