import type { Functie, HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { FUNCTIES_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/functies-schermen'
import { Scherm } from './Schermen'

// Een hoofdstuk van Functies als vol merkvlak (min 90svh): de naam klein, de kop
// groot links met de intro, daaronder het schermfragment; rechts de volledige lijst
// functies (titel en tekst, alles leesbaar zonder klikken). Het anker is de sleutel
// van het hoofdstuk (/functies#beheer enz.), daar linken de voorpagina en /nieuw naar.

interface Props {
  sleutel: HoofdstukSleutel
  naam: string
  kop: string
  intro: string
  functies: readonly Functie[]
  beeldLabel: string
  taal: Taal
}

export function Hoofdstuk({ sleutel, naam, kop, intro, functies, beeldLabel, taal }: Props) {
  return (
    <section id={sleutel} className={`fp-hoofdstuk fp-vlak-${sleutel}`} aria-labelledby={`${sleutel}-titel`}>
      <div className="fp-hoofdstuk-links vp-onthul">
        <p className="fp-naam">{naam}</p>
        <h2 id={`${sleutel}-titel`} className="vp-h2 fp-kop">
          {kop}
        </h2>
        <p className="fp-intro">{intro}</p>
        <Scherm sleutel={sleutel} taal={taal} label={beeldLabel} />
      </div>
      <ul className="fp-functies vp-onthul" aria-label={FUNCTIES_SCHERMEN[taal].functiesLabel(naam)}>
        {functies.map((f) => (
          <li key={f.titel}>
            <h3>{f.titel}</h3>
            <p>{f.tekst}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
