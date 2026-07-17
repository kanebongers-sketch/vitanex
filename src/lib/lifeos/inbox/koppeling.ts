// ─── LifeOS — de Gmail-koppeling (tokens) ───────────────────────────────────
// SERVER-ONLY. Leest en schrijft `koppelingen` met de service-role: tokens horen
// nooit langs de browser, ook niet via RLS.
//
// ─── OVER DE OVERLAP MET agenda/koppeling.ts ────────────────────────────────
// Het echte werk — de tokenvernieuwing zelf (`vernieuwToken`) en het inwisselen
// van de autorisatiecode (`wisselCodeIn`) — komt uit `agenda/google.ts` en wordt
// hier NIET nagebouwd. Dat is het deel dat je niet wilt dupliceren: daar zitten
// de `invalid_grant`-afhandeling, de timeouts en de narrowing in.
//
// Wat wél op agenda/koppeling.ts lijkt, is de orkestratie eromheen (rij lezen →
// verlopen? → verversen → wegschrijven). Die staat daar hardgecodeerd op
// `google_calendar` (`.eq('dienst', GOOGLE_CALENDAR)`), dus hij is niet aan te
// roepen voor Gmail zonder die map te wijzigen — en die map is niet van deze
// functie.
//
// Daarom is deze versie generiek over `dienst`. Dat is met opzet: hiermee is de
// samenvoeging triviaal. Wie dit opruimt, verplaatst dit bestand naar
// `src/lib/auth/koppelingen.ts`, laat `agenda/koppeling.ts` 'm aanroepen met
// `'google_calendar'`, en gooit de kopie daar weg. Dat raakt agenda/*, dus het
// is werk voor de hoofdsessie — niet iets om hier stilletjes te doen.

import type { SupabaseClient } from '@supabase/supabase-js'
import { vernieuwToken, type TokenSet } from '@/lib/lifeos/agenda/google'
import type { Dienst } from '@/lib/lifeos/auth/oauth-state'
import { gmailConfig } from './gmail'
import { GMAIL } from './inbox'

/** Verversen vlak vóór het verloopt: een token dat "nog 5 seconden" geldig is, is dood. */
const VERVERS_MARGE_MS = 2 * 60_000

/**
 * Draagt het user-id van `/api/lifeos/inbox/koppel` naar `/api/lifeos/inbox/callback`.
 *
 * Waarom een cookie: Google stuurt de browser naar de callback met een gewone
 * top-level GET, zonder Authorization-header. De CSRF-bescherming zit in de
 * HMAC-state (die alleen onze server kan maken); dit cookie zegt alleen aan
 * wélke gebruiker we de tokens hangen. HttpOnly, want de browser hoeft er niet bij.
 *
 * Eigen naam en eigen pad naast het agenda-cookie: twee koppelingen mogen elkaar
 * niet overschrijven als je ze vlak na elkaar start.
 *
 * SameSite=Lax is vereist: bij `Strict` stuurt de browser het cookie niet mee op
 * een navigatie die bij Google begint, en dan is de koppeling stuk.
 */
export const KOPPEL_COOKIE = 'lifeos_inbox_koppel'
export const KOPPEL_COOKIE_SECONDEN = 600
export const KOPPEL_COOKIE_PAD = '/api/lifeos/inbox'

export type TokenResultaat =
  | { staat: 'ok'; toegangstoken: string }
  | { staat: 'niet_gekoppeld' }
  | { staat: 'fout'; reden: string }

export type KoppelingStaat =
  | { staat: 'gekoppeld' }
  | { staat: 'niet_gekoppeld' }
  | { staat: 'fout'; reden: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

export type BereikUitkomst =
  | { staat: 'ok'; bereik: string[] }
  | { staat: 'niet_gekoppeld' }
  | { staat: 'fout'; reden: string }

/**
 * Het bereik dat Google bij deze koppeling gaf.
 *
 * Dit veld werd al sinds het begin geschreven (`bewaarKoppeling`) en nooit
 * teruggelezen. Sinds de scope van `gmail.readonly` naar `gmail.modify` ging is
 * dat het verschil tussen "koppel opnieuw voor schrijfrecht" en een kale
 * Google-403 waar niemand iets aan heeft. Zie `bereik.ts`.
 *
 * Een lege array is een geldig antwoord en betekent "we weten het niet" — geen
 * "geen rechten". Die twee uit elkaar houden is het hele punt; `beoordeelBereik`
 * doet dat.
 */
export async function leesBereik(
  admin: SupabaseClient,
  userId: string,
  dienst: Dienst = GMAIL,
): Promise<BereikUitkomst> {
  const { data, error } = await admin
    .from('koppelingen')
    .select('bereik')
    .eq('user_id', userId)
    .eq('dienst', dienst)
    .maybeSingle()

  if (error) return { staat: 'fout', reden: 'db' }

  const rij: unknown = data
  if (!isObject(rij)) return { staat: 'niet_gekoppeld' }

  // Systeemgrens: `bereik` is een text[]-kolom, maar we casten niet. Een rij met
  // rommel levert een lege lijst — dus 'onbekend', niet een verzonnen scope.
  const ruw = rij.bereik
  const bereik = Array.isArray(ruw) ? ruw.filter((s): s is string => typeof s === 'string') : []

  return { staat: 'ok', bereik }
}

/** Is deze dienst gekoppeld? Leest alleen; ververst niets. */
export async function koppelingStaat(
  admin: SupabaseClient,
  userId: string,
  dienst: Dienst = GMAIL,
): Promise<KoppelingStaat> {
  const { data, error } = await admin
    .from('koppelingen')
    .select('user_id')
    .eq('user_id', userId)
    .eq('dienst', dienst)
    .maybeSingle()

  if (error) return { staat: 'fout', reden: 'db' }
  return data ? { staat: 'gekoppeld' } : { staat: 'niet_gekoppeld' }
}

/**
 * Bewaart de tokens na een geslaagde koppeling.
 *
 * Het verversingstoken geeft Google ALLEEN bij de eerste toestemming (vandaar
 * `prompt=consent`). Krijgen we 'm niet, dan houden we de bestaande — 'm
 * overschrijven met null zou de koppeling na een uur stilletjes dood maken, en
 * dat merk je pas als je 'm nodig hebt.
 */
export async function bewaarKoppeling(
  admin: SupabaseClient,
  userId: string,
  tokens: TokenSet,
  dienst: Dienst = GMAIL,
): Promise<{ ok: true } | { ok: false; reden: string }> {
  const { data, error: leesFout } = await admin
    .from('koppelingen')
    .select('verversingstoken')
    .eq('user_id', userId)
    .eq('dienst', dienst)
    .maybeSingle()

  if (leesFout) return { ok: false, reden: 'db' }

  const bestaand: unknown = data
  const verversingstoken =
    tokens.verversingstoken ?? (isObject(bestaand) ? tekst(bestaand.verversingstoken) : null)

  if (!verversingstoken) {
    // Zonder refresh-token is de koppeling een uur houdbaar. Dan liever nu hard
    // falen dan morgen een lege triage tonen.
    return { ok: false, reden: 'geen_verversingstoken' }
  }

  const { error } = await admin.from('koppelingen').upsert(
    {
      user_id: userId,
      dienst,
      toegangstoken: tokens.toegangstoken,
      verversingstoken,
      verloopt_op: tokens.verlooptOp.toISOString(),
      bereik: tokens.bereik,
    },
    { onConflict: 'user_id,dienst' },
  )

  if (error) return { ok: false, reden: 'db' }
  return { ok: true }
}

/**
 * Een bruikbaar toegangstoken: uit de database, of net ververst.
 *
 * `invalid_grant` van Google betekent dat de toestemming is ingetrokken (of het
 * refresh-token is verlopen). Dat is dan écht "niet gekoppeld" — de enige weg
 * terug is opnieuw koppelen. Elke andere fout blijft een fout.
 *
 * ⚠️  Dit gebeurt bij Gmail vaker dan je verwacht. Staat de OAuth-consent-schermstatus
 *     op "Testing", dan geeft Google een refresh-token dat na 7 DAGEN verloopt, en
 *     een wachtwoordwijziging trekt Gmail-tokens sowieso in. `niet_gekoppeld` is
 *     hier dus een normale uitkomst, geen randgeval. Zie .env.example.
 */
export async function geldigToken(
  admin: SupabaseClient,
  userId: string,
  dienst: Dienst = GMAIL,
): Promise<TokenResultaat> {
  const rij = await leesTokenRij(admin, userId, dienst)
  if (rij.staat !== 'ok') return rij

  if (rij.geldig && rij.toegangstoken) return { staat: 'ok', toegangstoken: rij.toegangstoken }
  if (!rij.verversingstoken) return { staat: 'niet_gekoppeld' }

  return vernieuwEnBewaar(admin, userId, dienst, rij.verversingstoken)
}

/**
 * Ververs NU, ongeacht wat de administratie zegt over de houdbaarheid.
 *
 * Voor het geval dat `geldigToken` per definitie niet kan dekken: het token was
 * volgens ons nog 40 minuten geldig, en Gmail zegt tóch 401. Dat gebeurt echt —
 * een wachtwoordwijziging, een ingetrokken app-toestemming, of een
 * consent-scherm in "Testing" (dan verloopt het refresh-token na 7 dagen).
 *
 * Zonder deze functie is het antwoord op zo'n 401 "koppel opnieuw", terwijl één
 * refresh het had opgelost. De aanroeper gebruikt 'm dus als tweede kans: 401 →
 * forceer → nog één poging. Zie `inbox/vandaag/route.ts` en `gmail-acties.ts`.
 *
 * De discipline uit `google.ts` blijft overeind: alleen `invalid_grant` (echt
 * ingetrokken) wordt `niet_gekoppeld`. Een netwerkfout is en blijft `fout` — die
 * mag NOOIT als "niet gekoppeld" eindigen, anders stuurt een hik bij Google je
 * naar het koppelscherm.
 */
export async function forceerVernieuwing(
  admin: SupabaseClient,
  userId: string,
  dienst: Dienst = GMAIL,
): Promise<TokenResultaat> {
  const rij = await leesTokenRij(admin, userId, dienst)
  if (rij.staat !== 'ok') return rij
  if (!rij.verversingstoken) return { staat: 'niet_gekoppeld' }

  return vernieuwEnBewaar(admin, userId, dienst, rij.verversingstoken)
}

type TokenRij =
  | {
      staat: 'ok'
      toegangstoken: string | null
      verversingstoken: string | null
      /** Is het huidige token nog ruim genoeg geldig om te gebruiken? */
      geldig: boolean
    }
  | { staat: 'niet_gekoppeld' }
  | { staat: 'fout'; reden: string }

/** De rij + het oordeel over de houdbaarheid. Eén plek, twee aanroepers. */
async function leesTokenRij(
  admin: SupabaseClient,
  userId: string,
  dienst: Dienst,
): Promise<TokenRij> {
  const { data, error } = await admin
    .from('koppelingen')
    .select('toegangstoken, verversingstoken, verloopt_op')
    .eq('user_id', userId)
    .eq('dienst', dienst)
    .maybeSingle()

  if (error) return { staat: 'fout', reden: 'db' }

  const rij: unknown = data
  if (!isObject(rij)) return { staat: 'niet_gekoppeld' }

  const toegangstoken = tekst(rij.toegangstoken)
  const verlooptOpTekst = tekst(rij.verloopt_op)
  const verlooptOp = verlooptOpTekst ? new Date(verlooptOpTekst) : null

  return {
    staat: 'ok',
    toegangstoken,
    verversingstoken: tekst(rij.verversingstoken),
    geldig:
      toegangstoken !== null &&
      verlooptOp !== null &&
      !Number.isNaN(verlooptOp.getTime()) &&
      verlooptOp.getTime() - Date.now() > VERVERS_MARGE_MS,
  }
}

/**
 * Wisselt het verversingstoken in en schrijft het resultaat weg.
 *
 * Hier zit de reden dat dit bestand geen eigen tokenvernieuwing heeft: dit is
 * dezelfde provider, dus dezelfde functie (`vernieuwToken` uit agenda/google.ts).
 * De refresh-call gebruikt de redirect-URI niet, dus de Gmail-config werkt hier
 * net zo goed.
 */
async function vernieuwEnBewaar(
  admin: SupabaseClient,
  userId: string,
  dienst: Dienst,
  verversingstoken: string,
): Promise<TokenResultaat> {
  const config = gmailConfig()
  if (!config) return { staat: 'fout', reden: 'niet_ingericht' }

  const uitkomst = await vernieuwToken(config, verversingstoken)
  if (uitkomst.staat === 'ingetrokken') return { staat: 'niet_gekoppeld' }
  if (uitkomst.staat === 'fout') return { staat: 'fout', reden: uitkomst.reden }

  const { error: schrijfFout } = await admin
    .from('koppelingen')
    .update({
      toegangstoken: uitkomst.tokens.toegangstoken,
      verloopt_op: uitkomst.tokens.verlooptOp.toISOString(),
      // Bereik alleen bijwerken als Google het meestuurt; bij een refresh doet
      // hij dat niet altijd, en dan is een lege array een leugen.
      ...(uitkomst.tokens.bereik.length > 0 ? { bereik: uitkomst.tokens.bereik } : {}),
    })
    .eq('user_id', userId)
    .eq('dienst', dienst)

  // Het token werkt, maar we konden het niet bewaren: bruikbaar antwoord geven
  // en het volgende verzoek ververst gewoon opnieuw.
  if (schrijfFout) return { staat: 'ok', toegangstoken: uitkomst.tokens.toegangstoken }

  return { staat: 'ok', toegangstoken: uitkomst.tokens.toegangstoken }
}
