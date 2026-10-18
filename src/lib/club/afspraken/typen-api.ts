// ─── Club, afspraken: controle bij het opslaan van een type (SERVER-ONLY) ───
// Een soort afspraak geldt voor de hele sportschool (geen vestigingskolom).
// Wie maar een deel van de sportschool ziet (een ingelogde medewerker) mag het
// type wel aanpassen, maar alleen collega's uit zijn eigen vestigingen aan de
// lijst toevoegen of eraf halen. Collega's van andere vestigingen die er al op
// staan, blijven staan.

import type { ClubToegang } from '@/lib/club/toegang'
import { deeltVestiging, gewijzigdeIds } from '@/lib/club/kern/medewerker-vestigingen'

type Controle = Pick<ClubToegang, 'admin' | 'userId' | 'vestigingen' | 'rol'>

/**
 * Horen alle medewerkers in de lijst bij deze sportschool, en mag deze persoon
 * de gewijzigde (toegevoegde of weggehaalde) medewerkers koppelen? Leeg = ja.
 * `vorige` is de lijst die nu op het type staat (leeg bij een nieuw type).
 */
export async function medewerkersHoren(t: Controle, ids: readonly string[], vorige: readonly string[] = []): Promise<boolean> {
  const gewijzigd = gewijzigdeIds(ids, vorige)
  const opvragen = [...new Set([...ids, ...gewijzigd])]
  if (opvragen.length === 0) return true
  const { data, error } = await t.admin.from('club_medewerkers').select('id, vestigingen').eq('user_id', t.userId).in('id', opvragen)
  if (error) {
    console.error('[club] afspraken: medewerkers controleren mislukt', error.message)
    return false
  }
  const rijen = (data ?? []) as { id: unknown; vestigingen: unknown }[]
  const gevonden = new Map(rijen.map((r) => [String(r.id), Array.isArray(r.vestigingen) ? r.vestigingen.filter((v): v is string => typeof v === 'string') : []]))
  if (!ids.every((id) => gevonden.has(id))) return false
  // Een weggehaalde collega die niet meer bestaat, mag gewoon van de lijst.
  return gewijzigd.every((id) => !gevonden.has(id) || deeltVestiging(t, gevonden.get(id) ?? []))
}
