import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { DOELGROEPEN, type Doelgroep, type DoelgroepSleutel } from '@/components/aiyourgym/inhoud/doelgroepen'
import { AppLessen } from '@/components/aiyourgym/mockups/AppSchermen'
import { CijfersScherm, PersoneelScherm } from '@/components/aiyourgym/mockups/BeheerSchermen'
import { Figuur, Toestel } from '@/components/aiyourgym/mockups/kaders'
import { Oefening } from '@/components/aiyourgym/mockups/Oefening'
import { RoosterScherm } from '@/components/aiyourgym/mockups/RoosterScherm'
import { CheckinScherm, OpvolgScherm } from '@/components/aiyourgym/mockups/WerkvloerSchermen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { SectieActie, Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { PROEFDAGEN, vindPakket } from '@/lib/aiyourgym/pakketten'
import { siteAlternates } from '@/lib/aiyourgym/taal/metadata'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { VOOR_WIE } from '@/lib/aiyourgym/taal/woorden/website/voor-wie'

export async function generateMetadata(): Promise<Metadata> {
  const taal = await getSiteTaal()
  const t = VOOR_WIE[taal]
  return { title: t.metaTitel, description: t.metaOmschrijving, alternates: siteAlternates('/voor-wie') }
}

const BEELD: Record<DoelgroepSleutel, { inhoud: ReactNode; bron?: ReactNode; smal?: boolean }> = {
  zelfstandig: { inhoud: <CheckinScherm /> },
  boutique: { inhoud: <RoosterScherm /> },
  'pt-studio': { inhoud: <Oefening /> },
  keten: { inhoud: <PersoneelScherm /> },
  yoga: {
    inhoud: (
      <Toestel tab="Lessen">
        <AppLessen />
      </Toestel>
    ),
    smal: true,
  },
  vechtsport: { inhoud: <OpvolgScherm /> },
  bootcamp: { inhoud: <CijfersScherm /> },
}

function Groep({ doel, nr, taal }: { doel: Doelgroep; nr: number; taal: Taal }) {
  const t = VOOR_WIE[taal]
  const tekst = t.doelgroepen[doel.sleutel]
  const beeld = BEELD[doel.sleutel]
  const pakket = vindPakket(doel.pakket)
  const donker = doel.sleutel === 'pt-studio'
  return (
    <section id={doel.sleutel} className={donker ? 'ayg-sectie ayg-podium ayg-groep' : 'ayg-sectie ayg-groep'} aria-labelledby={`${doel.sleutel}-titel`}>
      <div className="ayg-wrap ayg-groep-raster">
        <div className="ayg-groep-kop">
          <span className="ayg-groep-nr" aria-hidden>
            {String(nr).padStart(2, '0')}
          </span>
          <p className="ayg-label ayg-label--accent">{tekst.naam}</p>
          <h2 className="ayg-h2" id={`${doel.sleutel}-titel`}>
            {tekst.kop}
          </h2>
          <p className="ayg-lead">{tekst.wie}</p>
        </div>
        <div className="ayg-stapel">
          <ul className="ayg-vinklijst ayg-vinklijst--groot">
            {tekst.punten.map((p) => (
              <li key={p}>
                <Check size={16} aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {pakket && (
            <p className="ayg-past">
              {t.pastBij} <strong>{pakket.naam}</strong>
              <span aria-hidden> · </span>
              <Link href={`${SITE_PADEN.AANMELDEN}?pakket=${pakket.sleutel}`}>{t.probeerPakket(pakket.naam)}</Link>
            </p>
          )}
          <Figuur
            className={`ayg-groep-beeld ayg-groep-beeld--breed-alleen ayg-onthul${beeld.smal ? ' ayg-groep-beeld--smal' : ''}`}
            label={t.beeld[doel.sleutel]}
            bijschrift={beeld.bron}
          >
            {beeld.inhoud}
          </Figuur>
        </div>
      </div>
    </section>
  )
}

export default async function VoorWiePagina() {
  const taal = await getSiteTaal()
  const t = VOOR_WIE[taal]
  const actie = ACTIE[taal]
  const { AANMELDEN, DEMO_AANVRAGEN } = SITE_PADEN
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst}>
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            {actie.probeerDagen(PROEFDAGEN)}
          </Knop>
          <Knop href={DEMO_AANVRAGEN} soort="rand">
            {actie.planDemo}
          </Knop>
        </div>
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
        <nav aria-label={t.soortenLabel} className="ayg-ruim-boven">
          <ul className="ayg-inhoudsopgave">
            {DOELGROEPEN.map((d) => (
              <li key={d.sleutel}>
                <a href={`#${d.sleutel}`}>{t.doelgroepen[d.sleutel].naam}</a>
              </li>
            ))}
          </ul>
        </nav>
      </PaginaKop>
      {DOELGROEPEN.map((d, i) => (
        <Groep key={d.sleutel} doel={d} nr={i + 1} taal={taal} />
      ))}
      <section className="ayg-sectie" aria-labelledby="aanpassen-titel">
        <div className="ayg-wrap">
          <SectieKop naast id="aanpassen-titel" label={t.aanpassenLabel} titel={t.aanpassenTitel} tekst={t.aanpassenTekst} />
          <ul className="ayg-aanpassen">
            {t.aanpassen.map((a, i) => (
              <li key={a.titel}>
                <span className="ayg-aanpassen-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="ayg-h3">{a.titel}</h3>
                <p>{a.tekst}</p>
              </li>
            ))}
          </ul>
          <SectieActie />
        </div>
      </section>
      <AanmeldBand titel={t.band} />
    </>
  )
}
