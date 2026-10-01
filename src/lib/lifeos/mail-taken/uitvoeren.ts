// ─── LifeOS — mail → to-do, en weer afvinken (SERVER-ONLY) ──────────────────
// Draait na elke agenda-sync (elk half uur overdag):
//   1. Nieuwe, ongelezen mail die iets van je vraagt → een taak met een logische
//      deadline (regels in `regels.ts`). Elke mail hoogstens één keer, en per
//      gesprek hoogstens één open taak.
//   2. Heb je inmiddels gereageerd (een verstuurd bericht in de thread), dan vinkt
//      LifeOS de "Reageren op …"-taak af. Facturen niet: betalen zie je niet in Gmail.
// LifeOS leest alleen afzender + onderwerp, nooit de inhoud (zie `inbox/gmail.ts`).

import type { SupabaseClient } from '@supabase/supabase-js'
import { geldigToken } from '@/lib/lifeos/inbox/koppeling'
import { haalProfiel, haalTriageMails } from '@/lib/lifeos/inbox/gmail'
import { triageer } from '@/lib/lifeos/inbox/classificeer'
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
}

async function eigenAdressen(token: string): Promise<Set<string>> {
  const eigen = new Set<string>()
  const ingesteld = process.env.LIFEOS_DAGPLANNING_MAIL?.trim().toLowerCase()
  if (ingesteld) eigen.add(ingesteld)
  const profiel = await haalProfiel(token).catch(() => null)
  if (profiel?.staat === 'ok') eigen.add(profiel.adres.toLowerCase())
  return eigen
}

/** Welke berichten en threads al een taak hebben. Fout → null: dan niets doen (anders dubbel). */
async function bekend(admin: SupabaseClient, userId: string): Promise<{ berichten: Set<string>; openThreads: Set<string> } | null> {
  const { data, error } = await admin.from(TABEL).select('bericht_id, thread_id, beantwoord_op, taak_id').eq('user_id', userId)
  if (error || !Array.isArray(data)) return null
  const berichten = new Set<string>()
  const openThreads = new Set<string>()
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

async function nieuweTaken(admin: SupabaseClient, userId: string, token: string): Promise<string[]> {
  const gelezen = await haalTriageMails(token)
  if (gelezen.staat !== 'ok') return []
  const al = await bekend(admin, userId)
  if (al === null) return []
  const eigen = await eigenAdressen(token)

  const triage = triageer(gelezen.mails)
  const voorstellen = [...triage.vraagtActie, ...triage.overige]
    .map((b) => mailNaarTaak(b, eigen))
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
  return nieuw
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
  if (token.staat !== 'ok') return { nieuw: [], afgevinkt: [] }
  const afgevinkt = await vinkBeantwoordAf(admin, userId, token.toegangstoken)
  const nieuw = await nieuweTaken(admin, userId, token.toegangstoken)
  return { nieuw, afgevinkt }
}
