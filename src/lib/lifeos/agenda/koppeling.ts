// ─── LifeOS — de agenda-koppeling (tokens) ──────────────────────────────────
// SERVER-ONLY. Leest en schrijft `koppelingen` met de service-role: tokens
// horen nooit langs de browser, ook niet via RLS.
//
// De drie uitkomsten zijn hier het hele punt. "Niet gekoppeld" en "er ging iets
// mis" zijn verschillende antwoorden, en een netwerkfout mag nooit als het
// eerste eindigen — anders vertelt LifeOS je dat je agenda niet gekoppeld is
// omdat Google net even traag was.

// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database.
import type { SupabaseClient } from '@supabase/supabase-js'
import { googleConfig, vernieuwToken, type TokenSet } from './google'
import { GOOGLE_CALENDAR } from './agenda'

/** Verversen vlak vóór het verloopt: een token dat "nog 5 seconden" geldig is, is dood. */
const VERVERS_MARGE_MS = 2 * 60_000

/**
 * Draagt het user-id van `/api/lifeos/agenda/koppel` naar `/api/lifeos/agenda/callback`.
 *
 * Waarom een cookie: Google stuurt de browser naar de callback met een gewone
 * top-level GET. Daar zit geen Authorization-header op, dus `getAuthenticatedUser`
 * kan daar niets. De CSRF-bescherming zit in de HMAC-state (die alleen onze
 * server kan maken); dit cookie zegt alleen aan wélke gebruiker we de tokens
 * hangen. HttpOnly, want de browser hoeft er niet bij.
 *
 * SameSite=Lax is hier vereist: bij `Strict` stuurt de browser het cookie niet
 * mee op een navigatie die bij Google begint, en dan is de koppeling stuk.
 */
export const KOPPEL_COOKIE = 'lifeos_agenda_koppel'
export const KOPPEL_COOKIE_SECONDEN = 600

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

/**
 * Puur: de gekozen `kalender_id` uit een `koppelingen`-rij, of null (= primary).
 *
 * `null` is geen fout maar de DEFAULT: een koppeling zonder gekozen agenda (of met
 * een lege kolom) werkt gewoon door op de primaire agenda. Los gehouden van de DB
 * zodat de default-regel zonder Supabase te testen is.
 */
export function kalenderIdUitRij(rij: unknown): string | null {
  return isObject(rij) ? tekst(rij.kalender_id) : null
}

/**
 * De gekozen agenda (kalender_id) voor de google_calendar-koppeling; null = de
 * primaire agenda.
 *
 * Bij een echte DB-fout loggen we luid en vallen terug op null (primary): de keuze
 * lezen mag nooit een lees- of schrijfactie blokkeren, en primary is het veilige,
 * gedocumenteerde standaardgedrag. (Vóór de `kalender_id`-migratie bestaat de kolom
 * nog niet; ook dan degradeert dit netjes naar primary.)
 */
export async function leesGekozenKalender(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from('koppelingen')
    .select('kalender_id')
    .eq('user_id', userId)
    .eq('dienst', GOOGLE_CALENDAR)
    .maybeSingle()

  if (error) {
    console.error('[agenda] kalenderkeuze lezen mislukt, val terug op primary:', error.message)
    return null
  }
  return kalenderIdUitRij(data)
}

/**
 * Zet de gekozen agenda op de bestaande koppeling. Een lege/whitespace keuze
 * normaliseren we defensief naar null (= primary) — de route valideert al op de
 * grens, dit is diepteverdediging.
 */
export async function zetGekozenKalender(
  admin: SupabaseClient,
  userId: string,
  kalenderId: string,
): Promise<{ ok: true } | { ok: false; reden: string }> {
  const schoon = kalenderId.trim()
  const { error } = await admin
    .from('koppelingen')
    .update({ kalender_id: schoon.length > 0 ? schoon : null })
    .eq('user_id', userId)
    .eq('dienst', GOOGLE_CALENDAR)

  if (error) return { ok: false, reden: 'db' }
  return { ok: true }
}

/** Is er een agenda gekoppeld? Leest alleen; ververst niets. */
export async function koppelingStaat(
  admin: SupabaseClient,
  userId: string,
): Promise<KoppelingStaat> {
  const { data, error } = await admin
    .from('koppelingen')
    .select('user_id')
    .eq('user_id', userId)
    .eq('dienst', GOOGLE_CALENDAR)
    .maybeSingle()

  if (error) return { staat: 'fout', reden: 'db' }
  return data ? { staat: 'gekoppeld' } : { staat: 'niet_gekoppeld' }
}

/**
 * Bewaart de tokens na een geslaagde koppeling.
 *
 * Let op het verversingstoken: Google geeft 'm ALLEEN bij de eerste toestemming
 * (daarom `prompt=consent` in de autorisatie-URL). Krijgen we 'm niet, dan
 * houden we de bestaande — 'm overschrijven met null zou de koppeling na een uur
 * stilletjes dood maken, en dat merk je pas als je 'm nodig hebt.
 */
export async function bewaarKoppeling(
  admin: SupabaseClient,
  userId: string,
  tokens: TokenSet,
): Promise<{ ok: true } | { ok: false; reden: string }> {
  const { data, error: leesFout } = await admin
    .from('koppelingen')
    .select('verversingstoken')
    .eq('user_id', userId)
    .eq('dienst', GOOGLE_CALENDAR)
    .maybeSingle()

  if (leesFout) return { ok: false, reden: 'db' }

  const bestaand: unknown = data
  const verversingstoken =
    tokens.verversingstoken ?? (isObject(bestaand) ? tekst(bestaand.verversingstoken) : null)

  if (!verversingstoken) {
    // Zonder refresh-token is de koppeling een uur houdbaar. Dan liever nu hard
    // falen dan morgen een lege agenda tonen.
    return { ok: false, reden: 'geen_verversingstoken' }
  }

  const { error } = await admin.from('koppelingen').upsert(
    {
      user_id: userId,
      dienst: GOOGLE_CALENDAR,
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
 */
export async function geldigToken(
  admin: SupabaseClient,
  userId: string,
): Promise<TokenResultaat> {
  const rij = await leesTokenRij(admin, userId)
  if (rij.staat !== 'ok') return rij

  if (rij.geldig && rij.toegangstoken) return { staat: 'ok', toegangstoken: rij.toegangstoken }
  if (!rij.verversingstoken) return { staat: 'niet_gekoppeld' }

  return vernieuwEnBewaar(admin, userId, rij.verversingstoken)
}

/**
 * Ververs NU, ongeacht wat de administratie zegt over de houdbaarheid.
 *
 * Voor het geval dat `geldigToken` per definitie niet kan dekken: het token was
 * volgens ons nog 40 minuten geldig, en Google zegt tóch 401. Dat gebeurt echt —
 * een ingetrokken app-toestemming of een wachtwoordwijziging wacht niet op onze
 * `verloopt_op`.
 *
 * Zonder deze functie was het antwoord op zo'n 401 "de koppeling is verlopen,
 * koppel opnieuw", terwijl één refresh het had opgelost. De aanroeper gebruikt
 * 'm dus als tweede kans: 401 → forceer → nog één poging. Zie `sync/route.ts` en
 * `schrijven.ts`.
 *
 * De discipline uit `google.ts` blijft overeind: alleen `invalid_grant` (echt
 * ingetrokken) wordt `niet_gekoppeld`. Een netwerkfout is en blijft `fout` — die
 * mag NOOIT als "niet gekoppeld" eindigen, anders vertelt LifeOS je dat je agenda
 * ontkoppeld is omdat Google net even traag was.
 */
export async function forceerVernieuwing(
  admin: SupabaseClient,
  userId: string,
): Promise<TokenResultaat> {
  const rij = await leesTokenRij(admin, userId)
  if (rij.staat !== 'ok') return rij
  if (!rij.verversingstoken) return { staat: 'niet_gekoppeld' }

  return vernieuwEnBewaar(admin, userId, rij.verversingstoken)
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
async function leesTokenRij(admin: SupabaseClient, userId: string): Promise<TokenRij> {
  const { data, error } = await admin
    .from('koppelingen')
    .select('toegangstoken, verversingstoken, verloopt_op')
    .eq('user_id', userId)
    .eq('dienst', GOOGLE_CALENDAR)
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

/** Wisselt het verversingstoken in en schrijft het resultaat weg. */
async function vernieuwEnBewaar(
  admin: SupabaseClient,
  userId: string,
  verversingstoken: string,
): Promise<TokenResultaat> {
  const config = googleConfig()
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
    .eq('dienst', GOOGLE_CALENDAR)

  // Het token werkt, maar we konden het niet bewaren: bruikbaar antwoord geven
  // en het volgende verzoek ververst gewoon opnieuw.
  if (schrijfFout) return { staat: 'ok', toegangstoken: uitkomst.tokens.toegangstoken }

  return { staat: 'ok', toegangstoken: uitkomst.tokens.toegangstoken }
}
