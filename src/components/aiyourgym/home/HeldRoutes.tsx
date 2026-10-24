import Link from 'next/link'
import { ArrowRight, MonitorPlay, Repeat2 } from 'lucide-react'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { HELD } from '@/lib/aiyourgym/taal/woorden/website/held'

// Onder de knoppen in de held: twee rustige routes voor wie nog niet wil
// aanmelden. Overstappen (bijna elke sportschool heeft al iets) en de live
// demo, die zonder account werkt. Op de telefoon staan ze naast elkaar.
// Teksten in de taal van de pagina (woordenboek HELD).

export async function HeldRoutes() {
  const taal = await getSiteTaal()
  const t = HELD[taal]
  const { DEMO, OVERSTAPPEN } = SITE_PADEN
  const routes = [
    { Icoon: Repeat2, pad: OVERSTAPPEN, ...t.overstappen },
    { Icoon: MonitorPlay, pad: DEMO, ...t.demo },
  ]
  return (
    <nav className="ayg-held-routes" aria-label={t.routesLabel}>
      {routes.map(({ Icoon, pad, kop, tekst, extra }) => (
        <Link key={pad} href={pad} className="ayg-held-route">
          <span className="ayg-held-route-icoon" aria-hidden>
            <Icoon size={18} />
          </span>
          <span className="ayg-held-route-tekst">
            <span className="ayg-held-route-kop">{kop}</span>
            <span className="ayg-held-route-naam">
              <span>
                {tekst}
                {extra && <span className="ayg-held-route-extra">{extra}</span>}
              </span>
              <ArrowRight size={15} aria-hidden />
            </span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
