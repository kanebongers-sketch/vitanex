import type { ReactNode } from 'react'

/**
 * Hoeveel nadruk deze kaart krijgt binnen zijn moment.
 *
 *   dragend  — de ene kaart die het moment draagt. Eén per moment.
 *   normaal  — ondersteunend, naast de dragende kaart.
 *   compact  — in de lade: bereikbaar, niet zichtbaar.
 *
 * Nadruk is puur visueel. De plaatsing in het raster hoort bij de cockpit-layout
 * (zie `Cockpit` + de `.os-cockpit`/`.os-prod`-CSS), niet hier — anders weet een
 * kaart iets over de pagina waar hij op staat.
 */
export type Nadruk = 'dragend' | 'normaal' | 'compact'

interface KaartProps {
  titel: string
  /**
   * Welke app deze kaart vervangt. De gouden regel, zichtbaar in de UI.
   *
   * Optioneel met precies één toegestane uitzondering: Vita vervangt niets —
   * hij is de reden dat de rest in één app hoort (README §Vita). Elke andere
   * kaart die geen app kan noemen, hoort hier niet te staan.
   */
  vervangt?: string
  nadruk?: Nadruk
  /** Kopniveau. 2 in het moment zelf, 3 in de lade — nooit een sprong. */
  niveau?: 2 | 3
  children: ReactNode
}

/**
 * Eén oppervlak. Diepte via laag + lijn + een dunne gloed, niet via een zware
 * slagschaduw. Hiërarchie loopt via schaal en ruimte — niet elke kaart
 * schreeuwt even hard.
 *
 * Hover en focus zitten in CSS (`.os-kaart`), niet in JS: de states moeten ook
 * werken zonder dat dit een client-eiland wordt. De kaart licht op bij hover en
 * krijgt een cyaan rand zodra er iets ín hem focus heeft — hij reageert dus
 * pas als er echt iets te bedienen valt.
 */
export function Kaart({ titel, vervangt, nadruk = 'normaal', niveau = 2, children }: KaartProps) {
  const Kop = niveau === 3 ? 'h3' : 'h2'

  return (
    <section className={`os-kaart os-kaart--${nadruk}`}>
      <header className="os-kaart__kop">
        <Kop className="os-kaart__titel">{titel}</Kop>
        {vervangt ? <span className="os-kaart__vervangt">vervangt {vervangt}</span> : null}
      </header>
      {children}
    </section>
  )
}

/**
 * De eerlijke lege staat. Geen verzonnen cijfer, geen nul die op een meting
 * lijkt — gewoon zeggen dat er niets is, en wat het zou opleveren.
 *
 * Dit is bewust een eigen component: in MentaForce bleek "fout" en "leeg" op
 * drie plekken hetzelfde te renderen, waardoor een netwerkstoring aan de
 * gebruiker vertelde dat hij niets gemeten had.
 */
export function NogNiets({ wat, waarom }: { wat: string; waarom: string }) {
  return (
    <div>
      {/* Het streepje is de vorm van "geen meting". Voor een screenreader is
          het ruis: `wat` zegt het al in woorden. */}
      <p className="os-cijfer os-leeg__streep" aria-hidden="true">
        —
      </p>
      <p className="os-leeg__wat">{wat}</p>
      <p className="os-leeg__waarom">{waarom}</p>
    </div>
  )
}
