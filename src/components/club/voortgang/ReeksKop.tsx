import { toonVerschilGetal, type ReeksInfo, type ReeksSleutel, type Verschillen } from '@/lib/club/voortgang/tijdlijn'
import { datumKort, getal } from './weergave'

interface ReeksKopProps {
  info: ReeksInfo
  verschil: Verschillen
  reeksen: readonly ReeksInfo[]
  gekozen: ReeksSleutel
  onKies: (sleutel: ReeksSleutel) => void
}

/**
 * Het grote getal van de gekozen meetwaarde met de verschillen, en de wissel.
 * Verschillen zijn neutraal gekleurd: of omhoog goed is, hangt af van het doel.
 */
export function ReeksKop({ info, verschil, reeksen, gekozen, onKies }: ReeksKopProps) {
  const eenheid = info.eenheid ? ` ${info.eenheid}` : ''
  return (
    <div className="club-voortgang-reekskop">
      <div className="club-voortgang-cijfer">
        <span className="club-tegel-label">{info.label}</span>
        <span className="club-voortgang-getal">
          {getal(verschil.laatste.waarde)}
          {info.eenheid && <small>{info.eenheid}</small>}
        </span>
        <span className="club-voortgang-meetdatum">Gemeten {datumKort(verschil.laatste.datum)}</span>
      </div>
      <dl className="club-voortgang-verschillen">
        <div>
          <dt>Sinds start</dt>
          <dd>{verschil.sindsStart === null ? 'Eerste meting' : `${toonVerschilGetal(verschil.sindsStart)}${eenheid}`}</dd>
          <dd className="club-voortgang-klein">{datumKort(verschil.start.datum)}</dd>
        </div>
        <div>
          <dt>Sinds vorige</dt>
          <dd>{verschil.sindsVorige === null ? 'Nog geen' : `${toonVerschilGetal(verschil.sindsVorige)}${eenheid}`}</dd>
          <dd className="club-voortgang-klein">{verschil.vorige ? datumKort(verschil.vorige.datum) : 'Volgende meting'}</dd>
        </div>
      </dl>
      {reeksen.length > 1 && (
        <div className="club-segment club-voortgang-wissel" role="group" aria-label="Kies meetwaarde">
          {reeksen.map((r) => (
            <button key={r.sleutel} type="button" aria-pressed={r.sleutel === gekozen} onClick={() => onKies(r.sleutel)}>
              {r.kort}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
