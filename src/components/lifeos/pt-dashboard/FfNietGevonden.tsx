import Link from 'next/link'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { FfMaker } from '@/components/lifeos/pt-dashboard/FfMaker'
import { barlow, inter } from '@/app/fonts/fit-factory'

// De 404 op fitfactorypt.nl: een onbekende naam of een pagina die niet bestaat.
// In de Fit Factory-stijl, met een weg terug naar de team-ingang.

export function FfNietGevonden() {
  return (
    <main className={`lifeos-root ff ${barlow.variable} ${inter.variable}`}>
      <header className="ff-balk">
        <FfLogo prioriteit />
      </header>
      <div className="ptd ff-smal">
        <section className="ptd-form ptd-smal" aria-labelledby="ff-404-kop">
          <h2 id="ff-404-kop">Deze pagina bestaat niet</h2>
          <p className="ptd-tekst">De link klopt niet (meer). Kies je naam op de startpagina om naar je eigen app te gaan.</p>
          <div className="ptd-acties">
            <Link className="ptd-knop ptd-knop--primair" href="/">
              Naar de startpagina
            </Link>
          </div>
        </section>
        <footer className="ff-voet">
          <span>Fit Factory Personal Training</span>
          <FfMaker />
        </footer>
      </div>
    </main>
  )
}
