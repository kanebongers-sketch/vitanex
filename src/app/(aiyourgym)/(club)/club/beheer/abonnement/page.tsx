import type { Metadata } from 'next'
import Link from 'next/link'
import { eisBeheerdersBeheer, type ClubToegang } from '@/lib/club/toegang'
import { abonnementWeergave, type AbonnementWeergave } from '@/lib/aiyourgym/abonnement'
import { stripeAbonnementVan, vindAbonnement } from '@/lib/aiyourgym/abonnement-opslag'
import { stripeSleutel } from '@/lib/aiyourgym/config'
import { PortaalKnop } from '@/components/club/abonnement/PortaalKnop'
import '@/components/club/abonnement/abonnement.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { BEHEER_PAGINAS } from '@/lib/aiyourgym/taal/woorden/club/beheer-paginas'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('abonnement')
}

type AboTekst = (typeof BEHEER_PAGINAS)['nl']['abonnement']
export const dynamic = 'force-dynamic'

// Het abonnement van de sportschool bij AI Your Gym: pakket, vestigingen en
// status, en de knop naar het Stripe Customer Portal (facturen, betaalgegevens,
// opzeggen). Alleen Kane en de eigenaar; een clubmanager krijgt een 404.

function GeenAbonnement({ t, a }: { t: ClubToegang; a: AboTekst }) {
  const eigen = t.userId === t.beheerderId
  const titel = eigen ? a.eigenTitel : t.organisatie.demo ? a.demoTitel : a.geenTitel
  const tekst = eigen ? a.eigenTekst(t.organisatie.naam) : t.organisatie.demo ? a.demoTekst : a.geenTekst
  return (
    <section className="club-abo-uitleg" aria-labelledby="abo-geen">
      <h2 id="abo-geen">{titel}</h2>
      <p>{tekst}</p>
      {!eigen && !t.organisatie.demo && (
        <p>
          <Link href="/club/hulp#melden">{a.melden}</Link>
        </p>
      )}
    </section>
  )
}

function Abonnement({ w, sinds, betalenIngesteld, a }: { w: AbonnementWeergave; sinds: string; betalenIngesteld: boolean; a: AboTekst }) {
  return (
    <>
      <section className="club-abo-status" data-toon={w.toon} aria-labelledby="abo-status">
        <p className="club-abo-label" id="abo-status">{a.status}</p>
        <p className="club-abo-waarde">{w.status}</p>
        {w.toelichting && <p className="club-abo-toelichting">{w.toelichting}</p>}
      </section>
      <dl className="club-abo-feiten">
        <div className="club-abo-feit">
          <dt>{a.pakket}</dt>
          <dd>{w.pakket}</dd>
        </div>
        <div className="club-abo-feit">
          <dt>{a.vestigingen}</dt>
          <dd>{w.vestigingen}</dd>
        </div>
        <div className="club-abo-feit">
          <dt>{a.klantSinds}</dt>
          <dd>{sinds}</dd>
        </div>
      </dl>
      {w.portaal && betalenIngesteld && <PortaalKnop />}
      {w.portaal && !betalenIngesteld && <p className="club-melding" role="status">{a.portaalDicht}</p>}
    </>
  )
}

export default async function AbonnementPagina() {
  const t = await eisBeheerdersBeheer()
  const gelezen = await vindAbonnement(t.admin, t.userId)
  const rij = gelezen.soort === 'gevonden' ? gelezen.rij : null
  const stripe = rij ? await stripeAbonnementVan(rij) : null
  const nu = new Date()
  const taal = await getTaal()
  const a = BEHEER_PAGINAS[taal].abonnement
  const titel = (await instelKop('abonnement')).titel
  const sinds = rij && !Number.isNaN(Date.parse(rij.aangemaaktOp)) ? formatDatum(rij.aangemaaktOp, taal) : a.onbekend

  return (
    <>
      <InstelKruimel id="abonnement" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{titel}</h1>
          <p>{a.intro}</p>
        </div>
      </header>
      <div className="club-abo">
        {gelezen.soort === 'fout' && <p className="club-melding club-melding--fout" role="status">{a.leesFout}</p>}
        {gelezen.soort === 'geen' && <GeenAbonnement t={t} a={a} />}
        {rij && <Abonnement w={abonnementWeergave(rij, stripe, nu, taal)} sinds={sinds} betalenIngesteld={stripeSleutel() !== null} a={a} />}
      </div>
    </>
  )
}
