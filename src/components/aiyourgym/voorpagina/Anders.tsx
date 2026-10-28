import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { aygPad } from '../site/paden'

// Wat het anders maakt (ivoor): eerlijkheid als onderscheid. Twee kolommen naast
// elkaar, wat AI Your Gym doet en wat het (nu) niet doet, met incasso er eerlijk bij.
// De volledige lijst staat op /overstappen#wel-niet.

export async function Anders() {
  const t = VOORPAGINA[await getSiteTaal()].anders
  return (
    <section className="vp-anders ayg-ivoor" aria-labelledby="vp-anders-titel">
      <div className="ayg-wrap vp-anders-raster">
        <div className="vp-anders-kop vp-onthul">
          <p className="ayg-label">{t.oog}</p>
          <h2 id="vp-anders-titel" className="ayg-h2">
            {t.titel.voor} <em>{t.titel.accent}</em>
          </h2>
          <p className="ayg-lead">{t.tekst}</p>
          <Link href={aygPad('/overstappen#wel-niet')} className="ayg-pijllink">
            {t.link} <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
        <div className="vp-anders-lijsten vp-onthul">
          <div className="vp-anders-kolom" data-soort="wel">
            <h3>{t.welKop}</h3>
            <ul>
              {t.wel.map((w) => (
                <li key={w}>
                  <Check size={18} aria-hidden /> {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="vp-anders-kolom" data-soort="niet">
            <h3>{t.nietKop}</h3>
            <ul>
              {t.niet.map((n) => (
                <li key={n}>
                  <Minus size={18} aria-hidden /> {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
