// ─── Club, betalen: wettelijke regels voor sportabonnementen (PUUR) ─────────
// Alle wettelijke waarden staan in WET, met bron. Bron van de feiten:
// docs/aiyourgym/betalen/ONDERZOEK-STRIPE.md, paragraaf 6. Dit is geen
// juridisch advies; [CHECK] betekent: niet op een primaire bron gecontroleerd.
//
// Keuze (strengste lezing, veilig voor de sportschool): een plan heeft een
// opzegtermijn voor het hele contract en die is nooit langer dan een maand.
// Opzeggen kan elke dag; het contract eindigt op de opzegdatum plus de
// opzegtermijn (en niet eerder dan het einde van de eerste looptijd). Er wordt
// niet doorgeschoven naar het einde van een factuurperiode: dan zou het einde
// later kunnen vallen dan de wet toestaat. De laatste periode gaat pro rata.
//
// Einddatums zijn exclusief, net als in periodes.ts: `einde` is de eerste dag
// zonder contract.

import { dagenTussen, plusDagen, plusMaanden, laatste, vroegste, type Datum } from './datum'

export const WET = {
  /** Na de eerste looptijd: alleen stilzwijgend verlengen naar onbepaalde tijd. */
  verlengingNaEersteLooptijd: {
    waarde: 'onbepaald',
    bron: 'Wet van Dam (art. 6:236 sub j BW [CHECK artikelnummer]); ACM sportscholen 2020',
    check: false,
  },
  /** Maximale opzegtermijn na de eerste looptijd, in kalendermaanden. */
  maxOpzegtermijnMaanden: {
    waarde: 1,
    bron: 'Wet van Dam (art. 6:236 sub j BW [CHECK artikelnummer]); ACM: na de eerste periode maandelijks opzegbaar',
    check: false,
  },
  /** Maximale eerste looptijd in maanden. Langer is in beginsel onredelijk bezwarend. */
  maxEersteLooptijdMaanden: {
    waarde: 12,
    bron: 'Grijze lijst BW (art. 6:237 sub k BW) [CHECK artikelnummer en precieze regel]; advies ONDERZOEK-STRIPE.md par. 6',
    check: true,
  },
  /** Online afgesloten betekent online kunnen opzeggen, zonder extra drempels. */
  onlineAfgeslotenOnlineOpzeggen: {
    waarde: true,
    bron: 'Art. 6:236 sub o BW; ACM "online afgesloten abonnement moet je online kunnen opzeggen"',
    check: false,
  },
  /** Bedenktijd bij online afsluiten, in dagen. */
  herroepingstermijnDagen: {
    waarde: 14,
    bron: 'Art. 6:230o BW (Richtlijn 2011/83/EU); herroepingsknop sinds 19-06-2026 (Richtlijn (EU) 2023/2673, ACM, KvK)',
    check: false,
  },
} as const

export const VERLENGINGEN = ['onbepaald', 'geen', 'zelfde_looptijd'] as const
/** onbepaald: na de eerste looptijd doorlopend per maand opzegbaar; geen: eindigt vanzelf; zelfde_looptijd: mag niet. */
export type Verlenging = (typeof VERLENGINGEN)[number]

export interface ContractVoorwaarden {
  /** Eerste looptijd in maanden; null of 0 = meteen onbepaalde tijd. */
  eersteLooptijdMaanden: number | null
  /** Opzegtermijn in kalenderdagen. */
  opzegtermijnDagen: number
  verlenging: Verlenging
  /** Kan het lid dit plan online afsluiten? */
  onlineAfsluiten: boolean
  /** Kan het lid dit plan online opzeggen? */
  onlineOpzeggen: boolean
}

export type PlanFoutCode =
  | 'looptijd_ongeldig'
  | 'looptijd_te_lang'
  | 'opzegtermijn_ongeldig'
  | 'opzegtermijn_te_lang'
  | 'verlenging_niet_toegestaan'
  | 'online_opzeggen_verplicht'

export interface PlanFout {
  code: PlanFoutCode
  melding: string
}

/** Het langste aantal dagen dat een maand kan hebben: een opzegtermijn in dagen mag hier nooit boven. */
export const MAX_OPZEGTERMIJN_DAGEN = 31

/** Controleer de voorwaarden van een plan tegen de wet. Lege lijst = in orde. */
export function controleerVoorwaarden(v: ContractVoorwaarden): PlanFout[] {
  const fouten: PlanFout[] = []
  const looptijd = v.eersteLooptijdMaanden
  if (looptijd !== null && (!Number.isSafeInteger(looptijd) || looptijd < 0)) {
    fouten.push({ code: 'looptijd_ongeldig', melding: 'De eerste looptijd moet een geheel aantal maanden zijn.' })
  } else if (looptijd !== null && looptijd > WET.maxEersteLooptijdMaanden.waarde) {
    fouten.push({ code: 'looptijd_te_lang', melding: `De eerste looptijd mag hooguit ${WET.maxEersteLooptijdMaanden.waarde} maanden zijn.` })
  }
  if (!Number.isSafeInteger(v.opzegtermijnDagen) || v.opzegtermijnDagen < 0) {
    fouten.push({ code: 'opzegtermijn_ongeldig', melding: 'De opzegtermijn moet een geheel aantal dagen zijn.' })
  } else if (v.opzegtermijnDagen > MAX_OPZEGTERMIJN_DAGEN) {
    fouten.push({ code: 'opzegtermijn_te_lang', melding: 'De opzegtermijn mag hooguit een maand zijn.' })
  }
  if (v.verlenging === 'zelfde_looptijd') {
    fouten.push({ code: 'verlenging_niet_toegestaan', melding: 'Stilzwijgend verlengen mag alleen naar onbepaalde tijd, maandelijks opzegbaar.' })
  }
  if (v.onlineAfsluiten && !v.onlineOpzeggen) {
    fouten.push({ code: 'online_opzeggen_verplicht', melding: 'Wie online kan afsluiten, moet ook online kunnen opzeggen.' })
  }
  return fouten
}

/** Einde van de eerste looptijd (exclusief), of null als er geen vaste eerste looptijd is. */
export function eindeEersteLooptijd(start: Datum, v: Pick<ContractVoorwaarden, 'eersteLooptijdMaanden'>): Datum | null {
  const m = v.eersteLooptijdMaanden
  return m === null || m === 0 ? null : plusMaanden(start, m)
}

/** Het wettelijke maximum: opzegdatum plus een kalendermaand. */
export function wettelijkLaatsteEinde(opzegdatum: Datum): Datum {
  return plusMaanden(opzegdatum, WET.maxOpzegtermijnMaanden.waarde)
}

/** Opzegdatum plus de opzegtermijn van het plan, nooit later dan het wettelijke maximum. */
function naOpzegtermijn(opzegdatum: Datum, opzegtermijnDagen: number): Datum {
  return vroegste(plusDagen(opzegdatum, opzegtermijnDagen), wettelijkLaatsteEinde(opzegdatum))
}

export interface OpzegInvoer {
  /** Begin van het contract. */
  start: Datum
  voorwaarden: Pick<ContractVoorwaarden, 'eersteLooptijdMaanden' | 'opzegtermijnDagen'>
  /** Dag waarop het lid opzegt (kalenderdag in Nederland). */
  opzegdatum: Datum
  /** Einde van de eerste looptijd na schuivende pauzes, als dat afwijkt van start plus looptijd. */
  eindeEersteLooptijdVerschoven?: Datum | null
}

/**
 * De vroegste einddatum (exclusief) bij opzeggen op `opzegdatum`.
 * - In de eerste looptijd: niet eerder dan het einde daarvan.
 * - Altijd: opzegdatum plus de opzegtermijn, begrensd op een maand.
 * - Nooit voor het begin van het contract (opzeggen voor de start telt vanaf de start).
 */
export function vroegsteEinde(invoer: OpzegInvoer): Datum {
  const eerste = invoer.eindeEersteLooptijdVerschoven ?? eindeEersteLooptijd(invoer.start, invoer.voorwaarden)
  const vanaf = laatste(invoer.opzegdatum, invoer.start)
  const naTermijn = naOpzegtermijn(vanaf, invoer.voorwaarden.opzegtermijnDagen)
  return eerste !== null && eerste > naTermijn ? eerste : naTermijn
}

/** De laatste dag die nog bij het contract hoort (einde min een dag). */
export function laatsteContractdag(einde: Datum): Datum {
  return plusDagen(einde, -1)
}

/** Valt `dag` binnen de wettelijke bedenktijd na online afsluiten op `afgeslotenOp`? */
export function binnenBedenktijd(afgeslotenOp: Datum, dag: Datum): boolean {
  const verschil = dagenTussen(afgeslotenOp, dag)
  return verschil >= 0 && verschil <= WET.herroepingstermijnDagen.waarde
}
