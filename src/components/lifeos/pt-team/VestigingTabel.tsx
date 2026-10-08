import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { euro } from '@/lib/lifeos/pt-dashboard/abonnementen'
import type { VestigingRij } from '@/lib/lifeos/pt-dashboard/team-overzicht'

// Per vestiging: lopende abonnementen, personen en maandomzet — de
// management-samenvatting uit de Excel, maar live. Puur weergave; alleen voor
// eigenaren en de beheerder (PT'ers zien geen bedragen).

export function VestigingTabel({ vestigingen }: { vestigingen: readonly VestigingRij[] }) {
  const som = (f: (v: VestigingRij) => number) => vestigingen.reduce((n, v) => n + f(v), 0)
  return (
    <section className="ptd-sectie" aria-labelledby="vestiging-kop">
      <div className="ptd-sectiekop">
        <h2 id="vestiging-kop">Per vestiging</h2>
        <span>lopende PT-abonnementen · incl. btw</span>
      </div>
      {vestigingen.length === 0 ? (
        <p className="ptd-leeg">Nog geen lopende klanten ingevuld.</p>
      ) : (
        <div className="ptd-scroll">
          <table className="ptd-tabel">
            <thead>
              <tr>
                <th scope="col">Vestiging</th>
                <th scope="col">Abonnementen</th>
                <th scope="col">Personen</th>
                <th scope="col">Per maand</th>
              </tr>
            </thead>
            <tbody>
              {vestigingen.map((v) => (
                <tr key={v.club}>
                  <td>{CLUB_LABEL[v.club]}</td>
                  <td>{v.lopend}{v.bevroren > 0 ? ` (${v.bevroren} bevr.)` : ''}</td>
                  <td>{v.personen}</td>
                  <td>{euro(v.maandwaarde)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Totaal</td>
                <td>{som((v) => v.lopend)}</td>
                <td>{som((v) => v.personen)}</td>
                <td>{euro(som((v) => v.maandwaarde))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}
