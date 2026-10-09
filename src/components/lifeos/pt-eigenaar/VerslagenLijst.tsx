import { FileDown } from 'lucide-react'
import type { EvaluatieJson } from '@/lib/lifeos/pt-coaching/pt-coaching'
import { afspraakLabel } from '@/lib/lifeos/pt-coaching/coach-overzicht'

// Alle coachgesprek-verslagen van één PT'er, nieuwste eerst: datum, de drie
// scores, wat besproken is en het aandachtspunt, met de pdf erbij. Puur.
// De pdf-link werkt op de sessiecookie van de PT-app (geen Bearer-token nodig).

const SCORES: { key: keyof EvaluatieJson['scores']; label: string }[] = [
  { key: 'algemeen', label: 'Algemeen' },
  { key: 'energie', label: 'Energie' },
  { key: 'voortgang', label: 'Voortgang' },
]

export function VerslagenLijst({ code, verslagen }: { code: string; verslagen: readonly EvaluatieJson[] }) {
  if (verslagen.length === 0) return <p className="ptd-hint">Nog geen verslag: het eerste coachgesprek is nog niet afgerond.</p>
  return (
    <ul className="ptd-lijst ptd-verslagen">
      {verslagen.map((v) => (
        <li key={v.id} className="ptd-verslag">
          <div className="ptd-rij-kop">
            <span className="ptd-tekst--sterk">{afspraakLabel(v.aangemaaktOp)}</span>
            <a className="ptd-link ptd-kleine-link" href={`/api/pt/${code}/coaching/${v.id}/pdf`}>
              <FileDown size={14} aria-hidden /> Pdf
            </a>
          </div>
          <p className="ptd-scores">
            {SCORES.map((s) => (
              <span key={s.key} className={v.scores[s.key] <= 2 ? 'ptd-score ptd-score--laag' : 'ptd-score'}>
                {s.label} <strong>{v.scores[s.key]}</strong>/5
              </span>
            ))}
          </p>
          {v.notitie ? <p className="ptd-tekst">{v.notitie}</p> : null}
          {v.aandachtspunt ? (
            <p className="ptd-tekst"><span className="ptd-label">Aandachtspunt</span><br />{v.aandachtspunt}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
