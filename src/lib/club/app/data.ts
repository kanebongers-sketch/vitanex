// ─── Fit Factory Club, ledenapp: gegevens voor een lid (SERVER) ─────────────
// Alles wat de voorvertoning van de ledenapp nodig heeft, in een paar gerichte
// queries. Geen bedragen: abonnement en betalingen staan in Sportivity.

import type { SupabaseClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { FIT_FACTORY } from '@/components/marketing/theme'
import type { Lid } from '@/lib/club/kern/lid'
import { alsRij, datum, getal, ingeslotenNaam, tekst } from '@/lib/club/cijfers/rijen'
import { dagSleutel, dagStart, plusDagen } from '@/lib/club/cijfers/tijd'
import { appRegelsUitJson, bezoekenDezeMaand, wekenOpRij, type AppRegels, type MijnStatus } from './regels'
import { oefeningUitRij, perDag, type AppLog, type AppSchemaDag } from './schema'

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
  notitie: string | null
  dagen: AppSchemaDag[]
}

export interface LidAppData {
  regels: AppRegels
  bezoekenMaand: number
  wekenOpRij: number
  lessen: AppLes[]
  schema: AppSchema | null
  logs: AppLog[]
  /** De QR-code als data-URL (SVG), voor een gewone <img>. */
  qrBron: string | null
  meldingen: string[]
}

const DAG_MS = 86_400_000
/** Scanners lezen een QR het best als donker op wit. */
const QR_LICHT = '#ffffff'

function isMijnStatus(v: unknown): v is MijnStatus {
  return v === 'geboekt' || v === 'wachtlijst' || v === 'aanwezig' || v === 'no_show' || v === 'geannuleerd'
}

/** De QR-code als SVG-data-URL. Bevat alleen het qr_token, nooit naam of lidnummer. */
async function qrBron(token: string | null): Promise<string | null> {
  if (!token) return null
  try {
    const svg = await QRCode.toString(token, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: FIT_FACTORY.zwart, light: QR_LICHT } })
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
  } catch (e) {
    console.error('[club/app] QR maken mislukt', e instanceof Error ? e.message : e)
    return null
  }
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
  const { data, error } = await admin
    .from('club_schemas')
    .select('id, naam, doel, weken, notitie')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .eq('status', 'actief')
    .order('bijgewerkt_op', { ascending: false })
    .limit(1)
    .maybeSingle()
  const r = alsRij(data)
  const id = r ? tekst(r.id) : null
  if (error || !r || !id) return { schema: null, fout: error?.message ?? null }
  const oef = await admin
    .from('club_schema_oefeningen')
    .select('id, dag, volgorde, sets, herhalingen, gewicht_kg, rust_sec, notitie, club_oefeningen(naam, spiergroep, aandachtspunten)')
    .eq('user_id', userId)
    .eq('schema_id', id)
    .order('dag')
    .order('volgorde')
  const oefeningen = (oef.data ?? []).map(oefeningUitRij).filter((o) => o !== null)
  return {
    schema: { id, naam: tekst(r.naam) ?? 'Schema', doel: tekst(r.doel), weken: getal(r.weken), notitie: tekst(r.notitie), dagen: perDag(oefeningen) },
    fout: oef.error?.message ?? null,
  }
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
  const [vestiging, token, bezoek, lessen, schema, logs] = await Promise.all([
    admin.from('club_vestigingen').select('regels').eq('vestiging', lid.vestiging).maybeSingle(),
    admin.from('club_leden').select('qr_token').eq('user_id', userId).eq('id', lid.id).maybeSingle(),
    haalBezoek(admin, userId, lid.id, nu),
    haalLessen(admin, userId, lid, nu, 7),
    haalSchema(admin, userId, lid.id),
    haalLogs(admin, userId, lid.id, nu),
  ])
  const fouten = [vestiging.error?.message, token.error?.message, bezoek.fout, lessen.fout, schema.fout, logs.fout].filter(Boolean)
  for (const f of fouten) console.error('[club/app] laden mislukt', f)
  return {
    regels: appRegelsUitJson(alsRij(vestiging.data)?.regels),
    bezoekenMaand: bezoekenDezeMaand(bezoek.bezoek, nu),
    wekenOpRij: wekenOpRij(bezoek.bezoek, nu),
    lessen: lessen.lessen,
    schema: schema.schema,
    logs: logs.logs,
    qrBron: await qrBron(tekst(alsRij(token.data)?.qr_token)),
    meldingen: fouten.length > 0 ? ['Niet alles kon worden geladen.'] : [],
  }
}
