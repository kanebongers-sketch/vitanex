import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { adminOfNull } from '@/lib/aiyourgym/api'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { welkomPad } from '@/lib/aiyourgym/links'
import { pakkettenTekst } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import { adresVan } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { vindOpSessie } from '@/lib/aiyourgym/opslag'
import { isTestSessie } from '@/lib/aiyourgym/testbetaling'
import { wachtendeTestbetaling } from '@/lib/aiyourgym/testbetaling-opslag'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { TestbetaalKnop } from '@/components/aiyourgym/aanmelden/TestbetaalKnop'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { TESTBETALING } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

// /aiyourgym/testbetaling?sessie=test_...: de plek van Stripe Checkout zolang
// Stripe er niet is (besluit Kane 23-10-2026). Zegt eerlijk dat er niets wordt
// afgeschreven; geen proefperiode (besluit Kane 30-10-2026); afronden richt de sportschool in en gaat naar de welkomstpagina.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(TESTBETALING)
  return { title: t.metaTitel, robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

function Onbekend({ taal }: { taal: Taal }) {
  const t = TESTBETALING[taal]
  const { AANMELDEN, INLOGGEN } = SITE_PADEN
  return (
    <>
      <h1 className="aan-titel">{t.onbekendKop}</h1>
      <p className="ayg-lead">{t.onbekendUitleg}</p>
      <div className="ayg-knoppen">
        <a href={AANMELDEN} className="ayg-knop ayg-knop--accent">
          {t.opnieuw}
        </a>
        <a href={INLOGGEN} className="ayg-knop ayg-knop--rand">
          {t.inloggen}
        </a>
      </div>
    </>
  )
}

export default async function TestbetalingPagina({ searchParams }: PaginaProps) {
  const sessie = (await searchParams).sessie
  const taal = await getSiteTaal()
  const t = TESTBETALING[taal]
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
          <Onbekend taal={taal} />
        </section>
      </AanmeldSchil>
    )
  }

  const regels = [
    { label: t.rij.sportschool, waarde: a.sportschoolNaam },
    { label: t.rij.adres, waarde: adresVan(a.slug, subdomeinenActief()) },
    { label: t.rij.pakket, waarde: pakkettenTekst(a.pakketten, taal) },
    { label: t.rij.vestigingen, waarde: String(a.aantalVestigingen) },
  ]
  return (
    <AanmeldSchil>
      <section className="aan-pagina aan-welkom ayg-wrap">
        <p className="ayg-label ayg-label--accent">{t.label}</p>
        <h1 className="aan-titel">{t.titel}</h1>
        <div className="aan-test-melding" role="note">
          <ShieldCheck size={20} aria-hidden="true" />
          <p>
            <strong>{t.nietsAf}</strong>
            {t.nietsAfUitleg()}
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
          <CreditCard size={16} aria-hidden="true" />
          {t.naStart}
        </p>
        <TestbetaalKnop sessie={String(sessie)} />
      </section>
    </AanmeldSchil>
  )
}
