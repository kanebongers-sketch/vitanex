import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { adminOfNull } from '@/lib/aiyourgym/api'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { welkomPad } from '@/lib/aiyourgym/links'
import { PROEFDAGEN, vindPakket } from '@/lib/aiyourgym/pakketten'
import { adresVan } from '@/lib/club/kern/subdomein'
import { vindOpSessie } from '@/lib/aiyourgym/opslag'
import { isTestSessie } from '@/lib/aiyourgym/testbetaling'
import { wachtendeTestbetaling } from '@/lib/aiyourgym/testbetaling-opslag'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { TestbetaalKnop } from '@/components/aiyourgym/aanmelden/TestbetaalKnop'

// /aiyourgym/testbetaling?sessie=test_...: de plek van Stripe Checkout zolang
// Stripe er niet is (besluit Kane 23-10-2026). Zegt eerlijk dat er niets wordt
// afgeschreven; afronden richt de sportschool in en gaat naar de welkomstpagina.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Proefperiode starten | AI Your Gym',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

function Onbekend() {
  return (
    <>
      <h1 className="aan-titel">Deze link kennen we niet.</h1>
      <p className="ayg-lead">De aanmelding is verlopen of al afgerond. Meld je opnieuw aan als je wilt starten.</p>
    </>
  )
}

export default async function TestbetalingPagina({ searchParams }: PaginaProps) {
  const sessie = (await searchParams).sessie
  const h = await headers()
  const host = (h.get('x-forwarded-host')?.split(',')[0] ?? h.get('host') ?? '').trim().toLowerCase()
  const admin = adminOfNull()
  const a = admin ? await wachtendeTestbetaling(admin, sessie) : null

  if (!a) {
    // Al afgerond (terugknop, tweede tabblad): gewoon naar de welkomstpagina.
    const klaar = admin && isTestSessie(sessie) ? await vindOpSessie(admin, sessie) : null
    if (klaar?.organisatieId) redirect(welkomPad(host, siteActief(), String(sessie)))
    return (
      <AanmeldSchil>
        <section className="aan-pagina aan-welkom ayg-wrap">
          <Onbekend />
        </section>
      </AanmeldSchil>
    )
  }

  const pakket = vindPakket(a.pakket)
  const regels = [
    { label: 'Sportschool', waarde: a.sportschoolNaam },
    { label: 'Adres', waarde: adresVan(a.slug) },
    { label: 'Pakket', waarde: pakket?.naam ?? a.pakket },
    { label: 'Vestigingen', waarde: String(a.aantalVestigingen) },
  ]
  return (
    <AanmeldSchil>
      <section className="aan-pagina aan-welkom ayg-wrap">
        <p className="ayg-label ayg-label--accent">Laatste stap</p>
        <h1 className="aan-titel">Start je proefperiode.</h1>
        <div className="aan-test-melding" role="note">
          <ShieldCheck size={20} aria-hidden="true" />
          <p>
            <strong>Er wordt niets afgeschreven.</strong> Online betalen is nog niet gekoppeld. Je start nu {PROEFDAGEN} dagen gratis; voor het
            einde daarvan spreken we samen af hoe je verder betaalt.
          </p>
        </div>
        <dl className="aan-test-overzicht ayg-podium">
          {regels.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.waarde}</dd>
            </div>
          ))}
        </dl>
        <p className="aan-uitleg">
          <CreditCard size={16} aria-hidden="true" /> Na het starten staat je eigen omgeving direct klaar en kies je je pincode. Daarna leidt de startwizard je door de inrichting.
        </p>
        <TestbetaalKnop sessie={String(sessie)} />
      </section>
    </AanmeldSchil>
  )
}
