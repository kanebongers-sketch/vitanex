import { COACHING_BENEN } from '@/lib/club/training/coaching/benen'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { OEFENING } from '@/lib/aiyourgym/taal/woorden/website/mockups/schermen'
import { Oefenbeeld } from './Oefenbeeld'

// Een oefening zoals een lid en trainer hem in Club zien: ons eigen figuur
// dat de beweging voordoet en de coaching uit de echte oefenbibliotheek van
// Club. Geen verzonnen tekst: dit komt uit de app zelf. De labels staan in de
// taal van de pagina (woordenboek OEFENING); de coaching zelf is nog Nederlands,
// die vertaling volgt met Club.

const NAAM = 'Front squat'

export async function Oefening() {
  const t = OEFENING[await getSiteTaal()]
  const coaching = COACHING_BENEN[NAAM]
  if (!coaching) return null
  return (
    <div className="aygm-oefening">
      <div className="aygm-beeld">
        <Oefenbeeld naam={NAAM} label={t.beeldLabel(NAAM)} className="ayg-3d--vul" sizes="(max-width: 720px) 90vw, 420px" />
      </div>
      <div className="aygm-coaching">
        <div>
          <p className="aygm-boven">{t.boven}</p>
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
            <p className="aygm-boven">{t.ademhaling}</p>
            <span>{coaching.ademhaling}</span>
          </div>
          <div>
            <p className="aygm-boven">{t.tempo}</p>
            <span>{coaching.tempo}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
