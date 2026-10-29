import { LifeBuoy } from 'lucide-react'
import { START_MINUTEN, START_STAPPEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { WizardScherm } from '@/components/aiyourgym/mockups/WizardScherm'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { START_SECTIE } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// "Zo simpel start je" op /overstappen: links een kop, een zin en de persoonlijke
// hulp uit de duurdere pakketten, rechts groot de startwizard zelf (het scherm laat
// de stappen zien). Teksten in de taal van de pagina (START_SECTIE).

export async function StartStappen() {
  const taal = await getSiteTaal()
  const t = START_SECTIE[taal]
  const titel = t.titel(START_STAPPEN.length)
  return (
    <section className="ayg-sectie ayg-start" aria-labelledby="start-titel">
      <div className="ayg-wrap ayg-start-raster">
        <div className="ayg-stapel ayg-start-kop">
          <SectieKop
            id="start-titel"
            label={t.label}
            titel={
              <>
                {titel.voor}
                <mark className="ayg-markeer">{titel.accent}</mark>
              </>
            }
            tekst={t.tekst(START_MINUTEN)}
          />
          <aside className="ayg-start-hulp" aria-label={t.hulpLabel}>
            <LifeBuoy size={22} aria-hidden />
            <div>
              <p className="ayg-start-hulp-kop">{t.hulpKop}</p>
              <p>{t.hulpTekst}</p>
            </div>
          </aside>
        </div>
        <Figuur className="ayg-onthul" label={t.figuurLabel}>
          <WizardScherm />
        </Figuur>
      </div>
    </section>
  )
}
