import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { HOOFDSTUKKEN, type HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import { NIEUW, aantalNieuw, korteDatum, maandNaam } from '@/components/aiyourgym/inhoud/nieuw'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop } from '@/components/aiyourgym/site/bouwstenen'

// Wat er elke maand is bijgekomen (concurrentenonderzoek item 10): eerlijk
// bewijs van "elke maand nieuwe functies", zonder klantcijfers. Alleen wat live
// is, met de datum; nooit beloftes voor later. Inhoud: inhoud/nieuw.ts.

export const metadata: Metadata = {
  title: 'Wat er nieuw is',
  description: 'Wat er elke maand bij AI Your Gym is bijgekomen. Alleen wat echt werkt, met de datum waarop het live ging.',
}

const NAAM: Record<HoofdstukSleutel, string> = Object.fromEntries(HOOFDSTUKKEN.map((h) => [h.sleutel, h.naam])) as Record<HoofdstukSleutel, string>

export default function NieuwPagina() {
  return (
    <>
      <PaginaKop
        label="Nieuw"
        titel="Wat er nieuw is."
        tekst={`Elke maand komt er iets bij. Hier staat wat er is gebouwd en nu werkt, met de datum waarop het live ging: ${aantalNieuw()} onderdelen tot nu toe. Geen beloftes voor later.`}
      />
      {NIEUW.map((m) => (
        <section key={m.maand} className="ayg-sectie--krap ayg-nieuw-maand" aria-labelledby={`nieuw-${m.maand}`}>
          <div className="ayg-wrap ayg-nieuw-raster">
            <header className="ayg-nieuw-kop">
              <h2 className="ayg-h2" id={`nieuw-${m.maand}`}>
                {maandNaam(m.maand)}
              </h2>
              <p className="ayg-lead">{m.samenvatting}</p>
              <p className="ayg-nieuw-tel">{m.punten.length} keer nieuw</p>
            </header>
            <ol className="ayg-nieuw-lijst">
              {m.punten.map((p) => (
                <li key={`${p.datum}-${p.titel}`} style={{ '--hfd': `var(--ayg-h-${p.hoofdstuk})` } as CSSProperties}>
                  <time dateTime={p.datum} className="ayg-nieuw-datum">
                    {korteDatum(p.datum)}
                  </time>
                  <div className="ayg-nieuw-punt">
                    <span className="ayg-nieuw-hfd">{NAAM[p.hoofdstuk]}</span>
                    <h3 className="ayg-h3">{p.titel}</h3>
                    <p>{p.tekst}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
      <AanmeldBand titel="Probeer het zelf, met alles wat er nu in zit." />
    </>
  )
}
