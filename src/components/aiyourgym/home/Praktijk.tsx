import { CalendarPlus, Clock, Smartphone, UserRound } from 'lucide-react'
import { OPRICHTER } from '@/components/aiyourgym/inhoud/praktijk'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { PRAKTIJK_SECTIE } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// Kane kort (besluit Kane 21-10-2026): wie het bouwt, in een paar zinnen, en
// wat je mag verwachten. Sociaal bewijs zonder te liegen: geen aantallen
// sportscholen, reviews, sterren of logo's (die hebben we nog niet). De naam
// komt uit inhoud/praktijk.ts; is die null, dan alleen de rol. Op de telefoon
// alleen de titels van de beloftes, op de pc ook de uitleg. Teksten in de taal
// van de pagina (woordenboek PRAKTIJK_SECTIE).

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

export async function Praktijk() {
  const t = await siteTekst(PRAKTIJK_SECTIE)
  const naam = OPRICHTER.naam
  return (
    <section className="ayg-sectie ayg-praktijk" aria-labelledby="praktijk-titel">
      <div className="ayg-wrap ayg-praktijk-raster">
        <div className="ayg-praktijk-verhaal">
          <p className="ayg-label ayg-label--accent">{t.label}</p>
          <h2 className="ayg-h2" id="praktijk-titel">
            {t.kop}
          </h2>
          <figure className="ayg-praktijk-citaat">
            <blockquote>
              <p>{t.tekst}</p>
            </blockquote>
            <figcaption className="ayg-praktijk-wie">
              <span className="ayg-praktijk-monogram" aria-hidden>
                {naam ? initialen(naam) : 'PT'}
              </span>
              <span>
                {naam && <strong>{naam}</strong>}
                <span>{t.rol}</span>
              </span>
            </figcaption>
          </figure>
        </div>
        <div className="ayg-praktijk-voorjou">
          <p className="ayg-label">{t.verwachten}</p>
          <ul className="ayg-praktijk-beloftes">
            {t.beloftes.map((b, i) => {
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
