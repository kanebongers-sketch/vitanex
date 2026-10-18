'use client'

import { useState } from 'react'
import { ArrowLeftRight, ChevronUp } from 'lucide-react'
import type { AppOefening } from '@/lib/club/app/schema'
import type { AppAlternatief } from '@/lib/club/training/alternatieven'
import { MATERIAAL_LABEL } from '@/lib/club/training/typen'
import { OefeningBeeld } from '@/components/club/training/OefeningBeeld'
import { useLedenappApi } from './LedenappApi'
import './andere-oefening.css'

// Toestel bezet? Het lid kiest voor alleen deze training een andere oefening
// met hetzelfde bewegingspatroon en dezelfde spier, nooit zwaarder dan het
// origineel. De keuze gaat via onKies naar de training (wisselOefening in
// alternatieven.ts); de sets worden op de gekozen oefening gelogd en de
// trainer ziet het in het logboek.
//
// Inpassen in de training (bijvoorbeeld in OefeningSets):
//   <AndereOefening lidId={lidId} oefening={o} onKies={(alt) => setDag((d) => wisselOefening(d, o.id, alt))} />

interface AndereOefeningProps {
  lidId: string
  /** De oefening uit het schema (id = schemaregel). */
  oefening: AppOefening
  onKies: (alternatief: AppAlternatief) => void
}

type Staat = { soort: 'dicht' } | { soort: 'laden' } | { soort: 'fout'; tekst: string } | { soort: 'lijst'; lijst: AppAlternatief[] }

function isAlternatief(v: unknown): v is AppAlternatief {
  return typeof v === 'object' && v !== null && typeof (v as AppAlternatief).oefeningId === 'string' && typeof (v as AppAlternatief).naam === 'string'
}

async function haal(url: string): Promise<Staat> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const data: unknown = await res.json().catch(() => null)
    const rij = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
    if (!res.ok) return { soort: 'fout', tekst: typeof rij.fout === 'string' ? rij.fout : 'Er ging iets mis. Probeer het opnieuw.' }
    return { soort: 'lijst', lijst: Array.isArray(rij.alternatieven) ? rij.alternatieven.filter(isAlternatief) : [] }
  } catch {
    return { soort: 'fout', tekst: 'Geen verbinding. Probeer het opnieuw.' }
  }
}

export function AndereOefening({ lidId, oefening, onKies }: AndereOefeningProps) {
  const api = useLedenappApi()
  const [staat, setStaat] = useState<Staat>({ soort: 'dicht' })
  const open = staat.soort !== 'dicht'
  const lijstId = `andere-${oefening.id}`

  async function wissel() {
    if (open) return setStaat({ soort: 'dicht' })
    setStaat({ soort: 'laden' })
    const uitslag = await haal(api.alternatieven(lidId, oefening.id))
    // Intussen gesloten: dicht laten.
    setStaat((nu) => (nu.soort === 'laden' ? uitslag : nu))
  }

  function kies(alt: AppAlternatief) {
    onKies(alt)
    setStaat({ soort: 'dicht' })
  }

  return (
    <div className="club-lidapp-andere">
      <button type="button" className="club-lidapp-andere-knop" onClick={wissel} aria-expanded={open} aria-controls={lijstId}>
        {open ? <ChevronUp aria-hidden size={16} /> : <ArrowLeftRight aria-hidden size={16} />}
        {open ? 'Sluiten' : 'Toestel bezet? Andere oefening'}
      </button>
      {open && (
        <div id={lijstId} className="club-lidapp-andere-paneel">
          {staat.soort === 'laden' && <p className="club-lidapp-andere-tekst" role="status">Even zoeken...</p>}
          {staat.soort === 'fout' && <p className="club-lidapp-andere-tekst" role="alert">{staat.tekst}</p>}
          {staat.soort === 'lijst' && staat.lijst.length === 0 && (
            <p className="club-lidapp-andere-tekst">Geen vergelijkbare oefening zonder extra belasting. Wacht even of vraag je trainer.</p>
          )}
          {staat.soort === 'lijst' && staat.lijst.length > 0 && (
            <>
              <p className="club-lidapp-andere-tekst">Alleen voor vandaag, in plaats van {oefening.naam}. Begin wat lichter: het is een andere oefening.</p>
              <ul className="club-lidapp-andere-lijst" aria-label={`Andere oefeningen voor ${oefening.naam}`}>
                {staat.lijst.map((alt) => (
                  <li key={alt.oefeningId}>
                    <button type="button" className="club-lidapp-andere-rij" onClick={() => kies(alt)}>
                      <OefeningBeeld naam={alt.naam} beeld={alt.beeld} formaat="klein" decoratief />
                      <span className="club-lidapp-andere-naam">
                        <strong>{alt.naam}</strong>
                        <span>{MATERIAAL_LABEL[alt.materiaal]} · {alt.overeenkomst === 2 ? 'zelfde spier' : 'vergelijkbaar'}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
