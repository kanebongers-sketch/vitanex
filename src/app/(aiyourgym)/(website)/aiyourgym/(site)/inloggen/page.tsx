import type { Metadata } from 'next'
import Link from 'next/link'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Knop, PaginaKop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, DEMO_AANVRAGEN } from '@/components/aiyourgym/site/paden'

// /inloggen op aiyourgym.com: hoe een sportschool inlogt. Er is geen algemene
// inlogpagina met wachtwoord; je logt in met de persoonlijke link die je na het
// aanmelden krijgt. Deze pagina blijft op de website zelf en wijst nergens
// anders heen.

export const metadata: Metadata = {
  title: 'Inloggen',
  description: 'Zo log je in op AI Your Gym: met de persoonlijke inloglink die je na het aanmelden krijgt en je eigen pincode.',
}

const STAPPEN = [
  {
    titel: 'Je persoonlijke link',
    tekst: 'Na het aanmelden staat je persoonlijke inloglink op de welkomstpagina. Sturen we je een welkomstmail, dan staat hij daar ook in. Bewaar hem goed en deel hem met niemand.',
  },
  {
    titel: 'Kies je pincode',
    tekst: 'Open de link en kies een pincode van 6 cijfers. Je krijgt een controlecode van 4 cijfers: noem die aan ons, dan zetten wij je pincode aan.',
  },
  {
    titel: 'Log in',
    tekst: 'Daarna log je met dezelfde link en je pincode in op de omgeving van je sportschool.',
  },
] as const

function LinkKwijt() {
  const { telefoon, email } = AYG_CONTACT
  if (heeftContact()) {
    return (
      <p>
        Ben je je link kwijt? Je bereikt ons op{' '}
        {telefoon && <a href={telLink(telefoon)}>{telefoon}</a>}
        {telefoon && email && ' of '}
        {email && <a href={`mailto:${email}`}>{email}</a>}. We maken dan een nieuwe link voor je.
      </p>
    )
  }
  return (
    <p>
      Ben je je link kwijt? Laat het ons weten via het formulier bij <Link href={DEMO_AANVRAGEN}>Plan een gratis demo</Link> en zet in je
      opmerking dat het om je inloglink gaat. We maken dan een nieuwe link voor je.
    </p>
  )
}

export default function InloggenPagina() {
  return (
    <>
      <PaginaKop
        label="Inloggen"
        titel="Inloggen met je eigen link."
        tekst="Er is geen algemene inlogpagina met een wachtwoord. Je logt in met de persoonlijke link die je na het aanmelden krijgt, plus een pincode die je zelf kiest."
      >
        {!CLUB_EIGEN_LOGIN && (
          <p className="ayg-klein" role="note">
            Inloggen opent na de lancering. Je link werkt dan meteen.
          </p>
        )}
      </PaginaKop>
      <section className="ayg-sectie" aria-labelledby="inloggen-stappen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop id="inloggen-stappen-titel" label="Zo werkt het" titel="In drie stappen binnen." />
          <ol className="ayg-genummerd">
            {STAPPEN.map((s) => (
              <li key={s.titel}>
                <div>
                  <h3 className="ayg-h3">{s.titel}</h3>
                  <p>{s.tekst}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="ayg-sectie--krap" aria-label="Hulp bij inloggen">
        <div className="ayg-wrap ayg-tekst">
          <h2>Link kwijt</h2>
          <LinkKwijt />
          <h2>Lid van een sportschool</h2>
          <p>Ben je lid? Dan krijg je de link naar de ledenapp van je eigen sportschool. Vraag hem aan de balie of aan je trainer.</p>
          <h2>Nog geen account</h2>
          <p>Probeer AI Your Gym {PROEFDAGEN} dagen gratis. Na het aanmelden krijg je meteen je persoonlijke link.</p>
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
