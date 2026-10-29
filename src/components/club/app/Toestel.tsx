import Link from 'next/link'
import type { ReactNode } from 'react'
import { Apple, CalendarClock, CalendarDays, Dumbbell, House, TrendingUp, UserRound } from 'lucide-react'
import { tijdNl } from '@/lib/club/cijfers/tijd'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

// Het telefoonframe van de voorvertoning. De labels van de tabbladen komen uit
// het woordenboek (LEDENAPP.tabs).
// Op een telefoon zelf valt het frame
// weg en vult de app het hele scherm.

export const APP_TABS = [
  { sleutel: 'home', Icoon: House },
  { sleutel: 'lessen', Icoon: CalendarDays },
  { sleutel: 'afspraken', Icoon: CalendarClock },
  { sleutel: 'schema', Icoon: Dumbbell },
  { sleutel: 'voeding', Icoon: Apple },
  { sleutel: 'voortgang', Icoon: TrendingUp },
  { sleutel: 'profiel', Icoon: UserRound },
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
  /** Logo van de sportschool bovenaan de app (URL), of het ingebouwde Fit Factory-logo. */
  merkLogo?: string | null
  fitFactory?: boolean
  /** Tabbladen die de sportschool heeft uitgezet. */
  tabsUit?: readonly string[]
  children: ReactNode
}

export async function Toestel({ tab, nu, tabPad, merkNaam, merkLogo = null, fitFactory = false, tabsUit = [], children }: Props) {
  const t = LEDENAPP[await getTaal()].tabs
  return (
    <div className="club-lidapp-toestel">
      <div className="club-lidapp-scherm">
        <div className="club-lidapp-statusbalk" aria-hidden>
          <span>{tijdNl(nu)}</span>
          <span className="club-lidapp-eiland" />
          <span>{merkNaam.toUpperCase()}</span>
        </div>
        <div className="club-lidapp-inhoud" id="lidapp-inhoud">
          <div className="club-lidapp-merk">
            {fitFactory ? <FitFactoryLogo /> : merkLogo ? <img src={merkLogo} alt={merkNaam} /> : <span>{merkNaam}</span>}
          </div>
          {children}
        </div>
        <nav className="club-lidapp-tabs" aria-label={t.label}>
          {APP_TABS.filter((x) => !tabsUit.includes(x.sleutel)).map(({ sleutel, Icoon }) => (
            <Link key={sleutel} href={tabPad(sleutel)} aria-current={sleutel === tab ? 'page' : undefined} scroll={false}>
              <Icoon aria-hidden size={20} />
              <span>{t[sleutel]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
