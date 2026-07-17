// ─── LifeOS — kennis: verwijzingen en backlinks in de database ──────────────
// SERVER-ONLY. Alle databasetoegang voor `notitie_links` staat hier; de routes
// doen auth, validatie en het antwoord. Het opbouwen van de grafiek zelf is puur
// en staat in `grafiek.ts`.
//
// De service-role-client komt als PARAMETER binnen (van `vereisLifeosToegang`):
// deze module weet niets van env of van welk Supabase-project. Zo blijft de
// LifeOS-brug op precies één plek. Zie `opslag.ts`.
//
// ─── DE REGEL DIE DEZE MODULE WAAR MOET HOUDEN ──────────────────────────────
//   `notities.tekst` is de waarheid, `notitie_links` is de index erop (zie
//   migratie 110). Die twee mogen niet uit elkaar lopen. Daarom wordt de index
//   bij élke schrijfactie HERBOUWD uit `parseLinks()`, nooit incrementeel
//   bijgewerkt: er is precies één functie die links schrijft
//   (`synchroniseerLinks`) en die gooit eerst alles van die notitie weg.
//
//   De eerlijke prijs: dat is een delete gevolgd door een insert, en PostgREST
//   kent geen transactie over twee calls. Tussen die twee heeft de notitie heel
//   even geen links. Voor een single-tenant app (één gebruiker, één tabblad) is
//   dat een venster van milliseconden waarin alleen jijzelf kunt kijken, en de
//   volgende sync herstelt het hoe dan ook. Zou LifeOS ooit multi-user worden,
//   dan hoort dit in een RPC-functie met één transactie.

import type { SupabaseClient } from '@supabase/supabase-js'
import { bouwGrafiek, MAX_KANTEN, type Grafiek, type KnoopBron, type LinkRij } from './grafiek'
import { parseLinks, titelSleutel } from './links'
import { notitiesVanRijen, type Notitie } from './notities'
import { vertaalFout, KOLOMMEN, type Uitkomst } from './opslag'

/**
 * Herbouwt de verwijzingen van één notitie vanuit zijn tekst.
 *
 * Roep dit aan na élke aanmaak of tekstwijziging. Idempotent: twee keer draaien
 * geeft hetzelfde resultaat.
 *
 * Een verwijzing naar een notitie die nog niet bestaat krijgt `doel_id = null` —
 * dat is geen fout maar een wens (zie migratie 110). Een verwijzing naar jezelf
 * wordt overgeslagen: een lus in de grafiek zegt niets.
 */
export async function synchroniseerLinks(
  admin: SupabaseClient,
  userId: string,
  notitie: Pick<Notitie, 'id' | 'tekst' | 'titel'>,
): Promise<Uitkomst<null>> {
  const eigenSleutel = titelSleutel(notitie.titel)
  const titels = parseLinks(notitie.tekst).filter((t) => t.toLowerCase() !== eigenSleutel)

  const opgelost = await zoekTitels(admin, userId, titels)
  if (!opgelost.ok) return opgelost

  const weg = await admin
    .from('notitie_links')
    .delete()
    .eq('bron_id', notitie.id)
    .eq('user_id', userId)
  if (weg.error) return { ok: false, reden: vertaalFout(weg.error) }

  if (titels.length === 0) return { ok: true, waarde: null }

  const rijen = titels.map((titel) => ({
    user_id: userId,
    bron_id: notitie.id,
    doel_id: opgelost.waarde.get(titel.toLowerCase()) ?? null,
    doel_titel: titel,
  }))

  const { error } = await admin.from('notitie_links').insert(rijen)
  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: null }
}

/**
 * De hele kennislaag van één notitie bijwerken: zijn eigen verwijzingen opbouwen
 * én wachtende verwijzingen naar zijn titel laten vastklikken.
 *
 * Dit is wat een route aanroept ná een geslaagde schrijfactie. Geeft `null` als
 * alles goed ging, of een NL-melding voor de gebruiker als het misging.
 *
 * ─── WAAROM DIT NIET DE HELE CALL LAAT FALEN ────────────────────────────────
 *   Op dit punt is de notitie AL opgeslagen. Alsnog een 502 teruggeven zou de
 *   gebruiker vertellen dat het mislukte terwijl zijn tekst gewoon veilig is —
 *   en dat is de ergere leugen. In een brain dump is de tekst alles; de
 *   verwijzingen zijn een index die de volgende sync toch herbouwt.
 *
 *   Maar dus ook niet stil: de melding gaat mee naar de UI én naar de serverlog.
 *   Een grafiek die stil een kant mist, is een grafiek die je niet kunt geloven.
 */
export async function synchroniseerNotitieKennis(
  admin: SupabaseClient,
  userId: string,
  notitie: Pick<Notitie, 'id' | 'tekst' | 'titel'>,
): Promise<string | null> {
  const links = await synchroniseerLinks(admin, userId, notitie)
  const titel = await hersyncTitel(admin, userId, notitie.id, notitie.titel)

  if (links.ok && titel.ok) return null

  console.error('[lifeos/kennis] bijwerken mislukt', {
    id: notitie.id,
    links: links.ok ? 'ok' : links.reden,
    titel: titel.ok ? 'ok' : titel.reden,
  })
  return 'Je notitie is opgeslagen, maar de verwijzingen konden niet bijgewerkt worden.'
}

/** titelsleutel → notitie-id, voor de titels die écht bestaan. */
async function zoekTitels(
  admin: SupabaseClient,
  userId: string,
  titels: readonly string[],
): Promise<Uitkomst<Map<string, string>>> {
  const kaart = new Map<string, string>()
  if (titels.length === 0) return { ok: true, waarde: kaart }

  // Eén query voor alle titels tegelijk, dankzij de gegenereerde kolom
  // `titel_sleutel` uit migratie 110. Met een kale expressie-index zou dit één
  // query per verwijzing zijn geweest.
  const { data, error } = await admin
    .from('notities')
    .select('id, titel_sleutel')
    .eq('user_id', userId)
    .in(
      'titel_sleutel',
      titels.map((t) => t.toLowerCase()),
    )

  if (error) return { ok: false, reden: vertaalFout(error) }

  for (const rij of Array.isArray(data) ? data : []) {
    const id = leesTekstVeld(rij, 'id')
    const sleutel = leesTekstVeld(rij, 'titel_sleutel')
    if (id !== null && sleutel !== null) kaart.set(sleutel, id)
  }
  return { ok: true, waarde: kaart }
}

/**
 * Zet de wachtende verwijzingen naar deze notitie goed nadat zijn titel is
 * veranderd (of er voor het eerst een kwam).
 *
 * DIT IS DE "WENS WORDT ECHT"-STAP. Je schreef ooit `[[Marge-model]]` zonder dat
 * die notitie bestond; maak je 'm nu aan, dan klikken al die verwijzingen hier
 * vast.
 *
 * Twee kanten, en de tweede wordt makkelijk vergeten:
 *
 *   1. OPLOSSEN: wensen met deze titel wijzen voortaan naar deze notitie.
 *   2. LOSLATEN: verwijzingen die naar deze notitie wezen onder zijn ÓUDE titel
 *      moeten weer wens worden. Zonder deze stap wijst `[[oude naam]]` stil naar
 *      een notitie die nu heel anders heet — een link die liegt is erger dan een
 *      link die ontbreekt.
 */
export async function hersyncTitel(
  admin: SupabaseClient,
  userId: string,
  notitieId: string,
  titel: string | null,
): Promise<Uitkomst<null>> {
  const sleutel = titelSleutel(titel)

  // 1. Loslaten: alles wat naar deze notitie wees maar niet (meer) zijn titel
  //    noemt. Bij `titel = null` (titel weggehaald) raakt dat álles.
  let losser = admin
    .from('notitie_links')
    .update({ doel_id: null })
    .eq('doel_id', notitieId)
    .eq('user_id', userId)
  if (sleutel !== null) losser = losser.neq('doel_sleutel', sleutel)

  const los = await losser
  if (los.error) return { ok: false, reden: vertaalFout(los.error) }

  if (sleutel === null) return { ok: true, waarde: null }

  // 2. Oplossen: wensen met deze titel wijzen nu hier naartoe. `neq('bron_id')`
  //    houdt een zelfverwijzing buiten de deur.
  const { error } = await admin
    .from('notitie_links')
    .update({ doel_id: notitieId })
    .eq('user_id', userId)
    .eq('doel_sleutel', sleutel)
    .is('doel_id', null)
    .neq('bron_id', notitieId)

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: null }
}

/**
 * Hoeveel titels we maximaal ophalen voor de "bestaat deze verwijzing?"-vraag.
 * Een titel is ≤120 tekens, dus 2000 titels is een kleine payload — en ruim meer
 * dan iemand ooit benoemt.
 */
const MAX_TITELS = 2000

/**
 * Hoeveel backlinks we maximaal tonen. Een notitie waar 200 andere naar
 * verwijzen is een spil; nummer 201 zien verandert je antwoord op "waar had ik
 * het hier eerder over?" niet meer, en de lijst is dan al lang geen lijst meer.
 */
const MAX_BACKLINKS = 200

/** Alle titels van de gebruiker, plus of dat er alles van was. */
export interface TitelLijst {
  titels: string[]
  /**
   * True = we hebben niet alle titels. De UI mag dan van GEEN ENKELE verwijzing
   * beweren dat hij niet bestaat — misschien zit hij in het deel dat we misten.
   * Zie `leesTitelsAntwoord`.
   */
  afgekapt: boolean
}

/**
 * Alle notitie-titels die bestaan.
 *
 * Waarvoor: de UI moet weten of `[[Marge-model]]` naar iets bestaands wijst of
 * een wens is. Dat kan ze niet uit de zichtbare lijst afleiden — een notitie van
 * vorige week staat daar niet in, en dan zou een bestaande verwijzing er als
 * "bestaat nog niet" uitzien. Dat is een leugen tegen de gebruiker, en precies
 * het soort dat je niet meer opmerkt.
 *
 * Alleen titels, geen tekst: dit is een kleine lijst die de hele vraag beantwoordt.
 */
export async function haalTitels(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<TitelLijst>> {
  const { data, error } = await admin
    .from('notities')
    .select('titel')
    .eq('user_id', userId)
    .not('titel', 'is', null)
    .order('titel', { ascending: true })
    .limit(MAX_TITELS + 1)

  if (error) return { ok: false, reden: vertaalFout(error) }

  const rijen = Array.isArray(data) ? data : []
  const titels = rijen
    .slice(0, MAX_TITELS)
    .map((rij) => leesTekstVeld(rij, 'titel'))
    .filter((t): t is string => t !== null)

  return { ok: true, waarde: { titels, afgekapt: rijen.length > MAX_TITELS } }
}

/**
 * Welke notities verwijzen naar deze? Dat is de vraag waarvoor dit hele
 * kennissysteem bestaat: "waar had ik het hier eerder over?".
 *
 * Twee queries in plaats van een embedded join: PostgREST-embedding hangt aan de
 * naam van de foreign-key-constraint, en dat is een string die stil breekt als
 * iemand die constraint ooit hernoemt. Eén extra round-trip is die zekerheid
 * waard.
 */
export async function haalBacklinks(
  admin: SupabaseClient,
  userId: string,
  notitieId: string,
): Promise<Uitkomst<Notitie[]>> {
  const { data, error } = await admin
    .from('notitie_links')
    .select('bron_id')
    .eq('user_id', userId)
    .eq('doel_id', notitieId)
    .limit(MAX_BACKLINKS)

  if (error) return { ok: false, reden: vertaalFout(error) }

  const ids = [
    ...new Set(
      (Array.isArray(data) ? data : [])
        .map((rij) => leesTekstVeld(rij, 'bron_id'))
        .filter((id): id is string => id !== null),
    ),
  ]
  if (ids.length === 0) return { ok: true, waarde: [] }

  const bronnen = await admin
    .from('notities')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .in('id', ids)
    .order('datum', { ascending: false })

  if (bronnen.error) return { ok: false, reden: vertaalFout(bronnen.error) }
  return { ok: true, waarde: notitiesVanRijen(Array.isArray(bronnen.data) ? bronnen.data : []) }
}

/**
 * De hele kennisgrafiek: knopen en kanten.
 *
 * Bevat alleen notities die aan een verwijzing meedoen (als bron of als doel).
 * Een notitie zonder verbanden is in een KENNISgrafiek een losse stip — die
 * voegt niets toe en maakt de rest onleesbaar. De eerlijke prijs: je ziet hier
 * dus niet al je notities, en dat zegt de UI er ook bij.
 */
export async function haalGrafiek(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<Grafiek>> {
  const { data, error } = await admin
    .from('notitie_links')
    .select('bron_id, doel_id, doel_titel, doel_sleutel')
    .eq('user_id', userId)
    // Deterministisch: dezelfde grafiek geeft bij elke lading dezelfde volgorde,
    // dus dezelfde layout. Een grafiek die bij elke refresh herschikt, is niet
    // te lezen.
    .order('bron_id', { ascending: true })
    .order('doel_sleutel', { ascending: true })
    .limit(MAX_KANTEN + 1)

  if (error) return { ok: false, reden: vertaalFout(error) }

  const alle = leesLinkRijen(Array.isArray(data) ? data : [])
  const teVeelKanten = alle.length > MAX_KANTEN
  const rijen = alle.slice(0, MAX_KANTEN)

  const notities = await haalBetrokkenNotities(admin, userId, rijen)
  if (!notities.ok) return notities

  return { ok: true, waarde: bouwGrafiek(rijen, notities.waarde, teVeelKanten) }
}

/** id → titel + tekst voor elke notitie die in de kanten voorkomt. */
async function haalBetrokkenNotities(
  admin: SupabaseClient,
  userId: string,
  rijen: readonly LinkRij[],
): Promise<Uitkomst<Map<string, KnoopBron>>> {
  const ids = new Set<string>()
  for (const rij of rijen) {
    ids.add(rij.bron_id)
    if (rij.doel_id !== null) ids.add(rij.doel_id)
  }

  const kaart = new Map<string, KnoopBron>()
  if (ids.size === 0) return { ok: true, waarde: kaart }

  // In brokken: een `.in()` met duizend ids wordt een URL die servers weigeren.
  for (const brok of inBrokken([...ids], 200)) {
    const { data, error } = await admin
      .from('notities')
      .select('id, titel, tekst')
      .eq('user_id', userId)
      .in('id', brok)

    if (error) return { ok: false, reden: vertaalFout(error) }

    for (const rij of Array.isArray(data) ? data : []) {
      const id = leesTekstVeld(rij, 'id')
      if (id === null) continue
      kaart.set(id, {
        titel: leesTekstVeld(rij, 'titel'),
        tekst: leesTekstVeld(rij, 'tekst') ?? '',
      })
    }
  }
  return { ok: true, waarde: kaart }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────
// Geen cast: de database is een systeemgrens als elke andere. Zie `notities.ts`.

function leesTekstVeld(rij: unknown, veld: string): string | null {
  if (typeof rij !== 'object' || rij === null) return null
  const waarde = (rij as Record<string, unknown>)[veld]
  if (typeof waarde !== 'string') return null
  const schoon = waarde.trim()
  return schoon.length > 0 ? schoon : null
}

/** Een rij zonder bron of doel_titel is onbruikbaar en valt weg. */
function leesLinkRijen(rijen: readonly unknown[]): LinkRij[] {
  const uit: LinkRij[] = []
  for (const rij of rijen) {
    const bron = leesTekstVeld(rij, 'bron_id')
    const titel = leesTekstVeld(rij, 'doel_titel')
    const sleutel = leesTekstVeld(rij, 'doel_sleutel')
    if (bron === null || titel === null || sleutel === null) continue
    uit.push({
      bron_id: bron,
      doel_id: leesTekstVeld(rij, 'doel_id'),
      doel_titel: titel,
      doel_sleutel: sleutel,
    })
  }
  return uit
}

function inBrokken<T>(lijst: readonly T[], grootte: number): T[][] {
  const uit: T[][] = []
  for (let i = 0; i < lijst.length; i += grootte) uit.push(lijst.slice(i, i + grootte))
  return uit
}
