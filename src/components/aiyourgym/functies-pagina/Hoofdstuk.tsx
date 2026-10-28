import type { Functie, HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { FUNCTIES_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/functies-schermen'
import { Scherm } from './Schermen'

// Een hoofdstuk van Functies als eigen vlak in het ritme van de site (Obsidian
// Luxury): het nummer en de naam klein in champagne, de kop groot links met de
// intro, daaronder het schermfragment; rechts de volledige lijst functies (titel en
// tekst, alles leesbaar zonder klikken). Het anker is de sleutel van het hoofdstuk
// (/functies#beheer enz.), daar linken de voorpagina en /nieuw naar.

/** Het vlak per hoofdstuk: obsidiaan, antraciet (podium) of ivoor. */
const VLAK: Record<HoofdstukSleutel, string> = {
  beheer: '',
  coaching: ' ayg-podium',
  planning: ' ayg-ivoor',
  groei: '',
  betrokkenheid: ' ayg-podium',
}

interface Props {
  nr: number
  sleutel: HoofdstukSleutel
  naam: string
  kop: string
  intro: string
  functies: readonly Functie[]
  beeldLabel: string
  taal: Taal
}

export function Hoofdstuk({ nr, sleutel, naam, kop, intro, functies, beeldLabel, taal }: Props) {
  return (
    <section id={sleutel} className={`fp-hoofdstuk${VLAK[sleutel]}`} aria-labelledby={`${sleutel}-titel`}>
      <div className="ayg-wrap fp-hoofdstuk-raster">
        <div className="fp-hoofdstuk-links vp-onthul">
          <p className="ayg-label">
            {String(nr).padStart(2, '0')} · {naam}
          </p>
          <h2 id={`${sleutel}-titel`} className="ayg-h2 fp-kop">
            {kop}
          </h2>
          <p className="ayg-lead fp-intro">{intro}</p>
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
      </div>
    </section>
  )
}
