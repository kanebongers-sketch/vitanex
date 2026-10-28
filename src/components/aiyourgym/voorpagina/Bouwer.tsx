import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// Het praktijkverhaal (antraciet podium): wie het bouwt, kort (besluit Kane 21-10-2026).
// Links een staande boog met het monogram KB in champagne: de plek voor een portret
// zodra er campagnefotografie is (docs/aiyourgym/FOTOGRAFIE.md), en nu al af als
// typografisch beeld. Rechts het citaat groot in de serif, wie Kane is en wat je
// mag verwachten. Geen aantallen, reviews of logo's: die zijn er nog niet.

export async function Bouwer() {
  const t = VOORPAGINA[await getSiteTaal()].bouwer
  return (
    <section className="vp-bouwer ayg-podium" aria-labelledby="vp-bouwer-titel">
      <div className="ayg-wrap vp-bouwer-raster">
        <div className="vp-boog vp-onthul" role="img" aria-label={t.stempel}>
          <span aria-hidden>KB</span>
        </div>
        <div className="vp-bouwer-tekst vp-onthul">
          <p className="ayg-label">{t.oog}</p>
          <h2 id="vp-bouwer-titel" className="ayg-h2">
            {t.titel.voor} <em>{t.titel.accent}</em>
          </h2>
          <figure className="vp-bouwer-citaat">
            <blockquote>
              <p>{t.citaat}</p>
            </blockquote>
            <figcaption>
              <strong>{t.naam}</strong>
              <span>{t.rol}</span>
            </figcaption>
          </figure>
          <div className="vp-bouwer-verwacht">
            <h3>{t.verwachtKop}</h3>
            <ul>
              {t.verwacht.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <Link href={SITE_PADEN.DEMO_AANVRAGEN} className="ayg-knop ayg-knop--rand vp-bouwer-knop">
            {t.knop} <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
