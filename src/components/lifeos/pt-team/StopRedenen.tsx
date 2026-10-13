import { STOP_REDEN_LABEL } from '@/lib/lifeos/pt-dashboard/abonnementen'
import type { StopOverzicht } from '@/lib/lifeos/pt-dashboard/stopredenen'

// Waarom klanten stoppen: per reden, en per trainer hoeveel er stopten met de
// meest genoemde reden. "Reden niet ingevuld" telt eerlijk mee. Puur weergave.

export function StopRedenen({ o }: { o: StopOverzicht }) {
  return (
    <section className="ptd-sectie" aria-labelledby="stop-kop">
      <div className="ptd-sectiekop">
        <h2 id="stop-kop">Waarom klanten stoppen</h2>
        <span>{o.totaal} opgezegd of gestopt</span>
      </div>
      {o.totaal === 0 ? (
        <p className="ptd-leeg">Nog geen klanten opgezegd of gestopt.</p>
      ) : (
        <div className="ptd-an-raster">
          <div className="ptd-scroll">
            <table className="ptd-tabel">
              <caption className="sr-only">Stopredenen</caption>
              <thead>
                <tr><th scope="col">Reden</th><th scope="col">Aantal</th><th scope="col">Aandeel</th></tr>
              </thead>
              <tbody>
                {o.redenen.map((r) => (
                  <tr key={r.reden}>
                    <th scope="row">{r.reden === 'onbekend' ? 'Reden niet ingevuld' : STOP_REDEN_LABEL[r.reden]}</th>
                    <td>{r.aantal}</td>
                    <td>{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ptd-scroll">
            <table className="ptd-tabel">
              <caption className="sr-only">Gestopt per PT&apos;er</caption>
              <thead>
                <tr><th scope="col">PT&apos;er</th><th scope="col">Gestopt</th><th scope="col">Meest genoemd</th></tr>
              </thead>
              <tbody>
                {o.perTrainer.map((t) => (
                  <tr key={t.id}>
                    <th scope="row">{t.naam}</th>
                    <td>{t.gestopt}</td>
                    <td>{t.vaakst ? STOP_REDEN_LABEL[t.vaakst] : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
