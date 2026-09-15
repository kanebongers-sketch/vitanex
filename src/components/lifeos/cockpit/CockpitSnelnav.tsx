import Link from 'next/link'
import { LayoutGrid, Users, Wallet, Network, Dumbbell } from 'lucide-react'

// Wayfinding onder de begroeting. Het dashboard toont alleen je dag; de zware
// overzichten (mensen, geld, kennis) wonen op hun eigen pagina zodat het dashboard
// niet dubbelt en niet vol loopt. Deze rij tegels is de weg ernaartoe. Server
// Component: alleen links, geen state.

const BESTEMMINGEN = [
  { href: '/lifeos/agenda-categorieen', label: 'Categorieën', Icoon: LayoutGrid },
  { href: '/lifeos/mensen', label: 'Mensen', Icoon: Users },
  { href: '/lifeos/geld', label: 'Geld', Icoon: Wallet },
  { href: '/lifeos/kennis', label: 'Kennis', Icoon: Network },
  { href: '/training', label: 'Training', Icoon: Dumbbell },
] as const

export function CockpitSnelnav() {
  return (
    <nav className="os-snelnav" aria-label="Naar je overzichten">
      {BESTEMMINGEN.map(({ href, label, Icoon }) => (
        <Link key={href} href={href} className="os-snelnav__tegel">
          <Icoon size={17} strokeWidth={2} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
