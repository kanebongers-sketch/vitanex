import { CalendarClock, AlertTriangle } from 'lucide-react'
import type { ContractEinde } from '@/lib/lifeos/analyse/analyse-data'
import { formatEuro, maandLabel, maandStatus } from './analyse-format'

// Contract-einde-tijdlijn — het verleng-/opzegsignaal. Eén rij per maand met
// "N contracten · € X". De peilmaand en alles daarná krijgen een subtiele
// aandacht-markering (--status-warning): dat is het venster waarin trajecten
// aflopen en verlengd of opgezegd worden. Maanden vóór de peildatum zijn al
// verlopen (historisch) en staan gedempt. Semantische tabel; de status staat óók
// als tekst-tag, niet enkel als kleur.

interface ContractEindeTijdlijnProps {
  rijen: readonly ContractEinde[]
  peilmaand: string
  zonderEinddatum: number
}

export function ContractEindeTijdlijn({ rijen, peilmaand, zonderEinddatum }: ContractEindeTijdlijnProps) {
  return (
    <section className="anl-sectie" aria-label="Contract-einde per maand">
      <div className="anl-sectie-kop">
        <h2 className="anl-sectie-titel">
          <CalendarClock size={17} strokeWidth={2} aria-hidden="true" />
          Contracten die aflopen
        </h2>
        <p className="anl-sectie-bij">
          Vanaf <b>{maandLabel(peilmaand)}</b> is het verleng-venster (oranje gemarkeerd). Eerdere
          maanden zijn al verlopen.
        </p>
      </div>

      <div className="anl-tablewrap">
        <table className="anl-table">
          <caption className="anl-sr">Aantal aflopende contracten en de bijbehorende maandomzet per maand.</caption>
          <thead>
            <tr>
              <th scope="col">Maand</th>
              <th scope="col" className="anl-th-num">Contracten</th>
              <th scope="col" className="anl-th-num">Maandomzet</th>
            </tr>
          </thead>
          <tbody>
            {rijen.map((rij) => {
              const status = maandStatus(rij.maand, peilmaand)
              const aandacht = status !== 'verleden'
              return (
                <tr key={rij.maand} className={`anl-rij--${aandacht ? 'aandacht' : 'verleden'}`}>
                  <td>
                    <span className="anl-maand">{maandLabel(rij.maand)}</span>
                    {status === 'deze-maand' && (
                      <span className="anl-tag">
                        <AlertTriangle size={10} strokeWidth={2.4} aria-hidden="true" /> Deze maand
                      </span>
                    )}
                  </td>
                  <td className="anl-num">{rij.aantal}</td>
                  <td className="anl-num anl-omzet-num">{formatEuro(rij.omzet)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {zonderEinddatum > 0 && (
        <p className="anl-sectie-bij" style={{ marginTop: 12 }}>
          {zonderEinddatum} actieve klant zonder vastgelegde einddatum valt buiten deze tijdlijn.
        </p>
      )}
    </section>
  )
}
