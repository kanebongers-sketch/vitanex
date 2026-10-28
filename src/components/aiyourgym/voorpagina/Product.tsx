import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { navLinks } from '../site/paden'
import { Inchecken } from './Inchecken'

// Het product (obsidiaan): een rustig raster van ongelijke tegels in antraciet met
// haarlijnen. Geen twee buren met hetzelfde soort ding: een levende schakelaar, een
// schema met kernpunten, een groot getal, een zin. Het getal 8 is echt: de
// startwizard van Club heeft acht stappen. Alles met voorbeeldgegevens van Kernhal.

export async function Product() {
  const taal = await getSiteTaal()
  const v = VOORPAGINA[taal]
  const t = v.plekken
  const functies = navLinks(taal).find((l) => l.sleutel === 'functies')
  return (
    <section className="vp-product" aria-labelledby="vp-product-titel">
      <div className="ayg-wrap">
        <div className="ayg-sectiekop ayg-sectiekop--naast vp-onthul">
          <p className="ayg-label">{v.product.oog}</p>
          <h2 id="vp-product-titel" className="ayg-h2">
            {v.product.titel.voor} <em>{v.product.titel.accent}</em>
          </h2>
          <div className="ayg-stapel">
            <p className="ayg-lead">{v.product.tekst}</p>
            {functies && (
              <Link href={functies.pad} className="ayg-pijllink vp-product-link">
                {t.alleFuncties} <ArrowRight size={17} aria-hidden />
              </Link>
            )}
          </div>
        </div>

        <div className="vp-raster vp-onthul">
          <Inchecken />

          <div className="vp-tegel vp-tegel-schema">
            <p className="vp-tegel-klein">{t.schemaWaar}</p>
            <p className="vp-tegel-kop">{t.schemaKop}</p>
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
            <p className="vp-tegel-klein">{t.kernpuntenKop}</p>
            <ol className="vp-tegel-punten">
              {t.kernpunten.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ol>
          </div>

          <div className="vp-tegel vp-tegel-getal">
            <strong>{t.getal}</strong>
            <span>{t.getalTekst}</span>
          </div>

          <p className="vp-tegel vp-tegel-zin vp-tegel-app">{t.ledenapp}</p>
          <p className="vp-tegel vp-tegel-zin">{t.rechten}</p>
          <p className="vp-tegel vp-tegel-zin">{t.talen}</p>
        </div>
      </div>
    </section>
  )
}
