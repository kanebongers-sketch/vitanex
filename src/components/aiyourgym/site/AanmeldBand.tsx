import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Geruststelling } from './Actie'
import { Knop } from './bouwstenen'
import { AANMELDEN, DEMO, DEMO_AANVRAGEN } from './paden'

interface Props {
  titel?: string
}

// De afsluitende oproep onderaan elke pagina.
export function AanmeldBand({ titel = 'Zet je sportschool er vandaag in.' }: Props) {
  return (
    <section className="ayg-sectie--krap" aria-labelledby="band-titel">
      <div className="ayg-podium ayg-podium--rond">
        <div className="ayg-band-gloed" aria-hidden />
        <div className="ayg-band ayg-wrap">
          <div className="ayg-stapel">
            <p className="ayg-label ayg-label--accent">{PROEFDAGEN} dagen gratis proberen</p>
            <h2 className="ayg-h2" id="band-titel">
              {titel}
            </h2>
          </div>
          <div className="ayg-stapel">
            <p className="ayg-lead">
              Je krijgt een eigen omgeving met je eigen logo en kleuren. Probeer alles {PROEFDAGEN} dagen met je team, of laat het je eerst persoonlijk zien.
            </p>
            <div className="ayg-knoppen">
              <Knop href={AANMELDEN} soort="accent" pijl>
                Probeer {PROEFDAGEN} dagen gratis
              </Knop>
              <Knop href={DEMO_AANVRAGEN} soort="rand">
                Plan een gratis demo
              </Knop>
            </div>
            <Link href={DEMO} className="ayg-pijllink ayg-band-live">
              Of bekijk de live demo <ArrowRight size={16} aria-hidden />
            </Link>
            <Geruststelling />
          </div>
        </div>
      </div>
    </section>
  )
}
