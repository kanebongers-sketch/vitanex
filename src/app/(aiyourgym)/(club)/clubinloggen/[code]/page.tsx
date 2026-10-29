import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CLUB_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/club/inloggen'
import { vindBeheerder } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { WachtwoordKiezen } from '@/components/club/inloggen/WachtwoordKiezen'
import '@/app/(aiyourgym)/(club)/club/club.css'
import '@/components/club/inloggen/inloggen.css'

// /clubinloggen/<code>: de uitnodiging van een eigenaar of clubmanager. Een keer
// een wachtwoord kiezen, daarna meteen binnen. Is het wachtwoord al gekozen, dan
// werkt de link niet meer: door naar /inloggen (e-mailadres en wachtwoord). Met
// de schakelaar uit of een onbekende link: een gewone 404. De code staat in de
// URL, dus nooit een referrer meesturen en nooit in zoekmachines.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await clubTekst(CLUB_INLOGGEN)).titelClub,
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  }
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
  // Uitnodiging al gebruikt: gewoon inloggen.
  if (b.wachtwoordHash) redirect('/inloggen')

  const stijl = huisstijlVariabelen(organisatie.kleurAccent, organisatie.thema) as CSSProperties
  const t = await clubTekst(CLUB_INLOGGEN)
  return (
    <div className="club-app club-inlog" style={stijl} data-thema={organisatie.thema}>
      <main className="club-inlog-vlak">
        <WachtwoordKiezen
          api={`/api/club/inloggen/${encodeURIComponent(b.code)}/wachtwoord`}
          rol={`${t.beheerderRol[b.rol]} · ${organisatie.naam}`}
          merk={<span className="club-inlog-club">{t.welkom(b.naam.split(' ')[0])}</span>}
          email={b.email}
          naam={b.naam}
        />
      </main>
    </div>
  )
}
