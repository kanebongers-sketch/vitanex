import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { voorbeeldOefeningen } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { SchemaBlikvanger, type BlikOefening } from './SchemaBlikvanger'

// Trainingsschema's zoals een trainer ze geeft, met ons eigen 3D-figuur als
// blikvanger. De coaching is de echte tekst uit de bibliotheek van Club; de
// hele route (intake, voorstel, editor, ledenapp) staat op /trainingsschemas.

const KERNPUNTEN = 3

export function Schemas() {
  const oefeningen: BlikOefening[] = voorbeeldOefeningen().map((o) => ({
    naam: o.naam,
    kort: o.kort,
    voorschrift: o.voorschrift,
    kernpunten: o.coaching.kernpunten.slice(0, KERNPUNTEN).map((k) => ({ punt: k.punt, uitleg: k.uitleg })),
  }))
  return (
    <section className="ayg-sectie ayg-podium ayg-podium--rond ayg-schemas" aria-labelledby="schemas-titel">
      <div className="ayg-wrap">
        <div className="ayg-schemas-kop">
          <p className="ayg-label ayg-label--accent">Trainingsschema&rsquo;s</p>
          <h2 className="ayg-h2" id="schemas-titel">
            Schema&rsquo;s zoals een <mark className="ayg-markeer">trainer</mark> ze geeft.
          </h2>
          <p className="ayg-lead">Bij elke oefening een figuur dat de beweging voordoet en de aanwijzingen van een goede trainer: genummerd, kort en in gewone taal.</p>
        </div>
        <SchemaBlikvanger oefeningen={oefeningen} />
        <div className="ayg-schemas-onder">
          <p className="ayg-klein">Echte tekst uit de oefenbibliotheek. Pas de coaching aan in de taal van je eigen trainers.</p>
          <Link href={aygPad('/trainingsschemas')} className="ayg-pijllink">
            Zo werken trainingsschema&rsquo;s, van intake tot voortgang <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
