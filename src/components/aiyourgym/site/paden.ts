// ─── AI Your Gym: paden van de verkoopwebsite (PUUR) ────────────────────────
// Een plek voor alle links van de website. Besluit Kane (30-10-2026): schone
// adressen zonder /aiyourgym (aiyourgym.com/prijzen, niet aiyourgym.com/aiyourgym/prijzen).
// De pagina's staan in de app onder /aiyourgym; de proxy herschrijft het schone
// adres daarheen en stuurt een oud adres met /aiyourgym met een 308 naar het
// schone (src/lib/aiyourgym/host.ts).
// Besluit Kane (24-10-2026): geen /en in adressen. Een pagina heeft in beide
// talen hetzelfde adres; de taal komt uit de cookie ayg-taal. Daarom zitten
// er nergens taal of /en in de paden hieronder.

import { KOP, MENU_SLEUTELS, type MenuSleutel } from '@/lib/aiyourgym/taal/woorden/website/kop'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

/** De map van de website in de app; komt nooit in een link. */
const INTERNE_BASIS = '/aiyourgym'

/**
 * Een schoon pad van de website ('/prijzen', '/' voor de voorpagina), in elke
 * taal hetzelfde. Een pad dat al schoon is blijft hetzelfde; staat er per
 * ongeluk /aiyourgym voor, dan gaat dat eraf.
 */
export function aygPad(sub = ''): string {
  if (!sub || sub === '/') return '/'
  const pad = sub.startsWith('/') ? sub : `/${sub}`
  return zonderBasis(pad, false)
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


/** Het pad zonder /aiyourgym ervoor (de slotstreep aan het eind gaat eraf, behalve met `slotstreepWeg` false). */
function zonderBasis(pad: string, slotstreepWeg = true): string {
  let kaal = pad
  while (kaal === INTERNE_BASIS || kaal.startsWith(`${INTERNE_BASIS}/`) || kaal.startsWith(`${INTERNE_BASIS}#`) || kaal.startsWith(`${INTERNE_BASIS}?`)) {
    kaal = kaal.slice(INTERNE_BASIS.length)
  }
  if (kaal.startsWith('#') || kaal.startsWith('?')) kaal = `/${kaal}`
  if (slotstreepWeg) kaal = kaal.replace(/\/$/, '')
  return kaal === '' ? '/' : kaal
}

/**
 * Is deze link de huidige pagina? Werkt met het schone adres in de adresbalk
 * (usePathname geeft na een herschrijving het adres van de browser) en, voor de
 * zekerheid, ook met het interne pad onder /aiyourgym.
 */
export function isHuidig(linkPad: string, adres: string | null): boolean {
  if (!adres) return false
  const link = zonderBasis(linkPad)
  const hier = zonderBasis(adres)
  return link === '/' ? hier === '/' : hier === link || hier.startsWith(`${link}/`)
}
