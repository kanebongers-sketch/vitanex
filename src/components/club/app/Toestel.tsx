import Link from 'next/link'
import type { ReactNode } from 'react'
import { CalendarDays, Dumbbell, House, UserRound } from 'lucide-react'
import { tijdNl } from '@/lib/club/cijfers/tijd'

// Het telefoonframe van de voorvertoning. Op een telefoon zelf valt het frame
// weg en vult de app het hele scherm.

export const APP_TABS = [
  { sleutel: 'home', label: 'Home', Icoon: House },
  { sleutel: 'lessen', label: 'Lessen', Icoon: CalendarDays },
  { sleutel: 'schema', label: 'Schema', Icoon: Dumbbell },
  { sleutel: 'profiel', label: 'Profiel', Icoon: UserRound },
] as const

export type AppTab = (typeof APP_TABS)[number]['sleutel']

export function kiesTab(ruw: string | string[] | undefined): AppTab {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return APP_TABS.find((t) => t.sleutel === w)?.sleutel ?? 'home'
}

interface Props {
  tab: AppTab
  nu: Date
  tabPad: (tab: AppTab) => string
  /** De naam van de sportschool die open staat, in de statusbalk. */
  merkNaam: string
  children: ReactNode
}

export function Toestel({ tab, nu, tabPad, merkNaam, children }: Props) {
  return (
    <div className="club-lidapp-toestel">
      <div className="club-lidapp-scherm">
        <div className="club-lidapp-statusbalk" aria-hidden>
          <span>{tijdNl(nu)}</span>
          <span className="club-lidapp-eiland" />
          <span>{merkNaam.toUpperCase()}</span>
        </div>
        <div className="club-lidapp-inhoud" id="lidapp-inhoud">
          {children}
        </div>
        <nav className="club-lidapp-tabs" aria-label="Ledenapp">
          {APP_TABS.map(({ sleutel, label, Icoon }) => (
            <Link key={sleutel} href={tabPad(sleutel)} aria-current={sleutel === tab ? 'page' : undefined} scroll={false}>
              <Icoon aria-hidden size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
