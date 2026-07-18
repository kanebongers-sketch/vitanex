// ─── LifeOS — notities in de database ───────────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor notities staat hier; de routes doen
// auth, validatie en het antwoord.
//
// De journal-race is hier het interessante geval — zie `lib/journal/opslag.ts`.
// Deze module blijft dom: hij leest en schrijft rijen, hij kent geen functie 7
// of 9. Het onderscheid zit in `soort`.
//
// De service-role-client komt als PARAMETER binnen (van `vereisLifeosToegang`):
// deze module weet niets van env of van welk Supabase-project. Zo blijft de
// LifeOS-brug op precies één plek.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  notitiesVanRijen,
  notitieVanRij,
  MAX_NOTITIES_LIMIET,
  NOTITIES_LIMIET,
  type NieuweNotitie,
  type Notitie,
  type NotitieWijziging,
  type Soort,
} from './notities'

export const KOLOMMEN =
  'id, tekst, titel, soort, datum, tags, categorie, aangemaakt_op, bijgewerkt_op'

/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: check-constraint geschonden. */
const CHECK_GESCHONDEN = '23514'
/** Postgres: tekst die geen geldig type is — bv. 'abc' als uuid. */
const ONLEESBAAR = '22P02'

export type Reden = 'db' | 'bezet' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

export function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'bezet'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  // Een onleesbare id (`DELETE /notities/abc`) is een cliëntfout, geen storing:
  // 'ongeldig' → 400, niet 'db' → 502. Zelfde keuze als projecten/opslag.ts.
  if (code === ONLEESBAAR) return 'ongeldig'
  return 'db'
}

export interface NotitiesFilter {
  soort: Soort
  /** Eén dag. Weglaten = alle dagen (nieuwste eerst). */
  datum?: string
  /** Vrije zoektekst (substring, case-insensitief, over tekst én titel). */
  zoek?: string
  /** Filter op één tag (exacte, genormaliseerde match). */
  tag?: string
  /** Filter op categorie. */
  categorie?: string
  /** Hoeveel notities je maximaal wilt. Weglaten = `NOTITIES_LIMIET` (100). */
  limiet?: number
}

/** Eén pagina notities, plus of er nog meer achter zit. */
export interface NotitiesPagina {
  notities: Notitie[]
  erIsMeer: boolean
}

/**
 * Bouwt de PostgREST-`or()`-filter voor een vrije zoekterm, over tekst ÉN titel.
 *
 * Waarom over allebei: je zoekt één keer en wilt een rij als de term in de tekst
 * óf in de titel zit. De titel is juist de naam waaronder je een notitie terug-
 * zoekt — zocht dit alleen `tekst`, dan vond zoeken-op-titel niets.
 *
 * Twee lagen ontsnapping, allebei nodig — puur en getest zodat de reden vastligt:
 *   1. LIKE-wildcards (`% _ \`) letterlijk maken, zodat wie "50%" zoekt geen
 *      wildcard triggert. Het escape-teken is `\`, dus die valt óók onder de set.
 *   2. PostgREST-structuur: binnen `or(...)` scheiden komma's de voorwaarden en
 *      groeperen haakjes. De waarde komt daarom tussen dubbele quotes, met `"` en
 *      `\` ontsnapt — zo breekt een komma of haakje in de zoekterm de filter niet.
 */
export function zoekFilter(zoek: string): string {
  const likeVeilig = zoek.replace(/[\\%_]/g, '\\$&')
  const geciteerd = likeVeilig.replace(/["\\]/g, '\\$&')
  return `tekst.ilike."%${geciteerd}%",titel.ilike."%${geciteerd}%"`
}

/**
 * De notities van een soort, nieuwste eerst.
 *
 * Binnen een dag oplopend op `aangemaakt_op`: een brain dump is een lijstje in
 * de volgorde waarin je hem leegde, niet omgekeerd. De dag zelf gaat aflopend —
 * dat matcht de index uit 050 én de leesrichting van een terugblik.
 *
 * ─── DE LIMIET ─────────────────────────────────────────────────────────────
 * Deze query had er geen. Voor "vandaag" viel dat niet op (een dag is klein),
 * maar `?zoek=de` over drie jaar brain dump haalt de hele tabel op — en die
 * groeit alleen maar. We vragen er ééntje TE VEEL op (`limiet + 1`): als die
 * terugkomt, weten we dát er meer is zonder een tweede count-query. De extra rij
 * gaat er weer af — hij is de vraag, niet het antwoord.
 */
export async function haalNotities(
  admin: SupabaseClient,
  userId: string,
  filter: NotitiesFilter,
): Promise<Uitkomst<NotitiesPagina>> {
  const limiet = begrensLimiet(filter.limiet)

  let vraag = admin
    .from('notities')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .eq('soort', filter.soort)

  if (filter.datum !== undefined) vraag = vraag.eq('datum', filter.datum)
  if (filter.categorie !== undefined) vraag = vraag.eq('categorie', filter.categorie)
  // Tag-containment: rijen waarvan de tags-array deze tag bevat.
  if (filter.tag !== undefined) vraag = vraag.contains('tags', [filter.tag])
  // Zoeken: substring, case-insensitief, over tekst ÉN titel. De dubbele
  // ontsnapping (LIKE-wildcards + PostgREST-structuur) staat in `zoekFilter`.
  if (filter.zoek !== undefined) {
    vraag = vraag.or(zoekFilter(filter.zoek))
  }

  const { data, error } = await vraag
    .order('datum', { ascending: false })
    .order('aangemaakt_op', { ascending: true })
    .limit(limiet + 1)

  if (error) return { ok: false, reden: vertaalFout(error) }

  const rijen = Array.isArray(data) ? data : []
  const erIsMeer = rijen.length > limiet
  return {
    ok: true,
    waarde: { notities: notitiesVanRijen(rijen.slice(0, limiet)), erIsMeer },
  }
}

/** Onzin, negatief of te groot → de veilige standaard. Faalt niet, kapt af. */
function begrensLimiet(gevraagd: number | undefined): number {
  if (gevraagd === undefined || !Number.isFinite(gevraagd)) return NOTITIES_LIMIET
  const heel = Math.floor(gevraagd)
  if (heel < 1) return NOTITIES_LIMIET
  return Math.min(heel, MAX_NOTITIES_LIMIET)
}

/**
 * Werkt tekst, titel, tags en/of categorie van één notitie bij. Alleen de
 * meegestuurde velden veranderen (partiële update). `.eq('user_id', ...)` blijft
 * de regel die je niet mag vergeten — zie `verwijderNotitie`.
 *
 * `tekst` en `titel` kwamen hier niet doorheen (alleen tags/categorie stonden in
 * `velden`), waardoor een tekstwijziging stil genegeerd werd: de PATCH gaf 200
 * met de ONgewijzigde notitie terug. Dat is het ergste soort bug — het lijkt te
 * werken tot je herlaadt.
 *
 * LET OP — wie `tekst` of `titel` wijzigt moet daarna de verwijzingen
 * hersynchroniseren (`synchroniseerLinks` / `hersyncTitel` in kennis.ts). Deze
 * module blijft dom en doet dat niet zelf: hij kent de grafiek niet.
 */
export async function wijzigNotitie(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: NotitieWijziging,
): Promise<Uitkomst<Notitie>> {
  const velden: Record<string, unknown> = {}
  if (wijziging.tekst !== undefined) velden.tekst = wijziging.tekst
  // `null` is hier een geldige waarde ("haal de titel weg"), dus de check is op
  // undefined — niet op falsy. Met `if (wijziging.titel)` zou wissen nooit werken.
  if (wijziging.titel !== undefined) velden.titel = wijziging.titel
  if (wijziging.tags !== undefined) velden.tags = wijziging.tags
  if (wijziging.categorie !== undefined) velden.categorie = wijziging.categorie
  // Niets te wijzigen? Dan is dit een no-op-fout, geen stille success — de route
  // hoort dat als "ongeldig" terug te geven i.p.v. een lege PATCH te doen.
  if (Object.keys(velden).length === 0) return { ok: false, reden: 'ongeldig' }

  const { data, error } = await admin
    .from('notities')
    .update(velden)
    .eq('id', id)
    .eq('user_id', userId)
    .select(KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }

  const notitie = notitieVanRij(data)
  return notitie ? { ok: true, waarde: notitie } : { ok: false, reden: 'db' }
}

export async function maakNotitie(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweNotitie,
): Promise<Uitkomst<Notitie>> {
  const { data, error } = await admin
    .from('notities')
    .insert({
      user_id: userId,
      tekst: nieuw.tekst,
      soort: nieuw.soort,
      datum: nieuw.datum,
      // Alleen meesturen als hij er is: `titel: undefined` zou PostgREST een
      // expliciete null laten schrijven en dat is hier hetzelfde, maar zo blijft
      // de insert leesbaar als "een capture heeft geen titel".
      ...(nieuw.titel === undefined ? {} : { titel: nieuw.titel }),
    })
    .select(KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const notitie = notitieVanRij(data)
  return notitie ? { ok: true, waarde: notitie } : { ok: false, reden: 'db' }
}

/**
 * Weg ermee.
 *
 * `.eq('user_id', ...)` staat er ook al gaat dit via de service-role-client (die
 * RLS omzeilt): zonder die filter zou een geraden id de notitie van een ander
 * verwijderen. Single-tenant maakt dat vandaag theoretisch — maar dit is de
 * regel die je niet één keer mag vergeten.
 */
export async function verwijderNotitie(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('notities')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}
