import { Pin } from 'lucide-react'
import { SOORT_CHIP, SOORT_LABEL, type Bericht } from '@/lib/club/berichten/model'
import { voorproef } from '@/lib/club/berichten/opmaak'
import { geledenTekst } from '@/lib/club/berichten/tijd'
import { BerichtInhoud } from './BerichtInhoud'

// Een bericht zoals het lid het in de app ziet. Groot: de hele tekst open
// (het vastgepinde bericht bovenaan). Compact: titel en een voorproef, met
// "Lees meer" (een <details>, werkt met toetsenbord en zonder JavaScript).

export type AppBericht = Pick<Bericht, 'titel' | 'tekst' | 'soort' | 'vastgepind' | 'zichtbaarVan'>

interface Props {
  bericht: AppBericht
  groot: boolean
  nu: Date
}

function Kop({ bericht, nu }: { bericht: AppBericht; nu: Date }) {
  return (
    <span className="club-bericht-app-boven">
      <span className={`club-bericht-app-soort club-bericht-app-soort--${SOORT_CHIP[bericht.soort]}`}>{SOORT_LABEL[bericht.soort]}</span>
      {bericht.vastgepind && (
        <span className="club-bericht-app-pin">
          <Pin aria-hidden size={12} /> Vastgepind
        </span>
      )}
      <span className="club-bericht-app-wanneer">{geledenTekst(bericht.zichtbaarVan, nu)}</span>
    </span>
  )
}

export function BerichtAppKaart({ bericht, groot, nu }: Props) {
  const kleur = `club-bericht-app--${SOORT_CHIP[bericht.soort]}`
  if (groot) {
    return (
      <article className={`club-bericht-app club-bericht-app--groot ${kleur}`}>
        <Kop bericht={bericht} nu={nu} />
        <h3>{bericht.titel}</h3>
        <BerichtInhoud tekst={bericht.tekst} />
      </article>
    )
  }
  const kort = voorproef(bericht.tekst, 90)
  const heeftMeer = kort !== voorproef(bericht.tekst, 5000)
  return (
    <article className={`club-bericht-app ${kleur}`}>
      <Kop bericht={bericht} nu={nu} />
      <h3>{bericht.titel}</h3>
      {heeftMeer ? (
        <details className="club-bericht-app-meer">
          <summary>
            <span className="club-bericht-app-kort">{kort}</span>
            <span className="club-bericht-app-lees">
              <span className="club-bericht-app-dicht">Lees meer</span>
              <span className="club-bericht-app-open">Minder</span>
            </span>
          </summary>
          <BerichtInhoud tekst={bericht.tekst} />
        </details>
      ) : (
        kort && <p className="club-bericht-app-kort">{kort}</p>
      )}
    </article>
  )
}
