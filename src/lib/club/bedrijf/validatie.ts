// ─── Club: bedrijfsgegevens controleren (PUUR) ──────────────────────────────
// Elk veld heeft een eigen controle die een nette vorm teruggeeft of null als
// het niet klopt. Leeg is apart (geen fout): dat beslist de invoerlaag.

import { normaliseerTelefoon } from '@/lib/club/leads/dubbel'
import { MAX_TEKST, SOCIAL_DOMEIN, type Social } from './model'

/** KvK-nummer: precies 8 cijfers (spaties en punten mogen in de invoer). */
export function normaliseerKvk(ruw: string): string | null {
  const cijfers = ruw.replace(/[\s.]/g, '')
  if (!/^\d{8}$/.test(cijfers) || /^0+$/.test(cijfers)) return null
  return cijfers
}

/** De oude elfproef op de 9 cijfers van een btw-nummer (voor 2020). */
function elfproef(cijfers: string): boolean {
  let som = 0
  for (let i = 0; i < 8; i++) som += Number(cijfers[i]) * (9 - i)
  som -= Number(cijfers[8])
  return som % 11 === 0
}

/** De mod-97-controle van het btw-id (sinds 2020): N=23, L=21, B=11. */
function mod97(cijfers: string, volg: string): boolean {
  const reeks = `2321${cijfers}11${volg}`
  let rest = 0
  for (const c of reeks) rest = (rest * 10 + Number(c)) % 97
  return rest === 1
}

/** Nederlands btw-nummer: NL + 9 cijfers + B + 2 cijfers, met controlegetal. */
export function normaliseerBtw(ruw: string): string | null {
  const w = ruw.replace(/[\s.-]/g, '').toUpperCase()
  const m = /^NL(\d{9})B(\d{2})$/.exec(w)
  if (!m || m[2] === '00') return null
  return elfproef(m[1]) || mod97(m[1], m[2]) ? w : null
}

/** Postcode: 1234 AB (ook 1234ab in de invoer). */
export function normaliseerPostcode(ruw: string): string | null {
  const m = /^([1-9]\d{3})\s?([a-zA-Z]{2})$/.exec(ruw.trim())
  return m ? `${m[1]} ${m[2].toUpperCase()}` : null
}

export function isEmail(ruw: string): boolean {
  return ruw.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ruw)
}

export function isTelefoon(ruw: string): boolean {
  return ruw.length <= 40 && /^[+\d\s().-]+$/.test(ruw) && normaliseerTelefoon(ruw) !== null
}

/** Een https-adres; zonder schema zetten we er https:// voor. http:// weigeren we. */
function leesUrl(ruw: string): URL | null {
  const w = ruw.trim()
  if (w.length > 300 || /\s/.test(w)) return null
  const metSchema = /^[a-z][a-z0-9+.-]*:/i.test(w) ? w : `https://${w}`
  let url: URL
  try {
    url = new URL(metSchema)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
  if (!url.hostname.includes('.')) return null
  return url
}

/** Website: elk https-adres met een domeinnaam. */
export function normaliseerWebsite(ruw: string): string | null {
  return leesUrl(ruw)?.toString() ?? null
}

/** Social link: alleen https en alleen het domein van dat netwerk (of een subdomein ervan). */
export function normaliseerSocial(social: Social, ruw: string): string | null {
  const url = leesUrl(ruw)
  if (!url) return null
  const domein = SOCIAL_DOMEIN[social]
  const host = url.hostname.toLowerCase()
  if (host !== domein && !host.endsWith(`.${domein}`)) return null
  if (url.pathname === '/' || url.pathname === '') return null
  return url.toString()
}

/**
 * Een tekst voor leden: regeleinden gelijk (\n), geen stuurtekens, geen
 * spaties aan het eind van regels, hooguit een lege regel achter elkaar.
 */
export function normaliseerTekst(ruw: string): string {
  return ruw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    .split('\n')
    .map((r) => r.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function isTekstTeLang(tekst: string): boolean {
  return tekst.length > MAX_TEKST
}
