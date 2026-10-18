import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, LifeBuoy, Activity } from 'lucide-react'
import { eisKane } from '@/lib/club/toegang'
import { MAX_AANMELDINGEN, haalPlatform } from '@/lib/club/platform/opslag'
import { maandNaam } from '@/lib/club/platform/tellingen'
import { Kerncijfers } from '@/components/club/platform/Kerncijfers'
import { Sportscholen } from '@/components/club/platform/Sportscholen'
import { Aanmeldingen } from '@/components/club/platform/Aanmeldingen'
import { DemoAanvragen } from '@/components/club/platform/DemoAanvragen'
import { MAX_DEMO_AANVRAGEN } from '@/lib/club/platform/demo-aanvragen'
import '@/components/club/platform/platform.css'

export const metadata: Metadata = { title: 'Platform' }
export const dynamic = 'force-dynamic'

// Het overzicht van AI Your Gym voor Kane als eigenaar van het platform: alle
// sportscholen, de demo-aanvragen en aanmeldingen van de website en de kerncijfers. Alleen echte
// tellingen; de prijzen en dus de omzet staan alleen in Stripe.

export default async function PlatformPagina() {
  const t = await eisKane()
  const nu = new Date()
  const stand = await haalPlatform(t, nu)
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">AI Your Gym · alleen Kane</p>
          <h1>Platform</h1>
          <p>Alle sportscholen, de demo-aanvragen en aanmeldingen van de website en wat er aandacht vraagt. Check-ins tellen per kalendermaand.</p>
        </div>
        <nav aria-label="Platform" className="club-acties">
          <Link href="/clubkane/hulp/meldingen" className="club-knop club-knop--klein">
            <LifeBuoy size={14} aria-hidden /> Supportmeldingen
          </Link>
          <Link href="/clubkane/systeem" className="club-knop club-knop--klein">
            <Activity size={14} aria-hidden /> Systeem
          </Link>
          <Link href="/aiyourgym?bekijk=1" className="club-knop club-knop--klein">
            <ExternalLink size={14} aria-hidden /> Website
          </Link>
        </nav>
      </header>
      {stand.problemen.length > 0 && (
        <div className="club-melding club-melding--fout" role="alert">
          <p className="club-platform-probleemkop">Niet alles is te lezen. De rest van het overzicht klopt wel.</p>
          <ul className="club-platform-problemen">
            {stand.problemen.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <Kerncijfers cijfers={stand.cijfers} />
      <DemoAanvragen aanvragen={stand.demoAanvragen} max={MAX_DEMO_AANVRAGEN} />
      <Sportscholen sportscholen={stand.sportscholen} maand={maandNaam(nu)} afgekapt={stand.afgekapt} />
      <Aanmeldingen aanmeldingen={stand.aanmeldingen} max={MAX_AANMELDINGEN} />
    </>
  )
}
