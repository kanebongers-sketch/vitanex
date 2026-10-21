import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { clubToegang, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { ROL_LABEL } from '@/lib/club/beheerders/beheerder'
import { vindBeheerder } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { ClubInlogPoort } from '@/components/club/inloggen/ClubInlogPoort'
import '@/app/(aiyourgym)/(club)/club/club.css'
import '@/components/club/inloggen/inloggen.css'

// /clubinloggen/<code>: de persoonlijke link van een eigenaar of clubmanager.
// Pincode kiezen, wachten op goedkeuring van Kane, of inloggen. Met de
// schakelaar uit of een onbekende link: een gewone 404. De code staat in de
// URL, dus nooit een referrer meesturen en nooit in zoekmachines.

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
    return clubDatabase()
  } catch {
    return null
  }
}

export default async function ClubInloggenPagina({ params }: PaginaProps) {
  if (!CLUB_EIGEN_LOGIN) notFound()
  const { code } = await params
  const admin = adminOfNull()
  if (!admin) notFound()
  const b = await vindBeheerder(admin, code)
  if (!b) notFound()
  const { organisatie } = await haalEigenOrganisatie(admin, b.organisatieId)
  if (!organisatie || !(await hostPastBij(organisatie))) notFound()
  // Al binnen bij deze sportschool: meteen door.
  const t = await clubToegang()
  if (t && !t.isPlatformEigenaar && t.userId === organisatie.id) redirect('/club')

  const stijl = huisstijlVariabelen(organisatie.kleurAccent, organisatie.thema) as CSSProperties
  return (
    <div className="club-app club-inlog" style={stijl} data-thema={organisatie.thema}>
      <main className="club-inlog-vlak">
        <ClubInlogPoort code={b.code} pinStatus={b.pinStatus} sportschool={organisatie.naam} voornaam={b.naam.split(' ')[0]} rol={ROL_LABEL[b.rol]} />
      </main>
    </div>
  )
}
