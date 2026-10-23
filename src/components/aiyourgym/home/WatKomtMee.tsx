import { Check, Minus } from 'lucide-react'
import { KOMT_MEE, KOMT_NIET_MEE, OVERSTAP_TIPS } from '@/components/aiyourgym/inhoud/eerlijk'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// Op /overstappen: eerlijk wat er uit je ledenbestand meekomt en wat niet, als
// een tabel (wat, en wat je ermee doet), plus tips voor je eigen leden.

export function WatKomtMee() {
  const rijen = [
    ...KOMT_MEE.map((p) => ({ ...p, mee: true })),
    ...KOMT_NIET_MEE.map((p) => ({ ...p, mee: false })),
  ]
  return (
    <section className="ayg-sectie" aria-labelledby="mee-titel">
      <div className="ayg-wrap">
        <SectieKop
          id="mee-titel"
          label="Wat komt mee"
          naast
          titel="Wat je meeneemt, en wat niet."
          tekst="Uit je ledenbestand lees je de gegevens van je leden in. Wat bij geld en geschiedenis hoort, blijft waar het nu staat."
        />
        <div className="ayg-mee-raster">
          <table className="ayg-mee">
            <caption className="ayg-sr">Wat er bij overstappen wel en niet meekomt</caption>
            <thead>
              <tr>
                <th scope="col">Gegevens</th>
                <th scope="col">Komt mee</th>
                <th scope="col">Toelichting</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.titel} data-mee={r.mee ? 'ja' : 'nee'}>
                  <th scope="row">{r.titel}</th>
                  <td>
                    <span className="ayg-mee-teken">
                      {r.mee ? <Check size={15} strokeWidth={2.6} aria-hidden /> : <Minus size={15} strokeWidth={2.6} aria-hidden />}
                      {r.mee ? 'Ja' : 'Nee'}
                    </span>
                  </td>
                  <td>{r.tekst}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <aside className="ayg-kaart ayg-mee-tips" aria-labelledby="tips-titel">
            <h3 className="ayg-h3" id="tips-titel">
              Tips voor je eigen leden
            </h3>
            <ol>
              {OVERSTAP_TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  )
}
