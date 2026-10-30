'use client'

import { useState } from 'react'
import { LEAD_STATUSSEN, type Lead, type LeadStatus } from '@/lib/club/leads/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { LeadKaart } from './LeadKaart'

interface PijplijnProps {
  leads: Lead[]
  medewerkers: Map<string, string>
  vandaag: string
  nu: Date
  bezig: string | null
  onOpen: (id: string) => void
  onVerplaats: (lead: Lead, status: LeadStatus) => void
  /** Rollen v2, alleen zien: geen knoppen die iets wijzigen (kanBewerken). */
  alleenLezen?: boolean
}

// Zes kolommen, van eerste contact tot lid of verloren. Op de telefoon schuiven
// de kolommen horizontaal; op de pc staan ze naast elkaar over de volle breedte.
export function Pijplijn({ leads, medewerkers, vandaag, nu, bezig, onOpen, onVerplaats, alleenLezen = false }: PijplijnProps) {
  const [doel, setDoel] = useState<LeadStatus | null>(null)
  const tekst = useTekst(LEADS)

  function zetNeer(status: LeadStatus, id: string) {
    setDoel(null)
    if (alleenLezen) return
    const lead = leads.find((l) => l.id === id)
    if (lead) onVerplaats(lead, status)
  }

  return (
    <section className="club-leads-pijplijn" aria-label={tekst.pijplijn.label}>
      {LEAD_STATUSSEN.map((status) => {
        const inKolom = leads.filter((l) => l.status === status)
        const kopId = `kolom-${status}`
        return (
          <section
            key={status}
            className="club-leads-kolom"
            data-status={status}
            data-doel={doel === status || undefined}
            aria-labelledby={kopId}
            onDragOver={(e) => {
              e.preventDefault()
              if (doel !== status) setDoel(status)
            }}
            onDragLeave={(e) => {
              if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) setDoel(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              zetNeer(status, e.dataTransfer.getData('text/plain'))
            }}
          >
            <h3 id={kopId} className="club-leads-kolomkop">
              <span>{tekst.status[status]}</span>
              <span className="club-leads-aantal" aria-label={tekst.werkvlak.aantal(inKolom.length)}>
                {inKolom.length}
              </span>
            </h3>
            {inKolom.length === 0 ? (
              <p className="club-leads-kolomleeg">{tekst.pijplijn.leeg}</p>
            ) : (
              <div className="club-leads-kaarten">
                {inKolom.map((lead) => (
                  <LeadKaart
                    key={lead.id}
                    lead={lead}
                    medewerker={lead.medewerkerId ? (medewerkers.get(lead.medewerkerId) ?? null) : null}
                    vandaag={vandaag}
                    nu={nu}
                    isBezig={bezig === lead.id}
                    onOpen={onOpen}
                    onVerplaats={onVerplaats}
                    alleenLezen={alleenLezen}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </section>
  )
}
