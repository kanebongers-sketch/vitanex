import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DagTijd } from '@/components/aiyourgym/dag/DagTijd'
import { momentTijd } from '@/components/aiyourgym/dag/momenten'
import { SchemaBouw } from '@/components/aiyourgym/dag/SchemaBouw'
import { voorbeeldOefeningen } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { DAG, DAG_SCHEMA } from '@/lib/aiyourgym/taal/woorden/website/dag'

// 10:30, de piek van de voorpagina: een trainingsschema bouwt zich op terwijl je
// scrolt en landt in de ledenapp (dag/SchemaBouw.tsx). De oefeningen en coaching
// komen uit de bibliotheek van Club (voorbeeldOefeningen, in de taal van de pagina).
// Geen oefenbeelden op de website (besluit Kane 27-10-2026).

interface SchemasProps {
  /** Op de voorpagina een moment van de dag (met kloktijd); op /trainingsschemas niet. */
  metTijd?: boolean
}

export async function Schemas({ metTijd = true }: SchemasProps) {
  const taal = await getSiteTaal()
  const t = DAG_SCHEMA[taal]
  const naam = DAG[taal].momenten.schema
  const minuten = momentTijd('schema')
  return (
    <section
      className="dag-schema ayg-podium ayg-podium--rond"
      aria-labelledby="schemas-titel"
      id={metTijd ? 'schema' : undefined}
      data-dag={metTijd ? minuten : undefined}
      data-dag-naam={metTijd ? naam : undefined}
    >
      <div className="ayg-wrap">
        <SchemaBouw
          oefeningen={voorbeeldOefeningen(taal)}
          kop={
            <div className="dag-schema-kop">
              {metTijd ? <DagTijd minuten={minuten} naam={naam} licht /> : <p className="ayg-label ayg-label--accent">{t.label}</p>}
              <h2 className="ayg-h2" id="schemas-titel">
                {t.titel.voor}
                <mark className="ayg-markeer">{t.titel.accent}</mark>
              </h2>
              <p className="ayg-lead">{t.lead}</p>
            </div>
          }
          onder={
            <>
              <p className="ayg-klein">{t.onder}</p>
              {metTijd && (
                <Link href={aygPad('/trainingsschemas')} className="ayg-pijllink">
                  {t.link} <ArrowRight size={16} aria-hidden />
                </Link>
              )}
            </>
          }
        />
      </div>
    </section>
  )
}
