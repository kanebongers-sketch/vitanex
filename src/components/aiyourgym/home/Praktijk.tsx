import { CalendarPlus, Clock, Smartphone, UserRound } from 'lucide-react'
import { BELOFTES, OPRICHTER, PRAKTIJK, VLOER } from '@/components/aiyourgym/inhoud/praktijk'

// Sociaal bewijs zonder te liegen: wie het bouwt, waarom (drie problemen van
// de werkvloer en wat AI Your Gym daaraan doet) en wat je mag verwachten.
// Geen aantallen sportscholen, reviews, sterren of logo's (die hebben we nog
// niet). De naam komt uit inhoud/praktijk.ts; is die null, dan alleen de rol.

const ICONEN = [Smartphone, CalendarPlus, UserRound, Clock] as const

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
          <figure className="ayg-praktijk-citaat">
            <blockquote>
              <p>{PRAKTIJK.tekst}</p>
            </blockquote>
            <figcaption className="ayg-praktijk-wie">
              <span className="ayg-praktijk-monogram" aria-hidden>
                {naam ? initialen(naam) : 'PT'}
              </span>
              <span>
                {naam && <strong>{naam}</strong>}
                <span>{PRAKTIJK.rol}</span>
              </span>
            </figcaption>
          </figure>
          <ol className="ayg-praktijk-vloer" aria-label="Waar AI Your Gym mee begon">
            {VLOER.map((v, i) => (
              <li key={v.probleem}>
                <span className="ayg-praktijk-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{v.probleem}</h3>
                  <p>{v.oplossing}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="ayg-praktijk-voorjou">
          <p className="ayg-label">Wat dat voor jou betekent</p>
          <ul className="ayg-praktijk-beloftes">
            {BELOFTES.map((b, i) => {
              const Icoon = ICONEN[i % ICONEN.length]
              return (
                <li key={b.titel}>
                  <Icoon aria-hidden />
                  <div>
                    <h3>{b.titel}</h3>
                    <p>{b.tekst}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
