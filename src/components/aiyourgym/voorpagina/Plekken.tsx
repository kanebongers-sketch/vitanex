import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { navLinks } from '../site/paden'

// Hoofdstuk 3 (creme): alles in een oogopslag als mozaiek van ongelijke tegels.
// Regel: geen twee buren bevatten hetzelfde soort ding (kop, scherm, getal, lijst,
// zin). Het getal 8 is echt: de startwizard heeft acht stappen.

export async function Plekken() {
  const taal = await getSiteTaal()
  const t = VOORPAGINA[taal].plekken
  const functies = navLinks(taal).find((l) => l.sleutel === 'functies')
  return (
    <section className="vp-plekken" aria-labelledby="vp-plekken-titel">
      <div className="vp-raster vp-onthul">
        <div className="vp-p vp-p-kop">
          <h2 id="vp-plekken-titel" className="vp-h2">
            {t.titel.map((r) => (
              <span key={r} className="vp-blok">
                {r}
              </span>
            ))}
          </h2>
          <p>{t.tekst}</p>
          {functies && (
            <Link href={functies.pad} className="vp-pijl">
              {t.alleFuncties} <ArrowRight size={18} aria-hidden />
            </Link>
          )}
        </div>

        <div className="vp-p vp-p-schema" data-ui>
          <p className="vp-ui-klein">{t.schemaWaar}</p>
          <p className="vp-p-schemakop">{t.schemaKop}</p>
          <table>
            <thead className="ayg-sr">
              <tr>
                <th scope="col">{t.kolommen.oefening}</th>
                <th scope="col">{t.kolommen.sets}</th>
                <th scope="col">{t.kolommen.rust}</th>
              </tr>
            </thead>
            <tbody>
              {t.oefeningen.map((o, n) => (
                <tr key={o.naam} data-gekozen={n === 0 ? '' : undefined}>
                  <th scope="row">{o.naam}</th>
                  <td>{o.sets}</td>
                  <td>{o.rust}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="vp-ui-klein">{t.kernpuntenKop}</p>
          <ol className="vp-p-punten">
            {t.kernpunten.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ol>
        </div>

        <div className="vp-p vp-p-getal">
          <p>
            <strong>{t.getal}</strong>
            <span>{t.getalTekst}</span>
          </p>
        </div>

        <div className="vp-p vp-p-rollen">
          <ul aria-label={t.rollenLabel}>
            {t.rollen.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <p className="vp-p vp-p-zin vp-p-app">{t.ledenapp}</p>
        <p className="vp-p vp-p-zin vp-p-rechten">{t.rechten}</p>
        <p className="vp-p vp-p-zin vp-p-talen">{t.talen}</p>
      </div>
    </section>
  )
}
