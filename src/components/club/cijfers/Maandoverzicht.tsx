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

interface Cel {
  w: number | null
  /** De data begon halverwege deze maand: het cijfer is onvolledig. */
  deels: boolean
}

function cel(t: Tegel, k: Kant, c: CijferContext): Cel {
  const begin = t.nodig.map((n) => c.rapport.vanaf[n])
  if (begin.some((b) => b === null || b > k.venster.tot)) return { w: null, deels: false }
  return { w: t.waarde(k.cijfers), deels: begin.some((b) => b !== null && b > k.venster.van) }
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
          rijen: maanden.map((k) => [k.venster.maand, ...KOLOMMEN.map((t) => csvWaarde(cel(t, k, c).w, t.soort))]),
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
                    const { w, deels } = cel(t, k, c)
                    return (
                      <td key={t.sleutel} className="club-cijfers-rechts club-getal" data-geen={w === null || undefined} data-deels={deels || undefined}>
                        {toon(w, t.soort)}
                        {deels && <span aria-label=", onvolledig: de data begon halverwege de maand">*</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="club-cijfers-voetnoot">* Onvolledig: de data begon halverwege die maand, dus dit cijfer telt maar een deel van de maand.</p>
      </CijferBlok>
    </Hoofdstuk>
  )
}
