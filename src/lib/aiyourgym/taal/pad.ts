// ─── AI Your Gym: oude Engelse adressen (PUUR) ──────────────────────────────
// Besluit Kane (24-10-2026): geen /en in adressen. Elke pagina staat altijd op
// hetzelfde adres; de taal komt uit de cookie ayg-taal (standaard Nederlands).
// Oude, gedeelde links met /en blijven werken: de proxy stuurt ze met een 308
// door naar hetzelfde pad zonder /en en zet de cookie op Engels.
//   /en, /en/functies                  wordt /, /functies
//   /aiyourgym/en, /aiyourgym/en/...   wordt /aiyourgym, /aiyourgym/...
// Zie docs/aiyourgym/TALEN.md.

export const EN_VOORVOEGSEL = '/en'
const BASIS = '/aiyourgym'

function begintMet(pad: string, voorvoegsel: string): boolean {
  return pad === voorvoegsel || pad.startsWith(`${voorvoegsel}/`)
}

function zonderEn(pad: string): string | null {
  if (!begintMet(pad, EN_VOORVOEGSEL)) return null
  const rest = pad.slice(EN_VOORVOEGSEL.length)
  return rest === '' ? '/' : rest
}

/**
 * Het pad van een oud Engels adres zonder /en, met of zonder /aiyourgym ervoor
 * zoals het binnenkwam. null als het pad geen oud Engels adres is.
 */
export function oudEngelsPad(pad: string): string | null {
  if (begintMet(pad, BASIS)) {
    const rest = zonderEn(pad.slice(BASIS.length) || '/')
    if (rest === null) return null
    return rest === '/' ? BASIS : `${BASIS}${rest}`
  }
  return zonderEn(pad)
}
