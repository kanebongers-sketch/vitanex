'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { stuur } from '@/components/club/leden/stuur'
import { haal } from './haal'
import { appDataUit, type AppAfspraak, type AppData } from './app-data'
import { AppBoeken } from './AppBoeken'
import './afspraken.css'

// Afspraken in de ledenapp: je komende afspraken (annuleren binnen de regels)
// en zelf een afspraak maken met een trainer. Werkt als eigen tabblad of als
// blok op Home. In de voorvertoning komt het lid uit de URL (lidId).

const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })

interface Props {
  lidId: string
}

function Komend({ a, bezig, onAnnuleer }: { a: AppAfspraak; bezig: boolean; onAnnuleer: (a: AppAfspraak) => void }) {
  const start = new Date(a.start)
  return (
    <li className="club-afspraken-app-afspraak" data-kleur={a.kleur}>
      <span className="club-afspraken-app-wanneer">
        <strong>{nlDelen(start).tijd}</strong>
        <span>{DAG.format(start)}</span>
      </span>
      <span className="club-afspraken-app-wat">
        <strong>{a.typeNaam}</strong>
        <span>met {a.trainer}</span>
      </span>
      {a.magAnnuleren ? (
        <button type="button" className="club-afspraken-app-annuleer" disabled={bezig} onClick={() => onAnnuleer(a)}>Annuleren</button>
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

  const laad = useCallback(async () => {
    const uit = await haal(`/api/club/afspraken/app?lid=${encodeURIComponent(lidId)}`)
    if (uit.ok) {
      setData(appDataUit(uit.data))
      setFout(null)
    } else {
      setFout(uit.fout || 'Je afspraken konden niet worden geladen.')
    }
  }, [lidId])

  useEffect(() => {
    let weg = false
    void haal(`/api/club/afspraken/app?lid=${encodeURIComponent(lidId)}`).then((uit) => {
      if (weg) return
      if (uit.ok) setData(appDataUit(uit.data))
      else setFout(uit.fout || 'Je afspraken konden niet worden geladen.')
    })
    return () => {
      weg = true
    }
  }, [lidId])

  async function annuleer(a: AppAfspraak) {
    if (!window.confirm(`${a.typeNaam} op ${DAG.format(new Date(a.start))} annuleren?`)) return
    setBezig(true)
    const uit = await stuur(`/api/club/afspraken/app/${a.id}/annuleren`, 'POST', { lidId })
    setBezig(false)
    setMelding(uit.ok ? 'Je afspraak is geannuleerd.' : uit.fout)
    if (uit.ok) await laad()
  }

  async function geboekt(tekst: string) {
    setBoeken(false)
    setMelding(tekst)
    await laad()
  }

  if (fout && !data) return <div className="club-afspraken-app"><p className="club-melding club-melding--fout" role="alert">{fout}</p></div>
  if (!data) return <div className="club-afspraken-app"><p className="club-afspraken-app-tijden-stand" aria-live="polite">Afspraken laden…</p></div>

  return (
    <div className="club-afspraken-app">
      <p className="club-afspraken-app-melding" role="status" aria-live="polite">{melding}</p>
      {boeken ? (
        <AppBoeken lidId={lidId} typen={data.typen} horizonDagen={data.horizonDagen} onGeboekt={(t) => void geboekt(t)} onTerug={() => setBoeken(false)} />
      ) : (
        <>
          <h3 className="club-afspraken-app-kop">Mijn afspraken</h3>
          {data.komend.length > 0 ? (
            <ul className="club-afspraken-app-lijst">
              {data.komend.map((a) => <Komend key={a.id} a={a} bezig={bezig} onAnnuleer={(x) => void annuleer(x)} />)}
            </ul>
          ) : (
            <p className="club-afspraken-app-leeg">Je hebt geen afspraken gepland.</p>
          )}
          {data.typen.length > 0 ? (
            <button type="button" className="club-afspraken-app-knop" onClick={() => { setMelding(null); setBoeken(true) }}>
              <CalendarPlus size={18} aria-hidden /> Afspraak maken
            </button>
          ) : (
            <p className="club-afspraken-app-leeg">Afspraken maken kan nu alleen via de balie.</p>
          )}
        </>
      )}
    </div>
  )
}
