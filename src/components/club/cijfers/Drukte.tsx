import type { CSSProperties } from 'react'
import { weekdagNaam } from '@/lib/club/cijfers/tijd'
import { heel } from '@/lib/club/cijfers/opmaak'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'

// Drukte per weekdag en uur als heatmap: een CSS-raster met vaste rijhoogte,
// dagen links en uren eronder in hetzelfde raster, dus altijd uitgelijnd en
// nooit buiten de kaart. Meer dekking = drukker; leeg vlak = geen check-in.

interface Props {
  raster: number[][]
  uren: number[]
  beschrijving: string
  taal: Taal
}

function Cel({ n, max, titel }: { n: number; max: number; titel: string }) {
  const stijl: CSSProperties | undefined = n === 0 ? undefined : { opacity: 0.16 + 0.84 * (n / max) }
  return <span className={n === 0 ? 'club-cijfers-cel club-cijfers-cel--leeg' : 'club-cijfers-cel'} style={stijl} title={titel} />
}

export function Drukte({ raster, uren, beschrijving, taal }: Props) {
  const t = CIJFERS[taal].drukte
  const max = Math.max(0, ...raster.flat())
  if (max === 0 || uren.length === 0) return <p className="club-leeg">{t.leeg}</p>
  return (
    <figure className="club-cijfers-figuur club-cijfers-drukte">
      <div className="club-cijfers-drukte-raster" aria-hidden style={{ gridTemplateColumns: `28px repeat(${uren.length}, minmax(0, 1fr))` }}>
        {raster.map((rij, d) => (
          <div key={t.weekdagKort[d]} className="club-cijfers-drukte-rij">
            <span className="club-cijfers-drukte-dag">{t.weekdagKort[d]}</span>
            {uren.map((uur) => (
              <Cel key={uur} n={rij[uur] ?? 0} max={max} titel={t.cel(weekdagNaam(d + 1, taal), uur, heel(rij[uur] ?? 0, taal))} />
            ))}
          </div>
        ))}
        <div className="club-cijfers-drukte-rij">
          <span />
          {uren.map((u) => (
            <span key={u} className="club-cijfers-drukte-uur">
              {u % 3 === 0 ? `${u}` : ''}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="club-cijfers-schaal">
        <span className="club-sr">{beschrijving}</span>
        <span>{t.rustig}</span>
        <span className="club-cijfers-schaal-balk" aria-hidden />
        <span>{t.druk}</span>
        <span className="club-cijfers-schaal-max">{t.max(heel(max, taal))}</span>
      </figcaption>
      <table className="club-sr">
        <caption>{t.tabel}</caption>
        <thead>
          <tr>
            <th scope="col">{t.dag}</th>
            {uren.map((u) => (
              <th key={u} scope="col">{`${u}:00`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {raster.map((rij, d) => (
            <tr key={t.weekdagKort[d]}>
              <th scope="row">{weekdagNaam(d + 1, taal)}</th>
              {uren.map((u) => (
                <td key={u}>{rij[u] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
