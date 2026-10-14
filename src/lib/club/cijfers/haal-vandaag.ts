// ─── Fit Factory Club: Vandaag ophalen (SERVER) ─────────────────────────────
// Zes gerichte queries tegelijk voor een vestiging, daarna puur rekenen.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/gedeeld/vestiging'
import { haalLaatsteBezoek } from './bronnen'
import { haalAlles } from './pagina'
import { alsRij, dag, datum, getal, ingeslotenNaam, isLidStatus, rijenVan, tekst } from './rijen'
import { dagSleutel, dagStart, maandagVan, plusDagen } from './tijd'
import {
  jarigen,
  nieuwDezeWeek,
  nuBinnen,
  risicoLeden,
  verschil,
  type Jarige,
  type RisicoLid,
  type VandaagLid,
  type Verschil,
} from './vandaag'

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
  verschil: Verschil
  lessen: VandaagLes[]
  proeflessen: VandaagLead[]
  opvolgen: VandaagLead[]
  opvolgenTotaal: number
  risico: RisicoLid[]
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

export async function haalVandaag(admin: SupabaseClient, userId: string, vestiging: Vestiging, nu = new Date()): Promise<Vandaag> {
  const vandaag = dagSleutel(nu)
  const start = dagStart(vandaag)
  const morgen = dagStart(plusDagen(vandaag, 1))
  const week = 7 * 86_400_000
  const [checkins, vorige, lessen, leads, leden, laatste] = await Promise.all([
    haalAlles((a, b) => admin.from('club_checkins').select('op').eq('user_id', userId).eq('vestiging', vestiging).gte('op', start.toISOString()).order('op').range(a, b)),
    admin
      .from('club_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('vestiging', vestiging)
      .gte('op', new Date(start.getTime() - week).toISOString())
      .lte('op', new Date(nu.getTime() - week).toISOString()),
    haalLessenVandaag(admin, userId, vestiging, start, morgen),
    haalLeadsVandaag(admin, userId, vestiging, vandaag, start, morgen),
    haalAlles((a, b) =>
      admin
        .from('club_leden')
        .select('id, voornaam, achternaam, status, lid_sinds, einddatum, geboortedatum, abonnement')
        .eq('user_id', userId)
        .eq('vestiging', vestiging)
        .order('id')
        .range(a, b),
    ),
    haalLaatsteBezoek(admin, userId, vestiging, new Date(nu.getTime() - 120 * 86_400_000)),
  ])
  const ops = rijenVan(checkins.rijen, (v) => datum(alsRij(v)?.op))
  const ledenLijst = rijenVan(leden.rijen, vandaagLidUitRij)
  const fouten = [checkins.fout, vorige.error?.message, lessen.fout, leads.fout, leden.fout]
  for (const f of fouten) if (f) console.error('[club/vandaag] laden mislukt', f)
  const meldingen = [...(fouten.some(Boolean) ? ['Niet alles kon worden geladen; sommige cijfers kunnen ontbreken.'] : []), ...(laatste.fout ? [laatste.fout] : [])]
  const vorigeAantal = vorige.count ?? 0
  return {
    vandaag,
    nu,
    nuBinnen: nuBinnen(ops, nu),
    checkinsVandaag: ops.length,
    checkinsVorigeWeek: vorigeAantal,
    verschil: verschil(ops.length, vorigeAantal),
    lessen: lessen.lessen,
    proeflessen: leads.proef,
    opvolgen: leads.opvolgen,
    opvolgenTotaal: leads.totaal,
    risico: risicoLeden(ledenLijst, laatste.data, vandaag),
    nieuw: nieuwDezeWeek(ledenLijst, maandagVan(vandaag), vandaag),
    jarig: jarigen(ledenLijst, vandaag),
    meldingen,
  }
}
