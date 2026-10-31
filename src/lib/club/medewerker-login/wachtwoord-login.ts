// ─── Club: een medewerker logt in met e-mailadres en wachtwoord (SERVER-ONLY) ─
// Het tweede deel van POST /api/club/inloggen: de route zoekt eerst een
// beheerder (eigenaar, clubmanager) met dit adres; is die er niet, dan komt
// het verzoek hier. Een onbekend adres, een andere sportschool op dit
// subdomein en een fout wachtwoord krijgen hetzelfde antwoord en ongeveer
// dezelfde rekentijd, zodat niemand kan uitzoeken wie een account heeft.

import type { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { hashWachtwoord, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'
import { logInMedewerkerMetWachtwoord, vindMedewerkerOpEmail } from './opslag'
import { zetClubSessie } from '@/lib/club/kern/sessie-cookie'

export const INLOG_FOUT = 'E-mailadres of wachtwoord klopt niet.'

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

/** Voor een onbekend adres: evenveel rekenwerk als een echte controle (een keer gemaakt, bij het eerste gebruik). */
let schijn: string | null = null
async function schijnControle(wachtwoord: string): Promise<void> {
  schijn ??= await hashWachtwoord('schijn-wachtwoord-voor-gelijke-tijd')
  await wachtwoordKlopt(wachtwoord, schijn)
}

/** De route heeft al gecontroleerd: schakelaar, oorsprong, rem per IP en de lengte van het wachtwoord. */
export async function logInAlsMedewerker(admin: SupabaseClient, email: unknown, wachtwoord: string, nu: Date = new Date()): Promise<NextResponse> {
  const gevonden = await vindMedewerkerOpEmail(admin, email)
  const { organisatie } = gevonden ? await haalEigenOrganisatie(admin, gevonden.toegang.userId) : { organisatie: null }
  if (!gevonden || !organisatie || !(await hostPastBij(organisatie))) {
    await schijnControle(wachtwoord)
    return clubFout(INLOG_FOUT, 401)
  }

  const uit = await logInMedewerkerMetWachtwoord(admin, gevonden, wachtwoord, nu)
  switch (uit.staat) {
    case 'ok': {
      return zetClubSessie(clubJson({ staat: 'ok' }), 'medewerker', uit.token, uit.verlooptOp)
    }
    case 'fout':
    case 'niet_actief':
      return clubFout(INLOG_FOUT, 401)
    case 'geblokkeerd':
      return clubFout(`Te vaak een fout wachtwoord. Probeer het na ${TIJD.format(new Date(uit.totOp))} opnieuw.`, 429)
    case 'gesloten':
      return clubFout('Te vaak een fout wachtwoord: dit account is dicht. Vraag je leidinggevende om een nieuwe uitnodiging.', 429)
    default:
      return clubFout('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}
