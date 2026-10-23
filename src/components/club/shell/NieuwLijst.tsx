'use client'

import { useEffect } from 'react'
import { NIEUW, korteDatum, leesGezien, maandNaam, nieuwSleutel, type NieuwHoofdstuk } from '@/lib/aiyourgym/nieuw'
import { markeerAllesGelezen, useGezienVoorOpenen, vergeetVoorOpenen } from './nieuw-gezien'
import './nieuw.css'

// Wat is nieuw in Club: dezelfde lijst als op de website, per maand en per
// datum. Bij openen staat alles op gelezen (de teller in de hulpbalk springt
// op nul); wat je bij deze keer openen nog niet had gezien, krijgt het label Nieuw.

const ONDERWERP: Record<NieuwHoofdstuk, string> = {
  beheer: 'Beheer',
  coaching: 'Coaching',
  planning: 'Planning',
  groei: 'Groei',
  betrokkenheid: 'Leden',
}

export function NieuwLijst({ persoon }: { persoon: string }) {
  const voor = useGezienVoorOpenen(persoon)
  useEffect(() => {
    markeerAllesGelezen(persoon)
    return () => vergeetVoorOpenen(persoon)
  }, [persoon])
  // Pas na het markeren weten we wat er nieuw was; ervoor (en op de server) geen labels.
  const gezien = voor === undefined ? null : leesGezien(voor)

  return (
    <div className="club-nieuw">
      {NIEUW.map((m) => (
        <section key={m.maand} className="club-nieuw-maand" aria-labelledby={`nieuw-${m.maand}`}>
          <header className="club-nieuw-maandkop">
            <h2 id={`nieuw-${m.maand}`}>{maandNaam(m.maand)}</h2>
            <p>{m.samenvatting}</p>
          </header>
          <ol className="club-nieuw-punten">
            {m.punten.map((p) => {
              const nieuw = gezien !== null && !gezien.has(nieuwSleutel(p))
              return (
                <li key={nieuwSleutel(p)} className="club-nieuw-punt" data-nieuw={nieuw ? 'true' : undefined}>
                  <time dateTime={p.datum} className="club-nieuw-datum">{korteDatum(p.datum)}</time>
                  <div className="club-nieuw-inhoud">
                    <h3>
                      {p.titel}
                      {nieuw && <span className="club-chip club-chip--merk club-chip--geen">Nieuw</span>}
                    </h3>
                    <p>{p.tekst}</p>
                    <span className="club-nieuw-onderwerp">{ONDERWERP[p.hoofdstuk]}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
