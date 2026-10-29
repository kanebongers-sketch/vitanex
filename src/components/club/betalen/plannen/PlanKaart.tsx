'use client'

import { useState } from 'react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { isDatum } from '@/lib/club/betalen/contract/datum'
import { BTW_REGELS, BTW_SLEUTELS } from '@/lib/club/betalen/geld/btw-tarieven'
import { euroTekst, prijsTekst } from '@/lib/club/betalen/plannen/tekst'
import { datumTekst, looptijdTekst, opzegTekst } from '@/lib/club/betalen/plannen/voorbeeld'
import type { PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import { PlanFormulier } from './PlanFormulier'
import { PlanVoorbeeld } from './PlanVoorbeeld'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { BetalenTekst } from '@/lib/aiyourgym/taal/woorden/club/betalen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Een plan bij een lidmaatschapsvorm: prijs groot, het contract in een rij
// kenmerken, geplande prijswijzigingen, het voorbeeld van de eerste incasso en
// opzeggen, en wijzigen of verwijderen (met leden: uit de verkoop).

interface Props {
  plan: PlanWeergave
  vormId: string
  vandaag: string
  onKlaar: (tekst: string, ok?: boolean) => void
}

function kenmerken(p: PlanWeergave, vestiging: (s: string) => string, tb: BetalenTekst, taal: Taal): string[] {
  const t = tb.kaart
  const sleutel = BTW_SLEUTELS.find((k) => BTW_REGELS[k].procent === p.nu.btwProcent)
  const btw = sleutel ? tb.btw[sleutel].label : ''
  return [
    looptijdTekst(p.contractMaanden, taal),
    p.contractMaanden ? (p.verlenging === 'geen' ? t.stoptVanzelf : t.daarna) : null,
    opzegTekst(p.opzegtermijnDagen, taal),
    btw,
    p.proefDagen > 0 ? t.proefdagen(p.proefDagen) : null,
    p.inschrijfkostenCent > 0 ? t.inschrijfkosten(euroTekst(p.inschrijfkostenCent, taal)) : null,
    p.factuurDag ? t.factuur(p.factuurDag) : null,
    p.doelgroep !== 'iedereen' ? tb.doelgroep[p.doelgroep] : null,
    p.vereistBewijs ? t.bewijs : null,
    p.vestigingen ? p.vestigingen.map(vestiging).join(', ') : null,
  ].filter((x): x is string => x !== null && x !== '')
}

export function PlanKaart({ plan: p, vormId, vandaag, onKlaar }: Props) {
  const vestigingen = useVestigingen()
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)
  const taal = useTaal()
  const tb = useTekst(BETALEN)
  const t = tb.kaart

  async function verwijder() {
    setBezig(true)
    const uit = await stuur(`/api/club/betalen/plannen/${p.id}`, 'DELETE')
    setBezig(false)
    setBevestig(false)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const weg = (uit.data as { uitkomst?: unknown } | null)?.uitkomst === 'weg'
    onKlaar(weg ? t.verwijderd(p.naam) : t.uitVerkoop(p.naam))
  }

  async function trekIn(vanaf: string) {
    const uit = await stuur(`/api/club/betalen/plannen/${p.id}/prijzen?vanaf=${encodeURIComponent(vanaf)}`, 'DELETE')
    onKlaar(uit.ok ? t.ingetrokken : uit.fout, uit.ok)
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
          {!p.actief && <span className="club-chip club-chip--uit club-chip--geen">{t.nietTeKoop}</span>}
        </h4>
        <p className="club-plan-prijs">{prijsTekst(p.nu.bedragCent, p.interval, taal)}</p>
        <p className="club-plan-leden">{p.contracten === 0 ? t.geenLeden : t.contracten(p.contracten)}</p>
      </div>
      <ul className="club-lidm-regels" aria-label={t.contract}>
        {kenmerken(p, (s) => naamVan(vestigingen, s), tb, taal).map((k) => <li key={k}>{k}</li>)}
      </ul>
      {p.komend.length > 0 && (
        <ul className="club-plan-komend" aria-label={t.gepland}>
          {p.komend.map((v) => (
            <li key={v.id}>
              <span>{t.nieuwePrijs(isDatum(v.geldigVanaf) ? datumTekst(v.geldigVanaf, taal) : v.geldigVanaf, prijsTekst(v.bedragCent, p.interval, taal))}</span>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => void trekIn(v.geldigVanaf)}>{t.intrekken}</button>
            </li>
          ))}
        </ul>
      )}
      <PlanVoorbeeld plan={{ ...p, bedragCent: p.nu.bedragCent, btwProcent: p.nu.btwProcent }} vandaag={vandaag} />
      <div className="club-lidm-knoppen club-plan-knoppen">
        {bevestig ? (
          <>
            <span className="club-hint">{p.contracten > 0 ? t.metLeden : t.helemaal}</span>
            <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder()}>
              {bezig ? t.bezig : p.contracten > 0 ? t.jaUitVerkoop : t.jaVerwijderen}
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(false)}>{t.nee}</button>
          </>
        ) : (
          <>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={t.wijzigLabel(p.naam)}>{t.wijzigen}</button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(true)} aria-label={t.verwijderLabel(p.naam)}>{t.verwijderen}</button>
          </>
        )}
      </div>
    </li>
  )
}
