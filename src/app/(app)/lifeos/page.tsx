import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { MomentWissel } from '@/components/lifeos/momenten/MomentWissel'
import { Ochtend } from '@/components/lifeos/momenten/Ochtend'
import { Nu } from '@/components/lifeos/momenten/Nu'
import { Avond } from '@/components/lifeos/momenten/Avond'

// LifeOS — Kane's persoonlijke Life OS, ingebed in MentaForce achter een
// founder-gate. De data leeft in een eigen Supabase-project (zie
// src/lib/lifeos/admin.ts); dit scherm surft er alleen op.
//
// Alles staat in een `.lifeos-root`-wrapper: die draagt de LifeOS-designtokens
// (navy/cyan + de os-* schaal) los van de MentaForce-tokens, zodat de twee
// stijlwerelden elkaar niet overschrijven.

export const metadata = { title: 'LifeOS' }

export default function LifeosPagina() {
  return (
    <FounderPoort>
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil">
          <MomentWissel ochtend={<Ochtend />} nu={<Nu />} avond={<Avond />} />
        </main>
      </div>
    </FounderPoort>
  )
}
