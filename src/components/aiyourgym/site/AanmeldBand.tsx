import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { Geruststelling } from './Actie'
import { Knop } from './bouwstenen'
import { SITE_PADEN } from './paden'

interface Props {
  /** Eigen kop uit het woordenboek van de pagina; anders de standaardkop uit ACTIE. */
  titel?: string
}

// De afsluitende oproep onderaan elke pagina, in de taal van de pagina (woordenboek ACTIE).
export async function AanmeldBand({ titel }: Props) {
  const t = await siteTekst(ACTIE)
  const { AANMELDEN, DEMO, DEMO_AANVRAGEN } = SITE_PADEN
  return (
    <section className="ayg-sectie--krap" aria-labelledby="band-titel">
      <div className="ayg-podium ayg-podium--rond">
        <div className="ayg-band-gloed" aria-hidden />
        <div className="ayg-band ayg-wrap">
          <div className="ayg-stapel">
            <p className="ayg-label ayg-label--accent">{t.bandLabel(PROEFDAGEN)}</p>
            <h2 className="ayg-h2" id="band-titel">
              {titel ?? t.bandTitel}
            </h2>
          </div>
          <div className="ayg-stapel">
            <p className="ayg-lead">{t.bandLead(PROEFDAGEN)}</p>
            <div className="ayg-knoppen">
              <Knop href={AANMELDEN} soort="accent" pijl>
                {t.probeerDagen(PROEFDAGEN)}
              </Knop>
              <Knop href={DEMO_AANVRAGEN} soort="rand">
                {t.planDemo}
              </Knop>
            </div>
            <Link href={DEMO} className="ayg-pijllink ayg-band-live">
              {t.ofLiveDemo} <ArrowRight size={16} aria-hidden />
            </Link>
            <Geruststelling />
          </div>
        </div>
      </div>
    </section>
  )
}
