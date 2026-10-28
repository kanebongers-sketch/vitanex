import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HeldDashboard } from '@/components/aiyourgym/mockups/HeldDashboard'
import { Figuur, Toestel } from '@/components/aiyourgym/mockups/kaders'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// De held (obsidiaan): de bezoeker moet het premium voelen voordat hij een alinea
// leest. Een grote editoriale kop links (de tweede regel cursief in champagne),
// rechts onderaan de zin wat het is, een hoofdknop en een rustige tweede keus.
// Daaronder het echte product op een donker podium met een zacht champagne licht:
// het scherm Vandaag van Club met de ledenapp ervoor (voorbeeldgegevens van
// Kernhal, en dat staat erbij). De kop komt regel voor regel op (alleen CSS).

export async function HeldMozaiek() {
  const t = VOORPAGINA[await getSiteTaal()].held
  return (
    <section className="vp-held" aria-labelledby="vp-held-titel">
      <div className="ayg-wrap vp-held-raster">
        <p className="ayg-label vp-held-oog">{t.oog}</p>
        <h1 id="vp-held-titel" className="vp-held-titel">
          <span className="vp-regel">
            <span>{t.titel.voor}</span>
          </span>
          <span className="vp-regel">
            <em>{t.titel.accent}</em>
          </span>
        </h1>
        <div className="vp-held-tekst">
          <p className="ayg-lead">{t.lead}</p>
          <div className="ayg-knoppen">
            <Link href={SITE_PADEN.AANMELDEN} className="ayg-knop ayg-knop--accent">
              {t.probeer(PROEFDAGEN)} <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={SITE_PADEN.DEMO} className="ayg-knop ayg-knop--rand">
              {t.demo}
            </Link>
          </div>
          <Geruststelling aantal={GERUST_BIJ_KNOP} />
        </div>
      </div>
      <div className="vp-held-podium">
        <Figuur label={t.beeldLabel} className="ayg-wrap vp-held-beeld">
          <div className="vp-held-scene">
            <div className="vp-held-venster">
              <HeldDashboard />
            </div>
            <Toestel tab="Home" className="vp-held-toestel">
              <AppHome />
            </Toestel>
          </div>
        </Figuur>
      </div>
    </section>
  )
}
