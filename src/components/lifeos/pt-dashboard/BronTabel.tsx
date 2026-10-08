import { BRON_LABEL } from '@/lib/lifeos/leads/leads'
import type { BronRij } from '@/lib/lifeos/pt-dashboard/analyse'

// Waar komen leads vandaan, en welke bron levert klanten op? Puur weergave; de
// cijfers komen uit `bronAnalyse` (analyse.ts). Alleen bronnen met leads.

export function BronTabel({ bronnen, kop = 'Per bron' }: { bronnen: readonly BronRij[]; kop?: string }) {
  const totaal = bronnen.reduce((n, b) => n + b.aantal, 0)
  return (
    <div className="ptd-an-blok">
      <div className="ptd-an-blokkop">
        <h3>{kop}</h3>
        <span>alle leads</span>
      </div>
      {bronnen.length === 0 ? (
        <p className="ptd-leeg">Nog geen leads, dus nog geen bronnen.</p>
      ) : (
        <>
          <div className="ptd-scroll">
            <table className="ptd-tabel">
              <thead>
                <tr>
                  <th scope="col">Bron</th>
                  <th scope="col">Leads</th>
                  <th scope="col">Aandeel</th>
                  <th scope="col">Klant</th>
                  <th scope="col">Conversie</th>
                </tr>
              </thead>
              <tbody>
                {bronnen.map((b) => (
                  <tr key={b.bron}>
                    <th scope="row">{BRON_LABEL[b.bron]}</th>
                    <td>{b.aantal}</td>
                    <td>{Math.round((b.aantal / totaal) * 100)}%</td>
                    <td>{b.klant}</td>
                    <td>{b.conversie === null ? '–' : `${b.conversie}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ptd-hint">Conversie = klant geworden ÷ leads uit die bron. Bij een handvol leads zegt een percentage nog weinig.</p>
        </>
      )}
    </div>
  )
}
