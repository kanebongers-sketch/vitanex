import Navbar from '@/components/layout/Navbar'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { TeamKpi } from '@/components/lifeos/team/TeamKpi'

// /team-kpi — Team-KPI-overzicht: hoe presteren Kane's trainers (klanten, omzet,
// spreiding) op basis van de Fit Factory-import. Achter dezelfde founder-gate als
// de rest van LifeOS (FounderPoort → niet-founder terug naar /home; de echte gate
// zit server-side op /api/lifeos/toegang).
//
// LET OP: bewust NIET op /team. Dat is al de B2B HR "Team dashboard"-route
// (member-beheer + /team/[id]-profielen, gelinkt vanuit HrShell/hr/dashboard).
// Deze founder-KPI is een los ding en krijgt daarom een eigen route.
//
// Server component die client-eilanden (Navbar, FounderPoort) rendert; TeamKpi is
// zelf statisch. De `.lifeos-root`-wrapper draagt de navy/cyan LifeOS-tokens.

export const metadata = { title: 'Team' }

export default function TeamKpiPagina() {
  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <FounderPoort>
        <div className="lifeos-root">
          <div className="os-sfeer" aria-hidden="true" />
          <main className="os-schil">
            <TeamKpi />
          </main>
        </div>
      </FounderPoort>
    </div>
  )
}
