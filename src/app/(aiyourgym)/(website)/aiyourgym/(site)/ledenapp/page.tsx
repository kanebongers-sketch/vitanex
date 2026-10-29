import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import { Dumbbell, QrCode, TrendingUp, type LucideIcon } from 'lucide-react'
import { Huisstijl } from '@/components/aiyourgym/home/Huisstijl'
import { AppHome, AppInloggen, AppSchema, AppVoeding } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel, type AppTab } from '@/components/aiyourgym/mockups/kaders'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { siteAlternates } from '@/lib/aiyourgym/taal/metadata'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { LEDENAPP_PAGINA } from '@/lib/aiyourgym/taal/woorden/website/ledenapp'

type Teksten = (typeof LEDENAPP_PAGINA)['nl']

export async function generateMetadata(): Promise<Metadata> {
  const taal = await getSiteTaal()
  const t = LEDENAPP_PAGINA[taal]
  return { title: t.metaTitel, description: t.metaOmschrijving, alternates: siteAlternates('/ledenapp') }
}

const SCHERMEN: readonly { sleutel: keyof Teksten['schermen']; tab: AppTab; Scherm: ComponentType }[] = [
  { sleutel: 'inloggen', tab: 'Profiel', Scherm: AppInloggen },
  { sleutel: 'home', tab: 'Home', Scherm: AppHome },
  { sleutel: 'schema', tab: 'Schema', Scherm: AppSchema },
  { sleutel: 'voeding', tab: 'Voeding', Scherm: AppVoeding },
]

const FUNCTIES: readonly { sleutel: keyof Teksten['functies']; Icoon: LucideIcon }[] = [
  { sleutel: 'inchecken', Icoon: QrCode },
  { sleutel: 'schema', Icoon: Dumbbell },
  { sleutel: 'voortgang', Icoon: TrendingUp },
]

export default async function LedenappPagina() {
  const taal = await getSiteTaal()
  const t = LEDENAPP_PAGINA[taal]
  const { AANMELDEN, DEMO } = SITE_PADEN
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst}>
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            {ACTIE[taal].probeerDagen(PROEFDAGEN)}
          </Knop>
          <Knop href={DEMO} soort="rand">
            {t.demoKnop}
          </Knop>
        </div>
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
      </PaginaKop>
      <section className="ayg-sectie--krap" aria-label={t.schermenLabel}>
        <div className="ayg-wrap">
          <div className="ayg-toestellen ayg-toestellen--vier">
            {SCHERMEN.map(({ sleutel, tab, Scherm }) => (
              <figure key={sleutel} className="aygm-figuur">
                <div role="img" aria-label={t.schermen[sleutel].label} className="aygm">
                  <Toestel tab={tab}>
                    <Scherm />
                  </Toestel>
                </div>
                <figcaption className="ayg-toestel-label">{t.schermen[sleutel].titel}</figcaption>
              </figure>
            ))}
          </div>
          <p className="aygm-bijschrift">
            <span>{t.voorbeelden}</span>
          </p>
        </div>
      </section>
      <section className="ayg-sectie" aria-labelledby="instap-titel">
        <div className="ayg-wrap">
          <SectieKop naast id="instap-titel" label={t.instapLabel} titel={t.instapTitel} tekst={t.instapTekst} />
          <ol className="ayg-instap">
            {t.instap.map((s, i) => (
              <li key={s.titel} className="ayg-onthul">
                <span className="ayg-instap-nr" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="ayg-h3">{s.titel}</h3>
                <p>{s.tekst}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="ayg-sectie" aria-labelledby="tabs-titel">
        <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--boven">
          <SectieKop id="tabs-titel" label={t.functiesLabel} titel={t.functiesTitel} tekst={t.functiesTekst} />
          <ul className="ayg-tabs-lijst">
            {FUNCTIES.map(({ sleutel, Icoon }) => (
              <li key={sleutel}>
                <Icoon aria-hidden />
                <div>
                  <h3 className="ayg-h3">{t.functies[sleutel].titel}</h3>
                  <p>{t.functies[sleutel].tekst}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Huisstijl />
      <section className="ayg-sectie" aria-labelledby="app-vragen-titel">
        <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--boven">
          <SectieKop id="app-vragen-titel" label={t.vragenLabel} titel={t.vragenTitel} />
          <Vragen vragen={t.vragen} />
        </div>
      </section>
      <AanmeldBand titel={t.band} />
    </>
  )
}
