import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { linkStaat } from '@/lib/club/ledenlogin/regels'
import { bruikbareLink } from '@/lib/club/ledenlogin/inlog-api'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { InlogKaart } from '@/components/club/ledenlogin/InlogKaart'
import { LidInlogFormulier } from '@/components/club/ledenlogin/LidInlogFormulier'

// /mijn/start/<code>: de persoonlijke link van een lid (als QR op de
// ledenkaart). De eerste keer een pincode kiezen, daarna inloggen. Schakelaar
// uit, onbekende, verlopen of ingetrokken link: een gewone 404, steeds gelijk.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inloggen',
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

export default async function MijnStart({ params }: PaginaProps) {
  if (!CLUB_LEDEN_LOGIN) notFound()
  const { code } = await params
  const admin = adminOfNull()
  if (!admin) notFound()
  const nu = new Date()
  const link = await bruikbareLink(admin, code, nu)
  if (!link) notFound()
  // Al ingelogd als dit lid: meteen de app in.
  const nuBinnen = await lidToegang(null)
  if (nuBinnen && !nuBinnen.voorvertoning && nuBinnen.lid.id === link.lid.id) redirect('/mijn')

  const kiezen = linkStaat(link.toegang, nu) === 'kiezen'
  const org = link.organisatie
  return (
    <LedenappSchil organisatie={org}>
      <InlogKaart
        merkNaam={org.naam}
        fitFactory={org.logo === LOGO_FIT_FACTORY}
        boven={org.naam}
        kop={kiezen ? `Welkom, ${link.lid.voornaam}` : `Hoi ${link.lid.voornaam}`}
        uitleg={kiezen ? 'Kies een pincode van 6 cijfers. Daarmee log je voortaan in op je ledenapp. Deel hem met niemand.' : 'Log in met je pincode van 6 cijfers.'}
      >
        <LidInlogFormulier modus={kiezen ? 'kiezen' : 'inloggen'} code={link.toegang.code} />
      </InlogKaart>
    </LedenappSchil>
  )
}
