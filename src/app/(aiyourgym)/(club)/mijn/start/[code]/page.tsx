import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { normaalEmail } from '@/lib/club/kern/wachtwoord-regels'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { LINK_WERKT_NIET, bruikbareLink } from '@/lib/club/ledenlogin/inlog-api'
import { AANVRAAG_PAD } from '@/lib/club/app-uitnodigen/velden'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { InlogKaart } from '@/components/club/ledenlogin/InlogKaart'
import { WachtwoordFormulier } from '@/components/club/ledenlogin/WachtwoordFormulier'

// /mijn/start/<code>: de uitnodiging van de sportschool (link in de mail of QR
// aan de balie). Eenmalig en 7 dagen geldig: het lid bevestigt zijn
// e-mailadres en kiest een sterk wachtwoord (eerste keer of wachtwoord
// vergeten). Daarna alleen nog inloggen met e-mail plus wachtwoord. Onbekende,
// gebruikte of verlopen link: steeds dezelfde neutrale kaart. Schakelaar uit: 404.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Wachtwoord kiezen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

const NEUTRAAL = { kleurAccent: '#B58E5C', thema: 'donker' as const }

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

function WerktNiet() {
  return (
    <LedenappSchil organisatie={NEUTRAAL}>
      <InlogKaart merkNaam="Ledenapp" fitFactory={false} boven="Ledenapp" kop="Link werkt niet" uitleg={LINK_WERKT_NIET}>
        <Link href="/mijn/inloggen" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed">Inloggen</Link>
        <Link href={AANVRAAG_PAD} className="club-mijn-inlog-link">Nieuwe link aanvragen</Link>
      </InlogKaart>
    </LedenappSchil>
  )
}

export default async function MijnStart({ params }: PaginaProps) {
  if (!CLUB_LEDEN_LOGIN) notFound()
  const { code } = await params
  const admin = adminOfNull()
  if (!admin) notFound()
  const link = await bruikbareLink(admin, code, new Date())
  if (!link) return <WerktNiet />

  const { organisatie: org, lid, toegang } = link
  const opnieuw = Boolean(toegang.wachtwoordHash)
  return (
    <LedenappSchil organisatie={org}>
      <InlogKaart
        merkNaam={org.naam}
        fitFactory={org.logo === LOGO_FIT_FACTORY}
        boven={org.naam}
        kop={opnieuw ? `Nieuw wachtwoord, ${lid.voornaam}` : `Welkom, ${lid.voornaam}`}
        uitleg={
          opnieuw
            ? 'Kies een nieuw wachtwoord. Je oude wachtwoord werkt daarna niet meer en je wordt op andere toestellen uitgelogd.'
            : 'Bevestig je e-mailadres en kies een wachtwoord. Daarmee log je voortaan in op je ledenapp. Deel het met niemand.'
        }
      >
        <WachtwoordFormulier code={toegang.code} standaardEmail={toegang.email ?? normaalEmail(lid.email)} naam={volledigeNaam(lid)} knop="Opslaan en inloggen" />
      </InlogKaart>
    </LedenappSchil>
  )
}
