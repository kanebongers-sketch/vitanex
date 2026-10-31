'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { lidStatusLabel, type LidStatus } from '@/lib/club/kern/lid'
import { ACTIE_DATUMS, actiesVoor, pauzeStand, wijzigingVoorActie, type LidmaatschapActie, type VormKeuze } from '@/lib/club/leden/hub/lidmaatschap'
import { STATUS_CHIP } from '@/lib/club/leden/weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { stuur } from '../stuur'
import { vraagtOpzegReden, zonderToelichting, type OpzegReden } from '@/lib/club/behoud/opzegreden'
import { BEHOUD_DATA } from '@/lib/aiyourgym/taal/woorden/club/behoud-data'
import { OpzegRedenVeld } from './OpzegRedenVeld'

// Het lidmaatschap van een lid, op de kaart aan te passen: de vorm, de
// startdatum en de status met datums (pauzeren, opzeggen, stoppen). Wat een
// knop precies wijzigt, staat in wijzigingVoorActie (getest).

export interface LidmaatschapStand {
  status: LidStatus
  abonnement: string | null
  lidSinds: string | null
  einddatum: string | null
  pauze: { van: string | null; tot: string | null; bewaarbaar: boolean }
}

interface LidmaatschapBeheerProps {
  lidId: string
  stand: LidmaatschapStand
  vormen: VormKeuze[]
  vandaag: string
  /** Er loopt een verzoek tot verwijderen (AVG): de status blijft vast. */
  statusVast: boolean
}

type Melding = { soort: 'ok' | 'fout'; tekst: string } | null

function Datumveld({ label, waarde, onZet, min }: { label: string; waarde: string; onZet: (v: string) => void; min?: string }) {
  return (
    <label className="club-veld">
      <span>{label}</span>
      <input type="date" className="club-invoer" value={waarde} min={min} onChange={(e) => onZet(e.target.value)} />
    </label>
  )
}

export function LidmaatschapBeheer({ lidId, stand, vormen, vandaag, statusVast }: LidmaatschapBeheerProps) {
  const w = useTekst(LEDENKAART).lidmaatschap
  const wo = useTekst(BEHOUD_DATA).opzeg
  const taal = useTaal()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding>(null)
  const [actie, setActie] = useState<LidmaatschapActie | null>(null)
  const [van, setVan] = useState(vandaag)
  const [tot, setTot] = useState('')
  const [lidSinds, setLidSinds] = useState(stand.lidSinds ?? '')
  const [reden, setReden] = useState<OpzegReden | ''>('')
  const [toelichting, setToelichting] = useState('')
  const datum = (d: string) => formatDatum(d, taal, 'kort')

  async function bewaar(body: object): Promise<boolean> {
    setBezig(true)
    setMelding(null)
    const uit = await stuur(`/api/club/leden/${encodeURIComponent(lidId)}`, 'PATCH', body)
    setBezig(false)
    if (!uit.ok) {
      setMelding({ soort: 'fout', tekst: uit.fout })
      return false
    }
    const data = typeof uit.data === 'object' && uit.data !== null ? (uit.data as Record<string, unknown>) : {}
    const zonderPauze = data.pauzeNietOpgeslagen === true
    const zonderReden = data.redenNietOpgeslagen === true
    setMelding(zonderPauze || zonderReden ? { soort: 'fout', tekst: zonderPauze ? w.pauzeNietOpgeslagen : w.redenNietOpgeslagen } : { soort: 'ok', tekst: w.opgeslagen })
    startTransition(() => router.refresh())
    return true
  }

  function kies(a: LidmaatschapActie) {
    setActie(a)
    setMelding(null)
    setVan(a === 'activeren' ? stand.lidSinds ?? vandaag : vandaag)
    setTot(a === 'stoppen' ? vandaag : '')
    setReden('')
    setToelichting('')
  }

  async function voerUit(e: FormEvent) {
    e.preventDefault()
    if (!actie) return
    const uitslag = wijzigingVoorActie(actie, { van: van || null, tot: tot || null }, vandaag, stand.lidSinds)
    if (!uitslag.ok) return setMelding({ soort: 'fout', tekst: w.fout[uitslag.fout] })
    const metReden = uitslag.wijziging.status !== undefined && vraagtOpzegReden(stand.status, uitslag.wijziging.status)
    if (metReden && reden === '') return setMelding({ soort: 'fout', tekst: wo.verplicht })
    const opzegReden = metReden && reden !== '' ? { opzegReden: { reden, toelichting: zonderToelichting(reden) ? null : toelichting.trim() || null } } : {}
    // Zonder de pauzekolommen (migratie 464) gaan de pauzedatums niet mee; de rest wel.
    const { pauzeVan, pauzeTot, ...rest } = uitslag.wijziging
    const body = { ...(stand.pauze.bewaarbaar ? uitslag.wijziging : rest), ...opzegReden }
    if (!(await bewaar(body))) return
    setActie(null)
    if (!stand.pauze.bewaarbaar && actie === 'pauzeren' && (pauzeVan || pauzeTot)) setMelding({ soort: 'fout', tekst: w.pauzeNietOpgeslagen })
  }

  const pauze = pauzeStand(stand.status, stand.pauze, vandaag)
  const velden = actie ? ACTIE_DATUMS[actie] : []
  const vraagtReden = (actie === 'opzeggen' && vraagtOpzegReden(stand.status, 'opgezegd')) || (actie === 'stoppen' && vraagtOpzegReden(stand.status, 'gestopt'))
  return (
    <div className="club-lidhub-lidmaatschap">
      <dl className="club-lidhub-feiten">
        <div>
          <dt>{w.status}</dt>
          <dd><span className={`club-chip ${STATUS_CHIP[stand.status]}`}>{lidStatusLabel(stand.status, taal)}</span></dd>
        </div>
        <div>
          <dt>{w.einddatum}</dt>
          <dd className={stand.einddatum ? 'club-getal' : 'club-zacht'}>{stand.einddatum ? datum(stand.einddatum) : w.geenEinddatum}</dd>
        </div>
        {stand.status === 'gepauzeerd' && (
          <div>
            <dt>{w.pauze}</dt>
            <dd>
              {stand.pauze.van && stand.pauze.tot ? w.pauzeVanTot(datum(stand.pauze.van), datum(stand.pauze.tot)) : stand.pauze.van ? w.pauzeOpen(datum(stand.pauze.van)) : w.pauzeZonderDatum}
            </dd>
          </div>
        )}
      </dl>
      {pauze === 'gepland' && stand.pauze.van ? <p className="club-melding" role="status">{w.pauzeGepland(datum(stand.pauze.van))}</p> : null}
      {pauze === 'voorbij' && stand.pauze.tot ? <p className="club-melding club-melding--fout" role="status">{w.pauzeVoorbij(datum(stand.pauze.tot))}</p> : null}

      <div className="club-formrij">
        <label className="club-veld">
          <span>{w.vorm}</span>
          <select className="club-invoer" value={stand.abonnement ?? ''} disabled={bezig} onChange={(e) => void bewaar({ abonnement: e.target.value || null })}>
            <option value="">{w.geenVorm}</option>
            {vormen.map((v) => <option key={v.naam} value={v.naam}>{v.actief ? v.naam : `${v.naam} (${w.nietTeKoop})`}</option>)}
          </select>
        </label>
        <form className="club-lidhub-inline" onSubmit={(e) => { e.preventDefault(); void bewaar({ lidSinds: lidSinds || null }) }}>
          <Datumveld label={w.lidSinds} waarde={lidSinds} onZet={setLidSinds} />
          {lidSinds !== (stand.lidSinds ?? '') && <button type="submit" className="club-knop club-knop--klein" disabled={bezig}>{w.bevestig}</button>}
        </form>
      </div>

      <div className="club-lidhub-blok">
        <h3 className="club-leden-subkop">{w.acties}</h3>
        {statusVast ? (
          <p className="club-hint">{w.avgVast}</p>
        ) : (
          <div className="club-acties">
            {actiesVoor(stand.status).map((a) => (
              <button key={a} type="button" className="club-knop club-knop--klein" aria-pressed={actie === a} disabled={bezig} onClick={() => kies(a)}>
                {w.actie[a]}
              </button>
            ))}
          </div>
        )}
        {actie && !statusVast && (
          <form className="club-lidhub-actieform" onSubmit={voerUit}>
            {velden.length > 0 && (
              <div className="club-formrij">
                {velden.includes('van') && <Datumveld label={w.datumVan[actie]} waarde={van} onZet={setVan} />}
                {velden.includes('tot') && <Datumveld label={w.datumTot[actie]} waarde={tot} onZet={setTot} min={actie === 'opzeggen' ? vandaag : undefined} />}
              </div>
            )}
            {vraagtReden && <OpzegRedenVeld reden={reden} toelichting={toelichting} onReden={setReden} onToelichting={setToelichting} />}
            <div className="club-acties">
              <button type="submit" className="club-knop club-knop--primair club-knop--klein" disabled={bezig} aria-busy={bezig || undefined}>
                {bezig ? w.bezig : w.bevestig}
              </button>
              <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setActie(null)}>{w.annuleer}</button>
            </div>
          </form>
        )}
      </div>
      {melding && <p className={`club-melding ${melding.soort === 'ok' ? 'club-melding--ok' : 'club-melding--fout'}`} role="status">{melding.tekst}</p>}
      <p className="club-hint">{w.importHint}</p>
    </div>
  )
}
