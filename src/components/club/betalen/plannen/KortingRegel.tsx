'use client'

import { useState } from 'react'
import { stuur } from '@/components/club/leden/stuur'
import { isDatum } from '@/lib/club/betalen/contract/datum'
import type { Korting } from '@/lib/club/betalen/plannen/model'
import { kortingWaardeTekst } from '@/lib/club/betalen/plannen/tekst'
import { datumTekst } from '@/lib/club/betalen/plannen/voorbeeld'
import { KortingFormulier, type PlanKeuze } from './KortingFormulier'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { BetalenTekst } from '@/lib/aiyourgym/taal/woorden/club/betalen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Een korting in de lijst: de waarde groot, de code als bon, en in een rij voor
// welk plan, hoe lang, wanneer en hoe vaak. Wijzigen of verwijderen; is hij in
// gebruik, dan wordt hij uitgezet in plaats van verwijderd.

interface Props {
  korting: Korting
  plannen: readonly PlanKeuze[]
  onKlaar: (tekst: string, ok?: boolean) => void
}

function dag(d: string | null, taal: Taal): string | null {
  return d && isDatum(d) ? datumTekst(d, taal) : null
}

function kenmerken(k: Korting, plannen: readonly PlanKeuze[], t: BetalenTekst['kortingRegel'], taal: Taal): string[] {
  const van = dag(k.geldigVanaf, taal)
  const tot = dag(k.geldigTot, taal)
  return [
    k.planId ? (plannen.find((p) => p.id === k.planId)?.label ?? t.eenPlan) : t.allePlannen,
    k.duurTermijnen ? t.termijnen(k.duurTermijnen) : t.heleLooptijd,
    van && tot ? t.vanTot(van, tot) : van ? t.vanaf(van) : tot ? t.tot(tot) : t.altijd,
    k.maxGebruik ? t.gebruiktVan(k.gebruikt, k.maxGebruik) : t.gebruikt(k.gebruikt),
    k.vereistBewijs ? t.bewijs : null,
  ].filter((x): x is string => x !== null)
}

export function KortingRegel({ korting: k, plannen, onKlaar }: Props) {
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)
  const taal = useTaal()
  const t = useTekst(BETALEN).kortingRegel

  async function verwijder() {
    setBezig(true)
    const uit = await stuur(`/api/club/betalen/kortingen/${k.id}`, 'DELETE')
    setBezig(false)
    setBevestig(false)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const weg = (uit.data as { uitkomst?: unknown } | null)?.uitkomst === 'weg'
    onKlaar(weg ? t.verwijderd(k.naam) : t.uitgezet(k.naam))
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
          {!k.actief && <span className="club-chip club-chip--uit club-chip--geen">{t.uit}</span>}
        </h3>
        <ul className="club-lidm-regels" aria-label={t.voorwaarden}>
          {kenmerken(k, plannen, t, taal).map((x) => <li key={x}>{x}</li>)}
        </ul>
      </div>
      <div className="club-lidm-rechts">
        <p className="club-korting-waarde">{kortingWaardeTekst(k, taal)}</p>
        <div className="club-lidm-knoppen">
          {bevestig ? (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder()}>
                {bezig ? t.bezig : t.jaVerwijderen}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(false)}>{t.nee}</button>
            </>
          ) : (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={t.wijzigLabel(k.naam)}>{t.wijzigen}</button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(true)} aria-label={t.verwijderLabel(k.naam)}>{t.verwijderen}</button>
            </>
          )}
        </div>
        {bevestig && k.gebruikt > 0 && <p className="club-hint club-lidm-let">{t.inGebruik}</p>}
      </div>
    </li>
  )
}
