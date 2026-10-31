import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eisPlatformEigenaar } from '@/lib/club/toegang'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { TWEESTAPS } from '@/lib/aiyourgym/taal/woorden/club/tweestaps'
import { huidigPlatformAccount } from '@/lib/club/platform-login/huidig'
import { leesPlatformTweestaps } from '@/lib/club/tweestaps/opslag'
import { tweestapsHoofdsleutel } from '@/lib/club/tweestaps/versleutelen'
import { TweestapsBeheer, type TweestapsStand } from '@/components/club/platform/TweestapsBeheer'
import '@/components/club/platform/platform.css'

// /club/platform/beveiliging: tweestapsverificatie (TOTP) van het master account
// instellen, bekijken en uitzetten. Alleen het master account zelf (layout:
// eisPlatformEigenaar). Zonder CLUB_2FA_SLEUTEL of zonder migratie 484 zegt de
// pagina eerlijk dat het nog niet kan.

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(TWEESTAPS)).pagina.titel }
}
export const dynamic = 'force-dynamic'

export default async function BeveiligingPagina() {
  const t = await eisPlatformEigenaar()
  const account = await huidigPlatformAccount()
  if (!account) notFound()
  const taal = await getTaal()
  const p = TWEESTAPS[taal].pagina
  const lezing = await leesPlatformTweestaps(t.admin, account.id)
  const rij = lezing.staat === 'ok' ? lezing.rij : null
  const sleutel = tweestapsHoofdsleutel() !== null
  const stand: TweestapsStand = {
    aan: rij?.aan === true,
    sinds: rij?.aan && rij.bevestigdOp ? formatDatum(rij.bevestigdOp, taal) : null,
    herstelOver: rij?.aan ? rij.herstelHashes.length : 0,
    kanAan: sleutel && lezing.staat === 'ok',
    probleem: lezing.staat === 'geen_tabel' ? 'geenTabel' : lezing.staat === 'db' ? 'leesFout' : sleutel ? null : 'geenSleutel',
  }
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{p.boventitel}</p>
          <h1>{p.titel}</h1>
          <p>{p.intro}</p>
        </div>
      </header>
      <TweestapsBeheer stand={stand} />
    </>
  )
}
