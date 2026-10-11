import { BlokKaart } from '@/components/lifeos/blok/BlokKaart'
import { ProgrammaKaart } from '@/components/lifeos/programma/ProgrammaKaart'
import { LkPaginaKop } from '@/components/lifeos/os/LkKop'

// /lifeoskane/training: Kane's "training van vandaag" (het 4-weken-blok) en zijn
// programma- en voedingsschema, op een eigen pagina zodat het dashboard rustig
// blijft. Toegang en menu regelt de LifeOS-layout.

export const metadata = { title: 'Training' }

export default function TrainingPagina() {
  return (
    <div className="lifeos-root">
      <main className="os-schil os-schil--breed">
        <LkPaginaKop
          titel="Training & voeding"
          intro="Je training van vandaag en je programma. Kies een sessie of voedingsdag om je dag te volgen."
        />

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
