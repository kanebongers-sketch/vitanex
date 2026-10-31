import Link from 'next/link'
import type { ReactNode } from 'react'
import { Apple, CalendarDays, Dumbbell, House, UserRound } from 'lucide-react'
import { tijdNl } from '@/lib/club/cijfers/tijd'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { zichtbareBalk, type AppBalkTab } from '@/lib/club/app/tabs'

// Het telefoonframe van de voorvertoning. De labels van de tabbladen komen uit
// het woordenboek (LEDENAPP.tabs). Hoogstens vijf tabbladen; welke er zijn
// volgt uit de secties die aan staan (lib/club/app/tabs.ts).
// Op een telefoon zelf valt het frame
// weg en vult de app het hele scherm.

export const APP_TABS = [
  { sleutel: 'home', Icoon: House },
  { sleutel: 'boeken', Icoon: CalendarDays },
  { sleutel: 'schema', Icoon: Dumbbell },
  { sleutel: 'voeding', Icoon: Apple },
  { sleutel: 'profiel', Icoon: UserRound },
] as const satisfies readonly { sleutel: AppBalkTab; Icoon: unknown }[]

export type AppTab = AppBalkTab

/** De tabbladen van de onderbalk die er zijn bij deze secties uit. */
export function balkTabs(tabsUit: readonly string[]): (typeof APP_TABS)[number][] {
  const aan = zichtbareBalk(tabsUit)
  return APP_TABS.filter((x) => aan.includes(x.sleutel))
}

interface Props {
  tab: AppTab
  nu: Date
  tabPad: (tab: string) => string
  /** De naam van de sportschool die open staat, in de statusbalk. */
  merkNaam: string
  /** Logo van de sportschool bovenaan de app (URL), of het ingebouwde Fit Factory-logo. */
  merkLogo?: string | null
  fitFactory?: boolean
  /** Secties die uit staan (ledenlogin/tabs.ts); een tabblad zonder secties valt weg. */
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
          {balkTabs(tabsUit).map(({ sleutel, Icoon }) => (
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
