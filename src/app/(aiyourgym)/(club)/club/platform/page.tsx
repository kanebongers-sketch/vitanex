import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, LifeBuoy, Activity } from 'lucide-react'
import { eisPlatformEigenaar } from '@/lib/club/toegang'
import { MAX_AANMELDINGEN, haalPlatform } from '@/lib/club/platform/opslag'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'
import { Kerncijfers } from '@/components/club/platform/Kerncijfers'
import { Sportscholen } from '@/components/club/platform/Sportscholen'
import { Aanmeldingen } from '@/components/club/platform/Aanmeldingen'
import { DemoAanvragen } from '@/components/club/platform/DemoAanvragen'
import { MAX_DEMO_AANVRAGEN } from '@/lib/club/platform/demo-aanvragen'
import { WachtwoordInstellen } from '@/components/club/platform/WachtwoordInstellen'
import { huidigPlatformAccount } from '@/lib/club/platform-login/huidig'
import '@/components/club/platform/platform.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(PLATFORM)).pagina.titel }
}
export const dynamic = 'force-dynamic'

// Het overzicht van AI Your Gym voor Kane als eigenaar van het platform: alle
// sportscholen, de demo-aanvragen en aanmeldingen van de website en de kerncijfers. Alleen echte
// tellingen; de prijzen en dus de omzet staan alleen in Stripe.

export default async function PlatformPagina() {
  const t = await eisPlatformEigenaar()
  const nu = new Date()
  const [stand, account] = await Promise.all([haalPlatform(t, nu), huidigPlatformAccount()])
  const taal = await getTaal()
  const p = PLATFORM[taal].pagina
  return (
    <>
      {account && !account.wachtwoordHash && <WachtwoordInstellen email={account.email} />}
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{p.boventitel}</p>
          <h1>{p.titel}</h1>
          <p>{p.intro}</p>
        </div>
        <nav aria-label={p.nav} className="club-acties">
          <Link href="/club/hulp/meldingen" className="club-knop club-knop--klein">
            <LifeBuoy size={14} aria-hidden /> {p.support}
          </Link>
          <Link href="/club/systeem" className="club-knop club-knop--klein">
            <Activity size={14} aria-hidden /> {p.systeem}
          </Link>
          <Link href="/" className="club-knop club-knop--klein">
            <ExternalLink size={14} aria-hidden /> {p.website}
          </Link>
        </nav>
      </header>
      {stand.problemen.length > 0 && (
        <div className="club-melding club-melding--fout" role="alert">
          <p className="club-platform-probleemkop">{p.problemen}</p>
          <ul className="club-platform-problemen">
            {stand.problemen.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <Kerncijfers cijfers={stand.cijfers} />
      <DemoAanvragen aanvragen={stand.demoAanvragen} max={MAX_DEMO_AANVRAGEN} />
      <Sportscholen sportscholen={stand.sportscholen} maand={formatDatum(nu, taal, 'maandNaam')} afgekapt={stand.afgekapt} />
      <Aanmeldingen aanmeldingen={stand.aanmeldingen} max={MAX_AANMELDINGEN} />
    </>
  )
}
