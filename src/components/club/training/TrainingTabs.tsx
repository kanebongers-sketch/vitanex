import Link from 'next/link'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

// Training (ontwerp "Club in 10 minuten", 03-11-2026): twee tabbladen,
// Schema's en Bibliotheek. De oude ?tab= blijven werken: intakes is de lijst
// met alle intakes onder Schema's, sjablonen en oefeningen zijn delen van de
// Bibliotheek, en voedingsjablonen is het deel Voeding. ?tab=bibliotheek opent
// het eerste deel (Sjablonen).

/** Alle waarden van ?tab=, in vaste volgorde. */
export const TABS = [{ sleutel: 'intakes' }, { sleutel: 'schemas' }, { sleutel: 'sjablonen' }, { sleutel: 'oefeningen' }, { sleutel: 'voedingsjablonen' }] as const
export type Tab = (typeof TABS)[number]['sleutel']

/** De twee tabbladen in de balk. */
export type Balk = 'schemas' | 'bibliotheek'

/** De delen van de Bibliotheek. */
export const DELEN = ['sjablonen', 'oefeningen', 'voedingsjablonen'] as const satisfies readonly Tab[]
export type Deel = (typeof DELEN)[number]

export function kiesTab(ruw: string | string[] | undefined): Tab {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  if (w === 'bibliotheek') return 'sjablonen'
  return TABS.find((t) => t.sleutel === w)?.sleutel ?? 'schemas'
}

/** Het tabblad in de balk waar een ?tab= onder valt. */
export function balkVan(tab: Tab): Balk {
  return tab === 'schemas' || tab === 'intakes' ? 'schemas' : 'bibliotheek'
}

export function isDeel(tab: Tab): tab is Deel {
  return (DELEN as readonly string[]).includes(tab)
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
}

export async function TrainingTabs({ vestiging, actief, lidId }: TrainingTabsProps) {
  const p = (await clubTekst(CLUB_TRAINING)).pagina
  const balk = balkVan(actief)
  return (
    <nav className="club-segment club-training-tabs" aria-label={p.tabsLabel}>
      <Link href={trainingPad(vestiging, 'schemas', lidId)} aria-current={balk === 'schemas' ? 'page' : undefined} scroll={false}>{p.tabs.schemas}</Link>
      <Link href={trainingPad(vestiging, 'sjablonen', lidId)} aria-current={balk === 'bibliotheek' ? 'page' : undefined} scroll={false}>{p.tabs.bibliotheek}</Link>
    </nav>
  )
}

/** De delen van de Bibliotheek; Voeding alleen voor wie voeding mag zien. */
export async function BibliotheekDelen({ vestiging, actief, lidId, metVoeding }: { vestiging: Vestiging; actief: Deel; lidId: string | null; metVoeding: boolean }) {
  const p = (await clubTekst(CLUB_TRAINING)).pagina
  const delen = DELEN.filter((d) => d !== 'voedingsjablonen' || metVoeding)
  const naam: Record<Deel, string> = { sjablonen: p.delen.sjablonen, oefeningen: p.delen.oefeningen, voedingsjablonen: p.delen.voeding }
  return (
    <nav className="club-training-delen" aria-label={p.delen.label}>
      {delen.map((d) => (
        <Link key={d} href={trainingPad(vestiging, d, d === 'sjablonen' ? lidId : null)} aria-current={d === actief ? 'page' : undefined} scroll={false}>{naam[d]}</Link>
      ))}
    </nav>
  )
}
