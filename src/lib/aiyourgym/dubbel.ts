// ─── AI Your Gym: een e-mailadres kan maar een eigenaar-account worden (SERVER-ONLY) ─
// Inloggen gaat op e-mailadres, dus een adres dat al een account heeft (eigenaar
// of medewerker met wachtwoord bij een sportschool, of het master account) of
// al bij een lopende aanmelding hoort, mag geen tweede sportschool openen.
//
// AVG: de melding verraadt niet OF er een account is. Dezelfde neutrale zin
// geldt voor alle gevallen, en de rem op /api/aiyourgym/checkout (per IP, per
// e-mailadres en in totaal) houdt het uitproberen van adressen tegen.
//
// Twee betalingen met hetzelfde adres tegelijk: de unieke index
// club_beheerders_email_wachtwoord (migratie 455) laat maar een eigenaar toe.
// De tweede inrichting wordt een aanvraag voor Kane (verwerkSessie), nooit een
// tweede sportschool en nooit een overschreven account.

import type { SupabaseClient } from '@supabase/supabase-js'
import { vindBeheerderOpEmail } from '@/lib/club/beheerders/beheerder-opslag'
import { vindPlatformOpEmail } from '@/lib/club/platform-login/opslag'

/** De neutrale melding bij het veld e-mailadres (NL; Engels in woorden/website/meldingen.ts). */
export const EMAIL_NIET_BRUIKBAAR = 'Met dit e-mailadres kun je je hier niet aanmelden. Log in als je al een account hebt, of gebruik een ander e-mailadres.'

/** Statussen waarin een aanmelding een sportschool heeft of krijgt. */
export const AANMELDING_BEZET = ['inrichten', 'actief', 'betaling_mislukt', 'gepauzeerd'] as const

/** Heeft dit adres al een account om mee in te loggen (beheerder met wachtwoord of master account)? */
export async function emailHeeftAccount(admin: SupabaseClient, email: string): Promise<boolean> {
  const [beheerder, platform] = await Promise.all([vindBeheerderOpEmail(admin, email), vindPlatformOpEmail(admin, email)])
  return beheerder !== null || platform !== null
}

/** Hoort dit adres al bij een aanmelding die een sportschool heeft of krijgt? Null bij een databasefout. */
export async function emailInAanmelding(admin: SupabaseClient, email: string): Promise<boolean | null> {
  const { data, error } = await admin.from('ayg_aanmeldingen').select('id').eq('eigenaar_email', email.trim().toLowerCase()).in('status', [...AANMELDING_BEZET]).limit(1)
  if (error) {
    console.error('[aiyourgym] aanmeldingen op e-mail lezen mislukt', error.code ?? '')
    return null
  }
  return (data ?? []).length > 0
}

/** Mag dit adres een nieuwe sportschool openen? Null bij een databasefout (dan niet doorgaan). */
export async function emailVrijVoorAanmelding(admin: SupabaseClient, email: string): Promise<boolean | null> {
  const [account, aanmelding] = await Promise.all([emailHeeftAccount(admin, email), emailInAanmelding(admin, email)])
  if (aanmelding === null) return null
  return !account && !aanmelding
}
