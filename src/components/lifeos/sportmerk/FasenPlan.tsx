import type { Fase } from '@/lib/lifeos/sportmerk/types'

// ─── Sportmerk — het uitvoeringsplan ────────────────────────────────────────
// Presentational: de fasen als genummerde tijdlijn. Per fase staan de beslis-
// regels ("door als" / "herzien als") als tekst met label, niet als kleurcode.

export function FasenPlan({ fasen }: { fasen: Fase[] }) {
  return (
    <ol className="spm__fasen">
      {fasen.map((f, i) => (
        <li key={f.naam} className="spm__fase">
          <p className="spm__fase-nr" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </p>
          <div className="spm__fase-body">
            <p className="spm__fase-periode">{f.periode}</p>
            <h4 className="spm__fase-naam">{f.naam}</h4>
            <p className="spm__fase-doel">{f.doel}</p>
            <dl className="spm__fase-regels">
              <div>
                <dt>Door als</dt>
                <dd>{f.doorAls}</dd>
              </div>
              <div>
                <dt>Herzien als</dt>
                <dd>{f.herzienAls}</dd>
              </div>
            </dl>
          </div>
        </li>
      ))}
    </ol>
  )
}
