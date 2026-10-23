import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HeldDashboard, OefeningKaartje } from '@/components/aiyourgym/mockups/HeldDashboard'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { DOELGROEPEN } from '@/components/aiyourgym/inhoud/doelgroepen'
import { Geruststelling, TweeRoutes } from '@/components/aiyourgym/site/Actie'
import { HeldRoutes } from './HeldRoutes'
import { WisselWoord } from './WisselWoord'

// De opening van de voorpagina: een belofte met wisselend publiek (gym,
// PT-studio, keten ...), een zin, twee routes (zelf gratis proberen of een
// persoonlijke demo plannen), kort wat het risico wegneemt en twee rustige
// routes: overstappen voor wie al software heeft, en de live demo zonder account. Ernaast het
// product zelf: het scherm Vandaag, een oefening in 3D en de ledenapp met QR.

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
            Check-in, lessen, rooster, trainingsschema&rsquo;s met coaching en een ledenapp in jouw naam en kleuren.
          </p>
          <TweeRoutes />
          <Geruststelling aantal={3} />
          <HeldRoutes />
        </div>
        <div
          className="ayg-held-beeld aygm"
          role="img"
          aria-label="AI Your Gym in een samengesteld beeld: het scherm Vandaag met tegels, de lessen van de dag met bezetting en een ledenkaart, een oefening uit een trainingsschema als 3D-beeld met genummerde kernpunten, en de ledenapp op een telefoon met de QR-code om in te checken"
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
        Schermvoorbeeld met voorbeeldgegevens
      </p>
    </section>
  )
}
