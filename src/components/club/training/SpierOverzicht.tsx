import type { EditorStaat } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { schemaOverzicht } from '@/lib/club/training/spier-overzicht'
import { opsomming, SPIER_GROEP_LABEL, SPIER_GROEPEN, spierNaamKlein, type SpierGroep } from '@/lib/club/training/spieren'
import { dagLetter } from '@/lib/club/training/typen'
import './spierkaart.css'

interface SpierOverzichtProps {
  staat: EditorStaat
  oefeningen: ReadonlyMap<string, Oefening>
}

const KORT: Record<SpierGroep, string> = {
  borst: 'Borst',
  rug: 'Rug',
  schouders: 'Schoud.',
  armen: 'Armen',
  romp: 'Romp',
  benen: 'Benen',
  conditie: 'Cardio',
}

/** Welke spieren het schema raakt: sets per spiergroep per dag, en de kernspieren die nergens terugkomen. */
export function SpierOverzicht({ staat, oefeningen }: SpierOverzichtProps) {
  const o = schemaOverzicht(staat.regels, oefeningen, staat.dagTitels.length)
  const leeg = staat.regels.length === 0
  return (
    <section className="club-kaart club-training-spieroverzicht" aria-labelledby="spieroverzicht-kop">
      <h2 id="spieroverzicht-kop" className="club-training-tussenkop">Spieren in dit schema</h2>
      <p className="club-hint">Sets per spiergroep, geteld op de spieren waar een oefening vooral op werkt.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Dag</th>
            {SPIER_GROEPEN.map((g) => <th key={g} scope="col" title={SPIER_GROEP_LABEL[g]}>{KORT[g]}</th>)}
          </tr>
        </thead>
        <tbody>
          {o.dagen.map((d) => (
            <tr key={d.dag}>
              <th scope="row" className="club-training-spieroverzicht-dag" title={staat.dagTitels[d.dag - 1]}>{dagLetter(d.dag)}</th>
              {SPIER_GROEPEN.map((g) => (
                <td key={g} data-nul={d.setsPerGroep[g] === 0}>{d.setsPerGroep[g]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {leeg ? null : o.ontbreekt.length > 0 ? (
        <p className="club-training-spieroverzicht-gat">Nergens als hoofdspier: {opsomming(o.ontbreekt.map(spierNaamKlein))}.</p>
      ) : (
        <p className="club-training-spieroverzicht-ok">Alle hoofdspieren komen aan bod.</p>
      )}
    </section>
  )
}
