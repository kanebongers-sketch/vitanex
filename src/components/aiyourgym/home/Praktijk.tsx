import { Clock, Download, Handshake } from 'lucide-react'
import { BELOFTES, OPRICHTER, PRAKTIJK } from '@/components/aiyourgym/inhoud/praktijk'
import { SectieActie } from '@/components/aiyourgym/site/Actie'

// Sociaal bewijs zonder te liegen: wie het bouwt en wat we beloven. Geen
// aantallen klanten, reviews, sterren of logo's (die hebben we nog niet).
// De naam komt uit inhoud/praktijk.ts; is die null, dan alleen de rol.

const ICONEN = [Clock, Handshake, Download] as const

function initialen(naam: string): string {
  return naam
    .split(/\s+/)
    .filter(Boolean)
    .map((d) => d[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Praktijk() {
  const naam = OPRICHTER.naam
  return (
    <section className="ayg-sectie ayg-praktijk" aria-labelledby="praktijk-titel">
      <div className="ayg-wrap ayg-praktijk-raster">
        <div className="ayg-praktijk-verhaal">
          <p className="ayg-label ayg-label--accent">{PRAKTIJK.label}</p>
          <h2 className="ayg-h2" id="praktijk-titel">
            {PRAKTIJK.kop}
          </h2>
          <div className="ayg-praktijk-wie">
            <span className="ayg-praktijk-monogram" aria-hidden>
              {naam ? initialen(naam) : 'PT'}
            </span>
            <p>
              {naam && <strong>{naam}</strong>}
              <span>{PRAKTIJK.rol}</span>
            </p>
          </div>
          <div className="ayg-praktijk-tekst">
            {PRAKTIJK.alineas.map((a) => (
              <p key={a}>{a}</p>
            ))}
          </div>
          <ul className="ayg-praktijk-feiten">
            {PRAKTIJK.feiten.map((f) => (
              <li key={f.titel}>
                <h3>{f.titel}</h3>
                <p>{f.tekst}</p>
              </li>
            ))}
          </ul>
        </div>
        <aside className="ayg-beloftes ayg-podium" aria-labelledby="beloftes-titel">
          <p className="ayg-beloftes-label">Onze beloftes</p>
          <h3 className="ayg-h3" id="beloftes-titel">
            Wat je van ons mag verwachten.
          </h3>
          <ol>
            {BELOFTES.map((b, i) => {
              const Icoon = ICONEN[i % ICONEN.length]
              return (
                <li key={b.titel}>
                  <Icoon aria-hidden />
                  <div>
                    <h4>{b.titel}</h4>
                    <p>{b.tekst}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </aside>
      </div>
      <div className="ayg-wrap">
        <SectieActie zin="Liever eerst even praten? Plan een gratis demo, dan laten we het je persoonlijk zien." />
      </div>
    </section>
  )
}
