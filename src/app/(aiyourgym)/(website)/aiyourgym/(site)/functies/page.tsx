import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { HOOFDSTUKKEN, type HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { CijfersScherm } from '@/components/aiyourgym/mockups/BeheerSchermen'
import { Figuur, Toestel } from '@/components/aiyourgym/mockups/kaders'
import { Oefening } from '@/components/aiyourgym/mockups/Oefening'
import { RoosterScherm } from '@/components/aiyourgym/mockups/RoosterScherm'
import { CheckinScherm } from '@/components/aiyourgym/mockups/WerkvloerSchermen'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Knop, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { sitePaden } from '@/components/aiyourgym/site/paden'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { taalAlternates } from '@/lib/aiyourgym/taal/metadata'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { FUNCTIES_PAGINA } from '@/lib/aiyourgym/taal/woorden/website/functies'

type Teksten = (typeof FUNCTIES_PAGINA)['nl']
type HoofdstukTekst = Teksten['hoofdstukken'][HoofdstukSleutel]

export async function generateMetadata(): Promise<Metadata> {
  const taal = await getSiteTaal()
  const t = FUNCTIES_PAGINA[taal]
  return { title: t.metaTitel, description: t.metaOmschrijving, alternates: taalAlternates('/functies', taal) }
}

const BEELD: Record<HoofdstukSleutel, { inhoud: ReactNode; bron?: ReactNode; smal?: boolean }> = {
  beheer: { inhoud: <CheckinScherm /> },
  coaching: { inhoud: <Oefening /> },
  planning: { inhoud: <RoosterScherm /> },
  groei: { inhoud: <CijfersScherm /> },
  betrokkenheid: {
    inhoud: (
      <Toestel tab="Home">
        <AppHome />
      </Toestel>
    ),
    smal: true,
  },
}

interface GroepProps {
  sleutel: HoofdstukSleutel
  groep: HoofdstukTekst
  label: string
  nr: number
}

function Groep({ sleutel, groep, label, nr }: GroepProps) {
  const beeld = BEELD[sleutel]
  const donker = sleutel === 'coaching'
  return (
    <section
      id={sleutel}
      className={donker ? 'ayg-sectie ayg-podium ayg-groep' : 'ayg-sectie ayg-groep'}
      aria-labelledby={`${sleutel}-titel`}
      style={{ '--hfd': `var(--ayg-h-${sleutel})` } as CSSProperties}
    >
      <div className="ayg-wrap ayg-groep-raster">
        <div className="ayg-groep-kop">
          <span className="ayg-groep-nr" aria-hidden>
            {String(nr).padStart(2, '0')}
          </span>
          <p className="ayg-hoofdstuk-label">{groep.naam}</p>
          <h2 className="ayg-h2" id={`${sleutel}-titel`}>
            {groep.kop}
          </h2>
          <p className="ayg-lead">{groep.intro}</p>
        </div>
        <div>
          <ul className="ayg-functielijst">
            {groep.functies.map((f) => (
              <li key={f.titel}>
                <h3>{f.titel}</h3>
                <p>{f.tekst}</p>
              </li>
            ))}
          </ul>
          <Figuur className={beeld.smal ? 'ayg-groep-beeld ayg-groep-beeld--smal ayg-onthul' : 'ayg-groep-beeld ayg-onthul'} label={label} bijschrift={beeld.bron}>
            {beeld.inhoud}
          </Figuur>
        </div>
      </div>
    </section>
  )
}

export default async function FunctiesPagina() {
  const taal = await getSiteTaal()
  const t = FUNCTIES_PAGINA[taal]
  const actie = ACTIE[taal]
  const { AANMELDEN, DEMO_AANVRAGEN } = sitePaden(taal)
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
        <nav aria-label={t.hoofdstukkenLabel} className="ayg-ruim-boven">
          <ul className="ayg-inhoudsopgave">
            {HOOFDSTUKKEN.map((g) => (
              <li key={g.sleutel} style={{ '--hfd': `var(--ayg-h-${g.sleutel})` } as CSSProperties}>
                <a href={`#${g.sleutel}`} className="ayg-hoofdstuk-link">
                  {t.hoofdstukken[g.sleutel].naam}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PaginaKop>
      {HOOFDSTUKKEN.map((g, i) => (
        <Groep key={g.sleutel} sleutel={g.sleutel} groep={t.hoofdstukken[g.sleutel]} label={t.beeld[g.sleutel]} nr={i + 1} />
      ))}
      <AanmeldBand titel={t.band} />
    </>
  )
}
