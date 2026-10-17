// ─── AI Your Gym: paden van de verkoopwebsite (PUUR) ────────────────────────
// Een plek voor alle links, zodat de basis (/aiyourgym) maar op een plek staat.

export const AYG_BASIS = '/aiyourgym'

export function aygPad(sub = ''): string {
  if (!sub) return AYG_BASIS
  return `${AYG_BASIS}${sub.startsWith('/') || sub.startsWith('#') ? sub : `/${sub}`}`
}

export const AANMELDEN = aygPad('/aanmelden')

export const NAV_LINKS = [
  { label: 'Functies', pad: aygPad('/functies') },
  { label: 'Ledenapp', pad: aygPad('/ledenapp') },
  { label: 'Prijzen', pad: aygPad('/prijzen') },
  { label: 'Overstappen', pad: aygPad('/overstappen') },
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
