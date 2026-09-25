import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { CockpitKop } from '@/components/lifeos/cockpit/CockpitKop'
import { Cockpit } from '@/components/lifeos/cockpit/Cockpit'

// LifeOS — Kane's persoonlijke Life OS, ingebed in MentaForce achter een
// founder-gate. De data leeft in een eigen Supabase-project (zie
// src/lib/lifeos/admin.ts); dit scherm surft er alleen op.
//
// Eén vullende cockpit i.p.v. drie moment-tabs: de kern (taken, notities) staat
// nu altijd in beeld en het scherm vult ook een breed venster. Alles staat in een
// `.lifeos-root`-wrapper: die draagt de LifeOS-designtokens (navy/cyan + de os-*
// schaal) los van de MentaForce-tokens, zodat de twee stijlwerelden elkaar niet
// overschrijven.

export const metadata = { title: 'Mijn dashboard' }

export default function LifeosPagina() {
  return (
    <FounderPoort>
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil os-schil--breed">
          <CockpitKop />
          <Cockpit />
        </main>
      </div>
    </FounderPoort>
  )
}
