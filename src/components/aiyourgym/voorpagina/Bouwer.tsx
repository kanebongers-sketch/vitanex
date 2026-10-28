import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// Hoofdstuk 4 (flessengroen paneel): wie het bouwt, kort (besluit Kane 21-10-2026).
// Een ingezet paneel met links de uitspraak en een boogvorm met de initialen (de plek
// voor een portret zodra er een foto is), rechts twee tekstblokken en een knop.
// Geen aantallen, reviews of logo's: die zijn er nog niet.

export async function Bouwer() {
  const t = VOORPAGINA[await getSiteTaal()].bouwer
  return (
    <section className="vp-bouwer" aria-labelledby="vp-bouwer-titel">
      <div className="vp-paneel vp-onthul">
        <h2 id="vp-bouwer-titel" className="vp-h2 vp-paneel-titel">
          {t.titel.map((r) => (
            <span key={r} className="vp-blok">
              {r}
            </span>
          ))}
        </h2>
        <div className="vp-boog" role="img" aria-label={t.stempel}>
          <span aria-hidden>KB</span>
        </div>
        <div className="vp-paneel-tekst">
          <div>
            <h3>{t.wieKop}</h3>
            <p>{t.wie}</p>
          </div>
          <div>
            <h3>{t.verwachtKop}</h3>
            <p>{t.verwacht}</p>
          </div>
          <Link href={SITE_PADEN.DEMO_AANVRAGEN} className="vp-knop vp-knop-salie">
            {t.knop} <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
