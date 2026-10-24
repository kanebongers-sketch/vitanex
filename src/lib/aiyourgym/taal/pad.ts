// ─── AI Your Gym: de taal in het adres van de website (PUUR) ────────────────
// Nederlands zonder voorvoegsel, Engels met /en:
//   aiyourgym.com/functies      Nederlands
//   aiyourgym.com/en/functies   Engels
// Interne links van de site lopen via /aiyourgym (src/components/aiyourgym/site/paden.ts),
// dus ook /aiyourgym/en/functies is Engels. De proxy herschrijft beide naar de
// gewone route (/aiyourgym/functies) en geeft de taal mee als kop (TAAL_KOP);
// er is geen aparte routeboom per taal. Zie docs/aiyourgym/TALEN.md.

import { STANDAARD_TAAL, type Taal } from './taal'

export const EN_VOORVOEGSEL = '/en'
const BASIS = '/aiyourgym'

function heeftVoorvoegsel(pad: string, voorvoegsel: string): boolean {
  return pad === voorvoegsel || pad.startsWith(`${voorvoegsel}/`) || pad.startsWith(`${voorvoegsel}#`) || pad.startsWith(`${voorvoegsel}?`)
}

/** Het pad zonder /en ervoor, met de taal. '/en' wordt '/', '/en/functies' wordt '/functies'. */
export function splitsTaal(pad: string): { taal: Taal; rest: string } {
  if (!heeftVoorvoegsel(pad, EN_VOORVOEGSEL)) return { taal: STANDAARD_TAAL, rest: pad }
  const rest = pad.slice(EN_VOORVOEGSEL.length)
  return { taal: 'en', rest: rest === '' ? '/' : rest.startsWith('/') ? rest : `/${rest}` }
}

/** Een pad zonder taal in een taal: ('en', '/functies') wordt '/en/functies', ('en', '/') wordt '/en'. */
export function taalPad(taal: Taal, pad: string): string {
  const schoon = pad === '' ? '/' : pad
  if (taal === STANDAARD_TAAL) return schoon
  if (schoon === '/') return EN_VOORVOEGSEL
  return `${EN_VOORVOEGSEL}${schoon.startsWith('/') ? schoon : `/${schoon}`}`
}

/**
 * Het adres van dezelfde pagina in de andere taal, met of zonder /aiyourgym
 * ervoor zoals het nu in de adresbalk staat. Voor de taalkeuze.
 */
export function wisselTaalPad(adres: string, naar: Taal): string {
  const metBasis = heeftVoorvoegsel(adres, BASIS)
  const zonderBasis = metBasis ? adres.slice(BASIS.length) || '/' : adres
  const { rest } = splitsTaal(zonderBasis)
  const nieuw = taalPad(naar, rest)
  if (!metBasis) return nieuw
  return nieuw === '/' ? BASIS : `${BASIS}${nieuw}`
}

/**
 * Een websitepad op aiyourgym.com of onder /aiyourgym, ontleed: de taal, het
 * pad waar de pagina echt staat (/aiyourgym/...) en het publieke pad zonder
 * taal (voor hreflang). null als het pad /aiyourgym of /en niet raakt.
 */
export function ontleedSitePad(pad: string): { taal: Taal; route: string; publiek: string } | null {
  const metBasis = heeftVoorvoegsel(pad, BASIS)
  const zonderBasis = metBasis ? pad.slice(BASIS.length) || '/' : pad
  const { taal, rest } = splitsTaal(zonderBasis)
  if (!metBasis && taal === STANDAARD_TAAL) return null
  return { taal, route: rest === '/' ? BASIS : `${BASIS}${rest}`, publiek: rest }
}
