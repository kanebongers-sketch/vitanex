import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ListChecks } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { OVERSTAPPEN } from '@/lib/aiyourgym/taal/woorden/website/overstappen'
import { StartStappen } from '@/components/aiyourgym/home/StartStappen'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { ImportScherm } from '@/components/aiyourgym/mockups/ImportScherm'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { WatKomtMee } from '@/components/aiyourgym/home/WatKomtMee'
import { WelNiet } from '@/components/aiyourgym/home/WelNiet'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'

// Teksten in beide talen: woorden/website/overstappen.ts. WelNiet, WatKomtMee,
// StartStappen en ImportScherm zijn gedeeld met de voorpagina en de mockups.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(OVERSTAPPEN)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

export default async function OverstappenPagina() {
  const taal = await getSiteTaal()
  const t = OVERSTAPPEN[taal]
  const { AANMELDEN, DEMO_AANVRAGEN, OVERSTAPCHECKLIST } = SITE_PADEN
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst}>
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            {t.begin(PROEFDAGEN)}
          </Knop>
          <Knop href={DEMO_AANVRAGEN} soort="rand">
            {ACTIE[taal].planDemo}
          </Knop>
        </div>
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
      </PaginaKop>
      <section className="ayg-sectie" aria-labelledby="stappen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <div className="ayg-stapel">
            <SectieKop id="stappen-titel" label={t.stappenLabel} titel={t.stappenTitel} />
            <Figuur className="ayg-onthul" label={t.importLabel}>
              <ImportScherm />
            </Figuur>
          </div>
          <ol className="ayg-genummerd">
            {t.stappen.map((s) => (
              <li key={s.titel}>
                <div>
                  <h3 className="ayg-h3">{s.titel}</h3>
                  <p>{s.tekst}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="ayg-wrap">
          <Link href={OVERSTAPCHECKLIST} className="ayg-cl-tip">
            <ListChecks size={20} aria-hidden />
            <span>
              <strong>{t.checklistKop}</strong>
              <span>{t.checklistTekst}</span>
            </span>
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>
      <WelNiet />
      <WatKomtMee />
      <StartStappen metLink={false} />
      <section className="ayg-sectie" id="vragen" aria-labelledby="overstap-vragen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop id="overstap-vragen-titel" label={t.vragenLabel} titel={t.vragenTitel} />
          <Vragen vragen={t.vragen} />
        </div>
      </section>
      <AanmeldBand titel={t.bandTitel} />
    </>
  )
}
