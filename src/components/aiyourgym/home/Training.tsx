import { Check } from 'lucide-react'
import { Figuur, RepdbBron } from '@/components/aiyourgym/mockups/kaders'
import { Oefening } from '@/components/aiyourgym/mockups/Oefening'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// Het hart van Club: trainingsschema's met coaching per oefening.

const PUNTEN = [
  'Intake met metingen en gezondheidsvragen, daarna een startvoorstel voor het schema',
  'Bij elke oefening kernpunten, stappen, veelgemaakte fouten, ademhaling en tempo',
  'Het lid ziet het schema in de app en vinkt af wat gedaan is',
] as const

export function Training() {
  return (
    <section className="ayg-sectie ayg-podium" aria-labelledby="training-titel">
      <div className="ayg-wrap ayg-gesplitst">
        <div className="ayg-stapel ayg-gesplitst-tekst">
          <SectieKop
            id="training-titel"
            label="Coaching"
            titel={
              <>
                Elk schema met een <mark className="ayg-markeer">trainer</mark> erin.
              </>
            }
            tekst="Een lid traint niet alleen met sets en herhalingen, maar met de aanwijzingen die een goede trainer op de vloer geeft. Genummerd, kort en in gewone taal."
          />
          <ul className="ayg-vinklijst">
            {PUNTEN.map((p) => (
              <li key={p}>
                <Check size={16} aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <Figuur
          className="ayg-onthul"
          label="Een oefening in AI Your Gym: de goblet squat als bewegende illustratie, met vier genummerde kernpunten, ademhaling en tempo"
          bijschrift={<RepdbBron />}
        >
          <Oefening />
        </Figuur>
      </div>
    </section>
  )
}
