'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarOff, CalendarPlus, TriangleAlert } from 'lucide-react'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { stuur } from '@/components/club/leden/stuur'
import { haal } from './haal'
import { appDataUit, type AppAfspraak, type AppData } from './app-data'
import { AppBoeken } from './AppBoeken'
import { useLedenappApi } from '@/components/club/app/LedenappApi'
import { LegeStaat } from '@/components/club/app/LegeStaat'
import './afspraken.css'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'

// Afspraken in de ledenapp: je komende afspraken (annuleren binnen de regels)
// en zelf een afspraak maken met een trainer. Werkt als eigen tabblad of als
// blok op Home. In de voorvertoning komt het lid uit de URL (lidId).

interface Props {
  lidId: string
}

function Komend({ a, bezig, onAnnuleer }: { a: AppAfspraak; bezig: boolean; onAnnuleer: (a: AppAfspraak) => void }) {
  const start = new Date(a.start)
  const taal = useTaal()
  const t = useTekst(AFSPRAKEN).app
  return (
    <li className="club-afspraken-app-afspraak" data-kleur={a.kleur}>
      <span className="club-afspraken-app-wanneer">
        <strong>{nlDelen(start).tijd}</strong>
        <span>{formatDatum(start, taal, 'dag')}</span>
      </span>
      <span className="club-afspraken-app-wat">
        <strong>{a.typeNaam}</strong>
        <span>{t.met(a.trainer)}</span>
      </span>
      {a.magAnnuleren ? (
        <button type="button" className="club-afspraken-app-annuleer" disabled={bezig} onClick={() => onAnnuleer(a)}>{t.annuleren}</button>
      ) : (
        <span className="club-afspraken-app-uitleg">{a.annulerenUitleg}</span>
      )}
    </li>
  )
}

export function LedenappAfspraken({ lidId }: Props) {
  const [data, setData] = useState<AppData | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [boeken, setBoeken] = useState(false)
  const [bezig, setBezig] = useState(false)
  const api = useLedenappApi()
  const taal = useTaal()
  const t = useTekst(AFSPRAKEN).app
  const laadFout = t.laadFout
  const overzichtUrl = api.afspraken(lidId)

  const laad = useCallback(async () => {
    const uit = await haal(overzichtUrl)
    if (uit.ok) {
      setData(appDataUit(uit.data))
      setFout(null)
    } else {
      setFout(uit.fout || laadFout)
    }
  }, [overzichtUrl, laadFout])

  useEffect(() => {
    let weg = false
    void haal(overzichtUrl).then((uit) => {
      if (weg) return
      if (uit.ok) setData(appDataUit(uit.data))
      else setFout(uit.fout || laadFout)
    })
    return () => {
      weg = true
    }
  }, [overzichtUrl, laadFout])

  async function annuleer(a: AppAfspraak) {
    if (!window.confirm(t.annulerenVraag(a.typeNaam, formatDatum(a.start, taal, 'dag')))) return
    setBezig(true)
    const verzoek = api.afspraakAnnuleren(a.id, lidId)
    const uit = await stuur(verzoek.url, 'POST', verzoek.body)
    setBezig(false)
    setMelding(uit.ok ? t.geannuleerd : uit.fout)
    if (uit.ok) await laad()
  }

  async function geboekt(tekst: string) {
    setBoeken(false)
    setMelding(tekst)
    await laad()
  }

  if (fout && !data) {
    return (
      <div className="club-afspraken-app">
        <LegeStaat Icoon={TriangleAlert} titel={t.nietBeschikbaar} fout>{fout}</LegeStaat>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="club-afspraken-app" role="status" aria-busy="true">
        <span className="club-sr">{t.laden}</span>
        <span className="club-lidapp-skelet club-lidapp-skelet--kop" aria-hidden />
        <span className="club-lidapp-skelet club-lidapp-skelet--kaart" aria-hidden />
        <span className="club-lidapp-skelet club-lidapp-skelet--kaart" aria-hidden />
      </div>
    )
  }

  return (
    <div className="club-afspraken-app">
      <p className="club-afspraken-app-melding" role="status" aria-live="polite">{melding}</p>
      {boeken ? (
        <AppBoeken lidId={lidId} typen={data.typen} horizonDagen={data.horizonDagen} onGeboekt={(t) => void geboekt(t)} onTerug={() => setBoeken(false)} />
      ) : (
        <>
          <h3 className="club-afspraken-app-kop">{t.mijn}</h3>
          {data.komend.length > 0 ? (
            <ul className="club-afspraken-app-lijst">
              {data.komend.map((a) => <Komend key={a.id} a={a} bezig={bezig} onAnnuleer={(x) => void annuleer(x)} />)}
            </ul>
          ) : (
            <LegeStaat Icoon={CalendarOff} titel={t.geenGepland}>
              {data.typen.length > 0 ? t.planHieronder : t.alleenBalie}
            </LegeStaat>
          )}
          {data.typen.length > 0 ? (
            <button type="button" className="club-afspraken-app-knop" onClick={() => { setMelding(null); setBoeken(true) }}>
              <CalendarPlus size={18} aria-hidden /> {t.maken}
            </button>
          ) : data.komend.length > 0 ? (
            <p className="club-afspraken-app-leeg">{t.makenAlleenBalie}</p>
          ) : null}
        </>
      )}
    </div>
  )
}
