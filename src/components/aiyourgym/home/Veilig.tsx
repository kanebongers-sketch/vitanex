import { Database, Download, HeartPulse, KeyRound, ShieldCheck } from 'lucide-react'
import { MAATREGELEN } from '@/components/aiyourgym/inhoud/vertrouwen'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// "Veilig en volgens de AVG": alleen maatregelen die echt zo gebouwd zijn
// (bronnen staan in inhoud/vertrouwen.ts).

const ICONEN = [Database, ShieldCheck, KeyRound, HeartPulse, Download] as const

export function Veilig() {
  return (
    <section className="ayg-sectie--krap" aria-labelledby="veilig-titel">
      <div className="ayg-podium ayg-podium--rond ayg-veilig">
        <div className="ayg-wrap ayg-veilig-raster">
          <div className="ayg-stapel">
            <SectieKop
              id="veilig-titel"
              label="Veilig en volgens de AVG"
              titel="Ledengegevens horen veilig te zijn. Punt."
              tekst="Je bewaart gegevens van je leden, soms ook over hun gezondheid. Zo gaan we daarmee om."
            />
            <p className="ayg-veilig-plek" aria-hidden>
              <span>EU</span>
              <span>Frankfurt</span>
            </p>
          </div>
          <ul className="ayg-veilig-lijst">
            {MAATREGELEN.map((m, i) => {
              const Icoon = ICONEN[i % ICONEN.length]
              return (
                <li key={m.titel}>
                  <Icoon size={20} aria-hidden />
                  <div>
                    <h3 className="ayg-h3">{m.titel}</h3>
                    <p>{m.tekst}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
