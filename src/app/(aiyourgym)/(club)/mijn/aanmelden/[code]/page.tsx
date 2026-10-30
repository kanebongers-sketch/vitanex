import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { openLink } from '@/lib/club/nieuwe-leden/aanmelden-opslag'
import { aanmeldMailKlaar } from '@/lib/club/nieuwe-leden/mail'
import { vormenVoorVestiging } from '@/lib/club/nieuwe-leden/regels'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { AanmeldFlow, type AanmeldVorm } from '@/components/club/aanmelden/AanmeldFlow'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { AANMELDEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/aanmelden'

// /mijn/aanmelden/<code>: zelf aanmelden met een aanmeldlink of QR van de
// sportschool (besluit Kane 30-10-2026; nooit via een openbare pagina). Alleen
// met een geldige, open link; anders een gewone 404 zonder iets van de
// sportschool. Drie stappen: gegevens, lidmaatschap (alleen als dat niet al
// vastligt in de link) en code plus wachtwoord. Daarna meteen de ledenapp en de intake.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: AANMELDEN[await getTaal()].titel, robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

function adminOfNull(): SupabaseClient | null {
  try {
    return clubDatabase()
  } catch {
    return null
  }
}

export default async function MijnAanmelden({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const admin = adminOfNull()
  const open = admin ? await openLink(admin, code, new Date()) : null
  if (!admin || !open) notFound()
  // Al ingelogd als lid: gewoon de app.
  if (await lidToegang(null)) redirect('/mijn')
  const { link, organisatie: org } = open
  const alleVormen = (await haalVormen(admin, org.id)) ?? []
  const vast = link.vormId ? alleVormen.find((v) => v.id === link.vormId) ?? null : null
  const vormen: AanmeldVorm[] = vast ? [] : vormenVoorVestiging(alleVormen, link.vestiging).map((v) => ({ id: v.id, naam: v.naam, omschrijving: v.omschrijving, groepslessen: v.groepslessen, dalVan: v.dalVan, dalTot: v.dalTot }))
  return (
    <LedenappSchil organisatie={org}>
      <AanmeldFlow
        code={link.code}
        sportschool={org.naam}
        fitFactory={org.logo === LOGO_FIT_FACTORY}
        vormen={vormen}
        vastVorm={vast?.naam ?? null}
        mailKlaar={aanmeldMailKlaar()}
      />
    </LedenappSchil>
  )
}
