import type { LogRegel } from '@/lib/club/training/rijen'
import { dagLetter } from '@/lib/club/training/typen'
import { toonDatum, trainingenPerWeek } from '@/lib/club/training/weergave'

interface TrainingslogKaartProps {
  log: LogRegel[]
  dagTitels: string[]
  nu: Date
}

/** Wat het lid in de app afvinkte bij dit schema. Alleen lezen. */
export function TrainingslogKaart({ log, dagTitels, nu }: TrainingslogKaartProps) {
  const weken = trainingenPerWeek(log, nu, 8)
  const max = Math.max(1, ...weken.map((w) => w.aantal))
  const recent = log.slice(0, 8)
  return (
    <section className="club-kaart club-training-log" aria-label="Getraind volgens de app">
      <h2>Getraind</h2>
      <div className="club-training-logcijfer">
        <span className="club-tegel-getal">{log.length}</span>
        <span className="club-tegel-sub">{log.length === 1 ? 'training afgevinkt' : 'trainingen afgevinkt'} in de ledenapp</span>
      </div>
      <div className="club-training-weken" role="img" aria-label={`Trainingen per week, laatste 8 weken: ${weken.map((w) => w.aantal).join(', ')}`}>
        {weken.map((w) => (
          <span key={w.week} className="club-training-week" title={`Week van ${toonDatum(w.week)}: ${w.aantal}`}>
            <i style={{ transform: `scaleY(${w.aantal / max})` }} data-leeg={w.aantal === 0} />
          </span>
        ))}
      </div>
      {recent.length === 0 ? (
        <p className="club-hint">Nog niets afgevinkt. Zodra het lid in de app een training afrondt, staat die hier.</p>
      ) : (
        <ul className="club-lijst">
          {recent.map((r) => (
            <li key={r.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{toonDatum(r.op)}</span>
                <span className="club-rij-sub">
                  {r.dag ? `Dag ${dagLetter(r.dag)}${dagTitels[r.dag - 1] ? ` · ${dagTitels[r.dag - 1]}` : ''}` : 'Dag onbekend'}
                  {` · ${r.aantalOefeningen} ${r.aantalOefeningen === 1 ? 'oefening' : 'oefeningen'}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
