// ─── AI Your Gym: paden van de verkoopwebsite (PUUR) ────────────────────────
// Een plek voor alle links, zodat de basis (/aiyourgym) maar op een plek staat.
// Engels: met taal 'en' komt /en achter de basis (/aiyourgym/en/functies); de
// proxy maakt daar dezelfde pagina in het Engels van (src/lib/aiyourgym/taal/pad.ts).
// De constanten hieronder zijn Nederlands; voor een taal gebruik je sitePaden(taal).

import { KOP, MENU_SLEUTELS, type MenuSleutel } from '@/lib/aiyourgym/taal/woorden/website/kop'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

export const AYG_BASIS = '/aiyourgym'

export function aygPad(sub = '', taal: Taal = 'nl'): string {
  const basis = taal === 'en' ? `${AYG_BASIS}/en` : AYG_BASIS
  if (!sub) return basis
  return `${basis}${sub.startsWith('/') || sub.startsWith('#') ? sub : `/${sub}`}`
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

/** De vaste links van de site in een taal. */
export function sitePaden(taal: Taal) {
  return {
    HOME: aygPad('', taal),
    AANMELDEN: aygPad('/aanmelden', taal),
    DEMO: aygPad('/demo', taal),
    DEMO_AANVRAGEN: aygPad('/demo-aanvragen', taal),
    INLOGGEN: aygPad('/inloggen', taal),
    PRIJS_OP_MAAT: aygPad('/prijs-op-maat', taal),
    OVERSTAPPEN: aygPad('/overstappen', taal),
    PRIVACY_BEVEILIGING: aygPad('/privacy-en-beveiliging', taal),
    NIEUW: aygPad('/nieuw', taal),
    OVERSTAPCHECKLIST: aygPad('/overstapchecklist', taal),
  } as const
}

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
  return MENU_SLEUTELS.map((sleutel) => ({ sleutel, pad: aygPad(MENU_PADEN[sleutel], taal), ...teksten[sleutel] }))
}

/** Nederlands; nieuwe code gebruikt navLinks(taal). */
export const NAV_LINKS = [
  { label: 'Functies', pad: aygPad('/functies'), uitleg: 'Beheer, coaching, planning, groei en betrokkenheid' },
  { label: 'Schema’s', pad: aygPad('/trainingsschemas'), uitleg: 'Van intake tot voortgang, met coaching per oefening' },
  { label: 'Voor wie', pad: aygPad('/voor-wie'), uitleg: 'Van gym en PT-studio tot yoga, vechtsport en keten' },
  { label: 'Ledenapp', pad: aygPad('/ledenapp'), uitleg: 'Een web-app in jouw huisstijl' },
  { label: 'Prijzen', pad: aygPad('/prijzen'), uitleg: 'Drie pakketten, een prijs op maat' },
  { label: 'Overstappen', pad: aygPad('/overstappen'), uitleg: 'Zo zet je je club erin' },
] as const

function zonderBasis(pad: string): string {
  const kaal = pad
    .replace(/^\/aiyourgym(?=\/|$)/, '')
    .replace(/^\/en(?=\/|$)/, '')
    .replace(/\/$/, '')
  return kaal === '' ? '/' : kaal
}

/**
 * Is deze link de huidige pagina? Werkt met en zonder basis in de adresbalk
 * (straks kan aiyourgym.com de basis weglaten) en los van de taal (/en).
 */
export function isHuidig(linkPad: string, adres: string | null): boolean {
  if (!adres) return false
  const link = zonderBasis(linkPad)
  const hier = zonderBasis(adres)
  return link === '/' ? hier === '/' : hier === link || hier.startsWith(`${link}/`)
}
