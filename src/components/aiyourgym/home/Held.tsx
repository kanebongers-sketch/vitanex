import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HeldDashboard, OefeningKaartje } from '@/components/aiyourgym/mockups/HeldDashboard'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { Geruststelling, TweeRoutes } from '@/components/aiyourgym/site/Actie'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { HELD } from '@/lib/aiyourgym/taal/woorden/website/held'
import { HeldRoutes } from './HeldRoutes'
import { WisselWoord } from './WisselWoord'

// De opening van de voorpagina: een belofte met wisselend publiek (gym,
// PT-studio, keten ...), een zin, twee routes (zelf gratis proberen of een
// persoonlijke demo plannen), kort wat het risico wegneemt en twee rustige
// routes: overstappen voor wie al software heeft, en de live demo zonder account. Ernaast het
// product zelf: het scherm Vandaag, een oefening in 3D en de ledenapp met QR.
// Teksten in de taal van de pagina (woordenboek HELD), de schermvoorbeelden ook
// (woorden/website/mockups); alleen de coaching uit de bibliotheek van Club is nog Nederlands.

export async function Held() {
  const t = await siteTekst(HELD)
  return (
    <section className="ayg-held" aria-labelledby="held-titel">
      <div className="ayg-wrap ayg-held-raster">
        <div className="ayg-held-tekst ayg-intro">
          <p className="ayg-label ayg-label--accent">{t.label}</p>
          <h1 className="ayg-display" id="held-titel">
            <span className="ayg-sr">{t.titelVoorlezen}</span>
            <span aria-hidden="true" className="ayg-held-kop">
              <span>{t.titelVoor}</span>
              <WisselWoord start={t.titelStart} woorden={t.wisselWoorden} />
              <span>{t.titelNa}</span>
            </span>
          </h1>
          <p className="ayg-lead">{t.lead}</p>
          <TweeRoutes />
          <Geruststelling aantal={3} />
          <HeldRoutes />
        </div>
        <div
          className="ayg-held-beeld aygm"
          role="img"
          aria-label={t.beeldLabel}
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
      <p className="ayg-wrap ayg-held-bijschrift">{t.bijschrift}</p>
    </section>
  )
}
