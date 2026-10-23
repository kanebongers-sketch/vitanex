import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import { ROL_LABEL } from '@/lib/club/kern/medewerker'
import { vindUitnodiging } from '@/lib/club/medewerker-login/opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { MedewerkerWachtwoordKiezen } from '@/components/club/inloggen/MedewerkerWachtwoordKiezen'
import '@/app/(aiyourgym)/(club)/club/club.css'
import '@/components/club/inloggen/inloggen.css'

// /clubinloggen/medewerker/<token>: de eenmalige uitnodiging van een medewerker.
// Een sterk wachtwoord kiezen en meteen binnen; daarna inloggen op /inloggen
// met e-mailadres en wachtwoord (besluit Kane 23-10-2026). Met de schakelaar
// uit, een onbekende, gebruikte of verlopen uitnodiging, of een medewerker uit
// dienst: een gewone 404. Nooit een referrer, nooit in zoekmachines.

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

export default async function MedewerkerInloggenPagina({ params }: PaginaProps) {
  if (!CLUB_EIGEN_LOGIN) notFound()
  const { code } = await params
  const admin = adminOfNull()
  if (!admin) notFound()
  const gevonden = await vindUitnodiging(admin, code, new Date())
  const email = gevonden?.toegang.email
  if (!gevonden || !email) notFound()
  const { toegang, medewerker } = gevonden
  const { organisatie } = await haalEigenOrganisatie(admin, toegang.userId)
  if (!organisatie || !(await hostPastBij(organisatie))) notFound()

  const stijl = huisstijlVariabelen(organisatie.kleurAccent, organisatie.thema) as CSSProperties
  const rol = medewerker.rollen.map((r) => ROL_LABEL[r]).join(', ') || 'Medewerker'
  return (
    <div className="club-app club-inlog" style={stijl} data-thema={organisatie.thema}>
      <main className="club-inlog-vlak">
        <MedewerkerWachtwoordKiezen
          token={code}
          sportschool={organisatie.naam}
          voornaam={medewerker.naam.split(' ')[0]}
          naam={medewerker.naam}
          rol={rol}
          email={email}
        />
      </main>
    </div>
  )
}
