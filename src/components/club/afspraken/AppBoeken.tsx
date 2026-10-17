'use client'

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { nlDelen, plusDagen } from '@/lib/club/rooster/tijd'
import { stuur } from '@/components/club/leden/stuur'
import { VrijeTijden, slotSleutel, useVrijeTijden } from './VrijeTijden'
import type { SlotOptie } from './haal'
import type { AppType } from './app-data'

// "Afspraak maken" in de ledenapp, in vier stappen: soort, trainer (of maakt
// niet uit), dag en tijd, en dan bevestigen. Alleen echt vrije tijden binnen
// de regels van de sportschool staan erbij.

const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', timeZone: 'UTC' })
const DAG_NR = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const DAG_LANG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const opDag = (d: string) => new Date(`${d}T12:00:00Z`)
const ZICHTBARE_DAGEN = 14

interface Props {
  lidId: string
  typen: readonly AppType[]
  horizonDagen: number
  onGeboekt: (melding: string) => void
  onTerug: () => void
}

export function AppBoeken({ lidId, typen, horizonDagen, onGeboekt, onTerug }: Props) {
  const vandaag = nlDelen(new Date()).datum
  const dagen = Array.from({ length: Math.min(ZICHTBARE_DAGEN, horizonDagen) }, (_, i) => plusDagen(vandaag, i))
  const [type, setType] = useState<AppType | null>(typen.length === 1 ? typen[0] : null)
  const [trainer, setTrainer] = useState<string>('')
  const [datum, setDatum] = useState(dagen[0])
  const [slot, setSlot] = useState<SlotOptie | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  const url = type ? `/api/club/afspraken/app/sloten?${new URLSearchParams({ lid: lidId, type: type.id, datum, medewerker: trainer })}` : null
  const tijden = useVrijeTijden(url)

  async function bevestig() {
    if (!type || !slot || bezig) return
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/afspraken/app', 'POST', { lidId, typeId: type.id, medewerkerId: trainer || null, datum, tijd: slot.tijd })
    setBezig(false)
    if (!uit.ok) {
      setSlot(null)
      return setFout(uit.fout)
    }
    onGeboekt(`${type.naam} geboekt op ${DAG_LANG.format(opDag(datum))} om ${slot.tijd}.`)
  }

  if (!type) {
    return (
      <section className="club-afspraken-app-stap" aria-labelledby="afs-app-soort">
        <button type="button" className="club-afspraken-app-terug" onClick={onTerug}><ChevronLeft size={16} aria-hidden /> Terug</button>
        <h3 id="afs-app-soort" className="club-afspraken-app-kop">Wat wil je plannen?</h3>
        <ul className="club-afspraken-app-typen">
          {typen.map((t) => (
            <li key={t.id}>
              <button type="button" data-kleur={t.kleur} onClick={() => setType(t)}>
                <strong>{t.naam}</strong>
                <span>{t.duurMin} minuten</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section className="club-afspraken-app-stap" aria-labelledby="afs-app-plan">
      <button type="button" className="club-afspraken-app-terug" onClick={() => (typen.length > 1 ? (setType(null), setSlot(null)) : onTerug())}>
        <ChevronLeft size={16} aria-hidden /> {typen.length > 1 ? 'Andere soort' : 'Terug'}
      </button>
      <h3 id="afs-app-plan" className="club-afspraken-app-kop">{type.naam}</h3>
      <p className="club-afspraken-app-regel">{type.duurMin} minuten · boeken tot {type.boekenUrenVooraf} uur van tevoren</p>

      <div className="club-afspraken-app-chips" role="radiogroup" aria-label="Trainer">
        <button type="button" role="radio" aria-checked={trainer === ''} onClick={() => { setTrainer(''); setSlot(null) }}>Maakt niet uit</button>
        {type.trainers.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={trainer === m.id} onClick={() => { setTrainer(m.id); setSlot(null) }}>{m.naam.split(' ')[0]}</button>
        ))}
      </div>

      <div className="club-afspraken-app-dagen" role="radiogroup" aria-label="Dag">
        {dagen.map((d) => (
          <button key={d} type="button" role="radio" aria-checked={datum === d} aria-label={DAG_LANG.format(opDag(d))} onClick={() => { setDatum(d); setSlot(null) }}>
            <span>{d === vandaag ? 'Vandaag' : DAG_KORT.format(opDag(d))}</span>
            <strong>{DAG_NR.format(opDag(d))}</strong>
          </button>
        ))}
      </div>

      <VrijeTijden
        klasse="club-afspraken-app"
        sloten={tijden.sloten}
        laden={tijden.laden}
        fout={tijden.fout}
        gekozen={slot ? slotSleutel(slot) : null}
        onKies={(s) => { setSlot(s); setFout(null) }}
        metTrainer={trainer === ''}
        leegTekst="Geen vrije tijden op deze dag. Probeer een andere dag."
      />

      <div aria-live="assertive">{fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}</div>
      {slot ? (
        <div className="club-afspraken-app-bevestig">
          <p>
            <strong>{DAG_LANG.format(opDag(datum))} om {slot.tijd}</strong>
            <span>met {slot.medewerkerNaam || 'een trainer'}</span>
          </p>
          <button type="button" className="club-afspraken-app-knop" onClick={() => void bevestig()} disabled={bezig}>{bezig ? 'Boeken…' : 'Bevestigen'}</button>
        </div>
      ) : null}
    </section>
  )
}
