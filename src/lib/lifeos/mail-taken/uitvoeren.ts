// ─── LifeOS — mail → to-do, en weer afvinken (SERVER-ONLY) ──────────────────
// Draait na elke agenda-sync (elk half uur overdag):
//   1. Gesprekken die op jou wachten (laatste bericht van een ander, nog in je
//      inbox — gelezen of niet, zie `gesprekken.ts`) en iets van je vragen → een
//      taak met een logische deadline (`regels.ts`). Elk bericht hoogstens één
//      keer, en per gesprek hoogstens één open taak.
//   2. Heb je inmiddels gereageerd (een verstuurd bericht in de thread), dan vinkt
//      LifeOS de "Reageren op …"-taak af. Facturen niet: betalen zie je niet in Gmail.
// LifeOS leest alleen afzender + onderwerp, nooit de inhoud (zie `inbox/gmail.ts`).

import type { SupabaseClient } from '@supabase/supabase-js'
import { geldigToken } from '@/lib/lifeos/inbox/koppeling'
import { haalProfiel } from '@/lib/lifeos/inbox/gmail'
import { classificeer } from '@/lib/lifeos/inbox/classificeer'
import { haalWachtendeGesprekken } from './gesprekken'
import { maakTaak, wijzigTaak } from '@/lib/lifeos/taken/opslag'
import { mailNaarTaak, type MailTaakVoorstel } from './regels'
import { antwoordInThread } from './thread'

const TABEL = 'mail_taken'
/** Per ronde: een volle inbox na een vakantie gaat in een paar rondes. */
const MAX_NIEUW = 10
const MAX_THREADS = 15

export interface MailTakenUitkomst {
  nieuw: string[]
  afgevinkt: string[]
  /** Hoeveel gesprekken op je reactie wachtten, en hoeveel daarvan een taak waard waren (voor het cron-antwoord). */
  wachtend?: number
  kandidaten?: number
  redenen?: Record<string, number>
  /** Waarom er niets gelezen kon worden, als dat zo was. */
  fout?: string
}

/** Je eigen adressen, plus het Gmail-adres zelf (nodig voor "stond ik in de aan?"). */
async function eigenAdressen(token: string): Promise<{ eigen: Set<string>; mijnAdres: string | null }> {
  const eigen = new Set<string>()
  const ingesteld = process.env.LIFEOS_DAGPLANNING_MAIL?.trim().toLowerCase()
  if (ingesteld) eigen.add(ingesteld)
  const profiel = await haalProfiel(token).catch(() => null)
  const mijnAdres = profiel?.staat === 'ok' ? profiel.adres.toLowerCase() : null
  if (mijnAdres) eigen.add(mijnAdres)
  return { eigen, mijnAdres }
}

/**
 * Welke van DEZE berichten en threads al een taak hebben. Gericht opgevraagd (`in`)
 * i.p.v. de hele tabel: die groeit elke dag, en boven 1000 rijen kapte PostgREST
 * stil af — dan leek een oude thread "nieuw" en kwam er een dubbele taak.
 * Fout → null: dan niets doen (anders dubbel).
 */
async function bekend(
  admin: SupabaseClient,
  userId: string,
  berichtIds: readonly string[],
  threadIds: readonly string[],
): Promise<{ berichten: Set<string>; openThreads: Set<string> } | null> {
  const berichten = new Set<string>()
  const openThreads = new Set<string>()
  if (berichtIds.length === 0 && threadIds.length === 0) return { berichten, openThreads }
  const lijst = (ids: readonly string[]) => ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',')
  const filters = [
    ...(berichtIds.length ? [`bericht_id.in.(${lijst(berichtIds)})`] : []),
    ...(threadIds.length ? [`thread_id.in.(${lijst(threadIds)})`] : []),
  ]
  const { data, error } = await admin
    .from(TABEL)
    .select('bericht_id, thread_id, beantwoord_op, taak_id')
    .eq('user_id', userId)
    .or(filters.join(','))
  if (error || !Array.isArray(data)) return null
  for (const r of data as { bericht_id: string; thread_id: string; beantwoord_op: string | null; taak_id: string | null }[]) {
    berichten.add(r.bericht_id)
    if (r.thread_id && r.beantwoord_op === null && r.taak_id !== null) openThreads.add(r.thread_id)
  }
  return { berichten, openThreads }
}

async function maakMailTaak(admin: SupabaseClient, userId: string, v: MailTaakVoorstel): Promise<boolean> {
  // Eerst claimen: de unieke (user_id, bericht_id) houdt een tweede klok tegen.
  const { data: claim, error } = await admin
    .from(TABEL)
    .insert({ user_id: userId, bericht_id: v.berichtId, thread_id: v.threadId, soort: v.soort, afzender: v.afzender, ontvangen_op: v.ontvangenOp.toISOString() })
    .select('id')
    .single()
  if (error || !claim) return false

  const taak = await maakTaak(admin, userId, {
    titel: v.titel,
    notitie: v.notitie,
    categorie: 'Mail',
    datum: null,
    top3Positie: null,
    inspanningMinuten: v.inspanningMinuten,
    deadline: v.deadline,
  })
  if (!taak.ok) {
    await admin.from(TABEL).delete().eq('id', (claim as { id: string }).id)
    return false
  }
  await admin.from(TABEL).update({ taak_id: taak.waarde.id }).eq('id', (claim as { id: string }).id)
  return true
}

interface NieuwUitkomst {
  nieuw: string[]
  wachtend: number
  kandidaten: number
  /** Waarom wachtende gesprekken géén taak werden, geteld per reden. */
  redenen?: Record<string, number>
  fout?: string
}

async function nieuweTaken(admin: SupabaseClient, userId: string, token: string): Promise<NieuwUitkomst> {
  const { eigen, mijnAdres } = await eigenAdressen(token)
  // Zonder je eigen adres kun je "aan mij" niet beoordelen: dan liever niets.
  if (!mijnAdres) return { nieuw: [], wachtend: 0, kandidaten: 0, fout: 'geen_profiel' }
  const wachtend = await haalWachtendeGesprekken(token, mijnAdres)
  if (wachtend === null) return { nieuw: [], wachtend: 0, kandidaten: 0, fout: 'gmail' }
  const al = await bekend(
    admin,
    userId,
    wachtend.map((m) => m.id),
    [...new Set(wachtend.map((m) => m.threadId).filter((t): t is string => !!t))],
  )
  if (al === null) return { nieuw: [], wachtend: wachtend.length, kandidaten: 0, fout: 'db' }

  const redenen: Record<string, number> = {}
  const tel = (r: string) => { redenen[r] = (redenen[r] ?? 0) + 1 }
  const voorstellen = wachtend
    .map((mail) => {
      const oordeel = classificeer(mail)
      const v = mailNaarTaak({ mail, oordeel }, eigen)
      if (!v) tel(oordeel.vraagtActie ? 'regels' : oordeel.reden.split(':')[0].slice(0, 40))
      return v
    })
    .filter((v): v is MailTaakVoorstel => v !== null && !al.berichten.has(v.berichtId) && !al.openThreads.has(v.threadId))
    // Oudste eerst: wie het langst wacht, staat het eerst op je lijst.
    .sort((a, b) => a.ontvangenOp.getTime() - b.ontvangenOp.getTime())

  const nieuw: string[] = []
  const threads = new Set<string>()
  for (const v of voorstellen) {
    if (nieuw.length >= MAX_NIEUW) break
    if (v.threadId && threads.has(v.threadId)) continue
    if (await maakMailTaak(admin, userId, v)) {
      nieuw.push(v.titel)
      if (v.threadId) threads.add(v.threadId)
    }
  }
  return { nieuw, wachtend: wachtend.length, kandidaten: voorstellen.length, redenen }
}

/** "Reageren"/"offerte"-taken waarop je inmiddels antwoordde → afvinken. */
async function vinkBeantwoordAf(admin: SupabaseClient, userId: string, token: string): Promise<string[]> {
  const { data, error } = await admin
    .from(TABEL)
    .select('id, thread_id, ontvangen_op, taak_id, taken!inner(titel, klaar)')
    .eq('user_id', userId)
    .is('beantwoord_op', null)
    .neq('soort', 'factuur')
    .not('taak_id', 'is', null)
    .eq('taken.klaar', false)
    .order('ontvangen_op', { ascending: false })
    .limit(MAX_THREADS)
  if (error || !Array.isArray(data)) return []

  const afgevinkt: string[] = []
  for (const r of data as unknown as { id: string; thread_id: string; ontvangen_op: string; taak_id: string; taken: { titel: string } }[]) {
    const moment = await antwoordInThread(token, r.thread_id, new Date(r.ontvangen_op))
    if (!moment) continue
    const klaar = await wijzigTaak(admin, userId, r.taak_id, { klaar: true })
    if (!klaar.ok) continue
    await admin.from(TABEL).update({ beantwoord_op: moment.toISOString() }).eq('id', r.id)
    afgevinkt.push(r.taken.titel)
  }
  return afgevinkt
}

export async function verwerkMail(admin: SupabaseClient, userId: string): Promise<MailTakenUitkomst> {
  const token = await geldigToken(admin, userId)
  if (token.staat !== 'ok') return { nieuw: [], afgevinkt: [], fout: `token_${token.staat}` }
  const afgevinkt = await vinkBeantwoordAf(admin, userId, token.toegangstoken)
  const { nieuw, wachtend, kandidaten, redenen, fout } = await nieuweTaken(admin, userId, token.toegangstoken)
  return { nieuw, afgevinkt, wachtend, kandidaten, redenen, ...(fout ? { fout } : {}) }
}
