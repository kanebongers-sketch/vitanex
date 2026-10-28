import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { aantalMetCoaching, voorbeeldOefeningen } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { SchemaToestel } from '@/components/aiyourgym/schemas/SchemaToestel'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { aygPad } from '../site/paden'

// Trainingsschema's, de blikvanger (antraciet podium met champagne licht). Links de
// kop en de coaching van een echte oefening uit de bibliotheek van Club: de
// genummerde kernpunten en een veelgemaakte fout met de correctie. Rechts het schema
// zoals het lid het in de ledenapp ziet. Geen oefenbeelden: die staan alleen achter
// het inloggen (besluit Kane 27-10-2026). Het aantal oefeningen met coaching is
// geteld uit de bibliotheek, niet geschat.

export async function Coaching() {
  const taal = await getSiteTaal()
  const t = VOORPAGINA[taal].coaching
  const oefeningen = voorbeeldOefeningen(taal)
  const eerste = oefeningen[0]
  if (!eerste) return null
  const fout = eerste.coaching.fouten[0]
  return (
    <section className="vp-coaching ayg-podium" aria-labelledby="vp-coaching-titel">
      <div className="ayg-wrap vp-coaching-raster">
        <div className="vp-coaching-tekst vp-onthul">
          <p className="ayg-label">{t.oog}</p>
          <h2 id="vp-coaching-titel" className="ayg-h2">
            {t.titel.voor} <em>{t.titel.accent}</em>
          </h2>
          <p className="ayg-lead">{t.tekst}</p>
          <div className="vp-coaching-kaart">
            <p className="vp-coaching-boven">{t.kernpuntenVan(eerste.naam)}</p>
            <ol className="vp-coaching-punten">
              {eerste.coaching.kernpunten.map((k, i) => (
                <li key={k.punt}>
                  <span className="vp-coaching-nr" aria-hidden>
                    {i + 1}
                  </span>
                  <span>
                    <strong>{k.punt}</strong>
                    <span>{k.uitleg}</span>
                  </span>
                </li>
              ))}
            </ol>
            {fout && (
              <dl className="vp-coaching-fout">
                <div>
                  <dt>{t.fout}</dt>
                  <dd>{fout.fout}</dd>
                </div>
                <div>
                  <dt>{t.beter}</dt>
                  <dd>{fout.beter}</dd>
                </div>
              </dl>
            )}
            <p className="vp-coaching-bron">
              {t.bron} {t.aantal(aantalMetCoaching())}.
            </p>
          </div>
          <Link href={aygPad('/trainingsschemas')} className="ayg-pijllink">
            {t.link} <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
        <div className="vp-coaching-toestel vp-onthul">
          <SchemaToestel oefeningen={oefeningen} gekozen={0} uitleg={false} />
        </div>
      </div>
    </section>
  )
}
