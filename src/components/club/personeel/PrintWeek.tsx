import type { Dienst, PersoneelLid, RoosterNotitie } from '@/lib/club/personeel/typen'
import { dagMaand, weekdagKort } from './weergave'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

type Tekst = (typeof PERSONEEL)['nl']

// De week voor op het prikbord: alleen zichtbaar bij printen. Per medewerker
// een rij, per dag een kolom, met tijd en soort dienst. Open diensten en
// mededelingen onderaan.

interface Props {
  dagen: readonly string[]
  week: readonly Dienst[]
  notities: readonly RoosterNotitie[]
  team: readonly PersoneelLid[]
  soortNamen: ReadonlyMap<string, string>
  titel: string
}

function Cel({ diensten, soortNamen, tk }: { diensten: readonly Dienst[]; soortNamen: ReadonlyMap<string, string>; tk: Tekst }) {
  return (
    <td>
      {diensten.map((d) => (
        <span key={d.id} className="club-personeel-printdienst">
          <strong>{tk.algemeen.vanTot(d.begin, d.eind)}</strong>{' '}
          {d.uursoort !== 'werk' ? tk.labels.uursoort[d.uursoort] : d.soortId ? soortNamen.get(d.soortId) : ''}
        </span>
      ))}
    </td>
  )
}

export async function PrintWeek({ dagen, week, notities, team, soortNamen, titel }: Props) {
  const taal = await getTaal()
  const tk = await clubTekst(PERSONEEL)
  const mensen = team.filter((l) => week.some((d) => d.medewerkerId === l.id))
  const open = week.filter((d) => d.medewerkerId === null)
  return (
    <section className="club-personeel-print" aria-hidden>
      <h2>
        {tk.print.titel(titel, dagMaand(dagen[0], taal), dagMaand(dagen[6], taal))}
      </h2>
      <table>
        <thead>
          <tr>
            <th>{tk.print.medewerker}</th>
            {dagen.map((d) => (
              <th key={d}>
                {weekdagKort(d, taal)} {dagMaand(d, taal)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mensen.map((l) => (
            <tr key={l.id}>
              <th>{l.naam}</th>
              {dagen.map((d) => (
                <Cel key={d} diensten={week.filter((x) => x.datum === d && x.medewerkerId === l.id)} soortNamen={soortNamen} tk={tk} />
              ))}
            </tr>
          ))}
          {open.length > 0 && (
            <tr>
              <th>{tk.print.open}</th>
              {dagen.map((d) => (
                <Cel key={d} diensten={open.filter((x) => x.datum === d)} soortNamen={soortNamen} tk={tk} />
              ))}
            </tr>
          )}
          {notities.length > 0 && (
            <tr>
              <th>{tk.print.mededelingen}</th>
              {dagen.map((d) => (
                <td key={d}>
                  {notities
                    .filter((n) => n.datum === d)
                    .map((n) => (
                      <span key={n.id} className="club-personeel-printdienst">
                        {n.van ? `${n.van} ` : ''}
                        {n.tekst}
                      </span>
                    ))}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
