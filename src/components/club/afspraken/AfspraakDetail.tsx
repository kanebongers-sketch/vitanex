'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Check, UserX, X } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import { GEBOEKT_DOOR_LABEL, STATUS_LABEL, type AfspraakStatus, type AfspraakWeergave } from '@/lib/club/afspraken/model'
import { volgendeStatussen } from '@/lib/club/afspraken/regels'
import { nlDatumTijd, tijdvak } from '@/lib/club/afspraken/weergave'
import { stuur } from '@/components/club/leden/stuur'
import { Verplaatsen } from './Verplaatsen'
import type { Persoon } from './AfspraakFormulier'
import { PtTegoed } from '@/components/club/betalen/PtTegoed'

// Een afspraak in het zijpaneel: wie, wat en wanneer, de status zetten,
// verplaatsen en de notitie bijwerken.

const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

const KNOP: Record<AfspraakStatus, { label: string; icoon: typeof Check; klasse: string }> = {
  gepland: { label: 'Terug naar gepland', icoon: CalendarClock, klasse: 'club-knop' },
  geweest: { label: 'Geweest', icoon: Check, klasse: 'club-knop club-knop--primair' },
  niet_gekomen: { label: 'Niet gekomen', icoon: UserX, klasse: 'club-knop' },
  geannuleerd: { label: 'Annuleren', icoon: X, klasse: 'club-knop club-knop--gevaar' },
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
    if (s === 'geannuleerd' && !window.confirm(`Afspraak met ${a.lidNaam} annuleren? Dit kan niet terug.`)) return
    void patch({ status: s }, `${a.lidNaam}: ${STATUS_LABEL[s].toLowerCase()}.`)
  }

  return (
    <div className="club-afspraken-detail" data-kleur={a.kleur}>
      <p className="club-boventitel">{a.typeNaam}</p>
      <h2 id={`${id}-kop`} className="club-afspraken-paneelkop">{a.lidNaam}</h2>
      <dl className="club-afspraken-feiten">
        <div><dt>Wanneer</dt><dd>{DAG.format(new Date(`${datum}T12:00:00Z`))}, {tijdvak(a)}</dd></div>
        <div><dt>Trainer</dt><dd>{trainerNaam}</dd></div>
        <div><dt>Status</dt><dd><span className={`club-chip club-afspraken-status--${a.status}`}>{STATUS_LABEL[a.status]}</span></dd></div>
        <div><dt>Geboekt via</dt><dd>{GEBOEKT_DOOR_LABEL[a.geboektDoor]}</dd></div>
      </dl>
      <Link className="club-afspraken-link" href={clubPad(`/leden/${a.lidId}`, vestiging)}>Naar de ledenkaart</Link>
      <PtTegoed afspraakId={a.id} typeNaam={a.typeNaam} />

      {opties.length > 0 ? (
        <div className="club-acties club-afspraken-detailacties" role="group" aria-label="Status zetten">
          {a.status === 'gepland' && !verplaats ? (
            <button type="button" className="club-knop club-knop--klein club-afspraken-verplaatsknop" onClick={() => setVerplaats(true)}>
              <CalendarClock size={15} aria-hidden /> Verplaatsen
            </button>
          ) : null}
          {opties.map((s) => {
            const k = KNOP[s]
            const Icoon = k.icoon
            return <button key={s} type="button" className={`${k.klasse} club-knop--klein`} data-status={s} disabled={bezig} onClick={() => zetStatus(s)}><Icoon size={15} aria-hidden /> {k.label}</button>
          })}
        </div>
      ) : (
        <p className="club-hint">Deze afspraak is geannuleerd. Maak een nieuwe afspraak als het lid toch wil komen.</p>
      )}

      {a.status === 'gepland' && verplaats ? (
        <Verplaatsen afspraak={a} vestiging={vestiging} trainers={trainers} vandaag={vandaag} bezig={bezig} onAnnuleer={() => setVerplaats(false)}
          onBevestig={(d, tijd, mw) => void patch({ datum: d, tijd, medewerkerId: mw }, `Afspraak verplaatst naar ${tijd}.`)} />
      ) : null}

      <label className="club-veld"><span>Notitie</span>
        <textarea className="club-invoer" rows={3} maxLength={1000} value={notitie} onChange={(e) => setNotitie(e.target.value)} />
      </label>
      {notitie !== (a.notitie ?? '') ? (
        <div className="club-acties">
          <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => void patch({ notitie }, 'Notitie opgeslagen.')}>Notitie opslaan</button>
        </div>
      ) : null}
      <div aria-live="assertive">{fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}</div>
    </div>
  )
}
