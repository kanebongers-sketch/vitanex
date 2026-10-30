// ─── Fit Factory Club, ledenapp: gegevens voor een lid (SERVER) ─────────────
// Alles wat de voorvertoning van de ledenapp nodig heeft, in een paar gerichte
// queries. Geen bedragen: abonnement en betalingen staan in Sportivity.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lid } from '@/lib/club/kern/lid'
import { alsRij, datum, getal, ingeslotenNaam, tekst } from '@/lib/club/cijfers/rijen'
import { dagSleutel, dagStart, plusDagen } from '@/lib/club/cijfers/tijd'
import { appRegelsUitJson, bezoekenDezeMaand, wekenOpRij, type AppRegels, type MijnStatus } from './regels'
import { notitieVoorLid } from '@/lib/club/training/voorstel-uitleg'
import { isMaker, kiesActief, type Maker } from '@/lib/club/training/lid-schemas/regels'
import { historiePerOefening, oefeningUitRij, perDag, type AppLog, type AppSchemaDag, type OefeningHistorie, type SetLogRij } from './schema'

export interface AppLes {
  id: string
  naam: string
  omschrijving: string | null
  intensiteit: number | null
  zaal: string | null
  instructeur: string | null
  /** ISO */
  start: string
  eind: string
  capaciteit: number
  bezet: number
  wachtlijst: number
  geannuleerd: boolean
  mijn: { reserveringId: string; status: MijnStatus; wachtpositie: number | null } | null
}

export interface AppSchema {
  id: string
  naam: string
  doel: string | null
  weken: number | null
  /** De notitie voor het lid (zonder de regels die alleen voor de trainer zijn, zie notitieVoorLid). */
  notitie: string | null
  dagen: AppSchemaDag[]
  /** Van de trainer of zelf gemaakt door het lid (migratie 472). */
  maker: Maker
}

export interface LidAppData {
  regels: AppRegels
  bezoekenMaand: number
  wekenOpRij: number
  lessen: AppLes[]
  schema: AppSchema | null
  logs: AppLog[]
  /** Per oefening (club_oefeningen.id) de vorige keer en het beste resultaat. */
  historie: Record<string, OefeningHistorie>
  meldingen: string[]
}

const DAG_MS = 86_400_000

function isMijnStatus(v: unknown): v is MijnStatus {
  return v === 'geboekt' || v === 'wachtlijst' || v === 'aanwezig' || v === 'no_show' || v === 'geannuleerd'
}

async function haalLessen(admin: SupabaseClient, userId: string, lid: Lid, nu: Date, dagen: number) {
  const tot = dagStart(plusDagen(dagSleutel(nu), dagen + 1))
  const { data, error } = await admin
    .from('club_lessen')
    .select('id, start_op, eind_op, capaciteit, status, club_lestypen(naam, omschrijving, intensiteit), club_zalen(naam), club_medewerkers(naam)')
    .eq('user_id', userId)
    .eq('vestiging', lid.vestiging)
    .gte('eind_op', nu.toISOString())
    .lt('start_op', tot.toISOString())
    .order('start_op')
    .limit(200)
  if (error) return { lessen: [] as AppLes[], fout: error.message }
  const basis = (data ?? []).flatMap((v) => {
    const r = alsRij(v)
    const id = r ? tekst(r.id) : null
    const start = r ? datum(r.start_op) : null
    const eind = r ? datum(r.eind_op) : null
    const capaciteit = r ? getal(r.capaciteit) : null
    if (!r || !id || !start || !eind || capaciteit === null) return []
    const lt = alsRij(Array.isArray(r.club_lestypen) ? r.club_lestypen[0] : r.club_lestypen)
    return [{ id, start, eind, capaciteit, geannuleerd: r.status === 'geannuleerd', naam: ingeslotenNaam(r.club_lestypen) ?? 'Les', omschrijving: lt ? tekst(lt.omschrijving) : null, intensiteit: lt ? getal(lt.intensiteit) : null, zaal: ingeslotenNaam(r.club_zalen), instructeur: ingeslotenNaam(r.club_medewerkers) }]
  })
  if (basis.length === 0) return { lessen: [] as AppLes[], fout: null }
  const res = await admin.from('club_reserveringen').select('id, les_id, lid_id, status, wachtpositie').eq('user_id', userId).in('les_id', basis.map((l) => l.id))
  const rijen = (res.data ?? []).map(alsRij).filter((r): r is Record<string, unknown> => r !== null)
  const lessen: AppLes[] = basis.map((l) => {
    const hier = rijen.filter((r) => r.les_id === l.id)
    const eigen = hier.find((r) => r.lid_id === lid.id && isMijnStatus(r.status))
    return {
      ...l,
      start: l.start.toISOString(),
      eind: l.eind.toISOString(),
      bezet: hier.filter((r) => r.status === 'geboekt' || r.status === 'aanwezig' || r.status === 'no_show').length,
      wachtlijst: hier.filter((r) => r.status === 'wachtlijst').length,
      mijn: eigen && typeof eigen.id === 'string' && isMijnStatus(eigen.status) ? { reserveringId: eigen.id, status: eigen.status, wachtpositie: getal(eigen.wachtpositie) } : null,
    }
  })
  return { lessen, fout: res.error?.message ?? null }
}

async function haalSchema(admin: SupabaseClient, userId: string, lidId: string): Promise<{ schema: AppSchema | null; fout: string | null }> {
  // Alle actieve schema's (van de trainer en eigen schema's van het lid); de app
  // toont het laatst gekozen schema (lid-schemas/regels.ts, migratie 472).
  const { data, error } = await admin
    .from('club_schemas')
    .select('id, naam, doel, weken, notitie, maker, aangemaakt_op, actief_gekozen_op')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .eq('status', 'actief')
    .order('aangemaakt_op', { ascending: false })
    .limit(50)
  const kandidaten = (data ?? []).flatMap((v) => {
    const k = alsRij(v)
    const kId = k ? tekst(k.id) : null
    return k && kId && isMaker(k.maker) ? [{ rij: k, id: kId, maker: k.maker, aangemaaktOp: tekst(k.aangemaakt_op) ?? '', actiefGekozenOp: tekst(k.actief_gekozen_op) }] : []
  })
  const gekozen = kiesActief(kandidaten)
  const r = gekozen?.rij ?? null
  const id = gekozen?.id ?? null
  if (error || !r || !id || !gekozen) return { schema: null, fout: error?.message ?? null }
  const oef = await admin
    .from('club_schema_oefeningen')
    .select('id, oefening_id, dag, volgorde, sets, herhalingen, gewicht_kg, rust_sec, notitie, groep, tijd_sec, rpe, rir, tempo, club_oefeningen(naam, spiergroep, spieren_primair, spieren_secundair, uitleg, aandachtspunten, beeld_start, beeld_eind, beeld_bron)')
    .eq('user_id', userId)
    .eq('schema_id', id)
    .order('dag')
    .order('volgorde')
  const oefeningen = (oef.data ?? []).map(oefeningUitRij).filter((o) => o !== null)
  return {
    schema: { id, naam: tekst(r.naam) ?? 'Schema', doel: tekst(r.doel), weken: getal(r.weken), notitie: notitieVoorLid(tekst(r.notitie)), dagen: perDag(oefeningen), maker: gekozen.maker },
    fout: oef.error?.message ?? null,
  }
}

/** De set-logs van dit lid voor de oefeningen in het schema (laatste 120 dagen). */
async function haalHistorie(admin: SupabaseClient, userId: string, lidId: string, schema: AppSchema | null, nu: Date): Promise<{ historie: Record<string, OefeningHistorie>; fout: string | null }> {
  const ids = [...new Set((schema?.dagen ?? []).flatMap((d) => d.oefeningen.map((o) => o.oefeningId)))]
  if (ids.length === 0) return { historie: {}, fout: null }
  const { data, error } = await admin
    .from('club_set_logs')
    .select('oefening_id, trainingslog_id, op, set_nr, herhalingen, gewicht_kg, tijd_sec')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .in('oefening_id', ids)
    .gte('op', new Date(nu.getTime() - 120 * DAG_MS).toISOString())
    .order('op', { ascending: false })
    .limit(3000)
  const rijen: SetLogRij[] = (data ?? []).flatMap((v) => {
    const r = alsRij(v)
    const oefeningId = r ? tekst(r.oefening_id) : null
    const trainingId = r ? tekst(r.trainingslog_id) : null
    const op = r ? datum(r.op) : null
    const setNr = r ? getal(r.set_nr) : null
    if (!r || !oefeningId || !trainingId || !op || setNr === null) return []
    return [{ oefeningId, trainingId, op: op.toISOString(), setNr, herhalingen: getal(r.herhalingen), gewichtKg: getal(r.gewicht_kg), tijdSec: getal(r.tijd_sec) }]
  })
  return { historie: historiePerOefening(rijen), fout: error?.message ?? null }
}

async function haalBezoek(admin: SupabaseClient, userId: string, lidId: string, nu: Date) {
  const { data, error } = await admin
    .from('club_checkins')
    .select('op')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .gte('op', new Date(nu.getTime() - 120 * DAG_MS).toISOString())
    .order('op', { ascending: false })
    .limit(1000)
  return { bezoek: (data ?? []).map((v) => datum(alsRij(v)?.op)).filter((d): d is Date => d !== null), fout: error?.message ?? null }
}

async function haalLogs(admin: SupabaseClient, userId: string, lidId: string, nu: Date) {
  const { data, error } = await admin
    .from('club_trainingslog')
    .select('id, schema_id, dag, op')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .gte('op', new Date(nu.getTime() - 60 * DAG_MS).toISOString())
    .order('op', { ascending: false })
    .limit(200)
  const logs: AppLog[] = (data ?? []).flatMap((v) => {
    const r = alsRij(v)
    const id = r ? tekst(r.id) : null
    const op = r ? datum(r.op) : null
    return r && id && op ? [{ id, schemaId: tekst(r.schema_id), dag: getal(r.dag), op: op.toISOString() }] : []
  })
  return { logs, fout: error?.message ?? null }
}

export async function haalLidApp(admin: SupabaseClient, userId: string, lid: Lid, nu = new Date()): Promise<LidAppData> {
  // De check-in QR-code haalt de app zelf (wisselt elke 30 seconden): /api/club/lid/checkin-code.
  const [vestiging, bezoek, lessen, schema, logs] = await Promise.all([
    admin.from('club_vestigingen').select('regels').eq('user_id', userId).eq('vestiging', lid.vestiging).maybeSingle(),
    haalBezoek(admin, userId, lid.id, nu),
    haalLessen(admin, userId, lid, nu, 7),
    haalSchema(admin, userId, lid.id),
    haalLogs(admin, userId, lid.id, nu),
  ])
  const historie = await haalHistorie(admin, userId, lid.id, schema.schema, nu)
  const fouten = [vestiging.error?.message, bezoek.fout, lessen.fout, schema.fout, logs.fout, historie.fout].filter(Boolean)
  for (const f of fouten) console.error('[club/app] laden mislukt', f)
  return {
    regels: appRegelsUitJson(alsRij(vestiging.data)?.regels),
    bezoekenMaand: bezoekenDezeMaand(bezoek.bezoek, nu),
    wekenOpRij: wekenOpRij(bezoek.bezoek, nu),
    lessen: lessen.lessen,
    schema: schema.schema,
    logs: logs.logs,
    historie: historie.historie,
    meldingen: fouten.length > 0 ? ['Niet alles kon worden geladen. Probeer het zo opnieuw.'] : [],
  }
}
