import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { clubToegang, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { ROL_LABEL } from '@/lib/club/kern/medewerker'
import { vindMedewerkerLink } from '@/lib/club/medewerker-login/opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { ClubInlogPoort } from '@/components/club/inloggen/ClubInlogPoort'
import { barlow, inter } from '@/app/fonts/fit-factory'
import '@/app/(hoofd)/clubkane/club.css'
import '@/components/club/inloggen/inloggen.css'

// /clubinloggen/medewerker/<code>: de persoonlijke link van een medewerker.
// Pincode kiezen, wachten op goedkeuring van de eigenaar of clubmanager, of
// inloggen. Met de schakelaar uit, een onbekende of ingetrokken link, of een
// medewerker uit dienst: een gewone 404. Nooit een referrer, nooit in zoekmachines.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inloggen · Club',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

interface PaginaProps {
  params: Promise<{ code: string }>
}

function adminOfNull(): SupabaseClient | null {
  try {
    return createLifeosAdminClient()
  } catch {
    return null
  }
}

export default async function MedewerkerInloggenPagina({ params }: PaginaProps) {
  if (!CLUB_EIGEN_LOGIN) notFound()
  const { code } = await params
  const admin = adminOfNull()
  if (!admin) notFound()
  const gevonden = await vindMedewerkerLink(admin, code)
  if (!gevonden) notFound()
  const { toegang, medewerker } = gevonden
  const { organisatie } = await haalEigenOrganisatie(admin, toegang.userId)
  if (!organisatie || !(await hostPastBij(organisatie))) notFound()
  // Al binnen bij deze sportschool: meteen door.
  const t = await clubToegang()
  if (t && !t.isKane && t.userId === organisatie.id) redirect('/clubkane')

  const stijl = huisstijlVariabelen(organisatie.kleurAccent, organisatie.thema) as CSSProperties
  const rol = medewerker.rollen.map((r) => ROL_LABEL[r]).join(', ') || 'Medewerker'
  return (
    <div className={`lifeos-root ff club-app club-inlog ${barlow.variable} ${inter.variable}`} style={stijl} data-thema={organisatie.thema}>
      <main className="club-inlog-vlak">
        <ClubInlogPoort
          code={toegang.code}
          pinStatus={toegang.pinStatus}
          sportschool={organisatie.naam}
          voornaam={medewerker.naam.split(' ')[0]}
          rol={rol}
          apiBasis={`/api/club/inloggen/medewerker/${encodeURIComponent(toegang.code)}`}
        />
      </main>
    </div>
  )
}
