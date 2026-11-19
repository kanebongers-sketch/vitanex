// ─── Club, ledenkaart: contactgegevens wijzigen (SERVER-ONLY) ───────────────
// Wat de PATCH van een lid nodig heeft om een e-mailadres veilig te wijzigen:
// dezelfde regel als bij Lid toevoegen (een adres hoort bij een lid per
// sportschool) en het inlogadres van de ledenapp. Dat inlogadres
// (club_lid_toegang.email, door het lid zelf gekozen) verandert hier niet mee.
// Wat dat waard is, hangt af van de mails: een link of code voor de ledenapp
// gaat voor een lid met login alleen naar het inlogadres (meldingen/versturen.ts,
// adresVoorMail) en het aanvraagformulier vindt zo'n lid alleen op dat adres
// (app-uitnodigen/opslag.ts, planAanvraag). Een gewijzigd contactadres geeft
// dus geen link naar het account van een lid met login. Wie Leden mag bewerken,
// kan wel via de ledenkaart een nieuwe link maken (maakLidLink); dat is een
// bewuste handeling van de sportschool en staat los van dit contactadres.
// Elke query filtert op de sportschool.

import type { SupabaseClient } from '@supabase/supabase-js'
import { zoekZelfdeAdres } from '@/lib/club/nieuwe-leden/toevoegen-opslag'
import { inlogAdresVanLid } from '@/lib/club/ledenlogin/opslag'
import type { ContactVeld, ContactWijziging } from './invoer'

export type EmailOordeel =
  /** Het adres mag; loginBlijft = het lid logt in de ledenapp in met een ander adres, dat blijft zo. */
  | { staat: 'ok'; loginBlijft: boolean }
  | { staat: 'dubbel' }
  | { staat: 'db' }

/**
 * Mag dit lid dit nieuwe contactadres krijgen? Alleen aanroepen als het adres
 * echt verandert. `nieuw` is al genormaliseerd (kleine letters) of null (leeg).
 */
export async function beoordeelEmail(admin: SupabaseClient, userId: string, lidId: string, nieuw: string | null): Promise<EmailOordeel> {
  if (nieuw !== null) {
    const ander = await zoekZelfdeAdres(admin, userId, nieuw)
    if (ander === undefined) return { staat: 'db' }
    if (ander && ander.id !== lidId) return { staat: 'dubbel' }
  }
  const inlog = await inlogAdresVanLid(admin, userId, lidId)
  if (inlog === undefined) return { staat: 'db' }
  return { staat: 'ok', loginBlijft: inlog !== null && inlog !== nieuw }
}

const VELD_IN_LOG: Record<ContactVeld, string> = {
  voornaam: 'voornaam',
  achternaam: 'achternaam',
  email: 'e-mail',
  telefoon: 'telefoon',
  geboortedatum: 'geboortedatum',
}

/** De regel voor het logboek: alleen welke velden, nooit de oude of nieuwe waarde (AVG). */
export function contactInLog(contact: ContactWijziging): string | null {
  const velden = (Object.keys(VELD_IN_LOG) as ContactVeld[]).filter((v) => contact[v] !== undefined)
  return velden.length > 0 ? `gegevens gewijzigd (${velden.map((v) => VELD_IN_LOG[v]).join(', ')})` : null
}
