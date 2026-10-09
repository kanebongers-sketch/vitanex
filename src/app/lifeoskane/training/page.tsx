import { BlokKaart } from '@/components/lifeos/blok/BlokKaart'
import { ProgrammaKaart } from '@/components/lifeos/programma/ProgrammaKaart'

// /lifeoskane/training — Kane's "training van vandaag" (het 4-weken-blok) en zijn
// programma-/voedingsschema, op een eigen pagina zodat het dashboard rustig
// blijft. Toegang en menu regelt de LifeOS-layout.

export const metadata = { title: 'Training' }

export default function TrainingPagina() {
  return (
    <div className="lifeos-root">
      <div className="os-sfeer" aria-hidden="true" />
      <main className="os-schil os-schil--breed">
        <header className="os-cluster__kop" style={{ marginBottom: 8 }}>
          <h1 className="os-zone__kop">Training &amp; voeding</h1>
          <p className="os-zone__intro">
            Je training van vandaag en je programma. Kies een sessie of voedingsdag om je dag te volgen.
          </p>
        </header>

        <section className="os-cluster" aria-label="Training en voeding">
          <div className="os-tile--vol">
            <BlokKaart />
          </div>
          <div className="os-tile--vol">
            <ProgrammaKaart />
          </div>
        </section>
      </main>
    </div>
  )
}
