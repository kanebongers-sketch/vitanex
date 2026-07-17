// ─── LifeOS — de dagbriefing in de database ─────────────────────────────────
// SERVER-ONLY. `briefing.ts` stelt de tekst samen (puur); dit bestand onthoudt
// wat er verstuurd is. Twee bestanden, want de samenstelling moet testbaar zijn
// zonder database en de administratie moet echt zijn.
//
// ─── HET SLOT ───────────────────────────────────────────────────────────────
//
//   Een cron draait niet één keer. Hij wordt overgedaan na een timeout, hij wordt
//   handmatig getriggerd, en een platform kan hem dubbel vuren. Krijgt Kane zijn
//   briefing twee keer, dan leert hij het bericht wegkijken — en dan is de hele
//   proactieve laag stuk. Eén keer is het punt.
//
//   Het slot is de INSERT zelf (unieke index `vita_briefingen_uniek`, migratie
//   120), niet een `select` vooraf. "Kijken of hij er al is en dan schrijven" is
//   precies waar de race in zit: twee runs die tegelijk kijken zien allebei niets.
//   Wie de rij weet te inserten, mag sturen. De rest krijgt 23505 en zwijgt.
//
//   Volgorde: claim → stuur → markeer. Nooit stuur → claim: valt het proces
//   tussen die twee om, dan stuurt de volgende run hem opnieuw.

import type { SupabaseClient } from '@supabase/supabase-js'

/** Het enige kanaal dat de briefing nu kent. Spiegelt de check-constraint in 120. */
export type BriefingKanaal = 'telegram'

/** Postgres: unieke index geschonden — hier: iemand was ons voor. */
const UNIEK_GESCHONDEN = '23505'

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

function foutTekst(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const melding = (error as { message: unknown }).message
    if (typeof melding === 'string') return melding
  }
  return 'Onbekende databasefout'
}

/**
 * De uitkomst van een claim. Drie staten, en ze betekenen echt iets anders:
 *
 *   geclaimd  → jij mag sturen, en jij bent verantwoordelijk voor het afronden.
 *   bezet     → een andere run was er al. Niets doen. Dit is GEEN fout.
 *   fout      → we weten niet óf er al een briefing uit is. Dan niet sturen:
 *               liever een gemiste briefing dan een dubbele.
 */
export type Claim =
  | { soort: 'geclaimd'; id: string }
  | { soort: 'bezet' }
  | { soort: 'fout'; melding: string }

/**
 * Claimt de briefing van één dag op één kanaal.
 *
 * Een `bezet` is nadrukkelijk geen fout: het is het slot dat zijn werk doet. Zou
 * dit als fout terugkomen, dan zou een tweede cron-run per dag een rood alarm
 * geven voor precies het gedrag dat we wilden.
 */
export async function claimBriefing(
  admin: SupabaseClient,
  userId: string,
  datum: string,
  kanaal: BriefingKanaal,
): Promise<Claim> {
  try {
    const { data, error } = await admin
      .from('vita_briefingen')
      .insert({ user_id: userId, datum, kanaal })
      .select('id')
      .single()

    if (error) {
      if (foutCode(error) === UNIEK_GESCHONDEN) return { soort: 'bezet' }
      return { soort: 'fout', melding: foutTekst(error) }
    }

    const id = typeof data?.id === 'string' ? data.id : null
    if (id === null) return { soort: 'fout', melding: 'Claim gaf geen id terug.' }
    return { soort: 'geclaimd', id }
  } catch (fout) {
    // Netwerkfout, timeout, DNS. Expliciet een fout — nooit stil als "bezet"
    // wegzetten: dan zwijgt Vita een dag omdat het netwerk hikte.
    return { soort: 'fout', melding: fout instanceof Error ? fout.message : 'Onbekende fout' }
  }
}

/**
 * Rondt de claim af: bezorgd, met de letterlijke tekst erbij.
 *
 * Faalt dit ná een geslaagde verzending, dan staat er een claim zonder
 * `bezorgd_op` terwijl Kane het bericht wél heeft. Dat is de veilige kant van de
 * fout: de volgende run ziet de claim staan en stuurt niet opnieuw.
 */
export async function markeerBezorgd(
  admin: SupabaseClient,
  id: string,
  inhoud: string,
  nu: Date,
): Promise<{ ok: boolean; melding?: string }> {
  const { error } = await admin
    .from('vita_briefingen')
    .update({ bezorgd_op: nu.toISOString(), inhoud })
    .eq('id', id)

  if (error) return { ok: false, melding: foutTekst(error) }
  return { ok: true }
}

/**
 * Geeft een claim terug die niet verstuurd kon worden, zodat een retry wél kan.
 *
 * ─── DE EERLIJKE PRIJS ────────────────────────────────────────────────────
 *   Hiermee gaat het slot voor die dag weer open. Dat is bewust: een mislukte
 *   verzending mag de briefing niet permanent blokkeren — dan zwijgt Vita de hele
 *   dag omdat Telegram één keer een 500 gaf.
 *
 *   Het risico dat daar tegenover staat is echt en klein: faalde het versturen
 *   pas nádat Telegram het bericht al had aangenomen, dan kan de retry een
 *   tweede bericht opleveren. Een zeldzame dubbele briefing is te verkiezen boven
 *   een stille dag — maar noem het geen exactly-once, want dat is het niet.
 *
 * `.is('bezorgd_op', null)` is de veiligheidspal: een claim die wél bezorgd is,
 * kan hiermee nooit verdwijnen.
 */
export async function geefClaimTerug(admin: SupabaseClient, id: string): Promise<void> {
  await admin.from('vita_briefingen').delete().eq('id', id).is('bezorgd_op', null)
}

/**
 * Wanneer stuurde Vita voor het laatst écht een briefing? `null` = nog nooit.
 *
 * Dit is het bewijs achter de belofte op de Vita-kaart. De kaart mag pas zeggen
 * dat hij je aantikt als dat aantoonbaar gebeurd is — niet omdat er ergens een
 * cron-route in de codebase staat. Code die bestaat is niet hetzelfde als een cron
 * die draait, en het verschil tussen die twee is precies een valse belofte.
 *
 * Geeft `undefined` bij een fout: dat is niet "nog nooit". Die twee mogen nooit
 * op één hoop — anders vertelt een kapotte query de gebruiker dat zijn briefing
 * niet loopt.
 */
export async function laatstBezorgdOp(
  admin: SupabaseClient,
  userId: string,
  kanaal: BriefingKanaal,
): Promise<string | null | undefined> {
  try {
    const { data, error } = await admin
      .from('vita_briefingen')
      .select('bezorgd_op')
      .eq('user_id', userId)
      .eq('kanaal', kanaal)
      .not('bezorgd_op', 'is', null)
      .order('bezorgd_op', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return undefined
    const op = data?.bezorgd_op
    return typeof op === 'string' ? op : null
  } catch {
    return undefined
  }
}
