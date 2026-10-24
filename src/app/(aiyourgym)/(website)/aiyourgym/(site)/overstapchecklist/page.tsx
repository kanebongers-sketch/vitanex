import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { CHECKLIST } from '@/lib/aiyourgym/taal/woorden/website/overstapchecklist'
import { Overstapchecklist } from '@/components/aiyourgym/hulpmiddel/Overstapchecklist'
import { GERUST_BIJ_KNOP, Geruststelling, TweeRoutes } from '@/components/aiyourgym/site/Actie'
import { PaginaKop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'

// Een gratis hulpmiddel zonder poort (concurrentenonderzoek item 14): de
// checklist werkt zonder account of e-mailadres, de vinkjes blijven in de
// browser van de bezoeker. Daarna pas de twee routes. Inhoud en rekenregels:
// src/lib/aiyourgym/overstapchecklist.ts (beide talen).

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(CHECKLIST)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

export default async function OverstapchecklistPagina() {
  const taal = await getSiteTaal()
  const t = CHECKLIST[taal]
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst} />
      <section className="ayg-sectie--krap ayg-cl-print" aria-label={t.sectie}>
        <p className="ayg-cl-printkop" aria-hidden>
          {t.printkop}
        </p>
        <Overstapchecklist />
      </section>
      <section className="ayg-sectie ayg-podium ayg-cl-verder" aria-labelledby="cl-verder-titel">
        <div className="ayg-wrap ayg-stapel">
          <SectieKop id="cl-verder-titel" label={t.verderLabel} titel={t.verderTitel} tekst={t.verderTekst} />
          <TweeRoutes />
          <Geruststelling aantal={GERUST_BIJ_KNOP} />
          <Link href={SITE_PADEN.OVERSTAPPEN} className="ayg-pijllink">
            {t.zoWerkt} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  )
}
