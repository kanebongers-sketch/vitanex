import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Knop } from './bouwstenen'
import { AANMELDEN, aygPad } from './paden'

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
              Je krijgt een eigen omgeving met je eigen logo en kleuren. Probeer alles {PROEFDAGEN} dagen, samen met je team.
            </p>
            <div className="ayg-knoppen">
              <Knop href={AANMELDEN} soort="accent" pijl>
                Probeer gratis
              </Knop>
              <Knop href={aygPad('/functies')} soort="rand">
                Bekijk de functies
              </Knop>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
