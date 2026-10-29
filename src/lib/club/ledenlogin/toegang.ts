// ─── Club, ledenlogin: wie gebruikt de ledenapp? (SERVER-ONLY) ──────────────
// Twee ingangen voor /mijn en /api/club/lid:
//   1. Een lid met een eigen sessie (e-mail plus wachtwoord). Alleen met de
//      schakelaar CLUB_LEDEN_LOGIN aan. Het lid komt ALTIJD uit de sessie.
//   2. Kane (beheerder-sessie van Club) als voorvertoning: het lid komt uit de
//      vraag (?lid= op de pagina, ?voor= op de API), alleen als het bij de
//      sportschool hoort die Kane open heeft. Werkt ook met de schakelaar uit.
// Alle anderen: /mijn bestaat niet (gewone 404). Een lidId in de body of de
// vraag van een gewoon lid wordt nooit gelezen.

import { cache } from 'react'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubToegang, haalEigenOrganisatie, sessiePastBijAdres } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY, isUuid, moduleAan, type Organisatie } from '@/lib/club/kern/organisatie'
import { apiAfgenomen } from '@/lib/club/kern/pakketten'
import { haalLid, magTrainen, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { hoortBij, vestigingenUitRijen, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { LedenappMerk, LedenappTabblad } from './contract'
import { tabsUitVoor } from './tabs'
import { lidCookie, type LidToegangRij } from './regels'
import { lidVanSessie } from './opslag'
import { CLUB_LEDEN_LOGIN } from './schakelaar'

export interface LidToegang {
  admin: SupabaseClient
  /** De sportschool (club_organisaties.id): het user_id van elke query. */
  userId: string
  organisatie: Organisatie
  lid: Lid
  merk: LedenappMerk
  /** Kane kijkt mee; er is geen ledensessie. */
  voorvertoning: boolean
  /** De vestigingen van de sportschool (voor namen in de app). */
  vestigingen: VestigingInfo[]
  /** Wie er werkt, voor het logboek van de sportschool. */
  naam: string
  /** Het account van het lid (SERVER-ONLY, met hashes); null in de voorvertoning. */
  account: LidToegangRij | null
  /** De sha256 van het sessietoken; null in de voorvertoning. */
  sessieHash: string | null
}

function adminOfNull(): SupabaseClient | null {
  try {
    return clubDatabase()
  } catch {
    return null
  }
}

/** Het merk voor de web-app (manifest, kleuren, logo). */
export function merkVan(org: Organisatie, voorvertoning: boolean): LedenappMerk {
  const eigenLogo = org.logo && org.logo !== LOGO_FIT_FACTORY ? org.logo : null
  const logoUrl = eigenLogo ? (voorvertoning ? `/api/club/organisatie/logo?pad=${encodeURIComponent(eigenLogo)}` : '/api/club/lid/logo') : null
  return { organisatieId: org.id, naam: org.naam, slug: org.slug, kleurAccent: org.kleurAccent, thema: org.thema, logoUrl }
}

async function haalVestigingen(admin: SupabaseClient, userId: string): Promise<VestigingInfo[]> {
  const { data, error } = await admin.from('club_vestigingen').select('vestiging, naam, volgorde, standaard').eq('user_id', userId).order('volgorde').order('naam')
  if (error) console.error('[club/ledenlogin] vestigingen lezen mislukt', error.message)
  return vestigingenUitRijen(data ?? [])
}

/** Mag dit lid de app gebruiken? Bij deze sportschool, een eigen vestiging, en trainen mag. */
export function lidMagApp(lid: Lid | null, vestigingen: readonly VestigingInfo[]): lid is Lid {
  return lid !== null && hoortBij(vestigingen, lid.vestiging) && magTrainen(lid.status)
}

/** Een lid met een eigen sessie; alleen met de schakelaar aan. */
async function toegangVoorLid(admin: SupabaseClient): Promise<LidToegang | null> {
  if (!CLUB_LEDEN_LOGIN) return null
  const token = (await cookies()).get(lidCookie())?.value
  if (!token) return null
  const sessie = await lidVanSessie(admin, token, new Date())
  if (!sessie) return null
  const { userId, lidId } = sessie.toegang
  const [{ organisatie }, lid, vestigingen] = await Promise.all([haalEigenOrganisatie(admin, userId), haalLid(admin, userId, lidId), haalVestigingen(admin, userId)])
  if (!organisatie || organisatie.id !== userId || !moduleAan(organisatie, 'app')) return null
  // Op het subdomein van een andere sportschool bestaat deze sessie niet.
  if (!(await sessiePastBijAdres(organisatie))) return null
  if (!lidMagApp(lid, vestigingen) || lid.id !== lidId) return null
  return { admin, userId, organisatie, lid, merk: merkVan(organisatie, false), voorvertoning: false, vestigingen, naam: `${volledigeNaam(lid)} (ledenapp)`.slice(0, 80), account: sessie.toegang, sessieHash: sessie.tokenHash }
}

/** Kane kijkt mee als dit lid; alleen in de sportschool die Kane open heeft. */
async function voorvertoningVoorKane(lidId: string | null | undefined): Promise<LidToegang | null> {
  if (!isUuid(lidId)) return null
  const t = await clubToegang()
  if (!t || !t.isPlatformEigenaar || !moduleAan(t.organisatie, 'app')) return null
  const lid = await haalLid(t.admin, t.userId, lidId)
  if (!lidMagApp(lid, t.vestigingen)) return null
  return { admin: t.admin, userId: t.userId, organisatie: t.organisatie, lid, merk: merkVan(t.organisatie, true), voorvertoning: true, vestigingen: t.vestigingen, naam: `${t.naam} (voorvertoning ledenapp)`.slice(0, 80), account: null, sessieHash: null }
}

/**
 * Wie gebruikt de ledenapp: een lid uit zijn sessie, of Kane als voorvertoning
 * met `voorvertoningLid`. Dat argument telt ALLEEN voor Kane. Per request een
 * keer gevraagd.
 */
export const lidToegang = cache(async (voorvertoningLid?: string | null): Promise<LidToegang | null> => {
  const admin = adminOfNull()
  if (!admin) return null
  return (await toegangVoorLid(admin)) ?? (await voorvertoningVoorKane(voorvertoningLid))
})

/** Per IP: ruim voor een mens, te weinig om de database te bestoken. */
const LEES_MAX = 240
const SCHRIJF_MAX = 40
const VENSTER_MS = 60_000

/**
 * De poort voor elke /api/club/lid-route. Niemand binnen: 404. Muterende
 * verzoeken moeten van onze eigen pagina komen. In de voorvertoning geeft Kane
 * het lid mee als ?voor=<id>; voor een lid wordt die waarde nooit gelezen.
 * Met `tabblad`: staat dat tabblad bij de sportschool uit, dan ook een 404.
 *
 *   const l = await vereisLidToegang(req, 'lessen')
 *   if (l instanceof NextResponse) return l
 */
export async function vereisLidToegang(req: NextRequest, tabblad?: LedenappTabblad): Promise<LidToegang | NextResponse> {
  const leest = req.method === 'GET' || req.method === 'HEAD'
  if (!leest && !isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  const ip = ipVan(req)
  if (isRateLimited(`club-lid-api:${ip}`, LEES_MAX, VENSTER_MS) || (!leest && isRateLimited(`club-lid-schrijf:${ip}`, SCHRIJF_MAX, VENSTER_MS))) {
    return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  }
  const l = await lidToegang(req.nextUrl.searchParams.get('voor'))
  if (!l || (tabblad && tabsUitVoor(l.organisatie).includes(tabblad))) return clubFout('Niet gevonden.', 404)
  // Een deel van de ledenapp van een pakket dat de sportschool niet afnam, bestaat niet (kern/pakketten.ts).
  if (!apiAfgenomen(l.organisatie.afgenomen, req.nextUrl.pathname)) return clubFout('Niet gevonden.', 404)
  return l
}

/** Een JSON-body met een grens; een lidId erin telt nooit. */
export function zonderLid(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return {}
  return Object.fromEntries(Object.entries(body as Record<string, unknown>).filter(([k]) => k !== 'lidId'))
}
