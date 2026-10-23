import type { Metadata } from 'next'
import { PAKKETTEN, PROEFDAGEN, vindPakket } from '@/lib/aiyourgym/pakketten'
import { maxVestigingenVoor } from '@/lib/aiyourgym/aanmelding'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { aanmeldbaar, testbetalen } from '@/lib/aiyourgym/testbetaling'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { AanmeldFormulier } from '@/components/aiyourgym/aanmelden/AanmeldFormulier'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import type { PakketKeuze } from '@/components/aiyourgym/aanmelden/types'

// /aiyourgym/aanmelden: een sportschool meldt zich aan. De poort (alleen Kane
// zolang de website uit staat) zit in ../layout.tsx. Welke pakketten online af
// te sluiten zijn, bepaalt de server (Stripe-prijs in env); bedragen tonen we
// nergens (besluit Kane): die ziet de klant pas bij Stripe.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aanmelden | AI Your Gym',
  description: 'Meld je sportschool aan bij AI Your Gym en krijg je eigen omgeving op een eigen adres, zoals aiyourgym.com/jouwgym.',
}

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

export default async function AanmeldenPagina({ searchParams }: PaginaProps) {
  const zoek = await searchParams
  const startPakket = vindPakket(typeof zoek.pakket === 'string' ? zoek.pakket : null)?.sleutel ?? null
  const geannuleerd = zoek.geannuleerd === '1'
  const pakketten: PakketKeuze[] = PAKKETTEN.map((p) => ({
    sleutel: p.sleutel,
    naam: p.naam,
    voorWie: p.voorWie,
    inbegrepen: p.inbegrepen,
    maxVestigingen: maxVestigingenVoor(p.sleutel),
    onbeperkt: p.maxVestigingen === null,
    aanbevolen: p.aanbevolen === true,
    open: aanmeldbaar(p.sleutel),
    test: testbetalen(p.sleutel),
  }))

  return (
    <AanmeldSchil>
      <section className="aan-pagina ayg-wrap">
        <header className="aan-intro">
          <p className="ayg-label ayg-label--accent">{PROEFDAGEN} dagen gratis proberen</p>
          <h1 className="aan-titel">Start je proefperiode in vier korte stappen.</h1>
          <p className="ayg-lead">Kies een pakket, je adres en wie de eigenaar is. Daarna staat je eigen omgeving klaar en leidt een startwizard je door de inrichting.</p>
          <Geruststelling aantal={3} />
        </header>
        {geannuleerd && (
          <p className="aan-melding aan-melding--rustig" role="status">
            Je hebt het betalen afgebroken. Er is niets afgeschreven; vul het formulier opnieuw in als je verder wilt.
          </p>
        )}
        <AanmeldFormulier pakketten={pakketten} proefdagen={PROEFDAGEN} startPakket={startPakket} subdomeinen={subdomeinenActief()} />
      </section>
    </AanmeldSchil>
  )
}
