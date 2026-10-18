import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { haalOpRanglijst } from '@/lib/club/community/lezen'
import { communityBasis } from '@/lib/club/community/paden'
import { RanglijstKeuze } from './RanglijstKeuze'
import './community.css'

// In Profiel: de weg naar de community en de keuze om op ranglijsten te
// staan (standaard uit). Zelfstandig blok, zodat /mijn alleen een regel nodig heeft.

interface Props {
  admin: SupabaseClient
  userId: string
  lidId: string
  voorvertoning: boolean
}

export async function CommunityProfielBlok({ admin, userId, lidId, voorvertoning }: Props) {
  const opRanglijst = await haalOpRanglijst(admin, userId, lidId)
  return (
    <div className="club-mijn-blok club-cm-profiel">
      <Link href={communityBasis(voorvertoning ? lidId : null)} className="club-cm-groep-link club-cm-profiel-link" prefetch={false}>
        <span className="club-cm-groep-icoon" aria-hidden>
          <Users size={20} />
        </span>
        <span className="club-cm-groep-tekst">
          <strong>Community</strong>
          <span className="club-cm-groep-meta">Groepen, berichten en ranglijsten</span>
        </span>
        <ChevronRight size={20} aria-hidden className="club-cm-groep-pijl" />
      </Link>
      {opRanglijst === null ? (
        <p className="club-cm-noot">Je keuze voor de ranglijsten kon niet worden geladen.</p>
      ) : (
        <RanglijstKeuze aan={opRanglijst} alleenLezen={voorvertoning} />
      )}
    </div>
  )
}
