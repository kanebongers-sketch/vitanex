// ─── LifeOS — opslag van wearable-koppelingen ──────────────────────────────
// Tokens zijn sleutels tot je gezondheidsdata. Ze staan in `koppelingen` en
// worden UITSLUITEND via de service-role gelezen — nooit vanuit de client, ook
// niet "even" met de anon-key en een RLS-policy erop. Een token dat de browser
// bereikt, staat in de devtools van iedereen die je scherm deelt.
//
// Alleen server-side.
//
// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database en nooit
// met de B2B-database van MentaForce.

import type { SupabaseClient } from '@supabase/supabase-js'
import { dienstConfig, isKoppelbareDienst, type KoppelbareDienst } from './diensten'
import { KoppelFout, ververs, type TokenAntwoord } from './oauth'
import { isObject, lijst, tekst } from './narrow'

export interface Koppeling {
  dienst: KoppelbareDienst
  toegangstoken: string
  verversingstoken: string | null
  /** ISO-tijdstip, of null als de dienst geen vervaltijd gaf. */
  verlooptOp: string | null
  bereik: string[]
}

/** Marge vóór het echte verlopen. Een token dat over 10s verloopt is nu al dood. */
const VERVAL_MARGE_MS = 60_000

/** Sla een verse koppeling op (of werk 'm bij). Idempotent op (user_id, dienst). */
export async function bewaarKoppeling(
  admin: SupabaseClient,
  userId: string,
  dienst: KoppelbareDienst,
  token: TokenAntwoord,
): Promise<void> {
  const { error } = await admin.from('koppelingen').upsert(
    {
      user_id: userId,
      dienst,
      toegangstoken: token.toegangstoken,
      verversingstoken: token.verversingstoken,
      verloopt_op: token.verlooptOp,
      bereik: token.bereik,
    },
    { onConflict: 'user_id,dienst' },
  )

  if (error) throw new KoppelFout(dienst, 'de koppeling kon niet worden opgeslagen')
}

/** Alle koppelbare diensten die deze gebruiker daadwerkelijk gekoppeld heeft. */
export async function leesKoppelingen(
  admin: SupabaseClient,
  userId: string,
): Promise<Koppeling[]> {
  const { data, error } = await admin
    .from('koppelingen')
    .select('dienst, toegangstoken, verversingstoken, verloopt_op, bereik')
    .eq('user_id', userId)

  if (error) throw new Error('koppelingen konden niet worden gelezen')

  const rijen: unknown = data
  return lijst(rijen)
    .map((rij) => leesKoppelingRij(rij))
    .filter((k): k is Koppeling => k !== null)
}

/**
 * Narrow één DB-rij. De DB is óók een systeemgrens: `koppelingen` wordt door
 * een andere module beheerd, en supabase-js geeft ons hier ongetypeerde data.
 * Een rij met een onbekende dienst (bv. een half gebouwde garmin-koppeling)
 * negeren we stil — die kan deze module per definitie niet gebruiken.
 */
function leesKoppelingRij(rij: unknown): Koppeling | null {
  if (!isObject(rij)) return null

  const dienst = rij.dienst
  if (!isKoppelbareDienst(dienst)) return null

  const toegangstoken = tekst(rij.toegangstoken)
  if (toegangstoken === null) return null

  return {
    dienst,
    toegangstoken,
    verversingstoken: tekst(rij.verversingstoken),
    verlooptOp: tekst(rij.verloopt_op),
    bereik: lijst(rij.bereik)
      .map((b) => tekst(b))
      .filter((b): b is string => b !== null),
  }
}

/**
 * Een gegarandeerd bruikbaar toegangstoken: ververst het als het (bijna)
 * verlopen is, en slaat het nieuwe meteen op.
 *
 * Let op de token-rotatie: WHOOP geeft bij elke refresh een NIEUW
 * verversingstoken en maakt het oude ongeldig. Sla je dat niet op, dan werkt de
 * koppeling precies één keer en is hij daarna stuk. Geeft de dienst géén nieuw
 * verversingstoken, dan houden we het oude — dat overschrijven met `null` zou
 * de koppeling net zo hard slopen.
 */
export async function geldigToegangstoken(
  admin: SupabaseClient,
  userId: string,
  koppeling: Koppeling,
): Promise<string> {
  if (!isVerlopen(koppeling.verlooptOp)) return koppeling.toegangstoken

  if (koppeling.verversingstoken === null) {
    throw new KoppelFout(
      koppeling.dienst,
      'de koppeling is verlopen en er is geen verversingstoken — opnieuw koppelen',
    )
  }

  const config = dienstConfig(koppeling.dienst)
  if (config === null) {
    throw new KoppelFout(koppeling.dienst, 'deze koppeling is niet geconfigureerd')
  }

  const vers = await ververs(config, koppeling.verversingstoken)

  await bewaarKoppeling(admin, userId, koppeling.dienst, {
    ...vers,
    verversingstoken: vers.verversingstoken ?? koppeling.verversingstoken,
  })

  return vers.toegangstoken
}

/** Puur: is dit token (bijna) verlopen? Onbekende vervaltijd = niet verlopen. */
export function isVerlopen(verlooptOp: string | null, nu: number = Date.now()): boolean {
  if (verlooptOp === null) return false
  const t = new Date(verlooptOp).getTime()
  if (Number.isNaN(t)) return false
  return t - VERVAL_MARGE_MS <= nu
}
