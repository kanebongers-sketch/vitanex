import type { Metadata } from 'next'
import { CheckCircle2, Clock, KeyRound, LoaderCircle } from 'lucide-react'
import { haalWelkom, type Welkom } from '@/lib/aiyourgym/welkom'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { AANMELDEN, INLOGGEN } from '@/components/aiyourgym/site/paden'
import { Ververs } from '@/components/aiyourgym/aanmelden/Ververs'

// /aiyourgym/welkom?sessie=cs_... (of test_...): na het betalen. Zegt dat de
// sportschool klaarstaat en wijst naar inloggen met e-mailadres en wachtwoord. De sessie staat in de URL: nooit in zoekmachines
// en nooit als referrer naar een andere site.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Welkom | AI Your Gym',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

function Klaar({ w }: { w: Extract<Welkom, { soort: 'klaar' }> }) {
  return (
    <>
      <CheckCircle2 size={40} strokeWidth={1.7} aria-hidden="true" className="aan-klaar-icoon" />
      <p className="ayg-label">Welkom bij AI Your Gym</p>
      <h1 className="aan-titel">Je sportschool staat klaar.</h1>
      <p className="ayg-lead">
        {w.adresActief ? (
          <>
            {w.sportschool} heeft een eigen omgeving op <strong>{w.adres}</strong>, met een eerste vestiging en een basisbibliotheek met oefeningen.
          </>
        ) : (
          <>
            {w.sportschool} heeft een eigen omgeving met een eerste vestiging en een basisbibliotheek met oefeningen. Je adres <strong>{w.adres}</strong> is voor je vastgelegd; tot het actief is werk je op aiyourgym.com.
          </>
        )}
      </p>
      <div className="aan-link ayg-podium">
        <p className="aan-samen-label">
          <KeyRound size={15} aria-hidden="true" /> Inloggen
        </p>
        <p>
          Log in met <strong>{w.email}</strong> en het wachtwoord dat je bij het aanmelden koos.
        </p>
        {w.loginOpen && (
          <div className="ayg-knoppen">
            <a href={INLOGGEN} className="ayg-knop ayg-knop--accent">
              Inloggen en starten
            </a>
          </div>
        )}
      </div>
      <ol className="ayg-genummerd aan-uitleg-lijst">
        {!w.loginOpen && <li>Inloggen opent na de lancering. Je account staat al klaar.</li>}
        <li>Na het inloggen start de startwizard: in ongeveer een kwartier zet je huisstijl, vestigingen, lessen, team en leden neer. Elke stap kun je overslaan en later afmaken.</li>
        <li>Je team nodig je daarna uit vanuit Instellingen.</li>
      </ol>
      {heeftContact() && <Contact />}
    </>
  )
}

/** Hoe je ons bereikt bij vragen; alleen als Kane contactgegevens heeft ingevuld. */
function Contact() {
  const { telefoon, email } = AYG_CONTACT
  return (
    <p className="ayg-klein">
      Je bereikt ons op{' '}
      {telefoon && <a href={telLink(telefoon)}>{telefoon}</a>}
      {telefoon && email && ' of '}
      {email && <a href={`mailto:${email}`}>{email}</a>}.
    </p>
  )
}

function Melding({ w }: { w: Exclude<Welkom, { soort: 'klaar' }> }) {
  if (w.soort === 'bezig') {
    return (
      <>
        <LoaderCircle size={36} aria-hidden="true" className="aan-klaar-icoon aan-draai" />
        <h1 className="aan-titel">We zetten je sportschool klaar.</h1>
        <p className="ayg-lead" role="status">Dit duurt meestal maar even. Deze pagina ververst vanzelf.</p>
        <Ververs />
      </>
    )
  }
  const tekst = {
    onbekend: { kop: 'Deze link kennen we niet.', uitleg: 'Controleer of je de hele link hebt, of neem contact met ons op.' },
    verlopen: { kop: 'Deze pagina is verlopen.', uitleg: 'Om veiligheidsredenen tonen we deze pagina maar een week. Je account blijft gewoon werken: log in met je e-mailadres en wachtwoord. Lukt dat niet, neem dan contact met ons op.' },
    gestopt: { kop: 'Dit abonnement is beeindigd.', uitleg: 'Wil je opnieuw starten? Meld je dan opnieuw aan.' },
  }[w.soort]
  return (
    <>
      <Clock size={36} strokeWidth={1.7} aria-hidden="true" className="aan-klaar-icoon" />
      <h1 className="aan-titel">{tekst.kop}</h1>
      <p className="ayg-lead">{tekst.uitleg}</p>
      <div className="ayg-knoppen">
        {w.soort === 'gestopt' ? (
          <a href={AANMELDEN} className="ayg-knop ayg-knop--accent">
            Opnieuw aanmelden
          </a>
        ) : (
          <a href={INLOGGEN} className="ayg-knop ayg-knop--accent">
            Naar inloggen
          </a>
        )}
      </div>
      {heeftContact() && <Contact />}
    </>
  )
}

export default async function WelkomPagina({ searchParams }: PaginaProps) {
  const zoek = await searchParams
  const w = await haalWelkom(zoek.sessie, new Date())
  return (
    <AanmeldSchil>
      <section className="aan-pagina aan-welkom ayg-wrap">{w.soort === 'klaar' ? <Klaar w={w} /> : <Melding w={w} />}</section>
    </AanmeldSchil>
  )
}
