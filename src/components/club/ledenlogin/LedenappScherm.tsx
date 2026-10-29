import Link from 'next/link'
import type { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { APP_TABS, type AppTab } from '@/components/club/app/Toestel'
import { TabIcoon } from '@/components/club/app/TabIcoon'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

// De ledenapp als echte app op de telefoon: merk bovenin, inhoud die scrolt,
// onderbalk met tabbladen. Houdt rekening met de notch en de thuisbalk
// (safe-area) en heeft tikvlakken van minstens 48 pixels. Het actieve tabblad
// krijgt een pil achter het icoon (alleen transform en opacity bewegen).

interface Props {
  /** Het actieve tabblad; null als er een scherm buiten de onderbalk open staat (Meldingen). */
  tab: AppTab | null
  tabPad: (tab: AppTab) => string
  merkNaam: string
  merkLogo: string | null
  fitFactory: boolean
  tabsUit: readonly string[]
  /** Alleen bij Kane: met wie hij meekijkt. */
  voorvertoningNaam: string | null
  /** Rechts in de kop, bijvoorbeeld de bel met meldingen. */
  kopActie?: ReactNode
  children: ReactNode
}

export async function LedenappScherm({ tab, tabPad, merkNaam, merkLogo, fitFactory, tabsUit, voorvertoningNaam, kopActie, children }: Props) {
  const tabs = APP_TABS.filter((x) => !tabsUit.includes(x.sleutel))
  const tekst = LEDENAPP[await getTaal()]
  return (
    <div className="club-mijn-scherm">
      <header className="club-mijn-kop">
        {voorvertoningNaam && (
          <p className="club-mijn-voorvertoning" role="status">
            <Eye size={14} aria-hidden /> {tekst.mijn.voorvertoning(voorvertoningNaam)}
          </p>
        )}
        <div className="club-mijn-merk">
          {fitFactory ? <FitFactoryLogo /> : merkLogo ? <img src={merkLogo} alt={merkNaam} height={28} /> : <span>{merkNaam}</span>}
          {kopActie}
        </div>
      </header>
      <main className="club-mijn-inhoud" id="lidapp-inhoud">
        {children}
      </main>
      <nav className="club-mijn-tabs" aria-label={tekst.tabs.label} style={{ ['--club-mijn-tabs' as string]: tabs.length }}>
        {tabs.map(({ sleutel, Icoon }) => (
          <Link key={sleutel} href={tabPad(sleutel)} aria-current={sleutel === tab ? 'page' : undefined} scroll={false} prefetch={false}>
            <TabIcoon>
              <Icoon size={22} strokeWidth={sleutel === tab ? 2.25 : 1.75} />
            </TabIcoon>
            <span className="club-mijn-tab-label">{tekst.tabs[sleutel]}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
