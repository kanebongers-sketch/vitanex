// ─── Club, ledenkaart als hub: tabbladen en de weg terug (PUUR) ─────────────
// Besluit Kane (27-10-2026): alles van een lid staat op het profiel. De kaart
// heeft vaste tabbladen; het open tabblad staat in de URL (?tab=), zodat een
// actie die op de kaart begint (intake, schema, les boeken) daar ook eindigt.
// Wie vanaf de kaart naar een ander scherm gaat, krijgt ?van=lid mee; dat
// scherm stuurt dan terug naar het juiste tabblad van het lid. Geen vrije
// terug-URL: zo kan een link nooit naar een ander adres doorsturen.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'

export const LID_TABS = ['overzicht', 'training', 'lidmaatschap', 'planning', 'contact', 'privacy'] as const
export type LidTab = (typeof LID_TABS)[number]

export const STANDAARD_TAB: LidTab = 'overzicht'

/** Parameter en waarde die zeggen: deze actie begon op de ledenkaart. */
export const VAN_PARAM = 'van'
export const VAN_LID = 'lid'

function eerste(ruw: string | string[] | undefined): string | undefined {
  return Array.isArray(ruw) ? ruw[0] : ruw
}

export function isLidTab(v: unknown): v is LidTab {
  return typeof v === 'string' && (LID_TABS as readonly string[]).includes(v)
}

/** Het tabblad uit de URL; onbekend of niet zichtbaar voor deze persoon wordt Overzicht. */
export function kiesLidTab(ruw: string | string[] | undefined, zichtbaar: readonly LidTab[] = LID_TABS): LidTab {
  const w = eerste(ruw)
  return isLidTab(w) && zichtbaar.includes(w) ? w : STANDAARD_TAB
}

/** Het adres van de ledenkaart, eventueel op een tabblad. Overzicht staat zonder ?tab= in de URL. */
export function lidKaartPad(lidId: string, vestiging: Vestiging, tab: LidTab = STANDAARD_TAB): string {
  const pad = `/leden/${encodeURIComponent(lidId)}`
  return clubPad(pad, vestiging, tab === STANDAARD_TAB ? {} : { tab })
}

/** Begon deze actie op de ledenkaart (?van=lid)? */
export function kwamVanLid(ruw: string | string[] | undefined): boolean {
  return eerste(ruw) === VAN_LID
}

/** Een pad binnen Club met ?van=lid erbij, zodat het scherm daarna terug naar het lid gaat. */
export function metVanLid(pad: string): string {
  const [basis, zoek = ''] = pad.split('?')
  const params = new URLSearchParams(zoek)
  params.set(VAN_PARAM, VAN_LID)
  return `${basis}?${params.toString()}`
}

/**
 * Waar een scherm na afloop heen gaat: terug naar het tabblad van het lid als
 * de actie daar begon en deze persoon Leden mag zien, anders de eigen weg.
 */
export function terugNaar(opties: { vanLid: boolean; magLeden: boolean; lidId: string | null; vestiging: Vestiging; tab: LidTab; anders: string }): string {
  const { vanLid, magLeden, lidId, vestiging, tab, anders } = opties
  return vanLid && magLeden && lidId ? lidKaartPad(lidId, vestiging, tab) : anders
}
