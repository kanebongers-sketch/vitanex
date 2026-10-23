import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Overstapchecklist } from '@/components/aiyourgym/hulpmiddel/Overstapchecklist'
import { GERUST_BIJ_KNOP, Geruststelling, TweeRoutes } from '@/components/aiyourgym/site/Actie'
import { PaginaKop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { OVERSTAPPEN } from '@/components/aiyourgym/site/paden'

// Een gratis hulpmiddel zonder poort (concurrentenonderzoek item 14): de
// checklist werkt zonder account of e-mailadres, de vinkjes blijven in de
// browser van de bezoeker. Daarna pas de twee routes. Inhoud en rekenregels:
// src/lib/aiyourgym/overstapchecklist.ts.

export const metadata: Metadata = {
  title: 'Overstapchecklist',
  description:
    'Gratis checklist voor sportscholen die overstappen naar nieuwe clubsoftware: voorbereiden, gegevens verzamelen, inrichten, leden meenemen en de eerste maand. Zonder account, ook te printen.',
}

export default function OverstapchecklistPagina() {
  return (
    <>
      <PaginaKop
        label="Gratis hulpmiddel"
        titel="De overstapchecklist."
        tekst="Alles wat je regelt als je overstapt naar nieuwe clubsoftware, in vijf fases. Vink af wat klaar is en print hem voor je team. Gratis, zonder account en zonder e-mailadres."
      />
      <section className="ayg-sectie--krap ayg-cl-print" aria-label="Checklist">
        <p className="ayg-cl-printkop" aria-hidden>
          Overstapchecklist | AI Your Gym
        </p>
        <Overstapchecklist />
      </section>
      <section className="ayg-sectie ayg-podium ayg-cl-verder" aria-labelledby="cl-verder-titel">
        <div className="ayg-wrap ayg-stapel">
          <SectieKop
            id="cl-verder-titel"
            label="En dan"
            titel="Klaar om over te stappen?"
            tekst="Probeer AI Your Gym in je eigen omgeving, of laat het je eerst persoonlijk zien. De checklist werkt hoe dan ook."
          />
          <TweeRoutes />
          <Geruststelling aantal={GERUST_BIJ_KNOP} />
          <Link href={OVERSTAPPEN} className="ayg-pijllink">
            Zo werkt overstappen in AI Your Gym <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  )
}
