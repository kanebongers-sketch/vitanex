// ─── Club, meldingen: de wachtrij versturen (SERVER-ONLY) ───────────────────
// Aangeroepen door /api/cron/club-meldingen. Per rij: claimen (gepland naar
// bezig, wie de claim wint verstuurt), controleren of de melding nog klopt,
// dan versturen of overslaan. Zonder CLUB_MAILS_ACTIEF=1, sleutel of afzender
// gaat er niets per mail: die rijen worden overgeslagen met een reden, de
// meldingen in de app komen er wel.

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { mailBeslissing, nogGeldig, volgendePoging, type MailOmgeving } from './beleid'
import { afmeldUrl, haalContext, haalWachtrij, logoVoorMail, zorgVoorToken, type Context, type WachtrijRij } from './context'
import { mailHtml, platteTekst } from './mail-html'
import { isAppSoort, isHerinnering } from './soorten'
import { ledenappLinkVoorMail } from '@/lib/club/app-uitnodigen/link-voor-mail'
import { KNOP_LABEL } from '@/lib/club/app-uitnodigen/regels'

export interface Mail {
  aan: string
  onderwerp: string
  tekst: string
  html: string
  headers: Record<string, string>
}

export interface VerstuurDeps {
  omgeving: MailOmgeving
  stuur: (m: Mail) => Promise<{ ok: true } | { ok: false; fout: string }>
  pauze: (ms: number) => Promise<void>
}

export interface Verslag {
  bekeken: number
  verstuurd: number
  inApp: number
  overgeslagen: number
  mislukt: number
}

const MAX_RIJEN = 200
/** Per keer hooguit zoveel mails, met een korte pauze ertussen (Resend staat een paar per seconde toe). */
const MAX_MAILS = 50
const PAUZE_MS = 600
const VASTGELOPEN_MS = 30 * 60_000

/** De echte omgeving: schakelaar, sleutel en afzender uit de env van Club. */
export function standaardDeps(): VerstuurDeps {
  const sleutel = process.env.CLUB_RESEND_API_KEY?.trim() ?? ''
  const van = process.env.CLUB_RESEND_FROM?.trim() ?? ''
  return {
    omgeving: { actief: process.env.CLUB_MAILS_ACTIEF === '1', ingesteld: Boolean(sleutel && van) },
    stuur: async (m) => {
      try {
        const { error } = await new Resend(sleutel).emails.send({ from: van, to: m.aan, subject: m.onderwerp, text: m.tekst, html: m.html, headers: m.headers })
        return error ? { ok: false, fout: error.name ?? 'Resend-fout' } : { ok: true }
      } catch (err) {
        return { ok: false, fout: err instanceof Error ? err.name : 'onbekend' }
      }
    },
    pauze: (ms) => new Promise((klaar) => setTimeout(klaar, ms)),
  }
}

async function zet(admin: SupabaseClient, id: string, velden: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from('club_meldingen').update({ ...velden, gewijzigd_op: new Date().toISOString() }).eq('id', id)
  if (error) console.error('[club-meldingen] status bijwerken mislukt', error.message)
}

/** Claim een rij: alleen wie hem van gepland naar bezig zet, gaat verder. */
async function claim(admin: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await admin.from('club_meldingen').update({ status: 'bezig', gewijzigd_op: new Date().toISOString() }).eq('id', id).eq('status', 'gepland').select('id')
  if (error) console.error('[club-meldingen] claimen mislukt', error.message)
  return !error && (data?.length ?? 0) === 1
}

/** Rijen die langer dan een half uur op bezig staan (afgebroken run): mislukt, nooit opnieuw (geen dubbele mail). */
async function ruimVastgelopenOp(admin: SupabaseClient, nu: Date): Promise<void> {
  const { error } = await admin
    .from('club_meldingen')
    .update({ status: 'mislukt', reden: 'Afgebroken tijdens versturen', gewijzigd_op: nu.toISOString() })
    .eq('status', 'bezig')
    .lt('gewijzigd_op', new Date(nu.getTime() - VASTGELOPEN_MS).toISOString())
  if (error) console.error('[club-meldingen] vastgelopen rijen opruimen mislukt', error.message)
}

async function bouwMail(admin: SupabaseClient, rij: WachtrijRij, ctx: Context, aan: string, knop: MailKnop): Promise<Mail | null> {
  const org = ctx.orgs.get(rij.userId)
  if (!org) return null
  const herinnering = isHerinnering(rij.soort)
  const token = herinnering ? (ctx.voorkeuren.get(`${rij.userId}:${rij.lidId}`)?.token ?? (await zorgVoorToken(admin, rij.userId, rij.lidId))) : null
  const afmelden = token ? afmeldUrl(token) : null
  const inhoud = { tekst: rij.inhoud, knop, afmeldUrl: afmelden }
  const huisstijl = { naam: org.naam, logoUrl: await logoVoorMail(admin, org.logo), accent: org.accent, donker: org.donker }
  const headers: Record<string, string> = afmelden ? { 'List-Unsubscribe': `<${afmelden}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : {}
  return { aan, onderwerp: rij.onderwerp, tekst: platteTekst(inhoud), html: mailHtml(huisstijl, inhoud), headers }
}

type Uitkomst = 'verstuurd' | 'inApp' | 'overgeslagen' | 'mislukt' | 'later'
type MailKnop = { label: string; url: string } | null

/** Mails rond de ledenapp krijgen de persoonlijke link als knop, pas nu gemaakt. */
async function knopVoor(admin: SupabaseClient, rij: WachtrijRij, nu: Date): Promise<{ knop: MailKnop } | { reden: string }> {
  if (!isAppSoort(rij.soort)) return { knop: null }
  const link = await ledenappLinkVoorMail(admin, rij.userId, rij.lidId, nu)
  return link.ok ? { knop: { label: KNOP_LABEL, url: link.url } } : { reden: link.reden }
}

async function verwerkMail(admin: SupabaseClient, rij: WachtrijRij, ctx: Context, deps: VerstuurDeps, nu: Date): Promise<Uitkomst> {
  const lid = ctx.leden.get(rij.lidId)
  const org = ctx.orgs.get(rij.userId)
  // Een zelf aangevraagde link gaat ook naar wie zich voor andere mails afmeldde.
  const voorkeur = rij.soort === 'app_link' ? null : (ctx.voorkeuren.get(`${rij.userId}:${rij.lidId}`) ?? null)
  const besluit = mailBeslissing(
    rij.soort,
    { organisatieId: rij.userId, organisatieDemo: org?.demo ?? true, lidDemo: lid?.demo ?? true, rijDemo: rij.demo, email: lid?.email ?? null, voorkeur },
    deps.omgeving,
  )
  if (!besluit.ok) {
    await zet(admin, rij.id, { status: 'overgeslagen', reden: besluit.reden })
    return 'overgeslagen'
  }
  const knop = await knopVoor(admin, rij, nu)
  if ('reden' in knop) {
    await zet(admin, rij.id, { status: 'overgeslagen', reden: knop.reden })
    return 'overgeslagen'
  }
  const mail = await bouwMail(admin, rij, ctx, besluit.email, knop.knop)
  if (!mail) {
    await zet(admin, rij.id, { status: 'overgeslagen', reden: 'Sportschool niet gevonden' })
    return 'overgeslagen'
  }
  const uit = await deps.stuur(mail)
  if (uit.ok) {
    await zet(admin, rij.id, { status: 'verstuurd', verstuurd_op: nu.toISOString(), pogingen: rij.pogingen + 1, reden: null })
    return 'verstuurd'
  }
  const volgende = volgendePoging(rij.pogingen, nu)
  await zet(admin, rij.id, { ...(volgende.status === 'gepland' ? { status: 'gepland', gepland_op: volgende.op } : { status: 'mislukt' }), pogingen: rij.pogingen + 1, reden: `Versturen mislukt: ${uit.fout}`.slice(0, 200) })
  return volgende.status === 'gepland' ? 'later' : 'mislukt'
}

async function verwerkRij(admin: SupabaseClient, rij: WachtrijRij, ctx: Context, deps: VerstuurDeps, nu: Date): Promise<Uitkomst> {
  const lid = ctx.leden.get(rij.lidId)
  // Strikte scheiding: het lid moet bij dezelfde sportschool horen als de melding.
  if (!lid || lid.userId !== rij.userId) {
    await zet(admin, rij.id, { status: 'overgeslagen', reden: 'Lid niet gevonden' })
    return 'overgeslagen'
  }
  const bron = rij.bronId ? (ctx.bronnen.get(`${rij.userId}:${rij.bronId}`) ?? null) : null
  if (!nogGeldig(rij.soort, { geplandOp: rij.geplandOp, bronStart: rij.bronStart }, bron, nu)) {
    await zet(admin, rij.id, { status: 'overgeslagen', reden: 'Klopt niet meer of te laat' })
    return 'overgeslagen'
  }
  if (rij.kanaal === 'app') {
    await zet(admin, rij.id, { status: 'verstuurd', verstuurd_op: nu.toISOString() })
    return 'inApp'
  }
  return verwerkMail(admin, rij, ctx, deps, nu)
}

/** Verwerk wat nu aan de beurt is. */
export async function verwerkWachtrij(admin: SupabaseClient, nu = new Date(), deps: VerstuurDeps = standaardDeps()): Promise<Verslag | null> {
  await ruimVastgelopenOp(admin, nu)
  const rijen = await haalWachtrij(admin, nu, MAX_RIJEN)
  if (!rijen) return null
  const ctx = await haalContext(admin, rijen)
  const verslag: Verslag = { bekeken: rijen.length, verstuurd: 0, inApp: 0, overgeslagen: 0, mislukt: 0 }
  let mails = 0
  for (const rij of rijen) {
    // Is de mail-limiet voor deze keer bereikt, dan wachten de overige mails op de volgende run.
    if (rij.kanaal === 'email' && mails >= MAX_MAILS) continue
    if (!(await claim(admin, rij.id))) continue
    const uitkomst = await verwerkRij(admin, rij, ctx, deps, nu)
    if (uitkomst === 'verstuurd' || uitkomst === 'mislukt' || uitkomst === 'later') {
      mails++
      await deps.pauze(PAUZE_MS)
    }
    if (uitkomst !== 'later') verslag[uitkomst]++
  }
  return verslag
}
