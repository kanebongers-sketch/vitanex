import { Check, Minus } from 'lucide-react'
import { VERGELIJKING } from '@/components/aiyourgym/inhoud/conversie'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// Zonder of met AI Your Gym: een eerlijke tabel over de situatie van een
// sportschool, zonder namen van andere aanbieders en zonder prijzen.

export function Vergelijking() {
  return (
    <section className="ayg-sectie" aria-labelledby="vergelijking-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="vergelijking-titel"
          label="Het verschil"
          titel="Zonder AI Your Gym, en met."
          tekst="Wat er verandert op een gewone werkdag, voor jou, je team en je leden."
        />
        <table className="ayg-vergelijk">
          <caption className="ayg-sr">Een sportschool zonder en met AI Your Gym</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="ayg-sr">Onderwerp</span>
              </th>
              <th scope="col">Zonder</th>
              <th scope="col" className="ayg-vergelijk-met">
                Met AI Your Gym
              </th>
            </tr>
          </thead>
          <tbody>
            {VERGELIJKING.map((r) => (
              <tr key={r.onderwerp}>
                <th scope="row">{r.onderwerp}</th>
                <td>
                  <Minus size={16} aria-hidden />
                  <span>{r.zonder}</span>
                </td>
                <td className="ayg-vergelijk-met">
                  <Check size={16} strokeWidth={2.6} aria-hidden />
                  <span>{r.met}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <SectieActie />
      </div>
    </section>
  )
}
