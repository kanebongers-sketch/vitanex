'use client'

import type { Lead } from '@/lib/club/leads/model'
import { LeadVelden, veldenUitFormulier } from './LeadVelden'
import type { Doe } from './usePaneel'

interface PaneelGegevensProps {
  lead: Lead
  medewerkers: { id: string; naam: string }[]
  bezig: boolean
  doe: Doe
}

// Gegevens bewerken, ingeklapt zodat het paneel rustig blijft. De key op de
// lead zorgt dat het formulier na een wijziging de nieuwe waarden toont.
export function PaneelGegevens({ lead, medewerkers, bezig, doe }: PaneelGegevensProps) {
  return (
    <details className="club-leads-blok club-leads-gegevens">
      <summary>
        <h3>Gegevens</h3>
        <span className="club-zacht">{lead.toestemmingContact ? 'Toestemming voor contact' : 'Geen toestemming voor contact'}</span>
      </summary>
      <form
        key={lead.bijgewerktOp}
        className="club-leads-formulier"
        onSubmit={(e) => {
          e.preventDefault()
          void doe(`/api/club/leads/${lead.id}`, 'PATCH', veldenUitFormulier(e.currentTarget))
        }}
      >
        <LeadVelden lead={lead} medewerkers={medewerkers} />
        <button type="submit" className="club-knop" disabled={bezig}>
          Gegevens opslaan
        </button>
      </form>
    </details>
  )
}
