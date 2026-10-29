'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Check, UserX, X } from 'lucide-react'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import type { AfspraakStatus, AfspraakWeergave } from '@/lib/club/afspraken/model'
import { volgendeStatussen } from '@/lib/club/afspraken/regels'
import { nlDatumTijd, tijdvak } from '@/lib/club/afspraken/weergave'
import { stuur } from '@/components/club/leden/stuur'
import { Verplaatsen } from './Verplaatsen'
import type { Persoon } from './AfspraakFormulier'
import { PtTegoed } from '@/components/club/betalen/PtTegoed'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'

// Een afspraak in het zijpaneel: wie, wat en wanneer, de status zetten,
// verplaatsen en de notitie bijwerken.

const KNOP: Record<AfspraakStatus, { label: 'terugGepland' | 'geweest' | 'nietGekomen' | 'annuleren'; icoon: typeof Check; klasse: string }> = {
  gepland: { label: 'terugGepland', icoon: CalendarClock, klasse: 'club-knop' },
  geweest: { label: 'geweest', icoon: Check, klasse: 'club-knop club-knop--primair' },
  niet_gekomen: { label: 'nietGekomen', icoon: UserX, klasse: 'club-knop' },
  geannuleerd: { label: 'annuleren', icoon: X, klasse: 'club-knop club-knop--gevaar' },
}

interface Props {
  afspraak: AfspraakWeergave
  vestiging: string
  trainerNaam: string
  /** Wie dit type mag geven, voor verplaatsen. */
  trainers: readonly Persoon[]
  vandaag: string
  onKlaar: (melding: string) => void
}

export function AfspraakDetail({ afspraak: a, vestiging, trainerNaam, trainers, vandaag, onKlaar }: Props) {
  const id = useId()
  const taal = useTaal()
  const t = useTekst(AFSPRAKEN)
  const td = t.detail
  const [notitie, setNotitie] = useState(a.notitie ?? '')
  const [verplaats, setVerplaats] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const opties = volgendeStatussen(a, new Date())
  const datum = nlDatumTijd(a.start).datum

  async function patch(body: Record<string, unknown>, melding: string) {
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/afspraken/${a.id}`, 'PATCH', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onKlaar(melding)
  }

  function zetStatus(s: AfspraakStatus) {
    if (s === 'geannuleerd' && !window.confirm(td.annulerenVraag(a.lidNaam))) return
    void patch({ status: s }, td.statusGezet(a.lidNaam, t.status[s].toLowerCase()))
  }

  return (
    <div className="club-afspraken-detail" data-kleur={a.kleur}>
      <p className="club-boventitel">{a.typeNaam}</p>
      <h2 id={`${id}-kop`} className="club-afspraken-paneelkop">{a.lidNaam}</h2>
      <dl className="club-afspraken-feiten">
        <div><dt>{td.wanneer}</dt><dd>{formatDatum(`${datum}T12:00:00Z`, taal, 'dag')}, {tijdvak(a, taal)}</dd></div>
        <div><dt>{td.trainer}</dt><dd>{trainerNaam}</dd></div>
        <div><dt>{td.status}</dt><dd><span className={`club-chip club-afspraken-status--${a.status}`}>{t.status[a.status]}</span></dd></div>
        <div><dt>{td.geboektVia}</dt><dd>{t.geboektDoor[a.geboektDoor]}</dd></div>
      </dl>
      <Link className="club-afspraken-link" href={lidKaartPad(a.lidId, vestiging, 'planning')}>{td.naarLedenkaart}</Link>
      <PtTegoed afspraakId={a.id} typeNaam={a.typeNaam} />

      {opties.length > 0 ? (
        <div className="club-acties club-afspraken-detailacties" role="group" aria-label={td.statusZetten}>
          {a.status === 'gepland' && !verplaats ? (
            <button type="button" className="club-knop club-knop--klein club-afspraken-verplaatsknop" onClick={() => setVerplaats(true)}>
              <CalendarClock size={15} aria-hidden /> {td.verplaatsen}
            </button>
          ) : null}
          {opties.map((s) => {
            const k = KNOP[s]
            const Icoon = k.icoon
            return <button key={s} type="button" className={`${k.klasse} club-knop--klein`} data-status={s} disabled={bezig} onClick={() => zetStatus(s)}><Icoon size={15} aria-hidden /> {td[k.label]}</button>
          })}
        </div>
      ) : (
        <p className="club-hint">{td.geannuleerd}</p>
      )}

      {a.status === 'gepland' && verplaats ? (
        <Verplaatsen afspraak={a} vestiging={vestiging} trainers={trainers} vandaag={vandaag} bezig={bezig} onAnnuleer={() => setVerplaats(false)}
          onBevestig={(d, tijd, mw) => void patch({ datum: d, tijd, medewerkerId: mw }, td.verplaatst(tijd))} />
      ) : null}

      <label className="club-veld"><span>{td.notitie}</span>
        <textarea className="club-invoer" rows={3} maxLength={1000} value={notitie} onChange={(e) => setNotitie(e.target.value)} />
      </label>
      {notitie !== (a.notitie ?? '') ? (
        <div className="club-acties">
          <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => void patch({ notitie }, td.notitieOpgeslagen)}>{td.notitieOpslaan}</button>
        </div>
      ) : null}
      <div aria-live="assertive">{fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}</div>
    </div>
  )
}
