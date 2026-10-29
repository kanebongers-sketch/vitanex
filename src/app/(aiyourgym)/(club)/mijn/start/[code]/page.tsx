import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { normaalEmail } from '@/lib/club/kern/wachtwoord-regels'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { bruikbareLink } from '@/lib/club/ledenlogin/inlog-api'
import { AANVRAAG_PAD } from '@/lib/club/app-uitnodigen/velden'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { InlogKaart } from '@/components/club/ledenlogin/InlogKaart'
import { WachtwoordFormulier } from '@/components/club/ledenlogin/WachtwoordFormulier'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'

// /mijn/start/<code>: de uitnodiging van de sportschool (link in de mail of QR
// aan de balie). Eenmalig en 7 dagen geldig: het lid bevestigt zijn
// e-mailadres en kiest een sterk wachtwoord (eerste keer of wachtwoord
// vergeten). Daarna alleen nog inloggen met e-mail plus wachtwoord. Onbekende,
// gebruikte of verlopen link: steeds dezelfde neutrale kaart. Schakelaar uit: 404.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: LID_INLOGGEN[await getTaal()].start.titel, robots: { index: false, follow: false }, referrer: 'no-referrer' }
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

function WerktNiet({ tekst }: { tekst: (typeof LID_INLOGGEN)['nl'] }) {
  return (
    <LedenappSchil organisatie={NEUTRAAL}>
      <InlogKaart merkNaam={tekst.ledenapp} fitFactory={false} boven={tekst.ledenapp} kop={tekst.start.werktNiet} uitleg={tekst.start.werktNietUitleg}>
        <Link href="/mijn/inloggen" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed">{tekst.inloggen.knop}</Link>
        <Link href={AANVRAAG_PAD} className="club-mijn-inlog-link">{tekst.start.nieuweLink}</Link>
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
  const tekst = LID_INLOGGEN[await getTaal()]
  const t = tekst.start
  if (!link) return <WerktNiet tekst={tekst} />

  const { organisatie: org, lid, toegang } = link
  const opnieuw = Boolean(toegang.wachtwoordHash)
  return (
    <LedenappSchil organisatie={org}>
      <InlogKaart
        merkNaam={org.naam}
        fitFactory={org.logo === LOGO_FIT_FACTORY}
        boven={org.naam}
        kop={opnieuw ? t.opnieuwKop(lid.voornaam) : t.welkomKop(lid.voornaam)}
        uitleg={
          opnieuw ? t.opnieuwUitleg : t.welkomUitleg
        }
      >
        <WachtwoordFormulier code={toegang.code} standaardEmail={toegang.email ?? normaalEmail(lid.email)} naam={volledigeNaam(lid)} knop={t.knop} />
      </InlogKaart>
    </LedenappSchil>
  )
}
