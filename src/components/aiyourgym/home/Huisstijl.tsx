import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HuisstijlDemo } from '@/components/aiyourgym/mockups/HuisstijlDemo'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { Knop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { HUISSTIJL_SECTIE } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// De ledenapp in de huisstijl van de sportschool, om zelf te proberen.
// Teksten in de taal van de pagina (woordenboek HUISSTIJL_SECTIE).

interface Props {
  /** Toon de link naar de ledenapp-pagina (niet op die pagina zelf). */
  metLink?: boolean
}

export async function Huisstijl({ metLink = true }: Props) {
  const taal = await getSiteTaal()
  const t = HUISSTIJL_SECTIE[taal]
  return (
    <section className="ayg-sectie ayg-podium" aria-labelledby="huisstijl-titel">
      <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--om">
        <div className="ayg-stapel ayg-gesplitst-tekst">
          <SectieKop
            id="huisstijl-titel"
            label={t.label}
            titel={
              <>
                {t.titel.voor}
                <mark className="ayg-markeer">{t.titel.accent}</mark>
              </>
            }
            tekst={t.tekst}
          />
          <SectieActie />
          {metLink && (
            <div>
              <Knop href={aygPad('/ledenapp')} soort="rand" pijl>
                {t.link}
              </Knop>
            </div>
          )}
        </div>
        <HuisstijlDemo>
          <div role="img" aria-label={t.beeldLabel}>
            <Toestel tab="Home">
              <AppHome />
            </Toestel>
          </div>
        </HuisstijlDemo>
      </div>
    </section>
  )
}
