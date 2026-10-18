// ─── AI Your Gym: paden van de verkoopwebsite (PUUR) ────────────────────────
// Een plek voor alle links, zodat de basis (/aiyourgym) maar op een plek staat.

export const AYG_BASIS = '/aiyourgym'

export function aygPad(sub = ''): string {
  if (!sub) return AYG_BASIS
  return `${AYG_BASIS}${sub.startsWith('/') || sub.startsWith('#') ? sub : `/${sub}`}`
}

export const AANMELDEN = aygPad('/aanmelden')
export const DEMO = aygPad('/demo')
/** Een persoonlijke demo aanvragen (gesprek), naast de live demo hierboven. */
export const DEMO_AANVRAGEN = aygPad('/demo-aanvragen')

export const NAV_LINKS = [
  { label: 'Functies', pad: aygPad('/functies'), uitleg: 'Beheer, coaching, planning, groei en betrokkenheid' },
  { label: 'Voor wie', pad: aygPad('/voor-wie'), uitleg: 'Van gym en PT-studio tot yoga, vechtsport en keten' },
  { label: 'Ledenapp', pad: aygPad('/ledenapp'), uitleg: 'Een web-app in jouw huisstijl' },
  { label: 'Prijzen', pad: aygPad('/prijzen'), uitleg: 'Drie pakketten, een prijs op maat' },
  { label: 'Overstappen', pad: aygPad('/overstappen'), uitleg: 'Zo zet je je club erin' },
] as const

function zonderBasis(pad: string): string {
  const kaal = pad.replace(/^\/aiyourgym(?=\/|$)/, '').replace(/\/$/, '')
  return kaal === '' ? '/' : kaal
}

/**
 * Is deze link de huidige pagina? Werkt met en zonder basis in de adresbalk
 * (straks kan aiyourgym.com de basis weglaten).
 */
export function isHuidig(linkPad: string, adres: string | null): boolean {
  if (!adres) return false
  const link = zonderBasis(linkPad)
  const hier = zonderBasis(adres)
  return link === '/' ? hier === '/' : hier === link || hier.startsWith(`${link}/`)
}
