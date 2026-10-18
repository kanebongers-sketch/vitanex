import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HeldDashboard, OefeningKaartje } from '@/components/aiyourgym/mockups/HeldDashboard'
import { RepdbBron, Toestel } from '@/components/aiyourgym/mockups/kaders'
import { DOELGROEPEN } from '@/components/aiyourgym/inhoud/doelgroepen'
import { Geruststelling, TweeRoutes } from '@/components/aiyourgym/site/Actie'
import { WisselWoord } from './WisselWoord'

// De opening van de voorpagina: een belofte met wisselend publiek (gym,
// PT-studio, keten ...), twee routes (zelf gratis proberen of een persoonlijke
// demo plannen) en direct eronder wat het risico wegneemt. Ernaast het product
// zelf: het scherm Vandaag, een oefening met coaching en de ledenapp met QR.

const WOORDEN = DOELGROEPEN.map((d) => d.kort)

export function Held() {
  return (
    <section className="ayg-held" aria-labelledby="held-titel">
      <div className="ayg-wrap ayg-held-raster">
        <div className="ayg-held-tekst ayg-intro">
          <p className="ayg-label ayg-label--accent">Clubsoftware voor sportscholen</p>
          <h1 className="ayg-display" id="held-titel">
            <span className="ayg-sr">Alles voor je sportschool, in een systeem.</span>
            <span aria-hidden="true" className="ayg-held-kop">
              <span>Alles voor je</span>
              <WisselWoord start="sportschool" woorden={WOORDEN} />
              <span>in een systeem.</span>
            </span>
          </h1>
          <p className="ayg-lead">
            Check-in, groepslessen, personeelsrooster, trainingsschema&rsquo;s met coaching en een ledenapp in je eigen naam en kleuren.
            Je team werkt vanuit een plek, je leden hebben jouw app op zak.
          </p>
          <TweeRoutes />
          <Geruststelling />
        </div>
        <div
          className="ayg-held-beeld aygm"
          role="img"
          aria-label="AI Your Gym in een samengesteld beeld: het scherm Vandaag met tegels, de lessen van de dag met bezetting en een ledenkaart, een oefening uit een trainingsschema met genummerde kernpunten, en de ledenapp op een telefoon met de QR-code om in te checken"
        >
          <div className="ayg-held-venster">
            <HeldDashboard />
          </div>
          <div className="ayg-held-oef">
            <OefeningKaartje />
          </div>
          <Toestel tab="Home" className="ayg-held-toestel">
            <AppHome />
          </Toestel>
        </div>
      </div>
      <p className="ayg-wrap ayg-held-bijschrift">
        Schermvoorbeeld met voorbeeldgegevens · <RepdbBron />
      </p>
    </section>
  )
}
