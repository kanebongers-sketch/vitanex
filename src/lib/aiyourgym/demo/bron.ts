// ─── AI Your Gym, demo: de rijen van de Voorbeeld Gym (SERVER-ONLY) ──────────
// De live demo is een alleen-lezen rondleiding langs de echte schermen van de
// demo-sportschool. Veiligheid zit in deze ene functie:
// - elke query filtert hard op DEMO_ORG_ID (vaste constante, nooit uit de URL);
// - op tabellen met een demo-kolom ook op demo = true;
// - de sportschool zelf moet als demo gemarkeerd zijn, anders geen demo;
// - alleen lezen (select), geen enkele schrijfactie, geen API-route;
// - geen e-mail, telefoon, geboortedatum, QR-token of gezondheidsvelden.
// Alleen aan te roepen vanuit een servercomponent.

import type { SupabaseClient } from '@supabase/supabase-js'
import { dagSleutel, dagStart, maandagVan, plusDagen } from '@/lib/club/cijfers/tijd'
import type { DemoRuw, Naam, RuwChallenge, RuwDienst, RuwLead, RuwLes, RuwLid, RuwMeting, RuwOefening, RuwReservering, RuwSchema, RuwVoeding, Vestiging } from './model'

/** De demo-sportschool "Voorbeeld Gym" (migratie 403). */
export const DEMO_ORG_ID = 'de000000-0000-4000-8000-0000000000c1'

const DAGEN_GRAFIEK = 14
const DAGEN_LID = 120
const OPEN_LEAD = ['nieuw', 'contact', 'proefles']

interface Antwoord<T> {
  data: T | null
  error: { message: string } | null
}

function rijen<T>(a: Antwoord<T[]>, wat: string): T[] {
  if (a.error) throw new Error(`Demo: ${wat} ophalen mislukt: ${a.error.message}`)
  return a.data ?? []
}

function aantal(a: { count: number | null; error: { message: string } | null }, wat: string): number {
  if (a.error) throw new Error(`Demo: ${wat} tellen mislukt: ${a.error.message}`)
  return a.count ?? 0
}

/** Een query op een club_*-tabel van de demo-sportschool. */
function tabel(admin: SupabaseClient, naam: string) {
  return {
    rijen: (kolommen: string) => admin.from(naam).select(kolommen).eq('user_id', DEMO_ORG_ID),
    demo: (kolommen: string) => admin.from(naam).select(kolommen).eq('user_id', DEMO_ORG_ID).eq('demo', true),
    tel: () => admin.from(naam).select('id', { count: 'exact', head: true }).eq('user_id', DEMO_ORG_ID).eq('demo', true),
  }
}

async function organisatie(admin: SupabaseClient): Promise<DemoRuw['organisatie'] | null> {
  const { data, error } = await admin.from('club_organisaties').select('naam, kleur_accent, thema').eq('id', DEMO_ORG_ID).eq('demo', true).maybeSingle()
  if (error) throw new Error(`Demo: sportschool ophalen mislukt: ${error.message}`)
  if (!data) return null
  const r = data as { naam: string; kleur_accent: string | null; thema: string | null }
  return { naam: r.naam, kleur: r.kleur_accent ?? '#1FA77A', thema: r.thema === 'licht' ? 'licht' : 'donker' }
}

async function peildagVan(admin: SupabaseClient, vestiging: string, nu: Date): Promise<string> {
  const a = (await tabel(admin, 'club_checkins').demo('op').eq('vestiging', vestiging).lte('op', nu.toISOString()).order('op', { ascending: false }).limit(1)) as Antwoord<{ op: string }[]>
  const laatste = rijen(a, 'laatste bezoek')[0]
  return dagSleutel(laatste ? new Date(laatste.op) : nu)
}

async function bezoekenOp(admin: SupabaseClient, vestiging: string, dag: string): Promise<number> {
  const a = await tabel(admin, 'club_checkins').tel().eq('vestiging', vestiging).gte('op', dagStart(dag).toISOString()).lt('op', dagStart(plusDagen(dag, 1)).toISOString())
  return aantal(a, 'bezoeken')
}

async function maandCijfers(admin: SupabaseClient, vestiging: string, peildag: string): Promise<DemoRuw['maand']> {
  const van = dagStart(`${peildag.slice(0, 7)}-01`).toISOString()
  const tot = dagStart(plusDagen(peildag, 1)).toISOString()
  const bezoek = (bron?: string) => {
    const q = tabel(admin, 'club_checkins').tel().eq('vestiging', vestiging).gte('op', van).lt('op', tot)
    return bron ? q.eq('bron', bron) : q
  }
  const [bezoeken, qr, bandje, balie, nieuw, actief] = await Promise.all([
    bezoek(),
    bezoek('qr'),
    bezoek('bandje'),
    bezoek('balie'),
    tabel(admin, 'club_leden').tel().eq('vestiging', vestiging).gte('lid_sinds', `${peildag.slice(0, 7)}-01`).lte('lid_sinds', peildag),
    tabel(admin, 'club_leden').tel().eq('vestiging', vestiging).eq('status', 'actief'),
  ])
  return {
    bezoeken: aantal(bezoeken, 'bezoeken'),
    perBron: { qr: aantal(qr, 'bezoeken'), bandje: aantal(bandje, 'bezoeken'), balie: aantal(balie, 'bezoeken') },
    nieuweLeden: aantal(nieuw, 'nieuwe leden'),
    actieveLeden: aantal(actief, 'actieve leden'),
  }
}

async function lessenEnReserveringen(admin: SupabaseClient, vestiging: string, peildag: string) {
  const maandBegin = `${peildag.slice(0, 7)}-01`
  const maandag = maandagVan(peildag)
  const van = maandBegin < maandag ? maandBegin : maandag
  const lessen = rijen(
    (await tabel(admin, 'club_lessen')
      .demo('id, vestiging, start_op, eind_op, capaciteit, lestype_id, zaal_id')
      .eq('vestiging', vestiging)
      .neq('status', 'geannuleerd')
      .gte('start_op', dagStart(van).toISOString())
      .lt('start_op', dagStart(plusDagen(maandag, 7)).toISOString())
      .order('start_op')) as Antwoord<RuwLes[]>,
    'lessen',
  )
  const ids = lessen.map((l) => l.id)
  const reserveringen = ids.length
    ? rijen((await tabel(admin, 'club_reserveringen').demo('les_id, lid_id, status').in('les_id', ids).limit(5000)) as Antwoord<RuwReservering[]>, 'reserveringen')
    : []
  return { lessen, reserveringen }
}

/** Het lid voor de ledenkaart: een actief lid met een schema, liefst ook met metingen en voeding. */
async function kiesLid(admin: SupabaseClient, vestiging: string): Promise<{ lid: RuwLid; schemaId: string | null } | null> {
  const [schemas, metingen, voeding] = await Promise.all([
    tabel(admin, 'club_schemas').demo('id, lid_id').eq('status', 'actief').order('aangemaakt_op'),
    tabel(admin, 'club_metingen').demo('lid_id'),
    tabel(admin, 'club_voedingsplannen').demo('lid_id'),
  ])
  const metMeting = new Set(rijen(metingen as Antwoord<{ lid_id: string }[]>, 'metingen').map((m) => m.lid_id))
  const metVoeding = new Set(rijen(voeding as Antwoord<{ lid_id: string }[]>, 'voeding').map((v) => v.lid_id))
  const lijst = rijen(schemas as Antwoord<{ id: string; lid_id: string }[]>, 'schema’s')
  const score = (lidId: string) => (metMeting.has(lidId) ? 2 : 0) + (metVoeding.has(lidId) ? 1 : 0)
  const kandidaten = [...lijst].sort((a, b) => score(b.lid_id) - score(a.lid_id))
  if (kandidaten.length === 0) return null
  const leden = rijen(
    (await tabel(admin, 'club_leden')
      .demo('id, voornaam, achternaam, vestiging, status, abonnement, lid_sinds')
      .in('id', kandidaten.map((k) => k.lid_id))
      .eq('status', 'actief')) as Antwoord<RuwLid[]>,
    'leden',
  )
  const opId = new Map(leden.map((l) => [l.id, l]))
  // Liefst een lid van de hoofdvestiging, anders het beste lid van een andere vestiging.
  const keuze = kandidaten.find((k) => opId.get(k.lid_id)?.vestiging === vestiging) ?? kandidaten.find((k) => opId.has(k.lid_id))
  const lid = keuze ? opId.get(keuze.lid_id) : undefined
  return keuze && lid ? { lid, schemaId: keuze.id } : null
}

async function schemaVan(admin: SupabaseClient, schemaId: string | null): Promise<{ schema: RuwSchema | null; oefeningen: RuwOefening[] }> {
  if (!schemaId) return { schema: null, oefeningen: [] }
  const [s, regels] = await Promise.all([
    tabel(admin, 'club_schemas').demo('naam, doel, weken, dag_titels').eq('id', schemaId).maybeSingle(),
    tabel(admin, 'club_schema_oefeningen').rijen('dag, volgorde, sets, herhalingen, rust_sec, oefening_id').eq('schema_id', schemaId),
  ])
  const sa = s as Antwoord<RuwSchema>
  if (sa.error) throw new Error(`Demo: schema ophalen mislukt: ${sa.error.message}`)
  const schema = sa.data
  const r = rijen(regels as Antwoord<(Omit<RuwOefening, 'naam' | 'beeld_start' | 'beeld_eind'> & { oefening_id: string })[]>, 'schema-oefeningen')
  const ids = [...new Set(r.map((x) => x.oefening_id))]
  const oef = ids.length
    ? rijen((await tabel(admin, 'club_oefeningen').rijen('id, naam, beeld_start, beeld_eind').in('id', ids)) as Antwoord<{ id: string; naam: string; beeld_start: string | null; beeld_eind: string | null }[]>, 'oefeningen')
    : []
  const opId = new Map(oef.map((o) => [o.id, o]))
  const oefeningen = r.flatMap((x) => {
    const o = opId.get(x.oefening_id)
    return o ? [{ dag: x.dag, volgorde: x.volgorde, sets: x.sets, herhalingen: x.herhalingen, rust_sec: x.rust_sec, naam: o.naam, beeld_start: o.beeld_start, beeld_eind: o.beeld_eind }] : []
  })
  return { schema, oefeningen }
}

async function lidGegevens(admin: SupabaseClient, lid: RuwLid, schemaId: string | null, peildag: string, nu: Date): Promise<DemoRuw['lid']> {
  const [bezoek, metingen, voeding, geboekt, schema] = await Promise.all([
    tabel(admin, 'club_checkins').demo('op').eq('lid_id', lid.id).gte('op', dagStart(plusDagen(peildag, -DAGEN_LID)).toISOString()).lte('op', nu.toISOString()),
    tabel(admin, 'club_metingen').demo('datum, gewicht_kg, buikomtrek_cm').eq('lid_id', lid.id).order('datum', { ascending: false }).limit(12),
    tabel(admin, 'club_voedingsplannen').demo('doel, kcal, eiwit_g, koolhydraten_g, vet_g').eq('lid_id', lid.id).limit(1),
    tabel(admin, 'club_reserveringen').demo('les_id').eq('lid_id', lid.id).eq('status', 'geboekt'),
    schemaVan(admin, schemaId),
  ])
  const lesIds = rijen(geboekt as Antwoord<{ les_id: string }[]>, 'reserveringen van het lid').map((r) => r.les_id)
  const komend = lesIds.length
    ? rijen((await tabel(admin, 'club_lessen').demo('id, vestiging, start_op, eind_op, capaciteit, lestype_id, zaal_id').in('id', lesIds).gt('start_op', nu.toISOString()).order('start_op').limit(3)) as Antwoord<RuwLes[]>, 'komende lessen')
    : []
  return {
    rij: lid,
    bezoekDagen: [...new Set(rijen(bezoek as Antwoord<{ op: string }[]>, 'bezoeken van het lid').map((b) => dagSleutel(new Date(b.op))))],
    schema: schema.schema,
    oefeningen: schema.oefeningen,
    metingen: rijen(metingen as Antwoord<RuwMeting[]>, 'metingen'),
    voeding: rijen(voeding as Antwoord<RuwVoeding[]>, 'voeding')[0] ?? null,
    komendeLessen: komend,
  }
}

/**
 * Alles wat de demo toont, of null als de demo-sportschool er niet is (of niet
 * meer als demo gemarkeerd staat). Gooit bij een databasefout.
 */
export async function haalDemo(admin: SupabaseClient, nu: Date = new Date()): Promise<DemoRuw | null> {
  const org = await organisatie(admin)
  if (!org) return null
  const vestigingen = rijen((await tabel(admin, 'club_vestigingen').rijen('vestiging, naam, standaard').order('volgorde')) as Antwoord<Vestiging[]>, 'vestigingen')
  const hoofd = vestigingen.find((v) => v.standaard) ?? vestigingen[0]
  if (!hoofd) return null
  const peildag = await peildagVan(admin, hoofd.vestiging, nu)
  const grafiekDagen = Array.from({ length: DAGEN_GRAFIEK }, (_, i) => plusDagen(peildag, i - DAGEN_GRAFIEK + 1))

  const [lr, typen, zalen, mensen, diensten, leads, perDag, maand, gekozen, challenges] = await Promise.all([
    lessenEnReserveringen(admin, hoofd.vestiging, peildag),
    tabel(admin, 'club_lestypen').rijen('id, naam'),
    tabel(admin, 'club_zalen').rijen('id, naam'),
    tabel(admin, 'club_medewerkers').demo('id, naam'),
    tabel(admin, 'club_diensten').demo('vestiging, datum, begin, eind, medewerker_id').eq('vestiging', hoofd.vestiging).eq('datum', peildag),
    tabel(admin, 'club_leads').demo('naam, bron, status, vestiging').eq('vestiging', hoofd.vestiging).in('status', OPEN_LEAD).order('aangemaakt_op', { ascending: false }).limit(5),
    Promise.all(grafiekDagen.map(async (dag) => ({ dag, aantal: await bezoekenOp(admin, hoofd.vestiging, dag) }))),
    maandCijfers(admin, hoofd.vestiging, peildag),
    kiesLid(admin, hoofd.vestiging),
    tabel(admin, 'club_challenges').demo('titel, soort, doel, start_op, eind_op').is('gestopt_op', null).order('start_op'),
  ])
  if (!gekozen) return null

  return {
    organisatie: org,
    vestigingen,
    peildag,
    lessen: lr.lessen,
    reserveringen: lr.reserveringen,
    lestypen: rijen(typen as Antwoord<Naam[]>, 'lestypen'),
    zalen: rijen(zalen as Antwoord<Naam[]>, 'zalen'),
    medewerkers: rijen(mensen as Antwoord<Naam[]>, 'medewerkers'),
    diensten: rijen(diensten as Antwoord<RuwDienst[]>, 'diensten'),
    leads: rijen(leads as Antwoord<RuwLead[]>, 'leads'),
    bezoekenPerDag: perDag,
    maand,
    lid: await lidGegevens(admin, gekozen.lid, gekozen.schemaId, peildag, nu),
    challenges: rijen(challenges as Antwoord<RuwChallenge[]>, 'challenges'),
  }
}
