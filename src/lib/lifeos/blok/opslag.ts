// ─── LifeOS — het 4-weken blok in de database ───────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor de blok-voortgang staat hier; de routes
// doen auth, validatie en het antwoord.
//
// De service-role-client komt als PARAMETER binnen (van `vereisLifeosToegang`):
// deze module weet niets van env of van welk Supabase-project. Zo blijft de
// LifeOS-brug op precies één plek — zie `admin.ts`.
//
// KRITIEK: die client omzeilt RLS. Elke query die een gebruiker kent filtert
// daarom ZELF op `user_id` — zonder die filter zou een geraden id de rij van een
// ander raken. Single-tenant maakt dat vandaag theoretisch, maar dit is de regel
// die je niet één keer mag vergeten (zie `finance/opslag.ts`).
//
// ─── DE GRENS BIJ `training_id` — lees dit voor je een route schrijft ────────
// `haalSets()` en `logSet()` krijgen alleen een `trainingId` mee, geen userId: ze
// werken op een sessie die de aanroeper al in handen heeft. Een route mag dat id
// dus NOOIT rauw van de client aannemen. Haal 'm op via `haalSessieOpDatum()` of
// `startSessie()` (beide user-gefilterd), of controleer 'm met de geëxporteerde
// `hoortTrainingBijGebruiker()`. Anders is een geraden uuid genoeg om in iemands
// log te schrijven.
//
// ─── gepland ≠ gedaan (070_training, en het is heilig) ──────────────────────
// `gepland = true` is een VOORNEMEN, `gepland = false` een METING. Vita en het
// weekoverzicht mogen alleen op metingen af — zie `training/actieve-minuten.ts`.
// Zodra hier iets gelogd wordt (`startSessie`, `logSet`, `rondSessieAf`) zetten we
// `gepland` daarom op false: wat je aan het doen bent, is geen plan meer.
//
// ─── GEEN import uit het programma ──────────────────────────────────────────
// Deze module kent de sessiecodes niet als allowlist en importeert niets uit
// `programma-4weken.ts` of `progressie.ts`. Het programma is code-data die vaak
// verandert; de opslag moet daar niet elke keer mee herschreven worden. De DB
// bewaakt lengte/bereik, de UI kent de codes.

import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Wat er in en uit gaat ──────────────────────────────────────────────────

export interface SessieRij {
  id: string
  /** Lokale kalenderdag (YYYY-MM-DD). */
  datum: string
  /** Programma-sessie ('upper_a', 'zone2', …) of null bij een losse training. */
  sessieCode: string | null
  /** Week 1..4 van het blok, of null. */
  blokWeek: number | null
  /** Wanneer afgerond (ISO). null = nog bezig of gepland. */
  voltooidOp: string | null
  rpe: number | null
  duurMinuten: number | null
}

export interface SetRij {
  oefening: string
  setNummer: number
  herhalingen: number | null
  gewichtKg: number | null
  rir: number | null
  notitie: string | null
}

/**
 * De redenen die deze module teruggeeft. Documentatie voor de routes (die 'm op
 * een HTTP-status mappen), geen harde typering van `Uitkomst` — die houdt
 * `reden: string` zodat een route er niet op vast zit.
 *
 *   'ongeldig'      → de aanroeper stuurde onzin (400)
 *   'niet_gevonden' → bestaat niet, of niet van deze gebruiker (404)
 *   'db'            → echte storing, of een rij die we niet konden lezen (502)
 */
export type Reden = 'ongeldig' | 'niet_gevonden' | 'db'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: string }

const SESSIE_KOLOMMEN = 'id, datum, sessie_code, blok_week, voltooid_op, rpe, duur_minuten'
const SET_KOLOMMEN = 'oefening, set_nummer, herhalingen, gewicht_kg, rir, notitie'

/** Postgres: check-constraint geschonden — bv. een RIR van 11 of blok_week 9. */
const CHECK_GESCHONDEN = '23514'
/** Postgres: foreign key geschonden — bv. een training_id dat niet (meer) bestaat. */
const FK_GESCHONDEN = '23503'
/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: tekst die geen geldig type is — bv. 'abc' als uuid. */
const ONLEESBAAR = '22P02'
/** Postgres: ongeldig datum/tijd-formaat. */
const ONLEESBARE_TIJD = '22007'

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

/**
 * Postgres-fout → onze reden. Alles wat de aanroeper fout deed wordt 'ongeldig'
 * (→ 400); alleen een echte storing blijft 'db' (→ 502). Zelfde indeling als
 * `finance/opslag.ts` en `crm/fout.ts`, zodat de routes één mapping hebben.
 */
function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  if (code === FK_GESCHONDEN) return 'ongeldig'
  if (code === UNIEK_GESCHONDEN) return 'ongeldig'
  if (code === ONLEESBAAR) return 'ongeldig'
  if (code === ONLEESBARE_TIJD) return 'ongeldig'
  return 'db'
}

function mislukt(reden: Reden): { ok: false; reden: string } {
  return { ok: false, reden }
}

// ─── Sessies ────────────────────────────────────────────────────────────────

/**
 * De sessie van een dag, of null als er die dag geen blok-sessie staat.
 *
 * Alleen blok-sessies (`sessie_code is not null`): een losse ochtendloop is geen
 * programma-sessie en zou hier de verkeerde kaart openen. Staan er onverwacht
 * twee, dan geeft dit de laatst aangemaakte — het blok kent één sessie per dag,
 * en gokken is beter dan willekeurig.
 */
export async function haalSessieOpDatum(
  admin: SupabaseClient,
  userId: string,
  datum: string,
  sessieCode?: string,
): Promise<Uitkomst<SessieRij | null>> {
  let vraag = admin
    .from('trainingen')
    .select(SESSIE_KOLOMMEN)
    .eq('user_id', userId)
    .eq('datum', datum)
    .not('sessie_code', 'is', null)

  // Met een expliciete code halen we precies díe sessie op. Zonder code (het
  // auto-schema) valt het terug op de laatst aangemaakte sessie van de dag. Dit
  // maakt "kies zelf je training" mogelijk: twee sessies op één dag botsen niet.
  if (sessieCode !== undefined) vraag = vraag.eq('sessie_code', sessieCode)

  const { data, error } = await vraag
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return mislukt(vertaalFout(error))
  if (data === null || data === undefined) return { ok: true, waarde: null }

  const sessie = leesSessieRij(data)
  return sessie === null ? mislukt('db') : { ok: true, waarde: sessie }
}

/**
 * Maakt (of vindt) de sessie-rij voor een datum + sessiecode. Idempotent.
 *
 * Eén upsert op de unieke index `trainingen_blok_sessie_uniek`
 * (user_id, datum, sessie_code) uit migratie 160 — dus twee snelle kliks of twee
 * tabs leveren één sessie, geen twee. `voltooid_op`, `rpe` en `duur_minuten`
 * staan bewust NIET in de payload: opnieuw starten mag een afgeronde sessie niet
 * leegvegen.
 */
export async function startSessie(
  admin: SupabaseClient,
  userId: string,
  datum: string,
  sessieCode: string,
  blokWeek: number,
): Promise<Uitkomst<SessieRij>> {
  const afkeur = keurSessieStart(sessieCode, blokWeek)
  if (afkeur !== null) return mislukt(afkeur)

  const { data, error } = await admin
    .from('trainingen')
    .upsert(
      {
        user_id: userId,
        datum,
        sessie_code: sessieCode.trim(),
        blok_week: blokWeek,
        soort: soortVoorSessie(sessieCode.trim()),
        // Wie een sessie start, is aan het meten. Een voornemen wordt hier een
        // meting — anders zou de constraint uit 070 de eerste RPE al weigeren.
        gepland: false,
      },
      { onConflict: 'user_id,datum,sessie_code' },
    )
    .select(SESSIE_KOLOMMEN)
    .single()

  if (error) return mislukt(vertaalFout(error))
  const sessie = leesSessieRij(data)
  return sessie === null ? mislukt('db') : { ok: true, waarde: sessie }
}

/**
 * Rondt de sessie af: `voltooid_op` erin, plus de RPE en duur als je die hebt.
 *
 * `null` voor rpe/duur betekent "niet gemeten" en laat een eerder ingevulde
 * waarde staan — leeg terugsturen wist geen meting. Opnieuw afronden (na een
 * correctie) zet `voltooid_op` op het nieuwe moment; dat is wanneer je het voor
 * het laatst bevestigde, en dus geen leugen.
 */
export async function rondSessieAf(
  admin: SupabaseClient,
  userId: string,
  trainingId: string,
  rpe: number | null,
  duurMinuten: number | null,
): Promise<Uitkomst<null>> {
  if (!isMeetwaardeOfNull(rpe, 1, 10, true)) return mislukt('ongeldig')
  if (!isMeetwaardeOfNull(duurMinuten, 1, 1440, true)) return mislukt('ongeldig')

  const velden: Record<string, unknown> = {
    voltooid_op: new Date().toISOString(),
    gepland: false,
  }
  if (rpe !== null) velden.rpe = rpe
  if (duurMinuten !== null) velden.duur_minuten = duurMinuten

  const { data, error } = await admin
    .from('trainingen')
    .update(velden)
    .eq('id', trainingId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return mislukt(vertaalFout(error))
  if (data === null || data === undefined) return mislukt('niet_gevonden')
  return { ok: true, waarde: null }
}

/**
 * Alle voltooide sessies in een periode (van en tot inclusief), oudste eerst.
 *
 * Alleen `voltooid_op is not null`: dit voedt het weekoverzicht en de evaluatie,
 * en die mogen alleen tellen wat je écht afmaakte. Een sessie die je startte maar
 * niet afrondde is geen gedane sessie.
 */
export async function haalVoltooideSessies(
  admin: SupabaseClient,
  userId: string,
  van: string,
  tot: string,
): Promise<Uitkomst<SessieRij[]>> {
  const { data, error } = await admin
    .from('trainingen')
    .select(SESSIE_KOLOMMEN)
    .eq('user_id', userId)
    .gte('datum', van)
    .lte('datum', tot)
    .not('voltooid_op', 'is', null)
    .order('datum', { ascending: true })

  if (error) return mislukt(vertaalFout(error))
  return { ok: true, waarde: sessiesVanRijen(Array.isArray(data) ? data : []) }
}

/**
 * Hoort deze training bij deze gebruiker? De eigendomscheck die de routes nodig
 * hebben omdat de admin-client RLS omzeilt (zie de kop van dit bestand).
 */
export async function hoortTrainingBijGebruiker(
  admin: SupabaseClient,
  userId: string,
  trainingId: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('trainingen')
    .select('id')
    .eq('id', trainingId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return mislukt(vertaalFout(error))
  if (data === null || data === undefined) return mislukt('niet_gevonden')
  return { ok: true, waarde: null }
}

// ─── Sets ───────────────────────────────────────────────────────────────────

/** Alle sets van een sessie, op oefening en setnummer. */
export async function haalSets(
  admin: SupabaseClient,
  trainingId: string,
): Promise<Uitkomst<SetRij[]>> {
  const { data, error } = await admin
    .from('oefening_sets')
    .select(SET_KOLOMMEN)
    .eq('training_id', trainingId)
    .order('oefening', { ascending: true })
    .order('set_nummer', { ascending: true })

  if (error) return mislukt(vertaalFout(error))
  return { ok: true, waarde: setsVanRijen(Array.isArray(data) ? data : []) }
}

/**
 * Logt één set idempotent: upsert op (training_id, oefening, set_nummer), de
 * unieke index uit migratie 160.
 *
 * Waarom idempotent: de logger draait op een telefoon in de sportschool. Een
 * retry na een wegvallende verbinding mag geen tweede rij maken — dan staat er
 * "5 sets" waar je er 3 deed, en dat is een verzonnen volume.
 *
 * De sessie gaat eerst van voornemen naar meting. Die kant op, en niet erna: is
 * de sessie niet omgezet, dan schrijven we ook de set niet — liever een fout dan
 * een set onder een plan.
 */
export async function logSet(
  admin: SupabaseClient,
  trainingId: string,
  set: SetRij,
): Promise<Uitkomst<null>> {
  const afkeur = keurSet(set)
  if (afkeur !== null) return mislukt(afkeur)

  const plan = await admin
    .from('trainingen')
    .update({ gepland: false })
    .eq('id', trainingId)
    .eq('gepland', true)
    .select('id')
  if (plan.error) return mislukt(vertaalFout(plan.error))

  const { error } = await admin.from('oefening_sets').upsert(
    {
      training_id: trainingId,
      oefening: set.oefening.trim(),
      set_nummer: set.setNummer,
      herhalingen: set.herhalingen,
      gewicht_kg: set.gewichtKg,
      rir: set.rir,
      notitie: set.notitie,
    },
    { onConflict: 'training_id,oefening,set_nummer' },
  )

  if (error) return mislukt(vertaalFout(error))
  return { ok: true, waarde: null }
}

/**
 * De laatste keer dat een oefening gedaan is: de sets van de meest recente
 * VOLTOOIDE sessie vóór `voorDatum` waarin die oefening voorkomt.
 *
 * Alleen voltooide sessies, want dit voedt het gewichtsvoorstel: een sessie die
 * je halverwege afbrak is geen prestatie om op door te bouwen. Lege lijst =
 * "nooit eerder gedaan" — dan stelt de progressie-engine niets voor en vul je
 * zelf in. Dat is het eerlijke antwoord; een verzonnen startgewicht is dat niet.
 *
 * Het sorteren gebeurt in `setsVanLaatsteSessie()` en niet in Postgres: sorteren
 * op een ingebedde tabel verschilt per PostgREST-versie, en het gaat om een
 * handvol rijen (de historie van één oefening).
 */
export async function haalLaatstePrestatie(
  admin: SupabaseClient,
  userId: string,
  oefening: string,
  voorDatum: string,
): Promise<Uitkomst<SetRij[]>> {
  const naam = oefening.trim()
  if (naam.length === 0 || naam.length > 200) return mislukt('ongeldig')

  const { data, error } = await admin
    .from('oefening_sets')
    .select(`${SET_KOLOMMEN}, training_id, trainingen!inner(datum, user_id, voltooid_op)`)
    .eq('oefening', naam)
    .eq('trainingen.user_id', userId)
    .lt('trainingen.datum', voorDatum)
    .not('trainingen.voltooid_op', 'is', null)

  if (error) return mislukt(vertaalFout(error))
  return { ok: true, waarde: setsVanLaatsteSessie(Array.isArray(data) ? data : []) }
}

// ─── Cardio (Zone 2 / Hyrox) ────────────────────────────────────────────────

/**
 * Bewaart de cardio-details van een sessie: upsert op `training_id`, dus opnieuw
 * opslaan werkt de rij bij in plaats van er een tweede naast te zetten.
 *
 * Eerst de eigendomscheck: de upsert gaat op `training_id`, en zonder die check
 * zou een geraden uuid iemands cardio-rij overschrijven (de admin-client omzeilt
 * RLS).
 */
export async function bewaarCardio(
  admin: SupabaseClient,
  userId: string,
  trainingId: string,
  soort: 'zone2' | 'hyrox',
  details: Record<string, unknown>,
): Promise<Uitkomst<null>> {
  if (soort !== 'zone2' && soort !== 'hyrox') return mislukt('ongeldig')

  const velden = leesCardioDetails(details)
  if (velden === null) return mislukt('ongeldig')

  const eigenaar = await hoortTrainingBijGebruiker(admin, userId, trainingId)
  if (!eigenaar.ok) return eigenaar

  const { error } = await admin
    .from('blok_cardio')
    .upsert({ user_id: userId, training_id: trainingId, soort, ...velden }, { onConflict: 'training_id' })

  if (error) return mislukt(vertaalFout(error))
  return { ok: true, waarde: null }
}

// ─── Keuring van wat er in gaat (puur) ──────────────────────────────────────

/**
 * Krachtsessie of cardio? Bepaalt `trainingen.soort`, dat een allowlist heeft
 * ('kracht', 'cardio', …) sinds 070.
 *
 * Geen import uit het programma (zie de kop): de twee cardio-codes staan hier als
 * literal. Komt er ooit een derde, dan faalt niets stil — de sessie wordt dan als
 * kracht geboekt, wat je in het weekoverzicht meteen ziet.
 */
export function soortVoorSessie(sessieCode: string): 'kracht' | 'cardio' {
  return sessieCode === 'zone2' || sessieCode === 'hyrox' ? 'cardio' : 'kracht'
}

/**
 * Mag deze sessie gestart worden? `null` = ja, anders de reden.
 *
 * 'rust' wordt geweigerd: een rustdag is geen sessie die je logt, en 'm als
 * 'kracht' wegschrijven zou een training verzinnen die niet bestond.
 */
export function keurSessieStart(sessieCode: string, blokWeek: number): Reden | null {
  const code = sessieCode.trim()
  if (code.length === 0 || code.length > 60) return 'ongeldig'
  if (code === 'rust') return 'ongeldig'
  if (!Number.isInteger(blokWeek) || blokWeek < 1 || blokWeek > 4) return 'ongeldig'
  return null
}

/**
 * Mag deze set gelogd worden? `null` = ja, anders de reden.
 *
 * NaN en Infinity worden hier geweigerd en niet stil `null` gemaakt: JSON
 * serialiseert NaN als null, en dan zou een kapotte invoer als "niet genoteerd"
 * in de database landen. Een kapotte bron is geen ontbrekende meting.
 * De bereiken lopen gelijk met de checks op `oefening_sets` (070 + 160).
 */
export function keurSet(set: SetRij): Reden | null {
  const oefening = set.oefening.trim()
  if (oefening.length === 0 || oefening.length > 200) return 'ongeldig'
  if (!Number.isInteger(set.setNummer) || set.setNummer < 1 || set.setNummer > 100) return 'ongeldig'
  if (!isMeetwaardeOfNull(set.herhalingen, 1, 1000, true)) return 'ongeldig'
  if (!isMeetwaardeOfNull(set.gewichtKg, 0, 999.9, false)) return 'ongeldig'
  if (!isMeetwaardeOfNull(set.rir, 0, 10, true)) return 'ongeldig'
  if (set.notitie !== null && (typeof set.notitie !== 'string' || set.notitie.length > 1000)) {
    return 'ongeldig'
  }
  return null
}

/** Een meetveld is óf `null` ("niet gemeten"), óf een echt getal binnen bereik. */
function isMeetwaardeOfNull(v: number | null, min: number, max: number, heel: boolean): boolean {
  if (v === null) return true
  if (typeof v !== 'number' || !Number.isFinite(v)) return false
  if (heel && !Number.isInteger(v)) return false
  return v >= min && v <= max
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────
// Narrowen, niet casten. Een kolom die van type verandert of een join die anders
// terugkomt, mag hier geen NaN of `undefined` doorlaten die verderop als cijfer
// in de UI eindigt. Onwetendheid valt naar `null` — de regel van
// `training/actieve-minuten.ts`.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/**
 * Een getal uit onbekende input. PostgREST levert `numeric` soms als string, en
 * een formulier stuurt getallen als tekst. Onzin → `null`.
 */
function getal(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim().length > 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Een getal binnen bereik, of `null` als het ontbreekt of onzin is. */
function getalInBereik(v: unknown, min: number, max: number, heel: boolean): number | null {
  const n = getal(v)
  if (n === null) return null
  if (heel && !Number.isInteger(n)) return null
  return n >= min && n <= max ? n : null
}

/**
 * Leest een rij uit `public.trainingen` als `SessieRij`.
 *
 * `id` en `datum` zijn de enige harde eisen: zonder die twee is de rij geen
 * sessie. De rest valt naar `null` — een onleesbare RPE is "niet gemeten", geen
 * reden om de hele sessie te laten verdwijnen.
 */
export function leesSessieRij(rij: unknown): SessieRij | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const datum = tekst(rij.datum)
  if (id === null || datum === null || datum.length < 10) return null

  return {
    id,
    datum: datum.slice(0, 10),
    sessieCode: tekst(rij.sessie_code),
    blokWeek: getalInBereik(rij.blok_week, 1, 4, true),
    voltooidOp: tekst(rij.voltooid_op),
    rpe: getalInBereik(rij.rpe, 1, 10, true),
    duurMinuten: getalInBereik(rij.duur_minuten, 1, 1440, true),
  }
}

export function sessiesVanRijen(rijen: readonly unknown[]): SessieRij[] {
  return rijen.map(leesSessieRij).filter((s): s is SessieRij => s !== null)
}

/**
 * Leest een rij uit `public.oefening_sets` als `SetRij`.
 *
 * `set_nummer` is hard verplicht, en dat heeft een prijs: een oude, losse set uit
 * de tijd vóór het blok (de kolom is nullable sinds 070) valt hier weg. Dat is de
 * eerlijke kant van de keuze — een setnummer verzinnen zou een set op een plek
 * zetten waar hij nooit stond, en de idempotente upsert hangt aan dat nummer.
 */
export function leesSetRij(rij: unknown): SetRij | null {
  if (!isObject(rij)) return null

  const oefening = tekst(rij.oefening)
  const setNummer = getalInBereik(rij.set_nummer, 1, 100, true)
  if (oefening === null || setNummer === null) return null

  return {
    oefening,
    setNummer,
    herhalingen: getalInBereik(rij.herhalingen, 1, 1000, true),
    gewichtKg: getalInBereik(rij.gewicht_kg, 0, 999.9, false),
    rir: getalInBereik(rij.rir, 0, 10, true),
    notitie: tekst(rij.notitie),
  }
}

export function setsVanRijen(rijen: readonly unknown[]): SetRij[] {
  return rijen.map(leesSetRij).filter((s): s is SetRij => s !== null)
}

/**
 * De sets van de MEEST RECENTE sessie in een resultaat met ingebedde
 * `trainingen`-gegevens (zie `haalLaatstePrestatie`).
 *
 * Twee passes: eerst de nieuwste sessie vinden (op datum, en bij gelijke datum op
 * afrondmoment), dan alleen díe sets teruggeven. Sets van een oudere sessie
 * ertussen zou een gemiddelde over twee trainingen maken, en daar is geen enkele
 * set ooit echt gedaan.
 */
export function setsVanLaatsteSessie(rijen: readonly unknown[]): SetRij[] {
  let nieuwste: { id: string; sleutel: string } | null = null
  for (const rij of rijen) {
    const kop = leesPrestatieKop(rij)
    if (kop === null) continue
    if (nieuwste === null || kop.sleutel > nieuwste.sleutel) nieuwste = kop
  }
  if (nieuwste === null) return []

  const gekozen = nieuwste
  const sets: SetRij[] = []
  for (const rij of rijen) {
    const kop = leesPrestatieKop(rij)
    if (kop === null || kop.id !== gekozen.id) continue
    const set = leesSetRij(rij)
    if (set !== null) sets.push(set)
  }
  return sets.sort((a, b) => a.setNummer - b.setNummer)
}

/**
 * De sessie-identiteit van een set-rij met ingebedde `trainingen`. PostgREST
 * geeft een to-one-relatie als object, maar bij sommige versies/queries als array
 * van één; beide vormen worden hier gelezen in plaats van gegokt.
 */
function leesPrestatieKop(rij: unknown): { id: string; sleutel: string } | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.training_id)
  if (id === null) return null

  const ruw = rij.trainingen
  const moeder = Array.isArray(ruw) ? ruw[0] : ruw
  if (!isObject(moeder)) return null

  const datum = tekst(moeder.datum)
  const voltooidOp = tekst(moeder.voltooid_op)
  // Niet voltooid = geen prestatie om op door te bouwen. De query filtert daar al
  // op; dit is de tweede sluiting van dezelfde deur.
  if (datum === null || voltooidOp === null) return null

  return { id, sleutel: `${datum.slice(0, 10)}|${voltooidOp}` }
}

/** De kolommen van `public.blok_cardio` die uit losse details komen. */
export interface CardioKolommen {
  duur_minuten: number | null
  afstand_meter: number | null
  gem_hartslag: number | null
  gem_pace_sec_per_km: number | null
  rpe: number | null
  onderdelen: readonly unknown[] | null
}

/**
 * Leest losse cardio-details als DB-kolommen. `null` = de vorm is kapot en er
 * gaat niets naar de database.
 *
 * Structuur is hard (een `onderdelen` die geen array van objecten is, weigeren
 * we — de UI doet er `.map` op), meetwaarden zijn zacht: een ontbrekende of
 * onleesbare hartslag wordt `null` ("niet gemeten"), niet 0. De route valideert
 * wat de gebruiker typte; dit is de laatste sluis vóór de kolom.
 *
 * Zowel camelCase (de taal van de app) als snake_case (de taal van de DB) wordt
 * gelezen. Eén van de twee negeren zou een veld stil laten verdwijnen, en dat is
 * precies de fout die deze laag moet voorkomen.
 */
export function leesCardioDetails(details: unknown): CardioKolommen | null {
  if (!isObject(details)) return null

  const onderdelen = leesOnderdelen(pak(details, 'onderdelen', 'onderdelen'))
  if (onderdelen === 'kapot') return null

  return {
    duur_minuten: getalInBereik(pak(details, 'duurMinuten', 'duur_minuten'), 1, 1440, true),
    afstand_meter: getalInBereik(pak(details, 'afstandMeter', 'afstand_meter'), 0, 1000000, true),
    gem_hartslag: getalInBereik(pak(details, 'gemHartslag', 'gem_hartslag'), 30, 250, true),
    gem_pace_sec_per_km: getalInBereik(
      pak(details, 'gemPaceSecPerKm', 'gem_pace_sec_per_km'),
      1,
      3600,
      true,
    ),
    rpe: getalInBereik(pak(details, 'rpe', 'rpe'), 1, 10, true),
    onderdelen,
  }
}

/** Een veld onder zijn camelCase- of zijn snake_case-naam. */
function pak(details: Record<string, unknown>, camel: string, snake: string): unknown {
  const waarde = details[camel]
  return waarde === undefined ? details[snake] : waarde
}

/**
 * De Hyrox-stations: een array van objecten, of niets. `'kapot'` bij elke andere
 * vorm — de kolom heeft een `jsonb_typeof = 'array'`-check, en een los object
 * zou daar alsnog op afketsen (of erger: door de UI heen glippen).
 */
function leesOnderdelen(v: unknown): readonly unknown[] | null | 'kapot' {
  if (v === undefined || v === null) return null
  if (!Array.isArray(v)) return 'kapot'
  return v.every((onderdeel) => isObject(onderdeel)) ? v : 'kapot'
}
