import Link from 'next/link'
import { HeartPulse } from 'lucide-react'

// De Check-in-tegel. Voeding, Workout en Water zijn niet langer losse links naar
// aparte pagina's: die staan nu als échte invoerkaarten in de gezondheids-rij
// (VoedingCockpitKaart, WorkoutCockpitKaart, WaterCockpitKaart) en schrijven
// rechtstreeks naar Kane's MentaForce-data. Check-in blijft een tegel — het is
// een eigen flow (/checkin), geen invoerveldje dat in een kaart past.
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
