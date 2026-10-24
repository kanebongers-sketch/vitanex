import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { NIEUW, aantalNieuw, korteDatum, maandNaam, maandSamenvatting, puntTekst } from '@/components/aiyourgym/inhoud/nieuw'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { FUNCTIES_PAGINA } from '@/lib/aiyourgym/taal/woorden/website/functies'
import { NIEUW_PAGINA } from '@/lib/aiyourgym/taal/woorden/website/nieuw'

// Wat er elke maand is bijgekomen (concurrentenonderzoek item 10): eerlijk
// bewijs van "elke maand nieuwe functies", zonder klantcijfers. Alleen wat live
// is, met de datum; nooit beloftes voor later. Inhoud in beide talen:
// src/lib/aiyourgym/nieuw.ts. Namen van de hoofdstukken: FUNCTIES_PAGINA.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(NIEUW_PAGINA)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

export default async function NieuwPagina() {
  const taal = await getSiteTaal()
  const t = NIEUW_PAGINA[taal]
  const hoofdstukken = FUNCTIES_PAGINA[taal].hoofdstukken
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst(aantalNieuw())} />
      {NIEUW.map((m) => (
        <section key={m.maand} className="ayg-sectie--krap ayg-nieuw-maand" aria-labelledby={`nieuw-${m.maand}`}>
          <div className="ayg-wrap ayg-nieuw-raster">
            <header className="ayg-nieuw-kop">
              <h2 className="ayg-h2" id={`nieuw-${m.maand}`}>
                {maandNaam(m.maand, taal)}
              </h2>
              <p className="ayg-lead">{maandSamenvatting(m, taal)}</p>
              <p className="ayg-nieuw-tel">{t.keerNieuw(m.punten.length)}</p>
            </header>
            <ol className="ayg-nieuw-lijst">
              {m.punten.map((p) => {
                const tekst = puntTekst(p, taal)
                return (
                  <li key={`${p.datum}-${p.titel}`} style={{ '--hfd': `var(--ayg-h-${p.hoofdstuk})` } as CSSProperties}>
                    <time dateTime={p.datum} className="ayg-nieuw-datum">
                      {korteDatum(p.datum, taal)}
                    </time>
                    <div className="ayg-nieuw-punt">
                      <span className="ayg-nieuw-hfd">{hoofdstukken[p.hoofdstuk].naam}</span>
                      <h3 className="ayg-h3">{tekst.titel}</h3>
                      <p>{tekst.tekst}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>
      ))}
      <AanmeldBand titel={t.bandTitel} />
    </>
  )
}
