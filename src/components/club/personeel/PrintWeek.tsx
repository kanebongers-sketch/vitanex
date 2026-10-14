import type { Dienst, PersoneelLid, RoosterNotitie } from '@/lib/club/personeel/typen'
import { UURSOORT_LABEL } from '@/lib/club/personeel/typen'
import { dagMaand, weekdagKort } from './weergave'

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

function Cel({ diensten, soortNamen }: { diensten: readonly Dienst[]; soortNamen: ReadonlyMap<string, string> }) {
  return (
    <td>
      {diensten.map((d) => (
        <span key={d.id} className="club-personeel-printdienst">
          <strong>
            {d.begin} tot {d.eind}
          </strong>{' '}
          {d.uursoort !== 'werk' ? UURSOORT_LABEL[d.uursoort] : d.soortId ? soortNamen.get(d.soortId) : ''}
        </span>
      ))}
    </td>
  )
}

export function PrintWeek({ dagen, week, notities, team, soortNamen, titel }: Props) {
  const mensen = team.filter((l) => week.some((d) => d.medewerkerId === l.id))
  const open = week.filter((d) => d.medewerkerId === null)
  return (
    <section className="club-personeel-print" aria-hidden>
      <h2>
        Personeelsrooster · {titel} · {dagMaand(dagen[0])} tot {dagMaand(dagen[6])}
      </h2>
      <table>
        <thead>
          <tr>
            <th>Medewerker</th>
            {dagen.map((d) => (
              <th key={d}>
                {weekdagKort(d)} {dagMaand(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mensen.map((l) => (
            <tr key={l.id}>
              <th>{l.naam}</th>
              {dagen.map((d) => (
                <Cel key={d} diensten={week.filter((x) => x.datum === d && x.medewerkerId === l.id)} soortNamen={soortNamen} />
              ))}
            </tr>
          ))}
          {open.length > 0 && (
            <tr>
              <th>Open</th>
              {dagen.map((d) => (
                <Cel key={d} diensten={open.filter((x) => x.datum === d)} soortNamen={soortNamen} />
              ))}
            </tr>
          )}
          {notities.length > 0 && (
            <tr>
              <th>Mededelingen</th>
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
