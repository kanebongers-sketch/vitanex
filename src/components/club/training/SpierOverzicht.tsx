import type { EditorStaat } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { schemaOverzicht } from '@/lib/club/training/spier-overzicht'
import { SPIER_GROEPEN } from '@/lib/club/training/spieren'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { opsommingIn } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { dagLetter } from '@/lib/club/training/typen'
import './spierkaart.css'

interface SpierOverzichtProps {
  staat: EditorStaat
  oefeningen: ReadonlyMap<string, Oefening>
}

/** Welke spieren het schema raakt: sets per spiergroep per dag, en de kernspieren die nergens terugkomen. */
export function SpierOverzicht({ staat, oefeningen }: SpierOverzichtProps) {
  const o = schemaOverzicht(staat.regels, oefeningen, staat.dagTitels.length)
  const leeg = staat.regels.length === 0
  const taal = useTaal()
  const t = useTekst(SCHEMA_EDITOR).spieren
  const l = useTekst(TRAINING_LABELS)
  return (
    <section className="club-kaart club-training-spieroverzicht" aria-labelledby="spieroverzicht-kop">
      <h2 id="spieroverzicht-kop" className="club-training-tussenkop">{t.kop}</h2>
      <p className="club-hint">{t.uitleg}</p>
      <table>
        <thead>
          <tr>
            <th scope="col">{t.dag}</th>
            {SPIER_GROEPEN.map((g) => <th key={g} scope="col" title={l.spierGroep[g]}>{t.kort[g]}</th>)}
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
        <p className="club-training-spieroverzicht-gat">{t.gat(opsommingIn(o.ontbreekt.map((s) => l.spier[s].toLowerCase()), taal))}</p>
      ) : (
        <p className="club-training-spieroverzicht-ok">{t.ok}</p>
      )}
    </section>
  )
}
