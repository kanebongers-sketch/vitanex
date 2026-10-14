import Link from 'next/link'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'

export const TABS = [
  { sleutel: 'intakes', label: 'Intakes' },
  { sleutel: 'schemas', label: "Schema's" },
  { sleutel: 'sjablonen', label: 'Sjablonen' },
  { sleutel: 'oefeningen', label: 'Oefeningen' },
] as const
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

export function TrainingTabs({ vestiging, actief, lidId, tellers }: TrainingTabsProps) {
  return (
    <nav className="club-segment club-training-tabs" aria-label="Training">
      {TABS.map((t) => (
        <Link key={t.sleutel} href={trainingPad(vestiging, t.sleutel, lidId)} aria-current={t.sleutel === actief ? 'page' : undefined} scroll={false}>
          {t.label}
          {tellers[t.sleutel] !== undefined && <span className="club-training-teller">{tellers[t.sleutel]}</span>}
        </Link>
      ))}
    </nav>
  )
}
