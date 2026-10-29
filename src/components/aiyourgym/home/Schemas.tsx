import { SchemaBouw } from '@/components/aiyourgym/dag/SchemaBouw'
import { voorbeeldOefeningen } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { DAG_SCHEMA } from '@/lib/aiyourgym/taal/woorden/website/dag'

// De schemabouw op /trainingsschemas: een trainingsschema bouwt zich op terwijl je
// scrolt en landt in de ledenapp (dag/SchemaBouw.tsx). De oefeningen en coaching
// komen uit de bibliotheek van Club (voorbeeldOefeningen, in de taal van de pagina).
// Geen oefenbeelden op de website (besluit Kane 27-10-2026).

export async function Schemas() {
  const taal = await getSiteTaal()
  const t = DAG_SCHEMA[taal]
  return (
    <section className="dag-schema ayg-podium ayg-podium--rond" aria-labelledby="schemas-titel">
      <div className="ayg-wrap">
        <SchemaBouw
          oefeningen={voorbeeldOefeningen(taal)}
          kop={
            <div className="dag-schema-kop">
              <p className="ayg-label ayg-label--accent">{t.label}</p>
              <h2 className="ayg-h2" id="schemas-titel">
                {t.titel.voor}
                <mark className="ayg-markeer">{t.titel.accent}</mark>
              </h2>
              <p className="ayg-lead">{t.lead}</p>
            </div>
          }
          onder={<p className="ayg-klein">{t.onder}</p>}
        />
      </div>
    </section>
  )
}
