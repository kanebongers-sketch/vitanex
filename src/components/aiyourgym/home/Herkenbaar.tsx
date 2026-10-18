import { ArrowDownRight } from 'lucide-react'
import { PIJNPUNTEN } from '@/components/aiyourgym/inhoud/conversie'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'

// Direct na de held: wat een eigenaar nu dwarszit, en per punt hoe AI Your Gym
// dat oplost. Eerst de pijn, dan de oplossing, zonder concurrenten bij naam.

export function Herkenbaar() {
  return (
    <section className="ayg-sectie" aria-labelledby="herkenbaar-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="herkenbaar-titel"
          label="Herkenbaar?"
          titel="Minder losse systemen. Meer overzicht."
          tekst="Werk je met een lappendeken van programma’s, lijstjes en Excel? Dit is wat er verandert."
        />
        <ol className="ayg-pijn">
          {PIJNPUNTEN.map((p, i) => (
            <li key={p.pijn} className="ayg-pijn-rij">
              <div className="ayg-pijn-nu">
                <span className="ayg-pijn-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="ayg-h3">{p.pijn}</h3>
                <p>{p.uitleg}</p>
              </div>
              <div className="ayg-pijn-oplossing">
                <p className="ayg-pijn-label">
                  <ArrowDownRight size={16} aria-hidden /> Met AI Your Gym
                </p>
                <p>{p.oplossing}</p>
              </div>
            </li>
          ))}
        </ol>
        <SectieActie />
      </div>
    </section>
  )
}
