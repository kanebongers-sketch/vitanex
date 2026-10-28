import { ArrowRight } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// De afsluitende oproep op elke pagina (ivoor): een zin in de serif met een gat.
// Het gat is het veld voor de naam van je club, het laatste woord is de knop. Een
// gewoon formulier (GET naar aanmelden met ?naam=): werkt ook zonder JavaScript, de
// naam staat daar al ingevuld en de controle gebeurt in het aanmeldformulier zelf.

export async function Oproep() {
  const t = VOORPAGINA[await getSiteTaal()].oproep
  return (
    <section className="vp-oproep ayg-ivoor" aria-labelledby="vp-oproep-titel">
      <form action={SITE_PADEN.AANMELDEN} method="get" className="ayg-wrap vp-oproep-zin vp-onthul">
        <h2 id="vp-oproep-titel" className="ayg-sr">
          {t.titel}
        </h2>
        <div className="vp-oproep-regel">
          <span>{t.voor}</span>{' '}
          <label className="ayg-sr" htmlFor="vp-oproep-naam">
            {t.veldLabel}
          </label>
          <input
            id="vp-oproep-naam"
            name="naam"
            type="text"
            autoComplete="organization"
            maxLength={80}
            placeholder={t.voorbeeld}
            className="vp-oproep-veld"
          />{' '}
          <span className="vp-oproep-na">{t.na}</span>
        </div>
        <div className="vp-oproep-onder">
          <button type="submit" className="ayg-knop ayg-knop--accent vp-oproep-knop">
            {t.knop} <ArrowRight size={18} aria-hidden />
          </button>
          <p>{t.onder(PROEFDAGEN)}</p>
        </div>
      </form>
    </section>
  )
}
