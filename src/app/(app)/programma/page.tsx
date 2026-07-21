import Navbar from '@/components/layout/Navbar'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { ProgrammaKaart } from '@/components/lifeos/programma/ProgrammaKaart'

// /programma — Kane's persoonlijke trainings- en voedingsschema, achter dezelfde
// founder-gate als de rest van LifeOS (FounderPoort → niet-founder terug naar
// /home; de echte gate zit server-side op /api/lifeos/toegang). Losse route,
// niet op /home: dit is Kane's programma, geen onderdeel van het werk-dashboard.
//
// Server component die client-eilanden (Navbar, FounderPoort, ProgrammaKaart)
// rendert. De `.lifeos-root`-wrapper draagt de navy/cyan LifeOS-tokens.

export const metadata = { title: 'Mijn programma' }

export default function ProgrammaPagina() {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <FounderPoort>
        <div className="lifeos-root">
          <div className="os-sfeer" aria-hidden="true" />
          <main className="os-schil">
            <ProgrammaKaart />
          </main>
        </div>
      </FounderPoort>
    </div>
  )
}
