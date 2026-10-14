import { spierStaat, spierUitleg, type Spier } from '@/lib/club/training/spieren'
import { ACHTERKANT, FIGUUR_BREEDTE, FIGUUR_HOOGTE, HOOFD, SILHOUET_HELFT, VOORKANT, type SpierVorm } from './spierkaart-vormen'
import './spierkaart.css'

// De spierkaart: een gestileerd silhouet, voor- en achteraanzicht, met per
// spier een vlak. Vooral = brons, werkt mee = brons zacht, de rest donkergrijs.
// Alleen de kleur verandert, rustig (zie spierkaart.css). Voor schermlezers
// een tekstalternatief met de spieren; klein en decoratief naast een naam.

export type SpierkaartFormaat = 'klein' | 'groot'

interface SpierkaartProps {
  naam: string
  primair: readonly Spier[]
  secundair: readonly Spier[]
  formaat?: SpierkaartFormaat
  /** Staan de spieren er al als tekst naast? Dan is de kaart voor schermlezers decoratie. */
  decoratief?: boolean
}

const SPIEGEL = `matrix(-1 0 0 1 ${FIGUUR_BREEDTE} 0)`

function Vormen({ vormen, primair, secundair }: { vormen: readonly SpierVorm[]; primair: readonly Spier[]; secundair: readonly Spier[] }) {
  const pad = (v: SpierVorm) => (
    <path
      key={v.spier}
      d={v.d}
      className={`club-training-spier club-training-spier--${spierStaat(v.spier, primair, secundair)}${v.diep ? ' club-training-spier--diep' : ''}`}
      data-spier={v.spier}
    />
  )
  return (
    <>
      <g>{vormen.filter((v) => !v.midden).map(pad)}</g>
      <g transform={SPIEGEL}>{vormen.filter((v) => !v.midden).map(pad)}</g>
      {/* Vormen op de middellijn als laatste, zodat de gespiegelde helft ze niet bedekt. */}
      <g>{vormen.filter((v) => v.midden).map(pad)}</g>
    </>
  )
}

function Figuur({ vormen, x, primair, secundair }: { vormen: readonly SpierVorm[]; x: number; primair: readonly Spier[]; secundair: readonly Spier[] }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g className="club-training-spierkaart-lichaam">
        <circle cx={HOOFD.cx} cy={HOOFD.cy} r={HOOFD.r} />
        <path d={SILHOUET_HELFT} />
        <path d={SILHOUET_HELFT} transform={SPIEGEL} />
      </g>
      <Vormen vormen={vormen} primair={primair} secundair={secundair} />
    </g>
  )
}

export function Spierkaart({ naam, primair, secundair, formaat = 'klein', decoratief = false }: SpierkaartProps) {
  const uitleg = spierUitleg(primair, secundair) || 'Nog geen spieren ingevuld.'
  const titel = `Spierkaart van ${naam}`
  const marge = formaat === 'groot' ? 14 : 0
  const svg = (
    <svg
      className={`club-training-spierkaart club-training-spierkaart--${formaat}`}
      viewBox={`0 0 ${FIGUUR_BREEDTE * 2} ${FIGUUR_HOOGTE + marge}`}
      {...(decoratief ? { 'aria-hidden': true, focusable: false } : { role: 'img', 'aria-label': `${titel}. ${uitleg}` })}
    >
      {!decoratief && <title>{titel}</title>}
      <Figuur vormen={VOORKANT} x={0} primair={primair} secundair={secundair} />
      <Figuur vormen={ACHTERKANT} x={FIGUUR_BREEDTE} primair={primair} secundair={secundair} />
      {formaat === 'groot' && (
        <g className="club-training-spierkaart-onderschrift" aria-hidden>
          <text x={FIGUUR_BREEDTE / 2} y={FIGUUR_HOOGTE + 11}>Voorkant</text>
          <text x={FIGUUR_BREEDTE * 1.5} y={FIGUUR_HOOGTE + 11}>Achterkant</text>
        </g>
      )}
    </svg>
  )
  if (formaat === 'klein') return svg
  return (
    <figure className="club-training-spierfiguur">
      {svg}
      <figcaption className="club-training-spierlegenda" aria-hidden>
        <span><i className="club-training-spierlegenda-stip club-training-spierlegenda-stip--primair" /> Werkt vooral</span>
        <span><i className="club-training-spierlegenda-stip club-training-spierlegenda-stip--secundair" /> Werkt mee</span>
      </figcaption>
    </figure>
  )
}
