import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { lidApparaatCookie, linkStaat } from '@/lib/club/ledenlogin/regels'
import { bruikbareLink } from '@/lib/club/ledenlogin/inlog-api'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { InlogKaart } from '@/components/club/ledenlogin/InlogKaart'
import { LidInlogFormulier } from '@/components/club/ledenlogin/LidInlogFormulier'
import { AANVRAAG_PAD } from '@/lib/club/app-uitnodigen/velden'
import { leesSportschoolSleutel } from '@/lib/club/app-uitnodigen/regels'

// /mijn/inloggen: opnieuw inloggen na een verlopen sessie of na uitloggen. Dit
// toestel onthoudt de persoonlijke link (httpOnly-cookie), dus alleen de
// pincode is nodig. Zonder (geldige) onthouden link: open de link of QR van de
// sportschool. Met de schakelaar uit: een gewone 404.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inloggen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

const NEUTRAAL = { kleurAccent: '#B58E5C', thema: 'donker' as const }

function adminOfNull(): SupabaseClient | null {
  try {
    return createLifeosAdminClient()
  } catch {
    return null
  }
}

type Zoek = Promise<Record<string, string | string[] | undefined>>

/** Naar de aanvraagpagina, met de sportschool erbij als die in de vraag stond. */
function aanvraagHref(s: unknown): string {
  const sleutel = leesSportschoolSleutel(s)
  return sleutel ? `${AANVRAAG_PAD}?s=${encodeURIComponent(sleutel.waarde)}` : AANVRAAG_PAD
}

export default async function MijnInloggen({ searchParams }: { searchParams: Zoek }) {
  if (!CLUB_LEDEN_LOGIN) notFound()
  if (await lidToegang(null)) redirect('/mijn')
  const admin = adminOfNull()
  const nu = new Date()
  const code = (await cookies()).get(lidApparaatCookie())?.value
  const link = admin ? await bruikbareLink(admin, code, nu) : null

  if (!link) {
    return (
      <LedenappSchil organisatie={NEUTRAAL}>
        <InlogKaart
          merkNaam="Ledenapp"
          fitFactory={false}
          boven="Ledenapp"
          kop="Inloggen"
          uitleg="Open de persoonlijke link of scan de QR-code die je van je sportschool kreeg. Werkt je link niet meer? Vraag hem opnieuw aan of vraag het aan de balie."
        >
          <Link href={aanvraagHref((await searchParams).s)} className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed">Nog geen link? Vraag hem aan</Link>
        </InlogKaart>
      </LedenappSchil>
    )
  }
  const org = link.organisatie
  const kiezen = linkStaat(link.toegang, nu) === 'kiezen'
  return (
    <LedenappSchil organisatie={org}>
      <InlogKaart
        merkNaam={org.naam}
        fitFactory={org.logo === LOGO_FIT_FACTORY}
        boven={org.naam}
        kop={`Hoi ${link.lid.voornaam}`}
        uitleg={kiezen ? 'Kies een pincode van 6 cijfers.' : 'Log in met je pincode van 6 cijfers. Pincode vergeten? Vraag aan de balie om een nieuwe link.'}
      >
        <LidInlogFormulier modus={kiezen ? 'kiezen' : 'inloggen'} code={null} />
      </InlogKaart>
    </LedenappSchil>
  )
}
