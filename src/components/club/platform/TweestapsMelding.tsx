import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { TWEESTAPS } from '@/lib/aiyourgym/taal/woorden/club/tweestaps'
import { clubDatabase } from '@/lib/club/kern/database'
import { huidigPlatformAccount } from '@/lib/club/platform-login/huidig'
import { leesPlatformTweestaps } from '@/lib/club/tweestaps/opslag'
import './tweestaps-melding.css'

// Bovenaan Club voor het master account zolang tweestapsverificatie uit staat
// (niet verplicht: Kane zet het eerst zelf aan). Alleen als de stand zeker
// bekend is; bij een leesfout of zonder migratie 484 geen melding.

export async function TweestapsMelding() {
  const account = await huidigPlatformAccount().catch(() => null)
  if (!account) return null
  const lezing = await leesPlatformTweestaps(clubDatabase(), account.id).catch(() => null)
  if (!lezing || lezing.staat !== 'ok' || lezing.rij?.aan) return null
  const t = await clubTekst(TWEESTAPS)
  return (
    <div className="club-2fa-melding" role="note">
      <p className="club-2fa-melding-tekst">
        <ShieldAlert size={15} aria-hidden /> {t.melding.tekst}
      </p>
      <Link href="/club/platform/beveiliging" className="club-knop club-knop--klein club-knop--primair">
        {t.melding.knop}
      </Link>
    </div>
  )
}
