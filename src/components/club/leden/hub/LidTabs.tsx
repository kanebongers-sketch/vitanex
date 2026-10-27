import Link from 'next/link'
import { LID_TABS, lidKaartPad, type LidTab } from '@/lib/club/leden/hub/tabs'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'

// De tabbladen van de ledenkaart. Het open tabblad staat in de URL (?tab=);
// elk tabblad is een gewone link, dus terug en vooruit in de browser werken.

interface LidTabsProps {
  lidId: string
  vestiging: Vestiging
  actief: LidTab
  zichtbaar?: readonly LidTab[]
}

export async function LidTabs({ lidId, vestiging, actief, zichtbaar = LID_TABS }: LidTabsProps) {
  const w = await clubTekst(LEDENKAART)
  return (
    <nav className="club-segment club-lidhub-tabs" aria-label={w.tabs.label}>
      {zichtbaar.map((tab) => (
        <Link key={tab} href={lidKaartPad(lidId, vestiging, tab)} aria-current={tab === actief ? 'page' : undefined} scroll={false}>
          {w.tabs[tab]}
        </Link>
      ))}
    </nav>
  )
}
