import Link from 'next/link'
import { LayoutGrid, Users } from 'lucide-react'

// Wayfinding onder de begroeting. Het dashboard toont je gereedschap, maar linkte
// nergens naar de losse LifeOS-schermen (Mensen, Categorieën) — die opende je enkel
// via de URL. Deze rij tegels maakt ze bereikbaar. Server Component: alleen links.

export function CockpitSnelnav() {
  return (
    <nav className="os-snelnav" aria-label="Snelkoppelingen">
      <Link href="/lifeos/agenda-categorieen" className="os-snelnav__tegel">
        <LayoutGrid size={17} strokeWidth={2} aria-hidden="true" />
        Categorieën
      </Link>
      <Link href="/lifeos/mensen" className="os-snelnav__tegel">
        <Users size={17} strokeWidth={2} aria-hidden="true" />
        Mensen
      </Link>
    </nav>
  )
}
