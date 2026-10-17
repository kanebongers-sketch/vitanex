import { Play } from 'lucide-react'
import { COACHING_BENEN } from '@/lib/club/training/coaching/benen'

// Een oefening zoals een lid en trainer hem in Club zien: bewegend beeld (begin-
// en eindhouding van RepDB, zachte wissel) en de coaching uit de echte
// oefenbibliotheek van Club. Geen verzonnen tekst: dit komt uit de app zelf.

const NAAM = 'Goblet squat'
const BEELD = 'goblet-squat'

export function Oefening() {
  const coaching = COACHING_BENEN[NAAM]
  if (!coaching) return null
  return (
    <div className="aygm-oefening">
      <div className="aygm-beeld">
        <img src={`/club/oefeningen-repdb/${BEELD}-start.webp`} alt="" width={512} height={512} loading="lazy" decoding="async" />
        <img
          className="aygm-beeld-eind"
          src={`/club/oefeningen-repdb/${BEELD}-eind.webp`}
          alt=""
          width={512}
          height={512}
          loading="lazy"
          decoding="async"
        />
        <div className="aygm-speler">
          <i>
            <Play size={12} aria-hidden />
          </i>
          <span>Begin</span>
          <span className="aygm-balk">
            <span />
          </span>
          <span>Eind</span>
        </div>
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
