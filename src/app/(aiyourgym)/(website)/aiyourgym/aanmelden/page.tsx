import type { Metadata } from 'next'
import { PAKKETTEN, leesPakketKeuze } from '@/lib/aiyourgym/pakketten'
import { MAX_NAAM } from '@/lib/aiyourgym/aanmelding'
import { afsluitbaar, bundelAfsluitbaar } from '@/lib/aiyourgym/config'
import { testbetalingAan } from '@/lib/aiyourgym/testbetaling'
import { subdomeinenActief } from '@/lib/aiyourgym/schakelaar'
import { AanmeldSchil } from '@/components/aiyourgym/aanmelden/AanmeldSchil'
import { AanmeldFormulier } from '@/components/aiyourgym/aanmelden/AanmeldFormulier'
import { Geruststelling } from '@/components/aiyourgym/site/Actie'
import type { PakketKeuze } from '@/components/aiyourgym/aanmelden/types'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { AANMELDEN } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'

// /aiyourgym/aanmelden: een sportschool meldt zich aan. De poort (alleen Kane
// zolang de website uit staat) zit in ../layout.tsx. De sportschool kiest een of
// meer losse pakketten (besluit Kane 29-10-2026). Welke online af te sluiten
// zijn, bepaalt de server (Stripe-prijs in env); bedragen tonen we nergens
// (besluit Kane): die ziet de klant pas bij Stripe.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(AANMELDEN)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

interface PaginaProps {
  searchParams: Promise<{ [sleutel: string]: string | string[] | undefined }>
}

export default async function AanmeldenPagina({ searchParams }: PaginaProps) {
  const [zoek, taal] = await Promise.all([searchParams, getSiteTaal()])
  const t = AANMELDEN[taal]
  // ?pakketten=lessen,groei (prijzenpagina); ?pakket= voor oude links.
  const startPakketten = leesPakketKeuze(zoek.pakketten ?? zoek.pakket) ?? []
  const geannuleerd = zoek.geannuleerd === '1'
  // Naam uit de oproep op de voorpagina; alleen als begin van het veld, de controle blijft in het formulier.
  const startNaam = typeof zoek.naam === 'string' ? zoek.naam.trim().slice(0, MAX_NAAM) : ''
  const pakketten: PakketKeuze[] = PAKKETTEN.map((p) => ({
    sleutel: p.sleutel,
    naam: p.naam,
    voorWie: p.voorWie,
    inbegrepen: p.inbegrepen,
    stripe: afsluitbaar(p.sleutel),
  }))
  // De testbetaling geldt voor een keuze waarvan niet elk pakket een Stripe-prijs heeft.
  const testAan = testbetalingAan()

  return (
    <AanmeldSchil>
      <section className="aan-pagina ayg-wrap">
        <header className="aan-intro">
          <p className="ayg-label ayg-label--accent">{t.label}</p>
          <h1 className="aan-titel">{t.titel}</h1>
          <p className="ayg-lead">{t.lead}</p>
          <Geruststelling aantal={3} />
        </header>
        {geannuleerd && (
          <p className="aan-melding aan-melding--rustig" role="status">
            {t.geannuleerd}
          </p>
        )}
        <AanmeldFormulier pakketten={pakketten} startPakketten={startPakketten} testAan={testAan} bundel={bundelAfsluitbaar()} subdomeinen={subdomeinenActief()} startNaam={startNaam} />
      </section>
    </AanmeldSchil>
  )
}
