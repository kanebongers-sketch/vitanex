import Navbar from '@/components/layout/Navbar'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { AnalyseScherm } from '@/components/lifeos/analyse/AnalyseScherm'

// /omzet-analyse — Kane's zakelijke analyse-scherm (Fit Factory): waar de omzet
// vandaan komt, welke contracten aflopen (churn/verleng) en hoe het groeit. Achter
// dezelfde founder-gate als de rest van LifeOS (FounderPoort → niet-founder terug
// naar /home; de echte gate zit server-side op /api/lifeos/toegang). Losse route,
// niet op /home: dit is Kane's cijferwerk, geen onderdeel van het werk-dashboard.
//
// Server component die client-eilanden (Navbar, FounderPoort) rendert; de
// `.lifeos-root`-wrapper draagt de navy/cyan LifeOS-tokens.

export const metadata = { title: 'Omzet-analyse' }

export default function OmzetAnalysePagina() {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <FounderPoort>
        <div className="lifeos-root">
          <div className="os-sfeer" aria-hidden="true" />
          <main className="os-schil">
            <AnalyseScherm />
          </main>
        </div>
      </FounderPoort>
    </div>
  )
}
