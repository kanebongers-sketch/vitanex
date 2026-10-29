import type { Functie, HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { FUNCTIES_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/functies-schermen'
import { Scherm } from './Schermen'

// Een hoofdstuk van Functies als vol merkvlak: aan de ene kant de naam klein, de
// kop, een zin en drie korte punten; aan de andere kant groot het schermfragment
// (het scherm doet het werk). Om en om gespiegeld. Het anker is de sleutel van het
// hoofdstuk (/functies#beheer enz.), daar linken de voorpagina en /nieuw naar.

interface Props {
  sleutel: HoofdstukSleutel
  naam: string
  kop: string
  intro: string
  functies: readonly Functie[]
  beeldLabel: string
  spiegel: boolean
  taal: Taal
}

export function Hoofdstuk({ sleutel, naam, kop, intro, functies, beeldLabel, spiegel, taal }: Props) {
  return (
    <section
      id={sleutel}
      className={`fp-hoofdstuk fp-vlak-${sleutel}`}
      data-spiegel={spiegel || undefined}
      aria-labelledby={`${sleutel}-titel`}
    >
      <div className="fp-hoofdstuk-tekst vp-onthul">
        <p className="fp-naam">{naam}</p>
        <h2 id={`${sleutel}-titel`} className="vp-h2 fp-kop">
          {kop}
        </h2>
        <p className="fp-intro">{intro}</p>
        <ul className="fp-functies" aria-label={FUNCTIES_SCHERMEN[taal].functiesLabel(naam)}>
          {functies.map((f) => (
            <li key={f.titel}>
              <h3>{f.titel}</h3>
              <p>{f.tekst}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="fp-hoofdstuk-beeld vp-onthul">
        <Scherm sleutel={sleutel} taal={taal} label={beeldLabel} />
      </div>
    </section>
  )
}
