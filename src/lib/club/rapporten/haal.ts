// ─── Club: rapporten ophalen (SERVER) ───────────────────────────────────────
// Elke query filtert op user_id (de sportschool) en op de gekozen vestigingen,
// die al tegen de eigen vestigingen zijn nagekeken (keuze.ts). Rijen komen in
// pagina's tot een plafond; daarboven is het rapport onvolledig en zegt de
// pagina dat. Alleen kolommen die in een rapport mogen worden gelezen.

import type { SupabaseClient } from '@supabase/supabase-js'
import { eersteDag, plusMaanden } from '@/lib/club/cijfers/maand'
import { haalAlles, type PaginaVraag } from '@/lib/club/cijfers/pagina'
import { rijenVan } from '@/lib/club/cijfers/rijen'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { dienstUitRij } from '@/lib/club/personeel/typen'
import { RAPPORTEN, type RapportSleutel } from './definities'
import { begrens, type Begrensd, type CsvWaarde } from './csv'
import { rapportPeriode, type RapportKeuze, type RapportPeriode } from './keuze'
import { bezoekPerLid, instroom, ledenlijst, type VestigingNaam } from './bouw-leden'
import { bezettingPerLes, leadsLijst, noShows } from './bouw-lessen'
import { afsprakenPerTrainer, opvolgPerMedewerker, urenPerMedewerker, type DienstRij } from './bouw-team'
import {
  LID_NAAM_KOLOMMEN,
  LID_RAPPORT_KOLOMMEN,
  afspraakUitRij,
  checkinUitRij,
  leadRapportUitRij,
  lesRapportUitRij,
  lidNaamUitRij,
  lidRapportUitRij,
  namenUitRijen,
  opvolgUitRij,
  reserveringRapportUitRij,
  type LidNaam,
} from './rijen'

/** Zoveel ruwe rijen per bron hoogstens. */
const PLAFOND = 50_000
/** Zoveel id's per .in()-filter, zodat de URL niet te lang wordt. */
const BLOK = 200

const DIENST_RAPPORT_KOLOMMEN = 'id, vestiging, datum, begin, eind, medewerker_id, soort_id, status, vervangt_id, uursoort, uur_status, gewerkt_begin, gewerkt_eind, pauze_min'

export type RapportUitkomst = { ok: true; tabel: Begrensd; onvolledig: boolean } | { ok: false; fout: string }

class LeesFout extends Error {}

interface Ctx {
  admin: SupabaseClient
  userId: string
  vestigingen: string[]
  periode: RapportPeriode
  vestiging: VestigingNaam
  lees: (wat: string, vraag: PaginaVraag) => Promise<unknown[]>
}

function maakLezer(): { lees: Ctx['lees']; onvolledig: () => boolean } {
  let afgekapt = false
  return {
    lees: async (wat, vraag) => {
      const r = await haalAlles(vraag, PLAFOND)
      if (r.fout) {
        console.error(`[club/rapporten] ${wat} lezen mislukt`, r.fout)
        throw new LeesFout(wat)
      }
      afgekapt = afgekapt || r.afgekapt
      return r.rijen
    },
    onvolledig: () => afgekapt,
  }
}

async function leesPerBlok(c: Ctx, wat: string, ids: readonly string[], vraag: (blok: string[]) => PaginaVraag): Promise<unknown[]> {
  const uniek = [...new Set(ids)]
  const blokken = Array.from({ length: Math.ceil(uniek.length / BLOK) }, (_, i) => uniek.slice(i * BLOK, (i + 1) * BLOK))
  const delen = await Promise.all(blokken.map((b) => c.lees(wat, vraag(b))))
  return delen.flat()
}

async function medewerkers(c: Ctx): Promise<Map<string, string>> {
  return namenUitRijen(await c.lees('Medewerkers', (a, b) => c.admin.from('club_medewerkers').select('id, naam').eq('user_id', c.userId).order('id').range(a, b)))
}

async function ledenNamen(c: Ctx, ids: readonly (string | null)[]): Promise<Map<string, LidNaam>> {
  const echt = ids.filter((id): id is string => id !== null)
  const rijen = await leesPerBlok(c, 'Leden', echt, (blok) => (a, b) => c.admin.from('club_leden').select(LID_NAAM_KOLOMMEN).eq('user_id', c.userId).in('id', blok).order('id').range(a, b))
  return new Map(rijenVan(rijen, lidNaamUitRij).map((l) => [l.id, l]))
}

async function ledenRapport(c: Ctx, filter: string) {
  const rijen = await c.lees('Leden', (a, b) =>
    c.admin.from('club_leden').select(LID_RAPPORT_KOLOMMEN).eq('user_id', c.userId).in('vestiging', c.vestigingen).or(filter).order('id').range(a, b),
  )
  return rijenVan(rijen, lidRapportUitRij)
}

async function lessenVanMaand(c: Ctx) {
  const rijen = await c.lees('Lessen', (a, b) =>
    c.admin
      .from('club_lessen')
      .select('id, vestiging, start_op, capaciteit, status, instructeur_id, club_lestypen(naam)')
      .eq('user_id', c.userId)
      .in('vestiging', c.vestigingen)
      .gte('start_op', c.periode.van.toISOString())
      .lt('start_op', c.periode.tot.toISOString())
      .order('start_op')
      .order('id')
      .range(a, b),
  )
  return rijenVan(rijen, lesRapportUitRij)
}

async function reserveringenVan(c: Ctx, lesIds: readonly string[], statussen?: readonly string[]) {
  const rijen = await leesPerBlok(c, 'Reserveringen', lesIds, (blok) => (a, b) => {
    const q = c.admin.from('club_reserveringen').select('les_id, lid_id, status, te_laat').eq('user_id', c.userId).in('les_id', blok)
    return (statussen ? q.in('status', [...statussen]) : q).order('id').range(a, b)
  })
  return rijenVan(rijen, reserveringRapportUitRij)
}

async function afsprakenVanMaand(c: Ctx, alleenNietGekomen: boolean) {
  const rijen = await c.lees('Afspraken', (a, b) => {
    const q = c.admin
      .from('club_afspraken')
      .select('vestiging, medewerker_id, lid_id, start_op, eind_op, status, club_afspraak_typen(naam)')
      .eq('user_id', c.userId)
      .in('vestiging', c.vestigingen)
      .gte('start_op', c.periode.van.toISOString())
      .lt('start_op', c.periode.tot.toISOString())
    return (alleenNietGekomen ? q.eq('status', 'niet_gekomen') : q).order('start_op').order('id').range(a, b)
  })
  return rijenVan(rijen, afspraakUitRij)
}

async function bezoek(c: Ctx): Promise<CsvWaarde[][]> {
  const rijen = await c.lees('Bezoek', (a, b) =>
    c.admin
      .from('club_checkins')
      .select('lid_id, vestiging, op')
      .eq('user_id', c.userId)
      .in('vestiging', c.vestigingen)
      .gte('op', c.periode.van.toISOString())
      .lt('op', c.periode.tot.toISOString())
      .order('op')
      .order('id')
      .range(a, b),
  )
  const checkins = rijenVan(rijen, checkinUitRij)
  return bezoekPerLid(checkins, await ledenNamen(c, checkins.map((x) => x.lidId)), c.vestiging)
}

async function bezetting(c: Ctx): Promise<CsvWaarde[][]> {
  const lessen = await lessenVanMaand(c)
  const [reserveringen, namen] = await Promise.all([reserveringenVan(c, lessen.map((l) => l.id)), medewerkers(c)])
  return bezettingPerLes(lessen, reserveringen, namen, c.vestiging)
}

async function gemist(c: Ctx): Promise<CsvWaarde[][]> {
  const [lessen, afspraken] = await Promise.all([lessenVanMaand(c), afsprakenVanMaand(c, true)])
  const reserveringen = await reserveringenVan(c, lessen.map((l) => l.id), ['no_show', 'geannuleerd'])
  const leden = await ledenNamen(c, [...reserveringen.map((r) => r.lidId), ...afspraken.map((a) => a.lidId)])
  return noShows(lessen, reserveringen, afspraken, leden, c.vestiging)
}

async function leads(c: Ctx): Promise<CsvWaarde[][]> {
  const rijen = await c.lees('Leads', (a, b) =>
    c.admin
      .from('club_leads')
      .select('vestiging, naam, email, telefoon, bron, interesse, status, proefles_op, verloren_reden, medewerker_id, aangemaakt_op')
      .eq('user_id', c.userId)
      .in('vestiging', c.vestigingen)
      .gte('aangemaakt_op', c.periode.van.toISOString())
      .lt('aangemaakt_op', c.periode.tot.toISOString())
      .order('aangemaakt_op')
      .order('id')
      .range(a, b),
  )
  return leadsLijst(rijenVan(rijen, leadRapportUitRij), await medewerkers(c), c.vestiging)
}

async function uren(c: Ctx, maand: string): Promise<CsvWaarde[][]> {
  const totExclusief = eersteDag(plusMaanden(maand, 1))
  const rijen = await c.lees('Diensten', (a, b) =>
    c.admin
      .from('club_diensten')
      .select(DIENST_RAPPORT_KOLOMMEN)
      .eq('user_id', c.userId)
      .in('vestiging', c.vestigingen)
      .gte('datum', c.periode.eerste)
      .lt('datum', totExclusief)
      .order('datum')
      .order('id')
      .range(a, b),
  )
  const diensten = rijen.flatMap((r): DienstRij[] => {
    const d = dienstUitRij(r)
    const v = (r as { vestiging?: unknown }).vestiging
    return d && typeof v === 'string' && c.vestigingen.includes(v) ? [{ ...d, vestiging: v }] : []
  })
  return urenPerMedewerker(diensten, await medewerkers(c), c.vestiging)
}

async function opvolging(c: Ctx): Promise<CsvWaarde[][]> {
  const rijen = await c.lees('Opvolgtaken', (a, b) =>
    c.admin
      .from('club_opvolgtaken')
      .select('vestiging, regel, status, afgehandeld_door, afgehandeld_op')
      .eq('user_id', c.userId)
      .in('vestiging', c.vestigingen)
      .in('status', ['gedaan', 'overgeslagen'])
      .gte('afgehandeld_op', c.periode.van.toISOString())
      .lt('afgehandeld_op', c.periode.tot.toISOString())
      .order('afgehandeld_op')
      .order('id')
      .range(a, b),
  )
  return opvolgPerMedewerker(rijenVan(rijen, opvolgUitRij), c.vestiging)
}

async function bouw(c: Ctx, rapport: RapportSleutel, maand: string): Promise<CsvWaarde[][]> {
  const p = c.periode
  switch (rapport) {
    case 'ledenlijst':
      return ledenlijst(await ledenRapport(c, `einddatum.is.null,einddatum.gte.${p.eerste}`), p, c.vestiging)
    case 'instroom':
      return instroom(await ledenRapport(c, `and(lid_sinds.gte.${p.eerste},lid_sinds.lte.${p.laatste}),and(einddatum.gte.${p.eerste},einddatum.lte.${p.laatste})`), p, c.vestiging)
    case 'bezoek':
      return bezoek(c)
    case 'bezetting':
      return bezetting(c)
    case 'noshows':
      return gemist(c)
    case 'leads':
      return leads(c)
    case 'afspraken':
      return afsprakenPerTrainer(await afsprakenVanMaand(c, false), await medewerkers(c), c.vestiging)
    case 'uren':
      return uren(c, maand)
    case 'opvolging':
      return opvolging(c)
  }
}

/** Het gekozen rapport als tabel, begrensd op MAX_RIJEN. */
export async function haalRapportTabel(admin: SupabaseClient, userId: string, lijst: readonly VestigingInfo[], keuze: RapportKeuze): Promise<RapportUitkomst> {
  const def = RAPPORTEN[keuze.rapport]
  if (keuze.vestigingen.length === 0) return { ok: false, fout: 'Deze sportschool heeft nog geen vestigingen.' }
  const lezer = maakLezer()
  const c: Ctx = { admin, userId, vestigingen: keuze.vestigingen, periode: rapportPeriode(keuze.maand), vestiging: (s) => naamVan(lijst, s), lees: lezer.lees }
  try {
    const rijen = await bouw(c, keuze.rapport, keuze.maand)
    return { ok: true, tabel: begrens({ kolommen: def.kolommen, rijen }), onvolledig: lezer.onvolledig() }
  } catch (e) {
    if (e instanceof LeesFout) return { ok: false, fout: `${e.message} kon niet worden gelezen. Probeer het later opnieuw.` }
    console.error('[club/rapporten] rapport maken mislukt', e)
    return { ok: false, fout: 'Het rapport kon niet worden gemaakt. Probeer het later opnieuw.' }
  }
}
