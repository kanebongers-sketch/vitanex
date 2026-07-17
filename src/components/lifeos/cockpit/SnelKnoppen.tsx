import Link from 'next/link'
import { HeartPulse } from 'lucide-react'

// De Check-in-tegel in de welzijn-rail. Check-in is een eigen vragen-flow
// (/checkin), geen invoerveldje dat in een kaart past. Mensen (het CRM-bord)
// stond hier ook als tegel, maar dat bord staat nu als eigen zone op deze pagina
// zelf — een link ernaartoe is dan dubbelop.
//
// Voeding, Workout en Water zijn hier bewust weg: die staan als échte
// invoerkaarten in de gezondheids-rij en schrijven rechtstreeks naar Kane's
// MentaForce-data.
//
// Server Component: puur een link, geen state. De hover/focus-staat zit in CSS
// (.os-snel), zodat dit geen client-eiland hoeft te worden.

export function SnelKnoppen() {
  return (
    <nav aria-label="Naar je check-in" className="os-snelrij">
      <Link href="/checkin" className="os-snel os-snel--vol">
        <span className="os-snel__badge" aria-hidden="true">
          <HeartPulse size={17} strokeWidth={2.2} />
        </span>
        <span className="os-snel__tekst">
          <span className="os-snel__naam">Check-in</span>
          <span className="os-snel__sub">Hoe voel je je?</span>
        </span>
      </Link>
    </nav>
  )
}
