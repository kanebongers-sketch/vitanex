import type { Metadata } from 'next'
import Link from 'next/link'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Knop, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { InlogFormulier } from '@/components/aiyourgym/inloggen/InlogFormulier'
import { AANMELDEN, DEMO_AANVRAGEN } from '@/components/aiyourgym/site/paden'

// /inloggen op aiyourgym.com: een sportschool logt in met e-mailadres en
// wachtwoord (besluit Kane 23-10-2026). Leden gebruiken de ledenapp van hun
// eigen sportschool.

export const metadata: Metadata = {
  title: 'Inloggen',
  description: 'Log in op AI Your Gym met je e-mailadres en wachtwoord.',
}

function WachtwoordVergeten() {
  const { telefoon, email } = AYG_CONTACT
  if (heeftContact()) {
    return (
      <p>
        Wachtwoord vergeten? Je bereikt ons op{' '}
        {telefoon && <a href={telLink(telefoon)}>{telefoon}</a>}
        {telefoon && email && ' of '}
        {email && <a href={`mailto:${email}`}>{email}</a>}. We helpen je dan aan een nieuw wachtwoord.
      </p>
    )
  }
  return (
    <p>
      Ben je je link kwijt? Laat het ons weten via het formulier bij <Link href={DEMO_AANVRAGEN}>Plan een gratis demo</Link> en zet in je
      opmerking dat het om je inloglink gaat. We helpen je dan aan een nieuw wachtwoord.
    </p>
  )
}

export default function InloggenPagina() {
  return (
    <>
      <PaginaKop label="Inloggen" titel="Welkom terug." tekst="Log in met het e-mailadres en wachtwoord van je account.">
        {!CLUB_EIGEN_LOGIN && (
          <p className="ayg-klein" role="note">
            Inloggen opent na de lancering.
          </p>
        )}
      </PaginaKop>
      <section className="ayg-sectie--krap" aria-label="Inloggen">
        <div className="ayg-wrap">
          <InlogFormulier />
        </div>
      </section>
      <section className="ayg-sectie--krap" aria-label="Hulp bij inloggen">
        <div className="ayg-wrap ayg-tekst">
          <h2>Wachtwoord vergeten</h2>
          <WachtwoordVergeten />
          <h2>Lid van een sportschool</h2>
          <p>Ben je lid? Dan log je in via de ledenapp van je eigen sportschool. Vraag de link aan de balie of aan je trainer.</p>
          <h2>Nog geen account</h2>
          <p>Probeer AI Your Gym {PROEFDAGEN} dagen gratis. Je kiest je wachtwoord bij het aanmelden en bent daarna meteen binnen.</p>
          <div className="ayg-knoppen">
            <Knop href={AANMELDEN} soort="accent" pijl>
              Probeer gratis
            </Knop>
          </div>
        </div>
      </section>
    </>
  )
}
