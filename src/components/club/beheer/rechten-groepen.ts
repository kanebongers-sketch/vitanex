import { GROEPEN, ONDERDELEN, groepInTaal, inMenu, isZichtbaar, onderdeelInTaal } from '@/components/club/shell/onderdelen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { NOOIT_VOOR_CLUBMANAGER } from '@/lib/club/beheerders/rechten'
import type { Module } from '@/lib/club/kern/organisatie'
import type { RechtenGroep } from './RechtenMatrix'

// De groepen voor de rechten per rol, zoals het menu, plus de groep
// Instellingen voor wat alleen via het instellingencentrum gaat. Niet in de
// lijst: wat alleen de eigenaar heeft (NOOIT_VOOR_CLUBMANAGER) en Hulp (heeft
// iedereen). Gedeeld door Rechten per rol en de startwizard (stap Team).

const NIET_IN_LIJST: ReadonlySet<string> = new Set([...NOOIT_VOOR_CLUBMANAGER, 'hulp'])

export function rechtenGroepen(uit: readonly Module[], taal: Taal = 'nl'): RechtenGroep[] {
  const kort = (bron: (typeof ONDERDELEN)[number]) => {
    const o = onderdeelInTaal(bron, taal)
    return { sleutel: o.sleutel, label: o.label, uitleg: o.uitleg }
  }
  const telt = ONDERDELEN.filter((o) => !NIET_IN_LIJST.has(o.sleutel) && isZichtbaar(o, uit))
  // Een sectie op Vandaag (Check-in, Taken, Opvolgen) hoort bij de groep van het menu, niet bij Instellingen.
  const dagelijks = (o: (typeof ONDERDELEN)[number]) => inMenu(o) || Boolean(o.sectie)
  const menu = GROEPEN.map((g) => ({ label: groepInTaal(g, taal).label, onderdelen: telt.filter((o) => dagelijks(o) && o.groep === g.sleutel).map(kort) }))
  const instellingen = { label: MENU[taal].hulpbalk.instellingen.label, onderdelen: telt.filter((o) => !dagelijks(o)).map(kort) }
  return [...menu, instellingen].filter((g) => g.onderdelen.length > 0)
}
