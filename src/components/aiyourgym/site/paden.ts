// ─── AI Your Gym: paden van de verkoopwebsite (PUUR) ────────────────────────
// Een plek voor alle links, zodat de basis (/aiyourgym) maar op een plek staat.
// Besluit Kane (24-10-2026): geen /en in adressen. Een pagina heeft in beide
// talen hetzelfde adres; de taal komt uit de cookie ayg-taal. Daarom zitten
// er nergens taal of /en in de paden hieronder.

import { KOP, MENU_SLEUTELS, type MenuSleutel } from '@/lib/aiyourgym/taal/woorden/website/kop'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

export const AYG_BASIS = '/aiyourgym'

/** Een pad van de website onder /aiyourgym, in elke taal hetzelfde. */
export function aygPad(sub = ''): string {
  if (!sub) return AYG_BASIS
  return `${AYG_BASIS}${sub.startsWith('/') || sub.startsWith('#') ? sub : `/${sub}`}`
}

export const AANMELDEN = aygPad('/aanmelden')
export const DEMO = aygPad('/demo')
/** Een persoonlijke demo aanvragen (gesprek), naast de live demo hierboven. */
export const DEMO_AANVRAGEN = aygPad('/demo-aanvragen')
/** Inloggen voor sportscholen (e-mailadres en wachtwoord), op de website zelf. */
export const INLOGGEN = aygPad('/inloggen')
/** Een prijs op maat aanvragen in drie stappen, zonder bedragen. */
export const PRIJS_OP_MAAT = aygPad('/prijs-op-maat')
export const OVERSTAPPEN = aygPad('/overstappen')
export const PRIVACY_BEVEILIGING = aygPad('/privacy-en-beveiliging')
export const PRIJZEN_VRAGEN = aygPad('/prijzen#vragen')
/** Wat er elke maand is bijgekomen, alleen wat live is. */
export const NIEUW = aygPad('/nieuw')
/** Gratis overstapchecklist, zonder e-mailadres. */
export const OVERSTAPCHECKLIST = aygPad('/overstapchecklist')
/** De soorten sportscholen op /voor-wie, met het anker van een soort. */
export function voorWie(sleutel?: string): string {
  return aygPad(sleutel ? `/voor-wie#${sleutel}` : '/voor-wie')
}

/** De vaste links van de site (in elke taal dezelfde). */
export const SITE_PADEN = {
  HOME: aygPad(),
  AANMELDEN,
  DEMO,
  DEMO_AANVRAGEN,
  INLOGGEN,
  PRIJS_OP_MAAT,
  OVERSTAPPEN,
  PRIVACY_BEVEILIGING,
  NIEUW,
  OVERSTAPCHECKLIST,
} as const

const MENU_PADEN: Readonly<Record<MenuSleutel, string>> = {
  functies: '/functies',
  schemas: '/trainingsschemas',
  voorWie: '/voor-wie',
  ledenapp: '/ledenapp',
  prijzen: '/prijzen',
  overstappen: '/overstappen',
}

export interface NavLink {
  sleutel: MenuSleutel
  label: string
  pad: string
  uitleg: string
}

/** De hoofdpagina's in het menu, in een taal. */
export function navLinks(taal: Taal): readonly NavLink[] {
  const teksten = KOP[taal].links
  return MENU_SLEUTELS.map((sleutel) => ({ sleutel, pad: aygPad(MENU_PADEN[sleutel]), ...teksten[sleutel] }))
}


function zonderBasis(pad: string): string {
  const kaal = pad
    .replace(/^\/aiyourgym(?=\/|$)/, '')
    .replace(/\/$/, '')
  return kaal === '' ? '/' : kaal
}

/**
 * Is deze link de huidige pagina? Werkt met en zonder basis in de adresbalk
 * (op aiyourgym.com staat de basis niet in de adresbalk).
 */
export function isHuidig(linkPad: string, adres: string | null): boolean {
  if (!adres) return false
  const link = zonderBasis(linkPad)
  const hier = zonderBasis(adres)
  return link === '/' ? hier === '/' : hier === link || hier.startsWith(`${link}/`)
}
