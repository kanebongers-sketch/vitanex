import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HuisstijlDemo } from '@/components/aiyourgym/mockups/HuisstijlDemo'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { Knop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// De ledenapp in de huisstijl van de sportschool, om zelf te proberen.

interface Props {
  /** Toon de link naar de ledenapp-pagina (niet op die pagina zelf). */
  metLink?: boolean
}

export function Huisstijl({ metLink = true }: Props) {
  return (
    <section className="ayg-sectie ayg-podium" aria-labelledby="huisstijl-titel">
      <div className="ayg-wrap ayg-gesplitst ayg-gesplitst--om">
        <div className="ayg-stapel ayg-gesplitst-tekst">
          <SectieKop
            id="huisstijl-titel"
            label="Ledenapp"
            titel={
              <>
                Jouw naam. Jouw kleuren. <mark className="ayg-markeer">Jouw app.</mark>
              </>
            }
            tekst="Leden zien jouw sportschool, niet de onze. Kies een kleur en een thema en kijk hoe de ledenapp meekleurt. Zo werkt het in de software ook."
          />
          {metLink && (
          <div>
            <Knop href={aygPad('/ledenapp')} soort="rand" pijl>
              Alles over de ledenapp
            </Knop>
          </div>
          )}
        </div>
        <HuisstijlDemo>
          <div role="img" aria-label="De ledenapp in de gekozen kleur: volgende les, bezoeken deze maand, QR-code en een challenge">
            <Toestel tab="Home">
              <AppHome />
            </Toestel>
          </div>
        </HuisstijlDemo>
      </div>
    </section>
  )
}
