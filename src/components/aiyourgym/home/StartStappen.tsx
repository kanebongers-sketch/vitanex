import Link from 'next/link'
import { ArrowRight, LifeBuoy } from 'lucide-react'
import { START_MINUTEN, START_STAPPEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { WizardScherm } from '@/components/aiyourgym/mockups/WizardScherm'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { START_SECTIE } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'
import { WIZARD } from '@/lib/aiyourgym/taal/woorden/website/mockups/schermen'

// "Zo simpel start je": de stappen van de startwizard uit Club, en de
// persoonlijke hulp die in de duurdere pakketten zit. Teksten in de taal van de
// pagina (START_SECTIE, de stappen uit WIZARD in de volgorde van START_STAPPEN).

interface Props {
  /** Toon de link naar de overstap-pagina (niet op die pagina zelf). */
  metLink?: boolean
}

export async function StartStappen({ metLink = true }: Props) {
  const taal = await getSiteTaal()
  const t = START_SECTIE[taal]
  const stappen = WIZARD[taal].stappen
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
          <SectieActie />
          {metLink && (
            <p>
              <Link href={aygPad('/overstappen', taal)} className="ayg-pijllink">
                {t.link} <ArrowRight size={16} aria-hidden />
              </Link>
            </p>
          )}
        </div>
        <ol className="ayg-start-stappen">
          {START_STAPPEN.map((s, i) => (
            <li key={s.nr} className="ayg-onthul" data-laatste={s.nr === START_STAPPEN.length ? '' : undefined}>
              <span className="ayg-start-nr" aria-hidden>
                {String(s.nr).padStart(2, '0')}
              </span>
              <h3 className="ayg-start-titel">{stappen[i]?.titel ?? s.titel}</h3>
              <p>{stappen[i]?.kort ?? s.kort}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="ayg-wrap ayg-ruim-boven">
        <Figuur className="ayg-onthul" label={t.figuurLabel}>
          <WizardScherm />
        </Figuur>
      </div>
    </section>
  )
}
