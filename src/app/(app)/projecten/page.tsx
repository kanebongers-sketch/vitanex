import Navbar from '@/components/layout/Navbar'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { ProjectenBord } from '@/components/lifeos/projecten/ProjectenBord'

// /projecten — Kane's projectenbord: elk project met zijn taken en voortgang,
// achter dezelfde founder-gate als de rest van LifeOS (FounderPoort → niet-founder
// terug naar /home; de echte gate zit server-side op /api/lifeos/toegang). Losse
// route, niet op /home: dit is beheer, geen onderdeel van het dag-dashboard.
//
// Server component die client-eilanden (Navbar, FounderPoort, ProjectenBord)
// rendert. De `.lifeos-root`-wrapper draagt de navy/cyan LifeOS-tokens.

export const metadata = { title: 'Projecten' }

export default function ProjectenPagina() {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <FounderPoort>
        <div className="lifeos-root">
          <div className="os-sfeer" aria-hidden="true" />
          <main className="os-schil">
            <ProjectenBord />
          </main>
        </div>
      </FounderPoort>
    </div>
  )
}
