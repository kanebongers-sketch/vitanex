import { CockpitKop } from '@/components/lifeos/cockpit/CockpitKop'
import { Cockpit } from '@/components/lifeos/cockpit/Cockpit'
import { KoppelFeedback } from '@/components/lifeos/KoppelFeedback'

// fitfactorypt.nl/lifeoskane — Kane's persoonlijke LifeOS-cockpit. Losgeknipt van
// MentaForce (dat is weer de consumenten-app); de toegang regelt de layout. De data
// leeft in een eigen Supabase-project (src/lib/lifeos/admin.ts).

export const metadata = { title: 'Dashboard' }

export default function LifeosDashboard() {
  return (
    <div className="lifeos-root">
      <div className="os-sfeer" aria-hidden="true" />
      <main className="os-schil os-schil--breed">
        <KoppelFeedback />
        <CockpitKop />
        <Cockpit />
      </main>
    </div>
  )
}
