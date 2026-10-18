import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { CheckCircle2, Clock, KeyRound, LoaderCircle } from 'lucide-react'
import { haalWelkom, type Welkom } from '@/lib/aiyourgym/welkom'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { Kopieer } from '@/components/aiyourgym/aanmelden/Kopieer'
import { Ververs } from '@/components/aiyourgym/aanmelden/Ververs'

// /aiyourgym/welkom?sessie=cs_...: na Stripe Checkout. Toont de persoonlijke
// inloglink naar het portaal. De sessie staat in de URL: nooit in zoekmachines
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
        {w.sportschool} heeft een eigen omgeving op <strong>{w.adres}</strong>, met een eerste vestiging en een basisbibliotheek met oefeningen.
      </p>
      <div className="aan-link ayg-podium">
        <p className="aan-samen-label">
          <KeyRound size={15} aria-hidden="true" /> Je persoonlijke inloglink
        </p>
        {w.link ? (
          <>
            <p className="aan-link-tekst">{w.link}</p>
            <div className="ayg-knoppen">
              <Kopieer tekst={w.link} />
            </div>
          </>
        ) : (
          <p className="aan-link-tekst aan-link-tekst--rustig">Je link maken we voor je klaar; je krijgt hem van ons.</p>
        )}
      </div>
      <ol className="ayg-genummerd aan-uitleg-lijst">
        <li>Bewaar de link goed en deel hem met niemand. Hij is alleen voor jou.</li>
        {w.loginOpen ? (
          <>
            <li>Open de link en kies een pincode van 6 cijfers.</li>
            <li>Je krijgt een controlecode van 4 cijfers. Noem die aan ons: daarna zetten wij je pincode aan en log je in.</li>
          </>
        ) : (
          <li>Inloggen opent na de lancering. Dan kies je via deze link een pincode van 6 cijfers en zetten wij hem aan zodra je ons de controlecode noemt.</li>
        )}
        <li>Na het inloggen start de startwizard: in ongeveer een kwartier zet je huisstijl, vestigingen, lessen, team en leden neer. Elke stap kun je overslaan en later afmaken.</li>
      </ol>
    </>
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
    verlopen: { kop: 'Deze pagina is verlopen.', uitleg: 'Om veiligheidsredenen tonen we de inloglink hier maar een week. Neem contact met ons op, dan helpen we je verder.' },
    gestopt: { kop: 'Dit abonnement is beeindigd.', uitleg: 'Wil je opnieuw starten? Meld je dan opnieuw aan.' },
  }[w.soort]
  return (
    <>
      <Clock size={36} strokeWidth={1.7} aria-hidden="true" className="aan-klaar-icoon" />
      <h1 className="aan-titel">{tekst.kop}</h1>
      <p className="ayg-lead">{tekst.uitleg}</p>
    </>
  )
}

export default async function WelkomPagina({ searchParams }: PaginaProps) {
  const zoek = await searchParams
  const h = await headers()
  const host = (h.get('x-forwarded-host')?.split(',')[0] ?? h.get('host') ?? '').trim().toLowerCase()
  const w = await haalWelkom(zoek.sessie, host, new Date())
  return (
    <AanmeldSchil>
      <section className="aan-pagina aan-welkom ayg-wrap">{w.soort === 'klaar' ? <Klaar w={w} /> : <Melding w={w} />}</section>
    </AanmeldSchil>
  )
}
