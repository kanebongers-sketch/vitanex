import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { siteCoaching } from '@/lib/aiyourgym/taal/woorden/website/coaching'
import { OEFENING } from '@/lib/aiyourgym/taal/woorden/website/mockups/schermen'

// Een oefening zoals een lid en trainer hem in Club zien: de coaching uit de
// echte oefenbibliotheek van Club. Geen verzonnen tekst: dit komt uit de app zelf.
// Zonder oefenbeeld: die staan alleen achter het inloggen (besluit Kane 27-10-2026). De labels staan in de
// taal van de pagina (woordenboek OEFENING), de coaching ook (siteCoaching).

const NAAM = 'Front squat'

export async function Oefening() {
  const taal = await getSiteTaal()
  const t = OEFENING[taal]
  const coaching = siteCoaching(NAAM, taal)
  if (!coaching) return null
  return (
    <div className="aygm-oefening aygm-oefening--tekst">
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
