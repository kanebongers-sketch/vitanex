import { COACHING_BENEN } from '@/lib/club/training/coaching/benen'
import { Oefenbeeld3d } from './Oefenbeeld3d'

// Een oefening zoals een lid en trainer hem in Club zien: ons eigen 3D-figuur
// dat de beweging voordoet en de coaching uit de echte oefenbibliotheek van
// Club. Geen verzonnen tekst: dit komt uit de app zelf.

const NAAM = 'Goblet squat'

export function Oefening() {
  const coaching = COACHING_BENEN[NAAM]
  if (!coaching) return null
  return (
    <div className="aygm-oefening">
      <div className="aygm-beeld">
        <Oefenbeeld3d naam={NAAM} label={`${NAAM} als bewegend 3D-beeld`} className="ayg-3d--vul" />
      </div>
      <div className="aygm-coaching">
        <div>
          <p className="aygm-boven">Benen · dag A · oefening 1</p>
          <p className="aygm-coaching-titel">{NAAM}</p>
        </div>
        <ol className="aygm-kernpunten">
          {coaching.kernpunten.slice(0, 4).map((k) => (
            <li key={k.punt}>
              <div>
                <b>{k.punt}</b>
                <span>{k.uitleg}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="aygm-feiten">
          <div>
            <p className="aygm-boven">Ademhaling</p>
            <span>{coaching.ademhaling}</span>
          </div>
          <div>
            <p className="aygm-boven">Tempo</p>
            <span>{coaching.tempo}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
