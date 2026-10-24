import type { Metadata } from 'next'
import Link from 'next/link'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { AYG_CONTACT, heeftContact, telLink } from '@/lib/aiyourgym/contact'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { INLOGGEN } from '@/lib/aiyourgym/taal/woorden/website/inloggen'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { InlogFormulier } from '@/components/aiyourgym/inloggen/InlogFormulier'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'

// /inloggen op aiyourgym.com: een sportschool logt in met e-mailadres en
// wachtwoord (besluit Kane 23-10-2026). Leden gebruiken de ledenapp van hun
// eigen sportschool.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(INLOGGEN)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

function WachtwoordVergeten({ taal }: { taal: Taal }) {
  const { telefoon, email } = AYG_CONTACT
  const t = INLOGGEN[taal]
  if (heeftContact()) {
    return (
      <p>
        {t.bereik}
        {telefoon && <a href={telLink(telefoon)}>{telefoon}</a>}
        {telefoon && email && t.of}
        {email && <a href={`mailto:${email}`}>{email}</a>}
        {t.helpen}
      </p>
    )
  }
  return (
    <p>
      {t.formulier.voor}
      <Link href={SITE_PADEN.DEMO_AANVRAGEN}>{t.formulier.link}</Link>
      {t.formulier.na}
    </p>
  )
}

export default async function InloggenPagina() {
  const taal = await getSiteTaal()
  const t = INLOGGEN[taal]
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst}>
        {!CLUB_EIGEN_LOGIN && (
          <p className="ayg-klein" role="note">
            {t.naLancering}
          </p>
        )}
      </PaginaKop>
      <section className="ayg-sectie--krap ayg-inlog-sectie" aria-label={t.label}>
        <div className="ayg-wrap ayg-inlog-raster">
          <InlogFormulier />
          <div className="ayg-tekst" role="region" aria-label={t.hulpLabel}>
            <h2>{t.vergetenKop}</h2>
            <WachtwoordVergeten taal={taal} />
            <h2>{t.lidKop}</h2>
            <p>{t.lidTekst}</p>
            <h2>{t.geenAccountKop}</h2>
            <p>{t.geenAccountTekst(PROEFDAGEN)}</p>
            <div className="ayg-knoppen">
              <Knop href={SITE_PADEN.AANMELDEN} soort="accent" pijl>
                {t.probeer}
              </Knop>
            </div>
            <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
          </div>
        </div>
      </section>
    </>
  )
}
