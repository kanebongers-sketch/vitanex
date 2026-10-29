'use client'

import { useMemo } from 'react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { Lead } from '@/lib/club/leads/model'
import type { ProeflesLes } from '@/lib/club/leads/lessen'
import type { VandaagItem } from '@/lib/club/leads/regels'
import type { Weergave } from '@/lib/club/leads/filters'
import { LeadPaneel } from './LeadPaneel'
import { LeadsLijst } from './LeadsLijst'
import { NieuweLead } from './NieuweLead'
import { Pijplijn } from './Pijplijn'
import { VandaagLijst } from './VandaagLijst'
import { useLeadsActies } from './useLeadsActies'
import type { PaneelStap } from '@/lib/club/leads/model'

interface LeadsWerkvlakProps {
  vestiging: Vestiging
  leads: Lead[]
  vandaag: VandaagItem[]
  medewerkers: { id: string; naam: string }[]
  lessen: ProeflesLes[]
  weergave: Weergave
  /** De huidige filterparameters, om bij het openen van een paneel te bewaren. */
  zoek: Record<string, string>
  vandaagDag: string
  nuIso: string
  paneel: { leadId: string | null; stap: PaneelStap | null; nieuw: boolean }
  /** Kane, eigenaar of clubmanager: mag een lead wissen (AVG). */
  magWissen: boolean
}

// Het interactieve deel van de leadspagina: vandaag, de pijplijn of de lijst,
// en het zijpaneel. Data komt van de server; dit eiland stuurt alleen acties.
export function LeadsWerkvlak(props: LeadsWerkvlakProps) {
  const { vestiging, leads, vandaag, medewerkers, lessen, weergave, zoek, vandaagDag, nuIso, paneel, magWissen } = props
  const acties = useLeadsActies(vestiging, zoek)
  const t = useTekst(LEADS).werkvlak
  const namen = useMemo(() => new Map(medewerkers.map((m) => [m.id, m.naam])), [medewerkers])
  const nu = useMemo(() => new Date(nuIso), [nuIso])

  return (
    <>
      {acties.fout && (
        <div className="club-melding club-melding--fout club-leads-fout" role="alert">
          <span>{acties.fout}</span>
          <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={acties.wisFout}>
            {t.sluiten}
          </button>
        </div>
      )}
      <VandaagLijst items={vandaag} vandaag={vandaagDag} bezig={acties.bezig} onOpen={acties.open} onGedaan={acties.gedaan} onUitkomst={acties.uitkomst} />
      <section aria-labelledby="leads-alle-kop" className="club-leads-alle">
        <div className="club-sectiekop">
          <h2 id="leads-alle-kop">{weergave === 'lijst' ? t.alleLeads : t.pijplijn}</h2>
          <span>{t.aantal(leads.length)}</span>
        </div>
        {weergave === 'lijst' ? (
          <LeadsLijst leads={leads} medewerkers={namen} vandaag={vandaagDag} onOpen={acties.open} />
        ) : (
          <Pijplijn leads={leads} medewerkers={namen} vandaag={vandaagDag} nu={nu} bezig={acties.bezig} onOpen={acties.open} onVerplaats={acties.verplaats} />
        )}
      </section>
      {paneel.nieuw && (
        <NieuweLead vestiging={vestiging} medewerkers={medewerkers} vandaag={vandaagDag} onSluit={acties.sluit} onAangemaakt={(id) => acties.open(id)} />
      )}
      {!paneel.nieuw && paneel.leadId && (
        <LeadPaneel
          key={`${paneel.leadId}-${paneel.stap ?? ''}`}
          leadId={paneel.leadId}
          vestiging={vestiging}
          stap={paneel.stap}
          medewerkers={medewerkers}
          lessen={lessen}
          vandaag={vandaagDag}
          nuIso={nuIso}
          magWissen={magWissen}
          onSluit={acties.sluit}
        />
      )}
    </>
  )
}
