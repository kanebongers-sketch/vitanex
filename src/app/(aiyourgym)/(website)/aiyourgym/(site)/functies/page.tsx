import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { HOOFDSTUKKEN, type Hoofdstuk, type HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { CijfersScherm } from '@/components/aiyourgym/mockups/BeheerSchermen'
import { Figuur, Toestel } from '@/components/aiyourgym/mockups/kaders'
import { Oefening } from '@/components/aiyourgym/mockups/Oefening'
import { RoosterScherm } from '@/components/aiyourgym/mockups/RoosterScherm'
import { CheckinScherm } from '@/components/aiyourgym/mockups/WerkvloerSchermen'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Knop, PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, DEMO_AANVRAGEN } from '@/components/aiyourgym/site/paden'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'

export const metadata: Metadata = {
  title: 'Functies',
  description:
    "Alle functies van AI Your Gym in vijf hoofdstukken: beheer, coaching, planning, groei en betrokkenheid. Check-in, schema's met coaching, groepslessen met wachtlijst, personeelsrooster, leads, cijfers per maand en een ledenapp in je eigen huisstijl.",
}

const BEELD: Record<HoofdstukSleutel, { label: string; inhoud: ReactNode; bron?: ReactNode; smal?: boolean }> = {
  beheer: { label: 'De check-in van AI Your Gym met de leden die net binnen zijn en hun status', inhoud: <CheckinScherm /> },
  coaching: {
    label: 'Een oefening met een bewegend 3D-beeld, genummerde kernpunten, ademhaling en tempo',
    inhoud: <Oefening />,
  },
  planning: { label: 'Het groepslesrooster van een week met de bezetting per les en volle lessen met wachtlijst', inhoud: <RoosterScherm /> },
  groei: { label: 'De cijfers van een kalendermaand met tegels en een staafgrafiek', inhoud: <CijfersScherm /> },
  betrokkenheid: {
    label: 'De ledenapp op een telefoon met de volgende les, bezoeken, de QR-code om in te checken en een challenge',
    inhoud: (
      <Toestel tab="Home">
        <AppHome />
      </Toestel>
    ),
    smal: true,
  },
}

function Groep({ groep, nr }: { groep: Hoofdstuk; nr: number }) {
  const beeld = BEELD[groep.sleutel]
  const donker = groep.sleutel === 'coaching'
  return (
    <section
      id={groep.sleutel}
      className={donker ? 'ayg-sectie ayg-podium ayg-groep' : 'ayg-sectie ayg-groep'}
      aria-labelledby={`${groep.sleutel}-titel`}
      style={{ '--hfd': `var(--ayg-h-${groep.sleutel})` } as CSSProperties}
    >
      <div className="ayg-wrap ayg-groep-raster">
        <div className="ayg-groep-kop">
          <span className="ayg-groep-nr" aria-hidden>
            {String(nr).padStart(2, '0')}
          </span>
          <p className="ayg-hoofdstuk-label">{groep.naam}</p>
          <h2 className="ayg-h2" id={`${groep.sleutel}-titel`}>
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
          <Figuur className={beeld.smal ? 'ayg-groep-beeld ayg-groep-beeld--smal ayg-onthul' : 'ayg-groep-beeld ayg-onthul'} label={beeld.label} bijschrift={beeld.bron}>
            {beeld.inhoud}
          </Figuur>
        </div>
      </div>
    </section>
  )
}

export default function FunctiesPagina() {
  return (
    <>
      <PaginaKop
        label="Functies"
        titel="Alles voor je club. Niets wat je niet gebruikt."
        tekst="Vijf hoofdstukken: beheer, coaching, planning, groei en betrokkenheid. Onderdelen die je niet nodig hebt zet je uit, dan zie je ze ook nergens."
      >
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            Probeer {PROEFDAGEN} dagen gratis
          </Knop>
          <Knop href={DEMO_AANVRAGEN} soort="rand">
            Plan een gratis demo
          </Knop>
        </div>
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
        <nav aria-label="Hoofdstukken op deze pagina" className="ayg-ruim-boven">
          <ul className="ayg-inhoudsopgave">
            {HOOFDSTUKKEN.map((g) => (
              <li key={g.sleutel} style={{ '--hfd': `var(--ayg-h-${g.sleutel})` } as CSSProperties}>
                <a href={`#${g.sleutel}`} className="ayg-hoofdstuk-link">
                  {g.naam}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PaginaKop>
      {HOOFDSTUKKEN.map((g, i) => (
        <Groep key={g.sleutel} groep={g} nr={i + 1} />
      ))}
      <AanmeldBand titel="Zie het werken in je eigen club." />
    </>
  )
}
