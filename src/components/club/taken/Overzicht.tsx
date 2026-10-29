import type { AchterstandRegel, TaakHistorie } from '@/lib/club/taken/overzicht'
import { frequentieTekst, type Takenlijst } from '@/lib/club/taken/typen'
import { dagKort } from '@/lib/club/taken/weergave'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

type OverzichtTekst = (typeof TAKEN)['nl']['overzicht']

// Overzicht voor de manager: wat er in de week niet gedaan is, en per taak hoe
// vaak gedaan tegenover het minimum over de laatste vier weken.

function perLijst<T extends { taak: { lijstId: string } }>(lijsten: Takenlijst[], regels: T[]): { lijst: Takenlijst; regels: T[] }[] {
  return lijsten.map((lijst) => ({ lijst, regels: regels.filter((r) => r.taak.lijstId === lijst.id) })).filter((g) => g.regels.length > 0)
}

function AchterstandTekst({ regel, t, taal }: { regel: AchterstandRegel; t: OverzichtTekst; taal: Taal }) {
  if (regel.taak.frequentie === 'dagelijks') {
    return (
      <span className="club-chip club-chip--let-op">
        {t.nietGedaan(regel.gemisteDagen.length, regel.gemisteDagen.map((d) => dagKort(d, taal)).join(', '))}
      </span>
    )
  }
  return <span className="club-chip club-chip--let-op">{regel.definitief ? t.teWeinig(regel.tekort) : t.nogNodig(regel.tekort)}</span>
}

export async function Achterstand({ lijsten, regels }: { lijsten: Takenlijst[]; regels: AchterstandRegel[] }) {
  const taal = await getTaal()
  const t = TAKEN[taal].overzicht
  if (regels.length === 0) {
    return <p className="club-melding club-melding--ok">{t.nietsLiggen}</p>
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
                  <span className="club-rij-sub">{frequentieTekst(r.taak, taal)}</span>
                </span>
                <AchterstandTekst regel={r} t={t} taal={taal} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Score({ h, t }: { h: TaakHistorie; t: OverzichtTekst }) {
  if (h.score === null) return <span className="club-zacht">{t.geenMinimum}</span>
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

export async function Historie({ lijsten, rijen, weekNummers }: HistorieProps) {
  const t = TAKEN[await getTaal()].overzicht
  return (
    <div className="club-tabel-wrap">
      <table className="club-tabel club-taken-historie">
        <caption className="club-sr">{t.tabelUitleg}</caption>
        <thead>
          <tr>
            <th scope="col">{t.taak}</th>
            {weekNummers.map((n) => (
              <th key={n} scope="col" className="club-getal">
                {t.wk(n)}
              </th>
            ))}
            <th scope="col">{t.minimum}</th>
            <th scope="col">{t.wekenGehaald}</th>
            <th scope="col">{t.gedaanVanNodig}</th>
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
                <td className="club-getal">{h.norm === null ? t.nvt : t.keer(h.norm)}</td>
                <td className="club-getal">{h.norm === null ? '' : t.vanWeken(h.wekenGehaald, h.perWeek.length)}</td>
                <td>
                  <Score h={h} t={t} />
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

export async function OverzichtTegels({ gemist, weekAchter, afgemeld, verstreken, notities }: TegelsProps) {
  const t = TAKEN[await getTaal()].overzicht
  return (
    <section className="club-tegels" aria-label={t.tegels}>
      <div className="club-tegel">
        <span className="club-tegel-label">{t.gemist}</span>
        <span className="club-tegel-getal">{gemist}</span>
        <span className="club-tegel-sub">{gemist === 0 ? t.gemistNul : <span className="club-min">{t.gemistSub}</span>}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">{t.weekAchter}</span>
        <span className="club-tegel-getal">{weekAchter}</span>
        <span className="club-tegel-sub">{weekAchter === 0 ? t.weekAchterNul : <span className="club-min">{t.weekAchterSub}</span>}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">{t.afgemeld}</span>
        <span className="club-tegel-getal">
          {afgemeld}
          <span className="club-taken-van">{t.van(verstreken)}</span>
        </span>
        <span className="club-tegel-sub">{t.afgelopenDagen}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">{t.ietsAnders}</span>
        <span className="club-tegel-getal">{notities}</span>
        <span className="club-tegel-sub">{t.notitiesWeek}</span>
      </div>
    </section>
  )
}
