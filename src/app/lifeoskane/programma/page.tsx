import { ProgrammaKaart } from '@/components/lifeos/programma/ProgrammaKaart'

// /lifeoskane/programma — Kane's trainings- en voedingsprogramma. Toegang en
// menu regelt de LifeOS-layout.

export const metadata = { title: 'Mijn programma' }

export default function ProgrammaPagina() {
  return (
    <div className="lifeos-root">
      <div className="os-sfeer" aria-hidden="true" />
      <main className="os-schil">
        <ProgrammaKaart />
      </main>
    </div>
  )
}
