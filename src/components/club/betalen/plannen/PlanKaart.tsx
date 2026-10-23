'use client'

import { useState } from 'react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { isDatum } from '@/lib/club/betalen/contract/datum'
import { BTW_REGELS, BTW_SLEUTELS } from '@/lib/club/betalen/geld/btw-tarieven'
import { DOELGROEP_LABEL } from '@/lib/club/betalen/plannen/model'
import { euroTekst, prijsTekst } from '@/lib/club/betalen/plannen/tekst'
import { datumTekst, looptijdTekst, opzegTekst } from '@/lib/club/betalen/plannen/voorbeeld'
import type { PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import { PlanFormulier } from './PlanFormulier'
import { PlanVoorbeeld } from './PlanVoorbeeld'

// Een plan bij een lidmaatschapsvorm: prijs groot, het contract in een rij
// kenmerken, geplande prijswijzigingen, het voorbeeld van de eerste incasso en
// opzeggen, en wijzigen of verwijderen (met leden: uit de verkoop).

interface Props {
  plan: PlanWeergave
  vormId: string
  vandaag: string
  onKlaar: (tekst: string, ok?: boolean) => void
}

function kenmerken(p: PlanWeergave, vestiging: (s: string) => string): string[] {
  const btw = BTW_SLEUTELS.map((k) => BTW_REGELS[k]).find((r) => r.procent === p.nu.btwProcent)?.label ?? ''
  return [
    looptijdTekst(p.contractMaanden),
    p.contractMaanden ? (p.verlenging === 'geen' ? 'stopt vanzelf' : 'daarna maandelijks opzegbaar') : null,
    opzegTekst(p.opzegtermijnDagen),
    btw,
    p.proefDagen > 0 ? `${p.proefDagen} proefdagen` : null,
    p.inschrijfkostenCent > 0 ? `${euroTekst(p.inschrijfkostenCent)} inschrijfkosten` : null,
    p.factuurDag ? `factuur op de ${p.factuurDag}e` : null,
    p.doelgroep !== 'iedereen' ? DOELGROEP_LABEL[p.doelgroep] : null,
    p.vereistBewijs ? 'bewijs nodig' : null,
    p.vestigingen ? p.vestigingen.map(vestiging).join(', ') : null,
  ].filter((x): x is string => x !== null && x !== '')
}

export function PlanKaart({ plan: p, vormId, vandaag, onKlaar }: Props) {
  const vestigingen = useVestigingen()
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)

  async function verwijder() {
    setBezig(true)
    const uit = await stuur(`/api/club/betalen/plannen/${p.id}`, 'DELETE')
    setBezig(false)
    setBevestig(false)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const weg = (uit.data as { uitkomst?: unknown } | null)?.uitkomst === 'weg'
    onKlaar(weg ? `${p.naam} is verwijderd.` : `${p.naam} heeft leden en is daarom uit de verkoop gehaald. Bestaande leden houden hun contract.`)
  }

  async function trekIn(vanaf: string) {
    const uit = await stuur(`/api/club/betalen/plannen/${p.id}/prijzen?vanaf=${encodeURIComponent(vanaf)}`, 'DELETE')
    onKlaar(uit.ok ? 'De geplande prijswijziging is ingetrokken.' : uit.fout, uit.ok)
  }

  if (bewerken) {
    return (
      <li className="club-plan is-bewerken">
        <PlanFormulier vormId={vormId} vandaag={vandaag} begin={p} onAnnuleer={() => setBewerken(false)} onKlaar={(t) => { setBewerken(false); onKlaar(t) }} />
      </li>
    )
  }

  return (
    <li className={`club-plan${p.actief ? '' : ' is-uit'}`}>
      <div className="club-plan-kop">
        <h4 className="club-plan-naam">
          {p.naam}
          {!p.actief && <span className="club-chip club-chip--uit club-chip--geen">niet te koop</span>}
        </h4>
        <p className="club-plan-prijs">{prijsTekst(p.nu.bedragCent, p.interval)}</p>
        <p className="club-plan-leden">{p.contracten === 0 ? 'Nog geen leden' : `${p.contracten} ${p.contracten === 1 ? 'contract' : 'contracten'}`}</p>
      </div>
      <ul className="club-lidm-regels" aria-label="Contract">
        {kenmerken(p, (s) => naamVan(vestigingen, s)).map((k) => <li key={k}>{k}</li>)}
      </ul>
      {p.komend.length > 0 && (
        <ul className="club-plan-komend" aria-label="Geplande prijswijzigingen">
          {p.komend.map((v) => (
            <li key={v.id}>
              <span>
                Nieuwe leden betalen vanaf {isDatum(v.geldigVanaf) ? datumTekst(v.geldigVanaf) : v.geldigVanaf} {prijsTekst(v.bedragCent, p.interval)}. Bestaande
                leden houden hun prijs tot je een wijziging aankondigt.
              </span>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => void trekIn(v.geldigVanaf)}>Intrekken</button>
            </li>
          ))}
        </ul>
      )}
      <PlanVoorbeeld plan={{ ...p, bedragCent: p.nu.bedragCent, btwProcent: p.nu.btwProcent }} vandaag={vandaag} />
      <div className="club-lidm-knoppen club-plan-knoppen">
        {bevestig ? (
          <>
            <span className="club-hint">{p.contracten > 0 ? 'Dit plan heeft leden: het gaat uit de verkoop, contracten blijven.' : 'Het plan verdwijnt helemaal.'}</span>
            <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder()}>
              {bezig ? 'Bezig...' : p.contracten > 0 ? 'Ja, uit de verkoop' : 'Ja, verwijderen'}
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(false)}>Nee</button>
          </>
        ) : (
          <>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={`${p.naam} wijzigen`}>Wijzigen</button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(true)} aria-label={`${p.naam} verwijderen`}>Verwijderen</button>
          </>
        )}
      </div>
    </li>
  )
}
