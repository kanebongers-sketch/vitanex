import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { FUNCTIE_GROEPEN, type FunctieGroep, type GroepSleutel } from '@/components/aiyourgym/inhoud/functies'
import { CijfersScherm } from '@/components/aiyourgym/mockups/BeheerSchermen'
import { Figuur, RepdbBron } from '@/components/aiyourgym/mockups/kaders'
import { Oefening } from '@/components/aiyourgym/mockups/Oefening'
import { RoosterScherm } from '@/components/aiyourgym/mockups/RoosterScherm'
import { CheckinScherm, OpvolgScherm } from '@/components/aiyourgym/mockups/WerkvloerSchermen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop } from '@/components/aiyourgym/site/bouwstenen'

export const metadata: Metadata = {
  title: 'Functies',
  description:
    "Alle functies van AI Your Gym: check-in, taken, opvolgen, ledenkaart, leads, groepslessen met wachtlijst, afspraken, personeelsrooster met uren, schema's met coaching, voeding, cijfers per maand en rechten per rol.",
}

const BEELD: Record<GroepSleutel, { label: string; inhoud: ReactNode; bron?: ReactNode }> = {
  werkvloer: { label: 'De check-in van AI Your Gym met de leden die net binnen zijn en hun status', inhoud: <CheckinScherm /> },
  leden: { label: 'De opvolglijst van vandaag met leden en de reden om ze aan te spreken', inhoud: <OpvolgScherm /> },
  planning: { label: 'Het groepslesrooster van een week met de bezetting per les en volle lessen met wachtlijst', inhoud: <RoosterScherm /> },
  coaching: {
    label: 'Een oefening met bewegende illustratie, genummerde kernpunten, ademhaling en tempo',
    inhoud: <Oefening />,
    bron: <RepdbBron />,
  },
  beheer: { label: 'De cijfers van een kalendermaand met tegels en een staafgrafiek', inhoud: <CijfersScherm /> },
}

function Groep({ groep, nr }: { groep: FunctieGroep; nr: number }) {
  const beeld = BEELD[groep.sleutel]
  const donker = groep.sleutel === 'coaching'
  return (
    <section id={groep.sleutel} className={donker ? 'ayg-sectie ayg-podium ayg-groep' : 'ayg-sectie ayg-groep'} aria-labelledby={`${groep.sleutel}-titel`}>
      <div className="ayg-wrap ayg-groep-raster">
        <div className="ayg-groep-kop">
          <span className="ayg-groep-nr" aria-hidden>
            {String(nr).padStart(2, '0')}
          </span>
          <p className="ayg-label ayg-label--accent">{groep.naam}</p>
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
          <Figuur className="ayg-groep-beeld ayg-onthul" label={beeld.label} bijschrift={beeld.bron}>
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
        tekst="Vijf onderdelen, ingedeeld zoals een sportschool werkt. Onderdelen die je niet nodig hebt zet je uit, dan zie je ze ook nergens."
      >
        <nav aria-label="Onderdelen op deze pagina">
          <ul className="ayg-inhoudsopgave">
            {FUNCTIE_GROEPEN.map((g) => (
              <li key={g.sleutel}>
                <a href={`#${g.sleutel}`}>{g.naam}</a>
              </li>
            ))}
          </ul>
        </nav>
      </PaginaKop>
      {FUNCTIE_GROEPEN.map((g, i) => (
        <Groep key={g.sleutel} groep={g} nr={i + 1} />
      ))}
      <AanmeldBand titel="Zie het werken in je eigen club." />
    </>
  )
}
