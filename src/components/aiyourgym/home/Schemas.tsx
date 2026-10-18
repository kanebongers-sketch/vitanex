import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { aantalMetCoaching, voorbeeldOefeningen } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { RepdbBron } from '@/components/aiyourgym/mockups/kaders'
import { CoachingDemo } from '@/components/aiyourgym/schemas/CoachingDemo'
import { SectieActie } from '@/components/aiyourgym/site/Actie'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// Het tweede hoofdpunt van de voorpagina: trainingsschema's zoals een trainer
// ze geeft. Een echte oefening uit de bibliotheek van Club, interactief.

export function Schemas() {
  const oefeningen = voorbeeldOefeningen()
  const aantal = aantalMetCoaching()
  return (
    <section className="ayg-sectie ayg-schemas" aria-labelledby="schemas-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="schemas-titel"
          label="Trainingsschema’s"
          titel={
            <>
              Schema&rsquo;s zoals een <mark className="ayg-markeer">trainer</mark> ze geeft.
            </>
          }
          tekst="Bij elke oefening de aanwijzingen die een goede trainer op de vloer geeft: genummerd, kort en in gewone taal. Met de fouten die je echt ziet en hoe je ze corrigeert."
        />
        <CoachingDemo oefeningen={oefeningen} />
        <div className="ayg-cd-onder">
          <ul className="ayg-cd-feitjes">
            <li>
              <b>{aantal}</b>
              <span>oefeningen met uitgeschreven coaching, klaar om mee te starten</span>
            </li>
            <li>
              <b>3 tot 5</b>
              <span>genummerde kernpunten per oefening, de belangrijkste eerst</span>
            </li>
            <li>
              <b>Eigen tekst</b>
              <span>pas de coaching aan in de taal van jouw trainers</span>
            </li>
          </ul>
          <p className="ayg-klein">
            Echte tekst uit de oefenbibliotheek. Schermvoorbeeld met voorbeeldgegevens · <RepdbBron />
          </p>
          <Link href={aygPad('/trainingsschemas')} className="ayg-pijllink">
            Zo werken trainingsschema&rsquo;s, van intake tot voortgang <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <SectieActie zin="Probeer het met je eigen trainers en je eigen oefeningen." />
      </div>
    </section>
  )
}
