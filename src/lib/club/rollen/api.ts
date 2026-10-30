// ─── Club, rollen v2: de API-poort (PUUR) ───────────────────────────────────
// Met het rollenmodel v2 vraagt elke API van Club een niveau: lezen (GET, HEAD)
// minstens zien, wijzigen minstens bewerken. Het onderdeel van een pad komt uit
// apiOnderdeel (beheerders/rechten.ts), met een paar fijnere sleutels van v2.

import { apiOnderdeel } from '@/lib/club/beheerders/rechten'
import { minstens, type Niveau } from './typen'

/** De sleutel van v2 voor een API-pad, of null (onbekend: dicht). */
export function apiSleutelV2(pad: string): string | null {
  const delen = pad.split('?')[0].split('/').filter(Boolean)
  if (delen[0] !== 'api' || delen[1] !== 'club') return null
  const map = delen[2] ?? ''
  if (map === 'team') return 'team'
  if (map === 'medewerker-toegang') return 'team'
  if (map === 'beheerders') return 'rollen'
  if (map === 'privacy' || map === 'widget') return map
  if (map === 'start') return 'start'
  // Het adres (slug) van de sportschool: naam en adres zijn van de eigenaar.
  if (map === 'organisatie' && delen[3] === 'adres') return 'huisstijl'
  if (map === 'betalen' && delen[3] !== 'plannen' && delen[3] !== 'kortingen') return 'financien'
  // Uren goedkeuren, verwerken en exporteren: de sleutel uren.
  if (map === 'personeel' && (delen[3] === 'uren' || (delen[3] === 'diensten' && delen[5] === 'uren'))) return 'uren'
  return apiOnderdeel(pad)
}

/** Mag dit verzoek met deze niveaus? */
export function magApiV2(niveaus: Readonly<Record<string, Niveau>>, pad: string, methode: string): boolean {
  const schoon = pad.split('?')[0]
  // Het logo ophalen mag iedereen die binnen is (de balk toont het op elke pagina).
  if (methode === 'GET' && schoon === '/api/club/organisatie/logo') return true
  const sleutel = apiSleutelV2(schoon)
  if (sleutel === null) return false
  if (sleutel === 'hulp') return true
  const leest = methode === 'GET' || methode === 'HEAD'
  return minstens(niveaus[sleutel] ?? 'geen', leest ? 'zien' : 'bewerken')
}
