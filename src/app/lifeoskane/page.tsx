import { CockpitKop } from '@/components/lifeos/cockpit/CockpitKop'
import { Cockpit } from '@/components/lifeos/cockpit/Cockpit'
import { KoppelFeedback } from '@/components/lifeos/KoppelFeedback'
import { LkHero } from '@/components/lifeos/os/LkKop'

// fitfactorypt.nl/lifeoskane: Kane's persoonlijke LifeOS-cockpit. Losgeknipt van
// MentaForce (dat is weer de consumenten-app); de toegang regelt de layout. De data
// leeft in een eigen Supabase-project (src/lib/lifeos/admin.ts). De groet staat in
// een hero met de teamfoto, net als het overzicht van de Fit Factory PT-app.

export const metadata = { title: 'Dashboard' }

export default function LifeosDashboard() {
  return (
    <div className="lifeos-root">
      <main className="os-schil os-schil--breed">
        <KoppelFeedback />
        <LkHero>
          <CockpitKop />
        </LkHero>
        <Cockpit />
      </main>
    </div>
  )
}
