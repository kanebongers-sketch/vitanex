import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { clubToegang } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY, type Organisatie } from '@/lib/club/kern/organisatie'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { AANVRAAG_GEEN_MAIL, leesSportschoolSleutel, mailKlaar } from '@/lib/club/app-uitnodigen/regels'
import { sportschoolVoorAanvraag } from '@/lib/club/app-uitnodigen/sportschool'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { InlogKaart } from '@/components/club/ledenlogin/InlogKaart'
import { AanvraagFormulier } from '@/components/club/ledenlogin/AanvraagFormulier'

// /mijn/aanvragen: een lid vraagt zelf een persoonlijke link aan met zijn
// e-mailadres (via de poster in de club of de knop op /mijn/inloggen). De
// sportschool komt uit het subdomein of uit ?s=<slug of id>. Het antwoord is
// altijd hetzelfde; de rem en de honingpot zitten in de API
// (/api/club/lid/aanvragen). Schakelaar CLUB_LEDEN_LOGIN uit: een gewone 404,
// behalve voor Kane (voorvertoning, versturen kan dan nog niet).

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Link aanvragen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

const NEUTRAAL = { kleurAccent: '#B58E5C', thema: 'donker' as const }

type Zoek = Promise<Record<string, string | string[] | undefined>>

function adminOfNull(): SupabaseClient | null {
  try {
    return clubDatabase()
  } catch {
    return null
  }
}

function Zonder() {
  return (
    <LedenappSchil organisatie={NEUTRAAL}>
      <InlogKaart
        merkNaam="Ledenapp"
        fitFactory={false}
        boven="Ledenapp"
        kop="Link aanvragen"
        uitleg="Scan de QR-code in je sportschool of open de link die je van de sportschool kreeg. Lukt dat niet? Vraag je link aan de balie."
      />
    </LedenappSchil>
  )
}

function Kaart({ org, voorvertoning }: { org: Organisatie; voorvertoning: boolean }) {
  const kanMailen = mailKlaar(process.env)
  const uitleg = !kanMailen
    ? AANVRAAG_GEEN_MAIL
    : 'Vul het e-mailadres in dat bij je lidmaatschap hoort. Je krijgt een mail met een persoonlijke link waarmee je een wachtwoord kiest (ook als je het vergeten bent).'
  return (
    <LedenappSchil organisatie={org}>
      <InlogKaart merkNaam={org.naam} fitFactory={org.logo === LOGO_FIT_FACTORY} boven={org.naam} kop="Je link voor de app" uitleg={uitleg}>
        {voorvertoning ? <p className="club-mijn-inlog-fout">Voorvertoning: de ledenapp is nog niet open voor leden, versturen kan nog niet.</p> : null}
        {kanMailen && !voorvertoning ? <AanvraagFormulier sportschool={org.slug ?? org.id} /> : null}
        <Link href={org.slug ? `/mijn/inloggen?s=${encodeURIComponent(org.slug)}` : '/mijn/inloggen'} className="club-mijn-inlog-link">Heb je al een wachtwoord? Inloggen</Link>
      </InlogKaart>
    </LedenappSchil>
  )
}

export default async function MijnAanvragen({ searchParams }: { searchParams: Zoek }) {
  const voorvertoning = !CLUB_LEDEN_LOGIN
  if (voorvertoning && !(await clubToegang())?.isPlatformEigenaar) notFound()
  if (!voorvertoning && (await lidToegang(null))) redirect('/mijn')
  const admin = adminOfNull()
  const sleutel = leesSportschoolSleutel((await searchParams).s)
  const org = admin ? await sportschoolVoorAanvraag(admin, sleutel) : null
  if (!org) return <Zonder />
  return <Kaart org={org} voorvertoning={voorvertoning} />
}
