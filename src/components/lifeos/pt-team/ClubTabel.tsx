import { LEAD_STATUSSEN, STATUS_LABEL, type LeadStatus } from '@/lib/lifeos/leads/leads'
import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import type { ClubMatrix } from '@/lib/lifeos/pt-dashboard/overzicht'

// Per club de leads per status — hetzelfde beeld als het "Overzicht"-tabblad
// van de Excel-tracker, maar live. Puur weergave.

export function ClubTabel({ clubs }: { clubs: ClubMatrix }) {
  const totaal = (s: LeadStatus) => clubs.reduce((n, c) => n + c.perStatus[s], 0)
  return (
    <section className="ptd-sectie" aria-labelledby="club-kop">
      <div className="ptd-sectiekop">
        <h2 id="club-kop">Leads per club</h2>
        <span>alle leads</span>
      </div>
      {clubs.length === 0 ? (
        <p className="ptd-leeg">Nog geen leads ingevuld.</p>
      ) : (
        <div className="ptd-scroll">
          <table className="ptd-tabel">
            <thead>
              <tr>
                <th scope="col">Club</th>
                <th scope="col">Totaal</th>
                {LEAD_STATUSSEN.map((s) => <th key={s} scope="col">{STATUS_LABEL[s]}</th>)}
              </tr>
            </thead>
            <tbody>
              {clubs.map((c) => (
                <tr key={c.club}>
                  <td>{c.club === 'onbekend' ? 'Geen club ingevuld' : CLUB_LABEL[c.club]}</td>
                  <td>{c.totaal}</td>
                  {LEAD_STATUSSEN.map((s) => <td key={s}>{c.perStatus[s] || ''}</td>)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Totaal</td>
                <td>{clubs.reduce((n, c) => n + c.totaal, 0)}</td>
                {LEAD_STATUSSEN.map((s) => <td key={s}>{totaal(s) || ''}</td>)}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}
