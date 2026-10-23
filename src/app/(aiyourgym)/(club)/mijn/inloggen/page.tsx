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

// /mijn/inloggen: inloggen op de ledenapp met e-mailadres en wachtwoord
// (besluit Kane 23-10-2026). De sportschool komt uit het subdomein of uit
// ?s=<slug of id> (voor de huisstijl en om alleen daar te zoeken); zonder
// sportschool zoekt de server op het adres. Eerste keer of wachtwoord
// vergeten: een link aanvragen (/mijn/aanvragen). Schakelaar uit: 404.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inloggen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

const NEUTRAAL = { kleurAccent: '#B58E5C', thema: 'donker' as const }
const UITLEG = 'Log in met je e-mailadres en wachtwoord.'
const HULP = 'Eerste keer of wachtwoord vergeten? Vraag een link aan, dan kies je een (nieuw) wachtwoord.'

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
  const aanvraagHref = org ? `${AANVRAAG_PAD}?s=${encodeURIComponent(org.slug ?? org.id)}` : sleutel ? `${AANVRAAG_PAD}?s=${encodeURIComponent(sleutel.waarde)}` : AANVRAAG_PAD

  return (
    <LedenappSchil organisatie={org ?? NEUTRAAL}>
      <InlogKaart
        merkNaam={org?.naam ?? 'Ledenapp'}
        fitFactory={org?.logo === LOGO_FIT_FACTORY}
        boven={org?.naam ?? 'Ledenapp'}
        kop="Inloggen"
        uitleg={UITLEG}
      >
        <LidInlogFormulier sportschool={org?.id ?? null} />
        <p className="club-mijn-veld-hint">{HULP}</p>
        <Link href={aanvraagHref} className="club-mijn-inlog-link">Link aanvragen</Link>
      </InlogKaart>
    </LedenappSchil>
  )
}
