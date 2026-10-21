import { ProgrammaKaart } from '@/components/lifeos/programma/ProgrammaKaart'

// /lifeoskane/programma: Kane's trainings- en voedingsprogramma. Toegang en menu
// regelt de LifeOS-layout; de kop (boventitel, h1, streep) zit in ProgrammaKaart en
// krijgt zijn Fit Factory-stijl uit globals.css.

export const metadata = { title: 'Mijn programma' }

export default function ProgrammaPagina() {
  return (
    <div className="lifeos-root">
      <main className="os-schil">
        <ProgrammaKaart />
      </main>
    </div>
  )
}
