import { Check, Minus } from 'lucide-react'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { WAT_KOMT_MEE } from '@/lib/aiyourgym/taal/woorden/website/home-vertrouwen'

// Op /overstappen: eerlijk wat er uit je ledenbestand meekomt en wat niet, als
// een tabel (wat, en wat je ermee doet), plus tips voor je eigen leden.
// Teksten in de taal van de pagina (woordenboek WAT_KOMT_MEE).

export async function WatKomtMee() {
  const t = await siteTekst(WAT_KOMT_MEE)
  const rijen = [...t.mee.map((p) => ({ ...p, mee: true })), ...t.nietMee.map((p) => ({ ...p, mee: false }))]
  return (
    <section className="ayg-sectie" aria-labelledby="mee-titel">
      <div className="ayg-wrap">
        <SectieKop id="mee-titel" label={t.label} naast titel={t.titel} tekst={t.tekst} />
        <div className="ayg-mee-raster">
          <table className="ayg-mee">
            <caption className="ayg-sr">{t.bijschrift}</caption>
            <thead>
              <tr>
                <th scope="col">{t.kolomGegevens}</th>
                <th scope="col">{t.kolomMee}</th>
                <th scope="col">{t.kolomToelichting}</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.titel} data-mee={r.mee ? 'ja' : 'nee'}>
                  <th scope="row">{r.titel}</th>
                  <td>
                    <span className="ayg-mee-teken">
                      {r.mee ? <Check size={15} strokeWidth={2.6} aria-hidden /> : <Minus size={15} strokeWidth={2.6} aria-hidden />}
                      {r.mee ? t.ja : t.nee}
                    </span>
                  </td>
                  <td>{r.tekst}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <aside className="ayg-kaart ayg-mee-tips" aria-labelledby="tips-titel">
            <h3 className="ayg-h3" id="tips-titel">
              {t.tipsTitel}
            </h3>
            <ol>
              {t.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  )
}
