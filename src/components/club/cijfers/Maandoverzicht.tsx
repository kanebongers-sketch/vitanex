import Link from 'next/link'
import { csvBestandsnaam } from '@/lib/club/cijfers/csv'
import { maandNaam } from '@/lib/club/cijfers/maand'
import type { Kant } from '@/lib/club/cijfers/rapport'
import { clubPad } from '@/lib/club/kern/vestiging'
import { CijferBlok, Hoofdstuk } from './CijferBlok'
import { csvWaarde, tegel, tegelLabel, toon, type Tegel } from './kern-tegels'
import { bestandsdeel, tekstVan, type CijferContext } from './context'

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
  const tk = tekstVan(c)
  const t = tk.maanden
  const maanden = [...c.rapport.trend].reverse()
  const pad = (m: string) => clubPad('/cijfers', c.vestiging, { maand: m, ...(c.bereik === 'alle' ? { bereik: 'alle' } : {}) })
  return (
    <Hoofdstuk nummer="06" titel={t.hoofdstuk}>
      <CijferBlok
        id="blok-maanden"
        className="club-cijfers-volle"
        titel={t.titel}
        definitie={tk.definities.maand}
        csv={{
          bestand: csvBestandsnaam('maandoverzicht', bestandsdeel(c)),
          kop: [tk.algemeen.maand, ...KOLOMMEN.map((k) => (k.soort === 'procent' ? `${tegelLabel(k, c.taal)} %` : tegelLabel(k, c.taal)))],
          rijen: maanden.map((k) => [k.venster.maand, ...KOLOMMEN.map((kol) => csvWaarde(cel(kol, k, c).w, kol.soort))]),
        }}
      >
        <div className="club-tabel-wrap club-cijfers-vergelijk">
          <table className="club-tabel">
            <caption className="club-sr">{t.bijschrift}</caption>
            <thead>
              <tr>
                <th scope="col">{tk.algemeen.maand}</th>
                {KOLOMMEN.map((k) => (
                  <th key={k.sleutel} scope="col" className="club-cijfers-rechts">
                    {tegelLabel(k, c.taal)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maanden.map((k) => (
                <tr key={k.venster.maand} aria-current={k.venster.maand === c.maand ? 'true' : undefined}>
                  <th scope="row">
                    <Link href={pad(k.venster.maand)} scroll={false}>
                      {maandNaam(k.venster.maand, c.taal)}
                    </Link>
                    {k.venster.lopend && <span className="club-cijfers-loopt">{t.loopt}</span>}
                  </th>
                  {KOLOMMEN.map((kol) => {
                    const { w, deels } = cel(kol, k, c)
                    return (
                      <td key={kol.sleutel} className="club-cijfers-rechts club-getal" data-geen={w === null || undefined} data-deels={deels || undefined}>
                        {toon(w, kol.soort, c.taal)}
                        {deels && <span aria-label={t.onvolledig}>*</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="club-cijfers-voetnoot">{t.voetnoot}</p>
      </CijferBlok>
    </Hoofdstuk>
  )
}
