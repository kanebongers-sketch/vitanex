import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { RoosterScherm } from '@/components/aiyourgym/mockups/RoosterScherm'
import { Knop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, DEMO } from '@/components/aiyourgym/site/paden'

// De opening van de voorpagina: een grote belofte die we waarmaken, en het
// product zelf als beeld (rooster in Club, ledenapp op de telefoon).

const KENMERKEN = ['Gegevens in de EU', 'Je eigen logo en kleuren', `${PROEFDAGEN} dagen gratis`] as const

export function Held() {
  return (
    <section className="ayg-held" aria-labelledby="held-titel">
      <div className="ayg-wrap ayg-held-raster">
        <div className="ayg-held-tekst ayg-intro">
          <p className="ayg-label ayg-label--accent">Clubsoftware voor sportscholen</p>
          <h1 className="ayg-display" id="held-titel">
            Je sportschool, <mark className="ayg-markeer">strak</mark> geregeld.
          </h1>
          <p className="ayg-lead">
            Check-in, groepslessen, personeel, trainingsschema&rsquo;s met coaching en een ledenapp in je eigen huisstijl. Een systeem
            voor de hele werkvloer, van balie tot vloer.
          </p>
          <div className="ayg-knoppen">
            <Knop href={AANMELDEN} soort="accent" pijl>
              Probeer {PROEFDAGEN} dagen gratis
            </Knop>
            <Knop href={DEMO} soort="rand">
              Probeer de demo
            </Knop>
          </div>
          <ul className="ayg-held-kenmerken">
            {KENMERKEN.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
        <div
          className="ayg-held-beeld aygm"
          role="img"
          aria-label="Het groepslesrooster van een sportschool in AI Your Gym, met daarvoor de ledenapp op een telefoon"
        >
          <div className="ayg-held-venster">
            <RoosterScherm />
          </div>
          <Toestel tab="Home" className="ayg-held-toestel">
            <AppHome />
          </Toestel>
        </div>
      </div>
      <p className="ayg-wrap ayg-held-bijschrift">Schermvoorbeeld met voorbeeldgegevens</p>
    </section>
  )
}
