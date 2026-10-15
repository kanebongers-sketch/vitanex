import Link from 'next/link'
import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { maandNaam } from '@/lib/club/cijfers/maand'
import type { Kant } from '@/lib/club/cijfers/rapport'
import { clubPad } from '@/lib/club/kern/vestiging'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { csvWaarde, tegel, toon, type Tegel } from './kern-tegels'
import { bestandsdeel, type CijferContext } from './context'

// De 12 maanden onder elkaar, nieuwste boven, met dezelfde kerncijfers als de
// strook bovenaan. Een maand van voor de eerste data staat als "geen data".
// Klik op een maand om het rapport van die maand te openen.

const KOLOMMEN: readonly Tegel[] = ['bestandEind', 'instroom', 'uitstroom', 'groei', 'bezoek', 'perLid', 'bezetting', 'noShow', 'leads', 'conversie'].map(tegel)

function waarde(t: Tegel, k: Kant, c: CijferContext): number | null {
  const vanaf = c.rapport.vanaf
  const zonderData = t.nodig.some((n) => {
    const begin = vanaf[n]
    return begin === null || begin > k.venster.tot
  })
  return zonderData ? null : t.waarde(k.cijfers)
}

export function Maandoverzicht({ c }: { c: CijferContext }) {
  const maanden = [...c.rapport.trend].reverse()
  const pad = (m: string) => clubPad('/cijfers', c.vestiging, { maand: m, ...(c.bereik === 'alle' ? { bereik: 'alle' } : {}) })
  return (
    <Hoofdstuk nummer="06" titel="12 maanden">
      <CijferBlok
        id="blok-maanden"
        className="club-cijfers-volle"
        titel="Maand voor maand"
        definitie={DEFINITIES.maand}
        csv={{
          bestand: csvBestandsnaam('maandoverzicht', bestandsdeel(c)),
          kop: ['Maand', ...KOLOMMEN.map((t) => (t.soort === 'procent' ? `${t.label} %` : t.label))],
          rijen: maanden.map((k) => [k.venster.maand, ...KOLOMMEN.map((t) => csvWaarde(waarde(t, k, c), t.soort))]),
        }}
      >
        <div className="club-tabel-wrap club-cijfers-vergelijk">
          <table className="club-tabel">
            <caption className="club-sr">Kerncijfers per maand, de laatste 12 maanden</caption>
            <thead>
              <tr>
                <th scope="col">Maand</th>
                {KOLOMMEN.map((t) => (
                  <th key={t.sleutel} scope="col" className="club-cijfers-rechts">
                    {t.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maanden.map((k) => (
                <tr key={k.venster.maand} aria-current={k.venster.maand === c.maand ? 'true' : undefined}>
                  <th scope="row">
                    <Link href={pad(k.venster.maand)} scroll={false}>
                      {maandNaam(k.venster.maand)}
                    </Link>
                    {k.venster.lopend && <span className="club-cijfers-loopt"> loopt nog</span>}
                  </th>
                  {KOLOMMEN.map((t) => {
                    const w = waarde(t, k, c)
                    return (
                      <td key={t.sleutel} className="club-cijfers-rechts club-getal" data-geen={w === null || undefined}>
                        {toon(w, t.soort)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CijferBlok>
    </Hoofdstuk>
  )
}
