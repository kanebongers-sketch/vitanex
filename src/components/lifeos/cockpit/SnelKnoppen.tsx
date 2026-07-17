import Link from 'next/link'
import { HeartPulse, Users } from 'lucide-react'

// De snelrij in de welzijn-rail: twee tegels naar flows die geen invoerveldje in
// een kaart zijn. Check-in (/checkin) is een eigen vragen-flow; Mensen
// (/lifeos/mensen) is het CRM-bord — te groot voor de cockpit, dus een eigen
// route met een tegel ernaartoe.
//
// Voeding, Workout en Water zijn hier bewust weg: die staan als échte
// invoerkaarten in de gezondheids-rij en schrijven rechtstreeks naar Kane's
// MentaForce-data.
//
// Server Component: puur links, geen state. De hover/focus-staat zit in CSS
// (.os-snel), zodat dit geen client-eiland hoeft te worden. De rij is 2-koloms
// (.os-snelrij), dus de twee tegels staan naast elkaar.

export function SnelKnoppen() {
  return (
    <nav aria-label="Snel naar" className="os-snelrij">
      <Link href="/checkin" className="os-snel">
        <span className="os-snel__badge" aria-hidden="true">
          <HeartPulse size={17} strokeWidth={2.2} />
        </span>
        <span className="os-snel__tekst">
          <span className="os-snel__naam">Check-in</span>
          <span className="os-snel__sub">Hoe voel je je?</span>
        </span>
      </Link>

      <Link href="/lifeos/mensen" className="os-snel">
        <span className="os-snel__badge" aria-hidden="true">
          <Users size={17} strokeWidth={2.2} />
        </span>
        <span className="os-snel__tekst">
          <span className="os-snel__naam">Mensen</span>
          <span className="os-snel__sub">Klanten &amp; teams</span>
        </span>
      </Link>
    </nav>
  )
}
