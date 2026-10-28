import { AANTAL_STAPPEN } from '@/lib/club/start/stappen'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// De afsluitende oproep (salie) als zin met een gat: "Open [jouw club] in AI Your
// Gym en start." Het gat is het veld voor de naam van je club, de laatste woorden
// zijn de knop. Een gewoon formulier (GET naar aanmelden met ?naam=): werkt ook
// zonder JavaScript, de naam staat daar al ingevuld en de controle gebeurt in het
// aanmeldformulier zelf. Eronder alleen wat klopt: de proefperiode (PROEFDAGEN,
// ook trial_period_days bij Stripe en de testbetaling), geen opstartkosten
// (besluit Kane 18-10-2026) en het aantal stappen van de startwizard.

export async function Oproep() {
  const t = VOORPAGINA[await getSiteTaal()].oproep
  return (
    <section className="vp-oproep" aria-labelledby="vp-oproep-titel">
      <form action={SITE_PADEN.AANMELDEN} method="get" className="vp-oproep-zin vp-onthul">
        <h2 id="vp-oproep-titel" className="ayg-sr">
          {t.titel}
        </h2>
        <p className="vp-oproep-regel">
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
          <span className="vp-oproep-na">{t.na}</span>{' '}
          <button type="submit" className="vp-oproep-knop">
            {t.knop}
          </button>
        </p>
        <p className="vp-oproep-onder">{t.onder(PROEFDAGEN, AANTAL_STAPPEN)}</p>
      </form>
    </section>
  )
}
