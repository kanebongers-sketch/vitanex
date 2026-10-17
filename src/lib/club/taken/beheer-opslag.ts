// ─── Fit Factory Club, taken: lijsten en taken beheren (SERVER) ─────────────
// Toevoegen, hernoemen, verplaatsen, frequentie wijzigen en uitzetten.
// Taken worden nooit verwijderd (dan zou de geschiedenis weg zijn), alleen
// uitgezet. Elke wijziging komt in het logboek.

import { logActie, type ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { hoortBij, naamVan } from '@/lib/club/kern/vestigingen'
import { kopieerPlan, verplaats, volgendeVolgorde, type TeKopierenTaak, type Volgorde } from './beheer'
import type { LijstWijziging, TaakVelden, TaakWijziging } from './invoer'
import { gelukt, haalTaken, mislukt, type Resultaat } from './opslag'
import { FREQUENTIE_LABEL, LIJST_KOLOMMEN, TAAK_KOLOMMEN, lijstUitRij, rijenNaar, taakUitRij, type Taak, type Takenlijst } from './typen'

const NIET_GELUKT = 'Opslaan is niet gelukt. Probeer het opnieuw.'

function logFout(wat: string, fout: { message: string }): void {
  console.error(`[club-taken] ${wat} mislukt`, fout.message)
}

function velden(v: TaakVelden): Record<string, unknown> {
  return { naam: v.naam, groep: v.groep, frequentie: v.frequentie, per_week_min: v.perWeekMin, moment: v.moment }
}

async function lijstVan(t: ClubToegang, id: string): Promise<Takenlijst | null> {
  const { data, error } = await t.admin.from('club_takenlijsten').select(LIJST_KOLOMMEN).eq('user_id', t.userId).eq('id', id).maybeSingle()
  return error ? null : lijstUitRij(data)
}

async function takenVanLijst(t: ClubToegang, lijstId: string): Promise<Taak[] | null> {
  const { data, error } = await t.admin.from('club_taken').select(TAAK_KOLOMMEN).eq('user_id', t.userId).eq('lijst_id', lijstId)
  return error ? null : rijenNaar(data, taakUitRij)
}

async function zetVolgorde(t: ClubToegang, tabel: 'club_taken' | 'club_takenlijsten', wijzigingen: Volgorde[]): Promise<boolean> {
  const uitkomsten = await Promise.all(wijzigingen.map((w) => t.admin.from(tabel).update({ volgorde: w.volgorde }).eq('user_id', t.userId).eq('id', w.id)))
  const fout = uitkomsten.find((u) => u.error)?.error
  if (fout) logFout('volgorde opslaan', fout)
  return !fout
}

export async function maakLijst(t: ClubToegang, vestiging: Vestiging, naam: string): Promise<Resultaat<Takenlijst>> {
  const data = await haalTaken(t.admin, t.userId, vestiging)
  if (!data) return mislukt(NIET_GELUKT, 500)
  if (data.lijsten.some((l) => l.naam.toLowerCase() === naam.toLowerCase())) return mislukt('Er is al een lijst met deze naam.', 409)
  const r = await t.admin
    .from('club_takenlijsten')
    .insert({ user_id: t.userId, vestiging, naam, volgorde: volgendeVolgorde(data.lijsten) })
    .select(LIJST_KOLOMMEN)
    .single()
  const lijst = lijstUitRij(r.data)
  if (r.error || !lijst) return mislukt(NIET_GELUKT, 500)
  await logActie(t, 'Takenlijst toegevoegd', naam, vestiging)
  return gelukt(lijst)
}

export async function wijzigLijst(t: ClubToegang, id: string, w: LijstWijziging): Promise<Resultaat<{ ok: true }>> {
  const lijst = await lijstVan(t, id)
  if (!lijst) return mislukt('Deze lijst bestaat niet.', 404)
  if (w.soort === 'verplaats') {
    const data = await haalTaken(t.admin, t.userId, lijst.vestiging)
    const plan = data ? verplaats(data.lijsten, id, w.richting) : null
    if (plan && !(await zetVolgorde(t, 'club_takenlijsten', plan))) return mislukt(NIET_GELUKT, 500)
    return gelukt({ ok: true })
  }
  const update = w.soort === 'naam' ? { naam: w.naam } : { actief: w.actief }
  const { error } = await t.admin.from('club_takenlijsten').update(update).eq('user_id', t.userId).eq('id', id)
  if (error) {
    logFout('lijst wijzigen', error)
    return mislukt(error.code === '23505' ? 'Er is al een lijst met deze naam.' : NIET_GELUKT, error.code === '23505' ? 409 : 500)
  }
  const wat = w.soort === 'naam' ? `${lijst.naam} heet nu ${w.naam}` : `${lijst.naam} ${w.actief ? 'aangezet' : 'uitgezet'}`
  await logActie(t, 'Takenlijst gewijzigd', wat, lijst.vestiging)
  return gelukt({ ok: true })
}

export async function maakTaak(t: ClubToegang, lijstId: string, v: TaakVelden): Promise<Resultaat<Taak>> {
  const lijst = await lijstVan(t, lijstId)
  const bestaand = lijst ? await takenVanLijst(t, lijstId) : null
  if (!lijst || !bestaand) return mislukt('Deze lijst bestaat niet.', 404)
  const r = await t.admin
    .from('club_taken')
    .insert({ user_id: t.userId, lijst_id: lijstId, ...velden(v), volgorde: volgendeVolgorde(bestaand) })
    .select(TAAK_KOLOMMEN)
    .single()
  const taak = taakUitRij(r.data)
  if (r.error || !taak) {
    if (r.error) logFout('taak toevoegen', r.error)
    return mislukt(NIET_GELUKT, 500)
  }
  await logActie(t, 'Taak toegevoegd', `${v.naam} (${lijst.naam})`, lijst.vestiging)
  return gelukt(taak)
}

function beschrijf(oud: Taak, w: TaakWijziging): string {
  if (w.soort === 'actief') return `${oud.naam} ${w.actief ? 'aangezet' : 'uitgezet'}`
  if (w.soort === 'verplaats') return `${oud.naam} ${w.richting}`
  const v = w.velden
  const freq = v.frequentie === 'per_week' ? `minimaal ${v.perWeekMin}x per week` : FREQUENTIE_LABEL[v.frequentie].toLowerCase()
  return v.naam === oud.naam ? `${v.naam}: ${freq}` : `${oud.naam} heet nu ${v.naam} (${freq})`
}

export async function wijzigTaak(t: ClubToegang, id: string, w: TaakWijziging): Promise<Resultaat<{ ok: true }>> {
  const { data, error } = await t.admin.from('club_taken').select(TAAK_KOLOMMEN).eq('user_id', t.userId).eq('id', id).maybeSingle()
  const oud = error ? null : taakUitRij(data)
  const lijst = oud ? await lijstVan(t, oud.lijstId) : null
  if (!oud || !lijst) return mislukt('Deze taak bestaat niet.', 404)
  if (w.soort === 'verplaats') {
    const taken = await takenVanLijst(t, oud.lijstId)
    const plan = taken ? verplaats(taken, id, w.richting) : null
    if (plan && !(await zetVolgorde(t, 'club_taken', plan))) return mislukt(NIET_GELUKT, 500)
    return gelukt({ ok: true })
  }
  const update = w.soort === 'actief' ? { actief: w.actief } : velden(w.velden)
  const r = await t.admin.from('club_taken').update(update).eq('user_id', t.userId).eq('id', id)
  if (r.error) {
    logFout('taak wijzigen', r.error)
    return mislukt(NIET_GELUKT, 500)
  }
  await logActie(t, 'Taak gewijzigd', beschrijf(oud, w), lijst.vestiging)
  return gelukt({ ok: true })
}

async function voegTakenToe(t: ClubToegang, lijstId: string, taken: readonly TeKopierenTaak[]): Promise<boolean> {
  if (taken.length === 0) return true
  const rijen = taken.map((x) => ({ user_id: t.userId, lijst_id: lijstId, ...velden(x), volgorde: x.volgorde }))
  const { error } = await t.admin.from('club_taken').insert(rijen)
  if (error) logFout('taken kopieren', error)
  return !error
}

/** Kopieer de lijsten van de ene vestiging naar de andere (zonder dubbelingen, zonder vinkjes). */
export async function kopieerLijsten(t: ClubToegang, van: Vestiging, naar: Vestiging): Promise<Resultaat<{ lijsten: number; taken: number }>> {
  if (!hoortBij(t.vestigingen, van) || !hoortBij(t.vestigingen, naar)) return mislukt('Onbekende vestiging.')
  const [bron, doel] = await Promise.all([haalTaken(t.admin, t.userId, van), haalTaken(t.admin, t.userId, naar)])
  if (!bron || !doel) return mislukt(NIET_GELUKT, 500)
  const plan = kopieerPlan(bron, doel)
  for (const nieuw of plan.nieuweLijsten) {
    const r = await t.admin.from('club_takenlijsten').insert({ user_id: t.userId, vestiging: naar, naam: nieuw.naam, volgorde: nieuw.volgorde }).select('id').single()
    const id = r.data && typeof r.data.id === 'string' ? r.data.id : null
    if (r.error || !id || !(await voegTakenToe(t, id, nieuw.taken))) return mislukt('Kopieren is half gelukt. Kijk de lijsten na en probeer het opnieuw.', 500)
  }
  for (const a of plan.aanvullen) {
    if (!(await voegTakenToe(t, a.lijstId, a.taken))) return mislukt('Kopieren is half gelukt. Kijk de lijsten na en probeer het opnieuw.', 500)
  }
  await logActie(t, 'Takenlijsten gekopieerd', `${naamVan(t.vestigingen, van)} naar ${naamVan(t.vestigingen, naar)}: ${plan.aantalTaken} taken`, naar)
  return gelukt({ lijsten: plan.nieuweLijsten.length, taken: plan.aantalTaken })
}
