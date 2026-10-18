// ─── Club, meldingen: wat de cron nodig heeft om te versturen (SERVER-ONLY) ──
// De rijen die aan de beurt zijn, met per rij de sportschool, het lid, de
// voorkeur van het lid en de huidige stand van de les of afspraak. Alles in
// een paar grote queries in plaats van per rij.

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { LOGO_PAD } from '@/lib/club/kern/organisatie'
import { ptUrl } from '@/lib/fit-factory/domein'
import type { BronStand } from './beleid'
import { isSoort, type Kanaal, type Soort } from './soorten'

export interface WachtrijRij {
  id: string
  userId: string
  lidId: string
  soort: Soort
  kanaal: Kanaal
  onderwerp: string
  inhoud: string
  bronSoort: 'reservering' | 'afspraak' | null
  bronId: string | null
  bronStart: string | null
  geplandOp: string
  pogingen: number
  demo: boolean
}

export interface OrgInfo {
  naam: string
  logo: string | null
  accent: string
  donker: boolean
  demo: boolean
}

export interface LidInfo {
  userId: string
  email: string | null
  demo: boolean
}

export interface VoorkeurInfo {
  token: string
  mails: boolean
  herinneringenPerMail: boolean
  /** false = het lid zette push uit. */
  push: boolean
}

export interface Context {
  orgs: Map<string, OrgInfo>
  leden: Map<string, LidInfo>
  voorkeuren: Map<string, VoorkeurInfo>
  bronnen: Map<string, BronStand>
}

const WACHTRIJ_KOLOMMEN = 'id, user_id, lid_id, soort, kanaal, onderwerp, inhoud, bron_soort, bron_id, bron_start, gepland_op, pogingen, demo'

function rijUit(r: Record<string, unknown>): WachtrijRij | null {
  if (typeof r.id !== 'string' || typeof r.user_id !== 'string' || typeof r.lid_id !== 'string' || !isSoort(r.soort)) return null
  if ((r.kanaal !== 'email' && r.kanaal !== 'app' && r.kanaal !== 'push') || typeof r.onderwerp !== 'string' || typeof r.inhoud !== 'string' || typeof r.gepland_op !== 'string') return null
  return {
    id: r.id,
    userId: r.user_id,
    lidId: r.lid_id,
    soort: r.soort,
    kanaal: r.kanaal,
    onderwerp: r.onderwerp,
    inhoud: r.inhoud,
    bronSoort: r.bron_soort === 'reservering' || r.bron_soort === 'afspraak' ? r.bron_soort : null,
    bronId: typeof r.bron_id === 'string' ? r.bron_id : null,
    bronStart: typeof r.bron_start === 'string' ? r.bron_start : null,
    geplandOp: r.gepland_op,
    pogingen: typeof r.pogingen === 'number' ? r.pogingen : 0,
    demo: r.demo === true,
  }
}

/** De rijen die nu aan de beurt zijn, oudste eerst. null bij een leesfout. */
export async function haalWachtrij(admin: SupabaseClient, nu: Date, max: number): Promise<WachtrijRij[] | null> {
  const { data, error } = await admin.from('club_meldingen').select(WACHTRIJ_KOLOMMEN).eq('status', 'gepland').lte('gepland_op', nu.toISOString()).order('gepland_op').limit(max)
  if (error) {
    console.error('[club-meldingen] wachtrij lezen mislukt', error.message)
    return null
  }
  return ((data ?? []) as Array<Record<string, unknown>>).map(rijUit).filter((r): r is WachtrijRij => r !== null)
}

type Rij = Record<string, unknown>

async function lees(admin: SupabaseClient, tabel: string, kolommen: string, kolom: string, ids: readonly string[]): Promise<Rij[]> {
  if (ids.length === 0) return []
  const { data, error } = await admin.from(tabel).select(kolommen).in(kolom, [...new Set(ids)])
  if (error) console.error(`[club-meldingen] ${tabel} lezen mislukt`, error.message)
  return (data ?? []) as unknown as Rij[]
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

async function haalBronnen(admin: SupabaseClient, rijen: readonly WachtrijRij[]): Promise<Map<string, BronStand>> {
  const ids = (soort: 'reservering' | 'afspraak') => rijen.filter((r) => r.bronSoort === soort && r.bronId).map((r) => r.bronId as string)
  const [reserveringen, afspraken] = await Promise.all([
    lees(admin, 'club_reserveringen', 'id, user_id, status, les_id', 'id', ids('reservering')),
    lees(admin, 'club_afspraken', 'id, user_id, status, start_op', 'id', ids('afspraak')),
  ])
  const lessen = await lees(admin, 'club_lessen', 'id, start_op, status', 'id', reserveringen.map((r) => String(r.les_id)))
  const lesVan = new Map(lessen.map((l) => [String(l.id), l]))
  const bronnen = new Map<string, BronStand>()
  for (const r of reserveringen) {
    const les = lesVan.get(String(r.les_id))
    if (les) bronnen.set(`${r.user_id}:${r.id}`, { status: String(r.status), start: String(les.start_op), lesGeannuleerd: les.status === 'geannuleerd' })
  }
  for (const a of afspraken) bronnen.set(`${a.user_id}:${a.id}`, { status: String(a.status), start: String(a.start_op) })
  return bronnen
}

/** Alles wat nodig is om deze rijen te beoordelen en te versturen. */
export async function haalContext(admin: SupabaseClient, rijen: readonly WachtrijRij[]): Promise<Context> {
  const [orgRijen, ledenRijen, voorkeurRijen, bronnen] = await Promise.all([
    lees(admin, 'club_organisaties', 'id, naam, logo, kleur_accent, thema, demo', 'id', rijen.map((r) => r.userId)),
    lees(admin, 'club_leden', 'id, user_id, email, demo', 'id', rijen.map((r) => r.lidId)),
    lees(admin, 'club_meldingen_voorkeuren', 'user_id, lid_id, afmeld_token, mails, herinneringen_per_mail, push', 'lid_id', rijen.map((r) => r.lidId)),
    haalBronnen(admin, rijen),
  ])
  return {
    orgs: new Map(orgRijen.map((o) => [String(o.id), { naam: tekst(o.naam) ?? 'Je sportschool', logo: tekst(o.logo), accent: tekst(o.kleur_accent) ?? '#B58E5C', donker: o.thema !== 'licht', demo: o.demo === true }])),
    leden: new Map(ledenRijen.map((l) => [String(l.id), { userId: String(l.user_id), email: tekst(l.email), demo: l.demo === true }])),
    voorkeuren: new Map(
      voorkeurRijen.map((v) => [`${v.user_id}:${v.lid_id}`, { token: String(v.afmeld_token), mails: v.mails !== false, herinneringenPerMail: v.herinneringen_per_mail !== false, push: v.push !== false }]),
    ),
    bronnen,
  }
}

/** Het afmeldtoken van een lid; maakt de voorkeur aan als die er nog niet is. null bij een fout. */
export async function zorgVoorToken(admin: SupabaseClient, userId: string, lidId: string): Promise<string | null> {
  const nieuw = randomBytes(24).toString('base64url')
  const { error } = await admin.from('club_meldingen_voorkeuren').upsert({ user_id: userId, lid_id: lidId, afmeld_token: nieuw }, { onConflict: 'user_id,lid_id', ignoreDuplicates: true })
  if (error) console.error('[club-meldingen] voorkeur aanmaken mislukt', error.message)
  const { data, error: f2 } = await admin.from('club_meldingen_voorkeuren').select('afmeld_token').eq('user_id', userId).eq('lid_id', lidId).maybeSingle()
  if (f2) console.error('[club-meldingen] voorkeur lezen mislukt', f2.message)
  return tekst((data as Rij | null)?.afmeld_token)
}

/**
 * Een url van het logo die in een mail werkt: een ondertekende link van een
 * jaar. Het ingebouwde Fit Factory-logo is een component en geen bestand: dan
 * null, en toont de mail de naam als woordmerk.
 */
export async function logoVoorMail(admin: SupabaseClient, logo: string | null): Promise<string | null> {
  if (!logo || !LOGO_PAD.test(logo)) return null
  const { data, error } = await admin.storage.from('club-logo').createSignedUrl(logo, 365 * 24 * 3600)
  if (error) console.error('[club-meldingen] logo-link maken mislukt', error.message)
  return data?.signedUrl ?? null
}

/** De afmeldlink voor een token. */
export function afmeldUrl(token: string): string {
  return ptUrl(`/api/club-afmelden/${encodeURIComponent(token)}`)
}
