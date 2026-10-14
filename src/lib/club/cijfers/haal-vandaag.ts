// ─── Fit Factory Club: Vandaag ophalen (SERVER) ─────────────────────────────
// Gerichte queries tegelijk voor een vestiging, daarna puur rekenen. Leden met
// risico komen uit de behoudsscore (haal-risico.ts), dezelfde als de ledenlijst.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalRisico } from './haal-risico'
import { haalWerkvloer, type Werkvloer } from './haal-werkvloer'
import { haalAlles } from './pagina'
import type { RisicoLid } from './risico'
import { alsRij, dag, datum, getal, ingeslotenNaam, isLidStatus, rijenVan, tekst } from './rijen'
import { dagSleutel, dagStart, maandagVan, plusDagen, tijdNl } from './tijd'
import {
  jarigen,
  nieuwDezeWeek,
  nuBinnen,
  vergelijkMetVorigeWeek,
  type CheckinMoment,
  type Jarige,
  type VandaagLid,
  type Verschil,
} from './vandaag'

/** Zoveel leden met risico staan er op Vandaag; de rest staat in de ledenlijst. */
export const RISICO_ZICHTBAAR = 8

export interface VandaagLes {
  id: string
  naam: string
  zaal: string | null
  instructeur: string | null
  start: Date
  eind: Date
  capaciteit: number
  geannuleerd: boolean
  geboekt: number
  wachtlijst: number
}

export interface VandaagLead {
  id: string
  naam: string
  status: string
  opvolgenOp: string | null
  proeflesOp: Date | null
  interesse: string | null
}

export interface Vandaag {
  vandaag: string
  nu: Date
  nuBinnen: number
  checkinsVandaag: number
  checkinsVorigeWeek: number
  /** Null als er vorige week op deze dag geen check-ins zijn geregistreerd. */
  verschil: Verschil | null
  lessen: VandaagLes[]
  proeflessen: VandaagLead[]
  opvolgen: VandaagLead[]
  opvolgenTotaal: number
  risico: RisicoLid[]
  /** Laatste bezoek ooit voor zichtbare risicoleden zonder bezoek in 12 weken. */
  laatsteOoit: Map<string, Date | null>
  werkvloer: Werkvloer
  nieuw: VandaagLid[]
  jarig: Jarige[]
  meldingen: string[]
}

function vandaagLidUitRij(v: unknown): VandaagLid | null {
  const r = alsRij(v)
  const id = r ? tekst(r.id) : null
  const voornaam = r ? tekst(r.voornaam) : null
  const achternaam = r ? tekst(r.achternaam) : null
  if (!r || !id || !voornaam || !achternaam || !isLidStatus(r.status)) return null
  return { id, voornaam, achternaam, status: r.status, lidSinds: dag(r.lid_sinds), einddatum: dag(r.einddatum), geboortedatum: dag(r.geboortedatum), abonnement: tekst(r.abonnement) }
}

function leadUitRij(v: unknown): VandaagLead | null {
  const r = alsRij(v)
  const id = r ? tekst(r.id) : null
  const naam = r ? tekst(r.naam) : null
  if (!r || !id || !naam) return null
  return { id, naam, status: tekst(r.status) ?? 'nieuw', opvolgenOp: dag(r.opvolgen_op), proeflesOp: datum(r.proefles_op), interesse: tekst(r.interesse) }
}

function lesUitRij(v: unknown): Omit<VandaagLes, 'geboekt' | 'wachtlijst'> | null {
  const r = alsRij(v)
  const id = r ? tekst(r.id) : null
  const start = r ? datum(r.start_op) : null
  const eind = r ? datum(r.eind_op) : null
  const capaciteit = r ? getal(r.capaciteit) : null
  if (!r || !id || !start || !eind || capaciteit === null) return null
  return {
    id,
    naam: ingeslotenNaam(r.club_lestypen) ?? 'Les',
    zaal: ingeslotenNaam(r.club_zalen),
    instructeur: ingeslotenNaam(r.club_medewerkers),
    start,
    eind,
    capaciteit,
    geannuleerd: r.status === 'geannuleerd',
  }
}

async function haalLessenVandaag(admin: SupabaseClient, userId: string, vestiging: Vestiging, van: Date, tot: Date) {
  const { data, error } = await admin
    .from('club_lessen')
    .select('id, start_op, eind_op, capaciteit, status, club_lestypen(naam), club_zalen(naam), club_medewerkers(naam)')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('start_op', van.toISOString())
    .lt('start_op', tot.toISOString())
    .order('start_op')
  if (error) return { lessen: [] as VandaagLes[], fout: error.message }
  const lessen = rijenVan(data ?? [], lesUitRij)
  if (lessen.length === 0) return { lessen: [] as VandaagLes[], fout: null }
  const res = await admin.from('club_reserveringen').select('les_id, status').eq('user_id', userId).in('les_id', lessen.map((l) => l.id))
  const telling = new Map<string, { geboekt: number; wachtlijst: number }>()
  for (const v of res.data ?? []) {
    const r = alsRij(v)
    const lesId = r ? tekst(r.les_id) : null
    if (!r || !lesId) continue
    const t = telling.get(lesId) ?? { geboekt: 0, wachtlijst: 0 }
    const bezet = r.status === 'geboekt' || r.status === 'aanwezig' || r.status === 'no_show'
    telling.set(lesId, { geboekt: t.geboekt + (bezet ? 1 : 0), wachtlijst: t.wachtlijst + (r.status === 'wachtlijst' ? 1 : 0) })
  }
  return { lessen: lessen.map((l) => ({ ...l, ...(telling.get(l.id) ?? { geboekt: 0, wachtlijst: 0 }) })), fout: res.error?.message ?? null }
}

const LEAD_KOLOMMEN = 'id, naam, status, opvolgen_op, proefles_op, interesse'

/** Leads om vandaag op te volgen (eerste 6 plus het totaal) en de proeflessen van vandaag. */
async function haalLeadsVandaag(admin: SupabaseClient, userId: string, vestiging: Vestiging, vandaag: string, start: Date, morgen: Date) {
  const basis = () => admin.from('club_leads').select(LEAD_KOLOMMEN, { count: 'exact' }).eq('user_id', userId).eq('vestiging', vestiging)
  const [opvolgen, proef] = await Promise.all([
    basis().in('status', ['nieuw', 'contact', 'proefles_geweest']).lte('opvolgen_op', vandaag).order('opvolgen_op').limit(6),
    basis().gte('proefles_op', start.toISOString()).lt('proefles_op', morgen.toISOString()).order('proefles_op'),
  ])
  return {
    opvolgen: rijenVan(opvolgen.data ?? [], leadUitRij),
    totaal: opvolgen.count ?? 0,
    proef: rijenVan(proef.data ?? [], leadUitRij),
    fout: opvolgen.error?.message ?? proef.error?.message ?? null,
  }
}

function checkinUitRij(v: unknown): CheckinMoment | null {
  const r = alsRij(v)
  const op = r ? datum(r.op) : null
  return r && op ? { lidId: tekst(r.lid_id), op } : null
}

function telVraag(admin: SupabaseClient, userId: string, vestiging: Vestiging, van: Date, tot: Date) {
  return admin
    .from('club_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('op', van.toISOString())
    .lt('op', tot.toISOString())
}

function haalLedenVandaag(admin: SupabaseClient, userId: string, vestiging: Vestiging) {
  return haalAlles((a, b) =>
    admin
      .from('club_leden')
      .select('id, voornaam, achternaam, status, lid_sinds, einddatum, geboortedatum, abonnement')
      .eq('user_id', userId)
      .eq('vestiging', vestiging)
      .order('id')
      .range(a, b),
  )
}

export async function haalVandaag(admin: SupabaseClient, userId: string, vestiging: Vestiging, nu = new Date()): Promise<Vandaag> {
  const vandaag = dagSleutel(nu)
  const start = dagStart(vandaag)
  const morgen = dagStart(plusDagen(vandaag, 1))
  const vorigeStart = dagStart(plusDagen(vandaag, -7))
  const vorigeNu = new Date(vorigeStart.getTime() + (nu.getTime() - start.getTime()))
  const [checkins, vorigeTotNu, vorigeDag, lessen, leads, leden, risico, werkvloer] = await Promise.all([
    haalAlles((a, b) => admin.from('club_checkins').select('lid_id, op').eq('user_id', userId).eq('vestiging', vestiging).gte('op', start.toISOString()).order('op').range(a, b)),
    telVraag(admin, userId, vestiging, vorigeStart, new Date(vorigeNu.getTime() + 1)),
    telVraag(admin, userId, vestiging, vorigeStart, dagStart(plusDagen(vandaag, -6))),
    haalLessenVandaag(admin, userId, vestiging, start, morgen),
    haalLeadsVandaag(admin, userId, vestiging, vandaag, start, morgen),
    haalLedenVandaag(admin, userId, vestiging),
    haalRisico(admin, userId, vestiging, nu, RISICO_ZICHTBAAR),
    haalWerkvloer(admin, userId, vestiging, vandaag, tijdNl(nu)),
  ])
  const ops = rijenVan(checkins.rijen, checkinUitRij)
  const ledenLijst = rijenVan(leden.rijen, vandaagLidUitRij)
  const fouten = [checkins.fout, vorigeTotNu.error?.message, vorigeDag.error?.message, lessen.fout, leads.fout, leden.fout]
  for (const f of fouten) if (f) console.error('[club/vandaag] laden mislukt', f)
  const meldingen = [
    ...(fouten.some(Boolean) ? ['Niet alles kon worden geladen; sommige cijfers kunnen ontbreken.'] : []),
    ...(risico.fout ? [risico.fout] : []),
  ]
  const toenTotNu = vorigeTotNu.count ?? 0
  return {
    vandaag,
    nu,
    nuBinnen: nuBinnen(ops, nu),
    checkinsVandaag: ops.length,
    checkinsVorigeWeek: toenTotNu,
    verschil: vorigeDag.error ? null : vergelijkMetVorigeWeek(ops.length, toenTotNu, vorigeDag.count ?? 0),
    lessen: lessen.lessen,
    proeflessen: leads.proef,
    opvolgen: leads.opvolgen,
    opvolgenTotaal: leads.totaal,
    risico: risico.lijst,
    laatsteOoit: risico.laatsteOoit,
    werkvloer,
    nieuw: nieuwDezeWeek(ledenLijst, maandagVan(vandaag), vandaag),
    jarig: jarigen(ledenLijst, vandaag),
    meldingen,
  }
}
