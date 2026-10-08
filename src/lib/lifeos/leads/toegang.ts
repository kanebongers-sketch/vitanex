// ─── LifeOS — PT-dashboard: het slot op de publieke API (SERVER-ONLY) ───────
// Link bestaat + dit toestel heeft een geldige sessie (pincode). Anders 404/401,
// zonder te vertellen wát er mist.

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { kijktMee, sessieGeldig, vindLink, type LeadLink } from './links'
import { sessieCookieNaam } from './pin'

export const GEEN_CACHE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } as const

export function foutAntwoord(fout: string, status: number): NextResponse {
  return NextResponse.json({ fout }, { status, headers: GEEN_CACHE })
}

export interface PtToegang {
  admin: SupabaseClient
  link: LeadLink
  /** Gezet als de beheerder namens een trainer werkt: zijn eigen persoon_id. */
  beheerderId?: string
}

/** De link achter de code, of een 404. */
export async function linkVoor(code: string): Promise<PtToegang | NextResponse> {
  const admin = createLifeosAdminClient()
  const link = await vindLink(admin, code)
  return link ? { admin, link } : foutAntwoord('Deze link werkt niet (meer).', 404)
}

/**
 * Als `linkVoor`, maar ook ingelogd met de pincode. Standaard alleen voor een
 * PT'er: een eigenaar kijkt mee maar schrijft geen leads, klanten of check-ins
 * (anders zouden die op zijn naam belanden). `eigenaarMag` voor wat hij wél mag
 * (bv. een document openen).
 */
export async function ingelogdeLink(req: NextRequest, code: string, { eigenaarMag = false } = {}): Promise<PtToegang | NextResponse> {
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const ok = await sessieGeldig(r.admin, r.link, req.cookies.get(sessieCookieNaam(r.link.code))?.value, new Date())
  if (!ok) return foutAntwoord('Je bent uitgelogd. Vernieuw de pagina en vul je pincode in.', 401)
  if (kijktMee(r.link.rol) && !eigenaarMag) return foutAntwoord('Als eigenaar kijk je mee; aanpassen doet de PT\'er zelf.', 403)
  return r
}

/**
 * Is `persoonId` een trainer in het team: een actieve PT'er (pt_team), of de
 * beheerder zelf (die traint ook klanten)?
 */
async function isTrainer(admin: SupabaseClient, userId: string, beheerderId: string, persoonId: string): Promise<boolean> {
  if (persoonId === beheerderId) return true
  if (!isUuid(persoonId)) return false
  const { data } = await admin
    .from('crm_personen')
    .select('groep, status')
    .eq('id', persoonId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data && data.groep === 'pt_team' && data.status !== 'inactief'
}

/**
 * Toegang tot één klant (bewerken, dossier). Een PT'er: alleen zijn eigen
 * klanten (de opslag filtert op zijn persoon_id). De beheerder: elke klant van
 * het team — de link wordt "als" de trainer van die klant, zodat dezelfde
 * opslagfuncties werken. Een eigenaar kijkt alleen mee (403).
 */
export async function klantToegang(req: NextRequest, code: string, klantId: string): Promise<PtToegang | NextResponse> {
  const r = await ingelogdeLink(req, code, { eigenaarMag: true })
  if (r instanceof NextResponse) return r
  if (r.link.rol === 'pt') return r
  if (r.link.rol !== 'beheerder') return foutAntwoord('Als eigenaar kijk je mee; aanpassen doet de PT\'er zelf.', 403)
  const { data } = await r.admin.from('pt_klanten').select('persoon_id').eq('id', klantId).eq('user_id', r.link.userId).maybeSingle()
  if (!data || !(await isTrainer(r.admin, r.link.userId, r.link.persoonId, data.persoon_id as string))) return foutAntwoord('Klant bestaat niet.', 404)
  return { admin: r.admin, link: { ...r.link, persoonId: data.persoon_id as string }, beheerderId: r.link.persoonId }
}

/**
 * Toegang om een nieuwe klant vast te leggen. Een PT'er: op zijn eigen naam. De
 * beheerder: bij de gekozen trainer (`trainerId` uit de body), anders bij zichzelf.
 */
export async function nieuweKlantToegang(req: NextRequest, code: string, trainerId: unknown): Promise<PtToegang | NextResponse> {
  const r = await ingelogdeLink(req, code, { eigenaarMag: true })
  if (r instanceof NextResponse) return r
  if (r.link.rol === 'pt') return r
  if (r.link.rol !== 'beheerder') return foutAntwoord('Als eigenaar kijk je mee; aanpassen doet de PT\'er zelf.', 403)
  const doel = typeof trainerId === 'string' && trainerId ? trainerId : r.link.persoonId
  if (!(await isTrainer(r.admin, r.link.userId, r.link.persoonId, doel))) return foutAntwoord('Kies een trainer uit het team.', 400)
  return { admin: r.admin, link: { ...r.link, persoonId: doel }, beheerderId: r.link.persoonId }
}

/**
 * De nieuwe trainer als de beheerder een klant naar iemand anders verplaatst
 * (`trainerId` in de body), of null: geen beheerder, dezelfde trainer of geen
 * geldige trainer uit het team.
 */
export async function verplaatsNaar(r: PtToegang, trainerId: unknown): Promise<string | null> {
  if (!r.beheerderId || typeof trainerId !== 'string' || trainerId === r.link.persoonId) return null
  return (await isTrainer(r.admin, r.link.userId, r.beheerderId, trainerId)) ? trainerId : null
}

/** De `pin` uit de body, als die 6 cijfers is. */
export function leesPin(body: unknown): string | null {
  const pin = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).pin : null
  return typeof pin === 'string' && /^\d{6}$/.test(pin) ? pin : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(v: string): boolean {
  return UUID.test(v)
}
