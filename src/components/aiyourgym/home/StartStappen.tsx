import Link from 'next/link'
import { ArrowRight, LifeBuoy } from 'lucide-react'
import { START_MINUTEN, START_STAPPEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { Figuur } from '@/components/aiyourgym/mockups/kaders'
import { WizardScherm } from '@/components/aiyourgym/mockups/WizardScherm'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// "Zo simpel start je": de stappen van de startwizard uit Club, en de
// persoonlijke hulp die in de duurdere pakketten zit.

interface Props {
  /** Toon de link naar de overstap-pagina (niet op die pagina zelf). */
  metLink?: boolean
}

export function StartStappen({ metLink = true }: Props) {
  return (
    <section className="ayg-sectie ayg-start" aria-labelledby="start-titel">
      <div className="ayg-wrap ayg-start-raster">
        <div className="ayg-stapel ayg-start-kop">
          <SectieKop
            id="start-titel"
            label="Zo simpel start je"
            titel={
              <>
                {START_STAPPEN.length} stappen. <mark className="ayg-markeer">Een kwartier.</mark>
              </>
            }
            tekst={`Na het aanmelden leidt een startwizard je door de inrichting, samen ongeveer ${START_MINUTEN} minuten. Elke stap stelt zijn deel meteen in, je stopt wanneer je wilt en gaat later verder waar je was. Pas als alles echt staat, staat je sportschool live.`}
          />
          <aside className="ayg-start-hulp" aria-label="Persoonlijke hulp">
            <LifeBuoy size={22} aria-hidden />
            <div>
              <p className="ayg-start-hulp-kop">Persoonlijke hulp, gratis in Club en Keten</p>
              <p>We richten je sportschool samen met je in: ledenbestand, rooster en je eerste schema&rsquo;s.</p>
            </div>
          </aside>
          <SectieActie />
          {metLink && (
            <p>
              <Link href={aygPad('/overstappen')} className="ayg-pijllink">
                Zo stap je over <ArrowRight size={16} aria-hidden />
              </Link>
            </p>
          )}
        </div>
        <ol className="ayg-start-stappen">
          {START_STAPPEN.map((s) => (
            <li key={s.nr} className="ayg-onthul" data-laatste={s.nr === START_STAPPEN.length ? '' : undefined}>
              <span className="ayg-start-nr" aria-hidden>
                {String(s.nr).padStart(2, '0')}
              </span>
              <h3 className="ayg-start-titel">{s.titel}</h3>
              <p>{s.kort}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="ayg-wrap ayg-ruim-boven">
        <Figuur
          className="ayg-onthul"
          label="De startwizard bij stap 5, Lessen: de teller met 4 van 8 stappen af en de tijd die nog over is, een balk per stap, de regel dat alles alvast is ingevuld voor de soort sportschool, de lestypen en de vaste week, en de knoppen Opslaan en stoppen en Klaar, verder"
        >
          <WizardScherm />
        </Figuur>
      </div>
    </section>
  )
}
