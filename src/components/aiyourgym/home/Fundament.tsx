import { Building2, Globe, KeyRound, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// Waarom je erop kunt bouwen: groei, rechten, privacy, en hoe het product
// beter wordt. Eerlijk over de naam: we bouwen met AI, we beloven geen AI-trucs.

const PUNTEN = [
  { Icoon: Building2, titel: 'Meerdere vestigingen', tekst: 'Elke vestiging met eigen zalen, lessen en openingstijden. Lidmaatschappen bepalen waar een lid mag sporten.' },
  { Icoon: KeyRound, titel: 'Rechten per rol', tekst: 'De eigenaar mag alles. Wat een clubmanager ziet, vink je zelf aan.' },
  { Icoon: ShieldCheck, titel: 'AVG en data in de EU', tekst: 'Gegevens staan in de EU. Elke sportschool heeft een strikt gescheiden omgeving, gezondheidsgegevens alleen met toestemming.' },
  { Icoon: Globe, titel: 'Je eigen adres', tekst: 'Je omgeving op naam.aiyourgym.com, met je eigen logo en kleuren.' },
  { Icoon: Sparkles, titel: 'Elke maand nieuwe functies', tekst: 'Automatisch voor iedereen. Geen updates installeren, geen nieuwe versie kopen.' },
  { Icoon: Workflow, titel: 'Gebouwd met AI', tekst: 'Daardoor komen verbeteringen snel bij jou en je team.' },
] as const

export function Fundament() {
  return (
    <section className="ayg-sectie" aria-labelledby="fundament-titel">
      <div className="ayg-wrap">
        <SectieKop
          id="fundament-titel"
          label="Fundament"
          titel="Gebouwd om mee te groeien."
          tekst="Of je nu een vestiging hebt of een keten: dezelfde software, die elke maand beter wordt."
        />
        <ul className="ayg-fundament">
          {PUNTEN.map(({ Icoon, titel, tekst }) => (
            <li key={titel}>
              <Icoon size={22} aria-hidden />
              <h3 className="ayg-h3">{titel}</h3>
              <p>{tekst}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
