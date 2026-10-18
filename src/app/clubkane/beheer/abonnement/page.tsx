import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisBeheerdersBeheer, type ClubToegang } from '@/lib/club/toegang'
import { abonnementWeergave, nlDatum, type AbonnementWeergave } from '@/lib/aiyourgym/abonnement'
import { stripeAbonnementVan, vindAbonnement } from '@/lib/aiyourgym/abonnement-opslag'
import { stripeSleutel } from '@/lib/aiyourgym/config'
import { PortaalKnop } from '@/components/club/abonnement/PortaalKnop'
import '@/components/club/abonnement/abonnement.css'

export const metadata: Metadata = { title: 'Abonnement en facturen' }
export const dynamic = 'force-dynamic'

// Het abonnement van de sportschool bij AI Your Gym: pakket, vestigingen en
// status, en de knop naar het Stripe Customer Portal (facturen, betaalgegevens,
// opzeggen). Alleen Kane en de eigenaar; een clubmanager krijgt een 404.

function GeenAbonnement({ t }: { t: ClubToegang }) {
  const eigen = t.userId === t.beheerderId
  const titel = eigen ? 'Eigen omgeving' : t.organisatie.demo ? 'Demo-sportschool' : 'Geen abonnement gevonden'
  const tekst = eigen
    ? `${t.organisatie.naam} gebruikt Club als eigen omgeving. Er is geen abonnement bij AI Your Gym en er komen geen facturen.`
    : t.organisatie.demo
      ? 'Dit is een demo-sportschool om Club te laten zien. Er is geen abonnement en er komen geen facturen.'
      : 'Voor deze sportschool staat geen abonnement bij AI Your Gym. Klopt dat niet? Meld het via Hulp en support.'
  return (
    <section className="club-abo-uitleg" aria-labelledby="abo-geen">
      <h2 id="abo-geen">{titel}</h2>
      <p>{tekst}</p>
      {!eigen && !t.organisatie.demo && (
        <p>
          <Link href="/clubkane/hulp#melden">Vraag of probleem melden</Link>
        </p>
      )}
    </section>
  )
}

function Abonnement({ w, sinds, betalenIngesteld }: { w: AbonnementWeergave; sinds: string; betalenIngesteld: boolean }) {
  return (
    <>
      <section className="club-abo-status" data-toon={w.toon} aria-labelledby="abo-status">
        <p className="club-abo-label" id="abo-status">Status</p>
        <p className="club-abo-waarde">{w.status}</p>
        {w.toelichting && <p className="club-abo-toelichting">{w.toelichting}</p>}
      </section>
      <dl className="club-abo-feiten">
        <div className="club-abo-feit">
          <dt>Pakket</dt>
          <dd>{w.pakket}</dd>
        </div>
        <div className="club-abo-feit">
          <dt>Vestigingen</dt>
          <dd>{w.vestigingen}</dd>
        </div>
        <div className="club-abo-feit">
          <dt>Klant sinds</dt>
          <dd>{sinds}</dd>
        </div>
      </dl>
      {w.portaal && betalenIngesteld && <PortaalKnop />}
      {w.portaal && !betalenIngesteld && <p className="club-melding" role="status">Facturen en betaalgegevens zijn nu niet te openen. Probeer het later opnieuw.</p>}
    </>
  )
}

export default async function AbonnementPagina() {
  const t = await eisBeheerdersBeheer()
  const gelezen = await vindAbonnement(t.admin, t.userId)
  const rij = gelezen.soort === 'gevonden' ? gelezen.rij : null
  const stripe = rij ? await stripeAbonnementVan(rij) : null
  const nu = new Date()
  const sinds = rij && !Number.isNaN(Date.parse(rij.aangemaaktOp)) ? nlDatum(new Date(rij.aangemaaktOp)) : 'Onbekend'

  return (
    <>
      <Link href="/clubkane/beheer" className="club-terug">
        <ArrowLeft size={16} aria-hidden /> Instellingencentrum
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Abonnement en facturen</h1>
          <p>Je pakket bij AI Your Gym, de status van je abonnement en je facturen.</p>
        </div>
      </header>
      <div className="club-abo">
        {gelezen.soort === 'fout' && <p className="club-melding club-melding--fout" role="status">Je abonnement kon niet worden gelezen. Probeer het later opnieuw.</p>}
        {gelezen.soort === 'geen' && <GeenAbonnement t={t} />}
        {rij && <Abonnement w={abonnementWeergave(rij, stripe, nu)} sinds={sinds} betalenIngesteld={stripeSleutel() !== null} />}
      </div>
    </>
  )
}
