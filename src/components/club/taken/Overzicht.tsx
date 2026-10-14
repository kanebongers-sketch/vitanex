import type { AchterstandRegel, TaakHistorie } from '@/lib/club/taken/overzicht'
import { frequentieTekst, type Takenlijst } from '@/lib/club/taken/typen'
import { dagKort } from '@/lib/club/taken/weergave'

// Overzicht voor de manager: wat er in de week niet gedaan is, en per taak hoe
// vaak gedaan tegenover het minimum over de laatste vier weken.

function perLijst<T extends { taak: { lijstId: string } }>(lijsten: Takenlijst[], regels: T[]): { lijst: Takenlijst; regels: T[] }[] {
  return lijsten.map((lijst) => ({ lijst, regels: regels.filter((r) => r.taak.lijstId === lijst.id) })).filter((g) => g.regels.length > 0)
}

function AchterstandTekst({ regel }: { regel: AchterstandRegel }) {
  if (regel.taak.frequentie === 'dagelijks') {
    return (
      <span className="club-chip club-chip--let-op">
        {regel.gemisteDagen.length}x niet gedaan: {regel.gemisteDagen.map(dagKort).join(', ')}
      </span>
    )
  }
  return <span className="club-chip club-chip--let-op">{regel.definitief ? `${regel.tekort}x te weinig gedaan` : `nog ${regel.tekort}x nodig, loopt achter`}</span>
}

export function Achterstand({ lijsten, regels }: { lijsten: Takenlijst[]; regels: AchterstandRegel[] }) {
  if (regels.length === 0) {
    return <p className="club-melding club-melding--ok">Niets blijven liggen in deze week. Alles wat moest, is gedaan of ligt nog op schema.</p>
  }
  return (
    <div className="club-taken-overzicht-lijsten">
      {perLijst(lijsten, regels).map(({ lijst, regels: rs }) => (
        <section key={lijst.id} className="club-kaart club-kaart--vlak">
          <h3 className="club-taken-overzicht-kop">{lijst.naam}</h3>
          <ul className="club-lijst">
            {rs.map((r) => (
              <li key={r.taak.id} className="club-rij club-taken-overzicht-rij">
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">{r.taak.naam}</span>
                  <span className="club-rij-sub">{frequentieTekst(r.taak)}</span>
                </span>
                <AchterstandTekst regel={r} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Score({ h }: { h: TaakHistorie }) {
  if (h.score === null) return <span className="club-zacht">Geen minimum</span>
  const pct = Math.round(h.score * 100)
  const soort = pct >= 100 ? 'ok' : pct < 75 ? 'let-op' : 'midden'
  return (
    <span className="club-taken-score" data-soort={soort}>
      <span className="club-taken-score-balk" aria-hidden>
        <span style={{ transform: `scaleX(${h.score})` }} />
      </span>
      <span className="club-getal">{pct}%</span>
    </span>
  )
}

interface HistorieProps {
  lijsten: Takenlijst[]
  rijen: TaakHistorie[]
  weekNummers: number[]
}

export function Historie({ lijsten, rijen, weekNummers }: HistorieProps) {
  return (
    <div className="club-tabel-wrap">
      <table className="club-tabel club-taken-historie">
        <caption className="club-sr">Per taak hoe vaak gedaan per week, tegenover het minimum</caption>
        <thead>
          <tr>
            <th scope="col">Taak</th>
            {weekNummers.map((n) => (
              <th key={n} scope="col" className="club-getal">
                Wk {n}
              </th>
            ))}
            <th scope="col">Minimum</th>
            <th scope="col">Weken gehaald</th>
            <th scope="col">Gedaan van nodig</th>
          </tr>
        </thead>
        {perLijst(lijsten, rijen).map(({ lijst, regels }) => (
          <tbody key={lijst.id}>
            <tr className="club-taken-groep">
              <th scope="colgroup" colSpan={weekNummers.length + 4}>
                {lijst.naam}
              </th>
            </tr>
            {regels.map((h) => (
              <tr key={h.taak.id}>
                <th scope="row" className="club-taken-historie-naam">
                  {h.taak.naam}
                </th>
                {h.perWeek.map((n, i) => (
                  <td key={weekNummers[i]} className="club-getal" data-te-weinig={h.norm !== null && n < h.norm ? '' : undefined}>
                    {n}
                  </td>
                ))}
                <td className="club-getal">{h.norm === null ? 'n.v.t.' : `${h.norm}x`}</td>
                <td className="club-getal">{h.norm === null ? '' : `${h.wekenGehaald} van ${h.perWeek.length}`}</td>
                <td>
                  <Score h={h} />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

interface TegelsProps {
  gemist: number
  weekAchter: number
  afgemeld: number
  verstreken: number
  notities: number
}

export function OverzichtTegels({ gemist, weekAchter, afgemeld, verstreken, notities }: TegelsProps) {
  return (
    <section className="club-tegels" aria-label="Deze week in cijfers">
      <div className="club-tegel">
        <span className="club-tegel-label">Dagtaken gemist</span>
        <span className="club-tegel-getal">{gemist}</span>
        <span className="club-tegel-sub">{gemist === 0 ? 'Elke dag alles gedaan' : <span className="club-min">Vakjes leeg gebleven</span>}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">Weektaken achter</span>
        <span className="club-tegel-getal">{weekAchter}</span>
        <span className="club-tegel-sub">{weekAchter === 0 ? 'Poetsrooster op schema' : <span className="club-min">Minimum in gevaar of gemist</span>}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">Afsluitronde afgemeld</span>
        <span className="club-tegel-getal">
          {afgemeld}
          <span className="club-taken-van"> van {verstreken}</span>
        </span>
        <span className="club-tegel-sub">Afgelopen dagen van deze week</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">Iets anders gedaan</span>
        <span className="club-tegel-getal">{notities}</span>
        <span className="club-tegel-sub">Notities deze week</span>
      </div>
    </section>
  )
}
