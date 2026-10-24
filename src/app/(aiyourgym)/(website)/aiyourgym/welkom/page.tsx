import type { Metadata } from 'next'
import { CheckCircle2, Clock, KeyRound, LoaderCircle } from 'lucide-react'
import { haalWelkom, type Welkom } from '@/lib/aiyourgym/welkom'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { WELKOM } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { Ververs } from '@/components/aiyourgym/aanmelden/Ververs'

// /aiyourgym/welkom?sessie=cs_... (of test_...): na het betalen. Zegt dat de
// sportschool klaarstaat en wijst naar inloggen met e-mailadres en wachtwoord. De sessie staat in de URL: nooit in zoekmachines
// en nooit als referrer naar een andere site.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(WELKOM)
  return { title: t.metaTitel, robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

function Klaar({ w, taal }: { w: Extract<Welkom, { soort: 'klaar' }>; taal: Taal }) {
  const t = WELKOM[taal]
  return (
    <>
      <CheckCircle2 size={40} strokeWidth={1.7} aria-hidden="true" className="aan-klaar-icoon" />
      <p className="ayg-label">{t.label}</p>
      <h1 className="aan-titel">{t.titel}</h1>
      <p className="ayg-lead">
        {w.sportschool}
        {t.omgeving.voor}
        <strong>{w.adres}</strong>
        {t.omgeving.na}
      </p>
      <div className="aan-link ayg-podium">
        <p className="aan-samen-label">
          <KeyRound size={15} aria-hidden="true" /> {t.inloggen}
        </p>
        <p>
          {t.logIn.voor}
          <strong>{w.email}</strong>
          {t.logIn.na}
        </p>
        {w.loginOpen && (
          <div className="ayg-knoppen">
            <a href={w.inlogUrl} className="ayg-knop ayg-knop--accent">
              {t.inloggenStarten}
            </a>
          </div>
        )}
      </div>
      <ol className="ayg-genummerd aan-uitleg-lijst">
        {!w.loginOpen && <li>{t.naLancering}</li>}
        <li>{t.wizard}</li>
        <li>{t.team}</li>
      </ol>
      {heeftContact() && <Contact taal={taal} />}
    </>
  )
}

/** Hoe je ons bereikt bij vragen; alleen als Kane contactgegevens heeft ingevuld. */
function Contact({ taal }: { taal: Taal }) {
  const { telefoon, email } = AYG_CONTACT
  const t = WELKOM[taal]
  return (
    <p className="ayg-klein">
      {t.bereik}
      {telefoon && <a href={telLink(telefoon)}>{telefoon}</a>}
      {telefoon && email && t.of}
      {email && <a href={`mailto:${email}`}>{email}</a>}.
    </p>
  )
}

function Melding({ w, taal }: { w: Exclude<Welkom, { soort: 'klaar' }>; taal: Taal }) {
  const t = WELKOM[taal]
  const { AANMELDEN, INLOGGEN } = SITE_PADEN
  if (w.soort === 'bezig') {
    return (
      <>
        <LoaderCircle size={36} aria-hidden="true" className="aan-klaar-icoon aan-draai" />
        <h1 className="aan-titel">{t.bezigKop}</h1>
        <p className="ayg-lead" role="status">{t.bezigUitleg}</p>
        <Ververs />
      </>
    )
  }
  const tekst = t[w.soort]
  return (
    <>
      <Clock size={36} strokeWidth={1.7} aria-hidden="true" className="aan-klaar-icoon" />
      <h1 className="aan-titel">{tekst.kop}</h1>
      <p className="ayg-lead">{tekst.uitleg}</p>
      <div className="ayg-knoppen">
        {w.soort === 'gestopt' ? (
          <a href={AANMELDEN} className="ayg-knop ayg-knop--accent">
            {t.opnieuwAanmelden}
          </a>
        ) : (
          <a href={INLOGGEN} className="ayg-knop ayg-knop--accent">
            {t.naarInloggen}
          </a>
        )}
      </div>
      {heeftContact() && <Contact taal={taal} />}
    </>
  )
}

export default async function WelkomPagina({ searchParams }: PaginaProps) {
  const zoek = await searchParams
  const [w, taal] = await Promise.all([haalWelkom(zoek.sessie, new Date()), getSiteTaal()])
  return (
    <AanmeldSchil>
      <section className="aan-pagina aan-welkom ayg-wrap">{w.soort === 'klaar' ? <Klaar w={w} taal={taal} /> : <Melding w={w} taal={taal} />}</section>
    </AanmeldSchil>
  )
}
