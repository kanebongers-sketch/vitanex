'use client'

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { nlDelen, plusDagen } from '@/lib/club/rooster/tijd'
import { stuur } from '@/components/club/leden/stuur'
import { VrijeTijden, slotSleutel, useVrijeTijden } from './VrijeTijden'
import type { SlotOptie } from './haal'
import type { AppType } from './app-data'
import { useLedenappApi } from '@/components/club/app/LedenappApi'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'

// "Afspraak maken" in de ledenapp, in vier stappen: soort, trainer (of maakt
// niet uit), dag en tijd, en dan bevestigen. Alleen echt vrije tijden binnen
// de regels van de sportschool staan erbij.

const opDag = (d: string) => `${d}T12:00:00Z`
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
  const api = useLedenappApi()
  const taal = useTaal()
  const t = useTekst(AFSPRAKEN).app
  const dagLang = (d: string) => formatDatum(opDag(d), taal, 'dag')

  const url = type ? api.sloten(lidId, { type: type.id, datum, medewerker: trainer }) : null
  const tijden = useVrijeTijden(url)

  async function bevestig() {
    if (!type || !slot || bezig) return
    setBezig(true)
    setFout(null)
    const verzoek = api.afspraakBoeken(lidId, { typeId: type.id, medewerkerId: trainer || null, datum, tijd: slot.tijd })
    const uit = await stuur(verzoek.url, 'POST', verzoek.body)
    setBezig(false)
    if (!uit.ok) {
      setSlot(null)
      return setFout(uit.fout)
    }
    onGeboekt(t.geboekt(type.naam, dagLang(datum), slot.tijd))
  }

  if (!type) {
    return (
      <section className="club-afspraken-app-stap" aria-labelledby="afs-app-soort">
        <button type="button" className="club-afspraken-app-terug" onClick={onTerug}><ChevronLeft size={16} aria-hidden /> {t.terug}</button>
        <h3 id="afs-app-soort" className="club-afspraken-app-kop">{t.watPlannen}</h3>
        <ul className="club-afspraken-app-typen">
          {typen.map((ty) => (
            <li key={ty.id}>
              <button type="button" data-kleur={ty.kleur} onClick={() => setType(ty)}>
                <strong>{ty.naam}</strong>
                <span>{t.minuten(ty.duurMin)}</span>
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
        <ChevronLeft size={16} aria-hidden /> {typen.length > 1 ? t.andereSoort : t.terug}
      </button>
      <h3 id="afs-app-plan" className="club-afspraken-app-kop">{type.naam}</h3>
      <p className="club-afspraken-app-regel">{t.regel(type.duurMin, type.boekenUrenVooraf)}</p>

      <div className="club-afspraken-app-chips" role="radiogroup" aria-label={t.trainer}>
        <button type="button" role="radio" aria-checked={trainer === ''} onClick={() => { setTrainer(''); setSlot(null) }}>{t.maaktNietUit}</button>
        {type.trainers.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={trainer === m.id} onClick={() => { setTrainer(m.id); setSlot(null) }}>{m.naam.split(' ')[0]}</button>
        ))}
      </div>

      <div className="club-afspraken-app-dagen" role="radiogroup" aria-label={t.dag}>
        {dagen.map((d) => (
          <button key={d} type="button" role="radio" aria-checked={datum === d} aria-label={dagLang(d)} onClick={() => { setDatum(d); setSlot(null) }}>
            <span>{d === vandaag ? t.vandaag : formatDatum(opDag(d), taal, 'weekdag')}</span>
            <strong>{formatDatum(opDag(d), taal, 'dagMaand')}</strong>
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
        leegTekst={t.geenTijden}
      />

      <div aria-live="assertive">{fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}</div>
      {slot ? (
        <div className="club-afspraken-app-bevestig">
          <p>
            <strong>{t.om(dagLang(datum), slot.tijd)}</strong>
            <span>{t.met(slot.medewerkerNaam || t.eenTrainer)}</span>
          </p>
          <button type="button" className="club-afspraken-app-knop" onClick={() => void bevestig()} disabled={bezig}>{bezig ? t.boekenBezig : t.bevestigen}</button>
        </div>
      ) : null}
    </section>
  )
}
