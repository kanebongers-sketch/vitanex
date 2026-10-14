import type { UrenRegel } from '@/lib/club/personeel/uren'
import { urenKlok } from '@/lib/club/personeel/uren'
import type { PersoneelLid } from '@/lib/club/personeel/typen'

// De urentabel voor de administratie. Verschil = gewerkt min contract over de
// periode (naar rato van de dagen): minder is koraal, meer is blauw.

export function UrenTabel({ regels, team }: { regels: readonly UrenRegel[]; team: readonly PersoneelLid[] }) {
  const lid = (id: string) => team.find((l) => l.id === id)
  return (
    <div className="club-tabel-wrap club-personeel-urentabel">
      <table className="club-tabel">
        <caption className="club-sr">Uren per medewerker in deze periode</caption>
        <thead>
          <tr>
            <th scope="col">Medewerker</th>
            <th scope="col">Gepland</th>
            <th scope="col">Gewerkt</th>
            <th scope="col">Contract</th>
            <th scope="col">Verschil</th>
            <th scope="col">Ziek</th>
            <th scope="col">Verlof</th>
            <th scope="col">Avond</th>
            <th scope="col">Weekend</th>
            <th scope="col">Open</th>
          </tr>
        </thead>
        <tbody>
          {regels.map((r) => {
            const l = lid(r.medewerkerId)
            const verschil = r.verschilMin
            return (
              <tr key={r.medewerkerId} data-kleur={l?.kleur}>
                <th scope="row" className="club-personeel-urennaam">
                  <span className="club-personeel-stip" aria-hidden />
                  {l?.naam ?? 'Onbekend'}
                </th>
                <td className="club-getal">{urenKlok(r.geplandMin)}</td>
                <td className="club-getal"><strong>{urenKlok(r.gewerktMin)}</strong></td>
                <td className="club-getal club-zacht">{r.contractMin === null ? 'geen' : urenKlok(r.contractMin)}</td>
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
      <p className="club-hint club-personeel-tabelnoot">Gewerkt is na aftrek van pauze. Avond is na 18:00, weekend is zaterdag en zondag. Open is het aantal geplande diensten zonder bevestiging.</p>
    </div>
  )
}
