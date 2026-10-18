import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { RoosterScherm } from '@/components/aiyourgym/mockups/RoosterScherm'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import { Knop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, DEMO } from '@/components/aiyourgym/site/paden'

// De opening van de voorpagina: een belofte die we waarmaken, een primaire knop
// (gratis proberen) en een rustige tweede (de demo), met direct eronder wat het
// risico wegneemt. Het product zelf staat ernaast als beeld.

export function Held() {
  return (
    <section className="ayg-held" aria-labelledby="held-titel">
      <div className="ayg-wrap ayg-held-raster">
        <div className="ayg-held-tekst ayg-intro">
          <p className="ayg-label ayg-label--accent">Clubsoftware voor sportscholen</p>
          <h1 className="ayg-display" id="held-titel">
            Je hele sportschool in <mark className="ayg-markeer">een systeem</mark>.
          </h1>
          <p className="ayg-lead">
            Check-in, groepslessen, personeelsrooster, trainingsschema&rsquo;s met coaching en een ledenapp in je eigen naam en kleuren.
            Je team werkt vanuit een plek, je leden hebben jouw app op zak.
          </p>
          <div className="ayg-knoppen">
            <Knop href={AANMELDEN} soort="accent" pijl>
              Probeer {PROEFDAGEN} dagen gratis
            </Knop>
            <Knop href={DEMO} soort="rand">
              Bekijk de demo
            </Knop>
          </div>
          <Geruststelling />
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
