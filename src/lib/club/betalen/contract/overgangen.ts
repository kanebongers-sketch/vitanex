// ─── Club, betalen: toestanden die alleen vooruit gaan (PUUR) ───────────────
// Toestanden en overgangen van contract, factuur en betaling, precies zoals in
// docs/aiyourgym/betalen/BOUWPLAN.md paragraaf 1.5. Webhooks komen in willekeurige
// volgorde en soms dubbel binnen; daarom:
// - nieuwe toestand bereikbaar vanuit de huidige (ook met stappen ertussen
//   die we gemist hebben): toepassen;
// - gelijk aan de huidige: negeren (dubbel bericht);
// - een oudere toestand (de huidige is bereikbaar vanuit de nieuwe): negeren;
// - anders: weigeren. Dat is een tegenstrijdig bericht (bijvoorbeeld mislukt
//   na geslaagd) en hoort als 'afwijkend' bij Kane te komen, nooit stil.
//
// Aanvulling op 1.5: deels_betaald kan nog naar betaald, oninbaar of
// gecrediteerd, anders zou een deelbetaling een doodlopend eind zijn.

export const BETALING_TOESTANDEN = ['klaar', 'aangeboden', 'in_behandeling', 'geslaagd', 'mislukt', 'geannuleerd', 'gestorneerd', 'storno_teruggedraaid'] as const
export type BetalingToestand = (typeof BETALING_TOESTANDEN)[number]

export const FACTUUR_TOESTANDEN = ['concept', 'definitief', 'open', 'betaald', 'deels_betaald', 'oninbaar', 'gecrediteerd'] as const
export type FactuurToestand = (typeof FACTUUR_TOESTANDEN)[number]

export const CONTRACT_TOESTANDEN = ['concept', 'wacht_op_machtiging', 'proef', 'actief', 'gepauzeerd', 'opgezegd', 'beeindigd', 'gestopt_wegens_achterstand'] as const
export type ContractToestand = (typeof CONTRACT_TOESTANDEN)[number]

export type Graaf<T extends string> = Readonly<Record<T, readonly T[]>>

export const BETALING_GRAAF: Graaf<BetalingToestand> = {
  klaar: ['aangeboden'],
  aangeboden: ['in_behandeling'],
  in_behandeling: ['geslaagd', 'mislukt', 'geannuleerd'],
  geslaagd: ['gestorneerd'],
  mislukt: [],
  geannuleerd: [],
  gestorneerd: ['storno_teruggedraaid'],
  storno_teruggedraaid: [],
}

export const FACTUUR_GRAAF: Graaf<FactuurToestand> = {
  concept: ['definitief'],
  definitief: ['open'],
  open: ['betaald', 'deels_betaald', 'oninbaar', 'gecrediteerd'],
  deels_betaald: ['betaald', 'oninbaar', 'gecrediteerd'],
  betaald: [],
  oninbaar: [],
  gecrediteerd: [],
}

export const CONTRACT_GRAAF: Graaf<ContractToestand> = {
  concept: ['wacht_op_machtiging'],
  wacht_op_machtiging: ['proef'],
  proef: ['actief'],
  actief: ['gepauzeerd', 'opgezegd', 'gestopt_wegens_achterstand'],
  gepauzeerd: ['actief'],
  opgezegd: ['beeindigd'],
  beeindigd: [],
  gestopt_wegens_achterstand: [],
}

/** Alle toestanden die vanuit `van` te bereiken zijn in een of meer stappen. */
export function bereikbaar<T extends string>(graaf: Graaf<T>, van: T): ReadonlySet<T> {
  const gezien = new Set<T>()
  const rij: T[] = [...graaf[van]]
  while (rij.length > 0) {
    const t = rij.shift() as T
    if (gezien.has(t)) continue
    gezien.add(t)
    rij.push(...graaf[t])
  }
  return gezien
}

export type OvergangUitslag = { soort: 'toepassen' } | { soort: 'negeren'; reden: 'gelijk' | 'ouder' } | { soort: 'weigeren'; reden: string }

/** Beslis wat er met een gemelde nieuwe toestand gebeurt (zie de regels bovenaan). */
export function beslisOvergang<T extends string>(graaf: Graaf<T>, huidig: T, nieuw: T): OvergangUitslag {
  if (huidig === nieuw) return { soort: 'negeren', reden: 'gelijk' }
  if (bereikbaar(graaf, huidig).has(nieuw)) return { soort: 'toepassen' }
  if (bereikbaar(graaf, nieuw).has(huidig)) return { soort: 'negeren', reden: 'ouder' }
  return { soort: 'weigeren', reden: `Van ${huidig} naar ${nieuw} kan niet` }
}

export function betalingOvergang(huidig: BetalingToestand, nieuw: BetalingToestand): OvergangUitslag {
  return beslisOvergang(BETALING_GRAAF, huidig, nieuw)
}

export function factuurOvergang(huidig: FactuurToestand, nieuw: FactuurToestand): OvergangUitslag {
  return beslisOvergang(FACTUUR_GRAAF, huidig, nieuw)
}

export function contractOvergang(huidig: ContractToestand, nieuw: ContractToestand): OvergangUitslag {
  return beslisOvergang(CONTRACT_GRAAF, huidig, nieuw)
}

/** Na definitief veranderen de bedragen van een factuur nooit meer (correctie via een creditnota). */
export function factuurBedragenBevroren(t: FactuurToestand): boolean {
  return t !== 'concept'
}

/** Is dit een eindtoestand (geen overgang meer mogelijk)? */
export function isEindtoestand<T extends string>(graaf: Graaf<T>, t: T): boolean {
  return graaf[t].length === 0
}
