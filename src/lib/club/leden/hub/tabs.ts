// ─── Club, ledenkaart als hub: tabbladen en de weg terug (PUUR) ─────────────
// Besluit Kane (27-10-2026): alles van een lid staat op het profiel. Sinds
// 03-11-2026 (EENVOUD-10-MINUTEN.md, hoofdstuk 4) heeft de kaart drie
// tabbladen: Overzicht, Training en Lidmaatschap. Het open tabblad staat in de
// URL (?tab=), zodat een actie die op de kaart begint (intake, schema, les
// boeken) daar ook eindigt.
// Oude tabbladen blijven werken als adres: planning en contact openen Overzicht
// op hun sectie, privacy opent Lidmaatschap op #privacy. Wie vanaf de kaart
// naar een ander scherm gaat, krijgt ?van=lid mee; dat scherm stuurt dan terug
// naar het juiste tabblad van het lid. Geen vrije terug-URL: zo kan een link
// nooit naar een ander adres doorsturen.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'

/** De tabbladen die de kaart echt heeft. */
export const KAART_TABS = ['overzicht', 'training', 'lidmaatschap'] as const
export type KaartTab = (typeof KAART_TABS)[number]

/** Oude tabbladen (tot 03-11-2026): het nieuwe tabblad en de sectie (anker) waar ze nu staan. */
export const OUDE_TABS = {
  planning: { tab: 'overzicht', anker: 'planning' },
  contact: { tab: 'overzicht', anker: 'notities' },
  privacy: { tab: 'lidmaatschap', anker: 'privacy' },
} as const satisfies Record<string, { tab: KaartTab; anker: string }>
export type OudeTab = keyof typeof OUDE_TABS

/** Elk tabblad dat een link mag noemen: de drie echte plus de oude namen. */
export type LidTab = KaartTab | OudeTab

/** Alle waarden die ?tab= mag hebben (nieuw en oud). */
export const LID_TABS: readonly LidTab[] = [...KAART_TABS, ...(Object.keys(OUDE_TABS) as OudeTab[])]

export const STANDAARD_TAB: KaartTab = 'overzicht'

/** Parameter en waarde die zeggen: deze actie begon op de ledenkaart. */
export const VAN_PARAM = 'van'
export const VAN_LID = 'lid'

/** Waar een tabblad (nieuw of oud) op de kaart terechtkomt. */
export interface KaartPlek {
  tab: KaartTab
  anker: string | null
}

function eerste(ruw: string | string[] | undefined): string | undefined {
  return Array.isArray(ruw) ? ruw[0] : ruw
}

export function isKaartTab(v: unknown): v is KaartTab {
  return typeof v === 'string' && (KAART_TABS as readonly string[]).includes(v)
}

export function isOudeTab(v: unknown): v is OudeTab {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(OUDE_TABS, v)
}

export function isLidTab(v: unknown): v is LidTab {
  return isKaartTab(v) || isOudeTab(v)
}

/** Een tabblad (nieuw of oud) als echt tabblad plus sectie. */
export function plekVan(tab: LidTab): KaartPlek {
  return isOudeTab(tab) ? { ...OUDE_TABS[tab] } : { tab, anker: null }
}

/**
 * Het tabblad uit de URL, met het anker als het een oude naam was. Onbekend,
 * leeg of niet zichtbaar voor deze persoon wordt Overzicht.
 */
export function kiesKaartPlek(ruw: string | string[] | undefined, zichtbaar: readonly KaartTab[] = KAART_TABS): KaartPlek {
  const w = eerste(ruw)
  if (!isLidTab(w)) return { tab: STANDAARD_TAB, anker: null }
  const plek = plekVan(w)
  return zichtbaar.includes(plek.tab) ? plek : { tab: STANDAARD_TAB, anker: null }
}

/** Alleen het tabblad uit de URL (zie kiesKaartPlek). */
export function kiesLidTab(ruw: string | string[] | undefined, zichtbaar: readonly KaartTab[] = KAART_TABS): KaartTab {
  return kiesKaartPlek(ruw, zichtbaar).tab
}

/** Stond er een oude naam in ?tab=? Dan stuurt de kaart door naar het nieuwe adres met anker. */
export function isOudAdres(ruw: string | string[] | undefined): boolean {
  return isOudeTab(eerste(ruw))
}

/**
 * Het adres van de ledenkaart, eventueel op een tabblad en een sectie.
 * Overzicht staat zonder ?tab= in de URL; een oude tabnaam geeft het nieuwe
 * tabblad met het anker van die sectie (#planning, #notities, #privacy).
 */
export function lidKaartPad(lidId: string, vestiging: Vestiging, tab: LidTab = STANDAARD_TAB, anker?: string): string {
  const plek = plekVan(tab)
  const pad = `/leden/${encodeURIComponent(lidId)}`
  const basis = clubPad(pad, vestiging, plek.tab === STANDAARD_TAB ? {} : { tab: plek.tab })
  const doel = anker ?? plek.anker
  return doel ? `${basis}#${doel}` : basis
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
