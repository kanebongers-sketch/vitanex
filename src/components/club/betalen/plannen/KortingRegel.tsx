'use client'

import { useState } from 'react'
import { stuur } from '@/components/club/leden/stuur'
import { isDatum } from '@/lib/club/betalen/contract/datum'
import type { Korting } from '@/lib/club/betalen/plannen/model'
import { kortingWaardeTekst } from '@/lib/club/betalen/plannen/tekst'
import { datumTekst } from '@/lib/club/betalen/plannen/voorbeeld'
import { KortingFormulier, type PlanKeuze } from './KortingFormulier'

// Een korting in de lijst: de waarde groot, de code als bon, en in een rij voor
// welk plan, hoe lang, wanneer en hoe vaak. Wijzigen of verwijderen; is hij in
// gebruik, dan wordt hij uitgezet in plaats van verwijderd.

interface Props {
  korting: Korting
  plannen: readonly PlanKeuze[]
  onKlaar: (tekst: string, ok?: boolean) => void
}

function dag(d: string | null): string | null {
  return d && isDatum(d) ? datumTekst(d) : null
}

function kenmerken(k: Korting, plannen: readonly PlanKeuze[]): string[] {
  const van = dag(k.geldigVanaf)
  const tot = dag(k.geldigTot)
  return [
    k.planId ? (plannen.find((p) => p.id === k.planId)?.label ?? 'Een plan') : 'Alle plannen',
    k.duurTermijnen ? `${k.duurTermijnen} ${k.duurTermijnen === 1 ? 'termijn' : 'termijnen'}` : 'hele looptijd',
    van && tot ? `van ${van} tot en met ${tot}` : van ? `vanaf ${van}` : tot ? `tot en met ${tot}` : 'altijd geldig',
    k.maxGebruik ? `${k.gebruikt} van ${k.maxGebruik} keer gebruikt` : `${k.gebruikt} keer gebruikt`,
    k.vereistBewijs ? 'bewijs nodig' : null,
  ].filter((x): x is string => x !== null)
}

export function KortingRegel({ korting: k, plannen, onKlaar }: Props) {
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)

  async function verwijder() {
    setBezig(true)
    const uit = await stuur(`/api/club/betalen/kortingen/${k.id}`, 'DELETE')
    setBezig(false)
    setBevestig(false)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const weg = (uit.data as { uitkomst?: unknown } | null)?.uitkomst === 'weg'
    onKlaar(weg ? `${k.naam} is verwijderd.` : `${k.naam} is in gebruik en is daarom uitgezet.`)
  }

  if (bewerken) {
    return (
      <li className="club-lidm-regel is-bewerken">
        <KortingFormulier plannen={plannen} begin={k} onAnnuleer={() => setBewerken(false)} onKlaar={(t) => { setBewerken(false); onKlaar(t) }} />
      </li>
    )
  }

  return (
    <li className={`club-lidm-regel${k.actief ? '' : ' is-uit'}`} data-kleur={k.actief ? 'amber' : 'zand'}>
      <div className="club-lidm-inhoud">
        <h3 className="club-lidm-naam">
          {k.naam}
          {k.code && <span className="club-korting-code">{k.code}</span>}
          {!k.actief && <span className="club-chip club-chip--uit club-chip--geen">uit</span>}
        </h3>
        <ul className="club-lidm-regels" aria-label="Voorwaarden">
          {kenmerken(k, plannen).map((x) => <li key={x}>{x}</li>)}
        </ul>
      </div>
      <div className="club-lidm-rechts">
        <p className="club-korting-waarde">{kortingWaardeTekst(k)}</p>
        <div className="club-lidm-knoppen">
          {bevestig ? (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder()}>
                {bezig ? 'Bezig...' : 'Ja, verwijderen'}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(false)}>Nee</button>
            </>
          ) : (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={`${k.naam} wijzigen`}>Wijzigen</button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(true)} aria-label={`${k.naam} verwijderen`}>Verwijderen</button>
            </>
          )}
        </div>
        {bevestig && k.gebruikt > 0 && <p className="club-hint club-lidm-let">Deze korting is gebruikt: hij wordt uitgezet en blijft bewaard.</p>}
      </div>
    </li>
  )
}
