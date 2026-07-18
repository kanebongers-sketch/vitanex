// ─── LifeOS — CRM: de sleepvolgorde binnen een kolom ────────────────────────
// Puur. `sortering` is een real: een nieuwe plek is het gemiddelde van de twee
// buren, zodat je ertussen kunt schuiven zonder de rest te hernummeren. De
// gesleepte tegel telt nooit als eigen buur — anders reken je met je oude plek.

import type { Persoon } from '@/lib/lifeos/crm/crm'

/** De personen van één status, oplopend op sortering (laag = boven). */
export function kolomVan(personen: readonly Persoon[], status: string): Persoon[] {
  return personen
    .filter((p) => p.status === status)
    .sort((a, b) => a.sortering - b.sortering)
}

/** Een plek achteraan de kolom (voor een drop op de kolom zelf). */
export function sorteringAanEinde(kolom: readonly Persoon[]): number {
  if (kolom.length === 0) return 0
  return kolom[kolom.length - 1].sortering + 1
}

/**
 * De sortering om `sleepId` ONDERAAN een andere status te zetten — voor een
 * statuswissel via de kiezer (tegel) of de popup. Cruciaal: de oude sortering
 * hoort bij de OUDE kolom; hem meenemen zou de persoon in de nieuwe kolom op een
 * willekeurige plek zetten (of midden tussen bestaande tegels laten vallen). We
 * rekenen dus een verse plek achter de laatste van de doelstatus, met de persoon
 * zelf eruit gefilterd (anders telt zijn eigen — nog niet verplaatste — regel mee).
 */
export function sorteringVoorStatus(
  personen: readonly Persoon[],
  status: string,
  sleepId: string,
): number {
  const doelKolom = kolomVan(personen, status).filter((p) => p.id !== sleepId)
  return sorteringAanEinde(doelKolom)
}

/**
 * De sortering om `sleepId` vóór `doelId` te zetten: het gemiddelde van de tegel
 * erboven en de doeltegel. Geeft `null` als het doel niet (meer) in de kolom zit.
 */
export function sorteringVoor(
  kolom: readonly Persoon[],
  doelId: string,
  sleepId: string,
): number | null {
  const zonderSleep = kolom.filter((p) => p.id !== sleepId)
  const doelIndex = zonderSleep.findIndex((p) => p.id === doelId)
  if (doelIndex === -1) return null

  const doel = zonderSleep[doelIndex]
  const boven = zonderSleep[doelIndex - 1]
  if (boven === undefined) return doel.sortering - 1
  return (boven.sortering + doel.sortering) / 2
}
