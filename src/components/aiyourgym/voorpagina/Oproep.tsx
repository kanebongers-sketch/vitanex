import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// Hoofdstuk 5 (salie): de afsluitende oproep als zin met een gat. Het gat is het
// veld voor de naam van je club, het laatste woord is de knop. Een gewoon formulier
// (GET naar aanmelden met ?naam=): werkt ook zonder JavaScript, de naam staat daar
// al ingevuld en de controle gebeurt in het aanmeldformulier zelf.

export async function Oproep() {
  const t = VOORPAGINA[await getSiteTaal()].oproep
  return (
    <section className="vp-oproep" aria-labelledby="vp-oproep-titel">
      <form action={SITE_PADEN.AANMELDEN} method="get" className="vp-oproep-zin vp-onthul">
        <h2 id="vp-oproep-titel" className="ayg-sr">
          {t.titel}
        </h2>
        <div className="vp-oproep-regel">
          {t.voor}{' '}
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
          <span className="vp-oproep-na">{t.na}</span>{' '}
          <button type="submit" className="vp-oproep-knop">
            {t.knop}
          </button>
        </div>
        <p className="vp-oproep-onder">{t.onder(PROEFDAGEN)}</p>
      </form>
    </section>
  )
}
