import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { LOGO_FIT_FACTORY, type Organisatie } from '@/lib/club/kern/organisatie'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { InlogKaart } from '@/components/club/ledenlogin/InlogKaart'
import { LidInlogFormulier } from '@/components/club/ledenlogin/LidInlogFormulier'
import { AANVRAAG_PAD } from '@/lib/club/app-uitnodigen/velden'
import { leesSportschoolSleutel } from '@/lib/club/app-uitnodigen/regels'
import { sportschoolVoorAanvraag } from '@/lib/club/app-uitnodigen/sportschool'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'

// /mijn/inloggen: inloggen op de ledenapp met e-mailadres en wachtwoord
// (besluit Kane 23-10-2026). De sportschool komt uit het subdomein of uit
// ?s=<slug of id> (voor de huisstijl en om alleen daar te zoeken); zonder
// sportschool zoekt de server op het adres. Eerste keer of wachtwoord
// vergeten: een link aanvragen (/mijn/aanvragen). Schakelaar uit: 404.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: LID_INLOGGEN[await getTaal()].inloggen.titel, robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

const NEUTRAAL = { kleurAccent: '#B58E5C', thema: 'donker' as const }

function adminOfNull(): SupabaseClient | null {
  try {
    return clubDatabase()
  } catch {
    return null
  }
}

type Zoek = Promise<Record<string, string | string[] | undefined>>

export default async function MijnInloggen({ searchParams }: { searchParams: Zoek }) {
  if (!CLUB_LEDEN_LOGIN) notFound()
  if (await lidToegang(null)) redirect('/mijn')
  const admin = adminOfNull()
  const sleutel = leesSportschoolSleutel((await searchParams).s)
  const org: Organisatie | null = admin ? await sportschoolVoorAanvraag(admin, sleutel) : null
  const tekst = LID_INLOGGEN[await getTaal()]
  const t = tekst.inloggen
  const aanvraagHref = org ? `${AANVRAAG_PAD}?s=${encodeURIComponent(org.slug ?? org.id)}` : sleutel ? `${AANVRAAG_PAD}?s=${encodeURIComponent(sleutel.waarde)}` : AANVRAAG_PAD

  return (
    <LedenappSchil organisatie={org ?? NEUTRAAL}>
      <InlogKaart
        merkNaam={org?.naam ?? tekst.ledenapp}
        fitFactory={org?.logo === LOGO_FIT_FACTORY}
        boven={org?.naam ?? tekst.ledenapp}
        kop={t.titel}
        uitleg={t.uitleg}
      >
        <LidInlogFormulier sportschool={org?.id ?? null} />
        <p className="club-mijn-veld-hint">{t.hulp}</p>
        <Link href={aanvraagHref} className="club-mijn-inlog-link">{t.linkAanvragen}</Link>
      </InlogKaart>
    </LedenappSchil>
  )
}
