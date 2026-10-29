import Link from 'next/link'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

/** De tabbladen in vaste volgorde; de namen staan in CLUB_TRAINING.pagina.tabs. */
export const TABS = [{ sleutel: 'intakes' }, { sleutel: 'schemas' }, { sleutel: 'sjablonen' }, { sleutel: 'oefeningen' }] as const
export type Tab = (typeof TABS)[number]['sleutel']

export function kiesTab(ruw: string | string[] | undefined): Tab {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return TABS.find((t) => t.sleutel === w)?.sleutel ?? 'schemas'
}

/** Het pad naar een tab, met de vestiging en (als die er is) het lidfilter. */
export function trainingPad(vestiging: Vestiging, tab: Tab, lidId: string | null, extra: Record<string, string> = {}): string {
  return clubPad('/training', vestiging, { tab, ...(lidId ? { lid: lidId } : {}), ...extra })
}

/** Vaste paden met een plek (__id__, __lid__) die de client invult. */
export function trainingPaden(vestiging: Vestiging) {
  return {
    editor: clubPad('/training/schema/__id__', vestiging),
    intakesVanLid: trainingPad(vestiging, 'intakes', '__lid__'),
    nieuweIntake: (lidId: string | null) => clubPad('/training/intake', vestiging, lidId ? { lid: lidId } : {}),
  }
}

interface TrainingTabsProps {
  vestiging: Vestiging
  actief: Tab
  lidId: string | null
  tellers: Partial<Record<Tab, number>>
}

export async function TrainingTabs({ vestiging, actief, lidId, tellers }: TrainingTabsProps) {
  const p = (await clubTekst(CLUB_TRAINING)).pagina
  return (
    <nav className="club-segment club-training-tabs" aria-label={p.tabsLabel}>
      {TABS.map((t) => (
        <Link key={t.sleutel} href={trainingPad(vestiging, t.sleutel, lidId)} aria-current={t.sleutel === actief ? 'page' : undefined} scroll={false}>
          {p.tabs[t.sleutel]}
          {tellers[t.sleutel] !== undefined && <span className="club-training-teller">{tellers[t.sleutel]}</span>}
        </Link>
      ))}
    </nav>
  )
}
