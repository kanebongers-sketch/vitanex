import type { UrenRegel } from '@/lib/club/personeel/uren'
import { urenKlok } from '@/lib/club/personeel/uren'
import type { PersoneelLid } from '@/lib/club/personeel/typen'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

// De urentabel voor de administratie. Verschil = gewerkt min contract over de
// periode (naar rato van de dagen): minder is koraal, meer is blauw.

export async function UrenTabel({ regels, team }: { regels: readonly UrenRegel[]; team: readonly PersoneelLid[] }) {
  const alles = await clubTekst(PERSONEEL)
  const tk = alles.urenTabel
  const lid = (id: string) => team.find((l) => l.id === id)
  return (
    <div className="club-tabel-wrap club-personeel-urentabel">
      <table className="club-tabel">
        <caption className="club-sr">{tk.bijschrift}</caption>
        <thead>
          <tr>
            <th scope="col">{tk.medewerker}</th>
            <th scope="col">{tk.gepland}</th>
            <th scope="col">{tk.gewerkt}</th>
            <th scope="col">{tk.contract}</th>
            <th scope="col">{tk.verschil}</th>
            <th scope="col">{tk.ziek}</th>
            <th scope="col">{tk.verlof}</th>
            <th scope="col">{tk.avond}</th>
            <th scope="col">{tk.weekend}</th>
            <th scope="col">{tk.open}</th>
          </tr>
        </thead>
        <tbody>
          {regels.map((r) => {
            const l = lid(r.medewerkerId)
            const verschil = r.verschilMin
            return (
              <tr key={r.medewerkerId} data-kleur={l?.kleur}>
                <th scope="row">
                  <span className="club-personeel-urennaam">
                    <span className="club-personeel-stip" aria-hidden />
                    {l?.naam ?? alles.algemeen.onbekend}
                  </span>
                </th>
                <td className="club-getal">{urenKlok(r.geplandMin)}</td>
                <td className="club-getal"><strong>{urenKlok(r.gewerktMin)}</strong></td>
                <td className="club-getal club-zacht">{r.contractMin === null ? tk.geen : urenKlok(r.contractMin)}</td>
                <td className="club-getal" data-verschil={verschil === null ? undefined : verschil < -60 ? 'min' : verschil > 60 ? 'plus' : 'gelijk'}>
                  {verschil === null ? '' : `${verschil > 0 ? '+' : ''}${urenKlok(verschil)}`}
                </td>
                <td className="club-getal">{r.ziekMin ? urenKlok(r.ziekMin) : ''}</td>
                <td className="club-getal">{r.verlofMin ? urenKlok(r.verlofMin) : ''}</td>
                <td className="club-getal">{r.avondMin ? urenKlok(r.avondMin) : ''}</td>
                <td className="club-getal">{r.weekendMin ? urenKlok(r.weekendMin) : ''}</td>
                <td className="club-getal">{r.onbevestigd > 0 ? <span className="club-chip club-chip--let-op">{r.onbevestigd}</span> : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="club-hint club-personeel-tabelnoot">{tk.noot}</p>
    </div>
  )
}
