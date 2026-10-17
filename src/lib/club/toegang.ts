// ─── Fit Factory clubsoftware: het slot (SERVER-ONLY) ───────────────────────
// Twee ingangen:
//   1. Kane: een geldige beheerder-sessie van de PT-app (de httpOnly-cookie van
//      het hoofdaccount). Ziet alle eigen sportscholen en wisselt ertussen.
//   2. Een eigenaar of clubmanager van een sportschool (club_beheerders), met
//      een eigen sessie na link plus pincode. Ziet ALLEEN de eigen sportschool.
//      Alleen als de schakelaar CLUB_EIGEN_LOGIN aan staat; standaard uit.
// Alle anderen: /clubkane bestaat niet. Pagina's geven een gewone 404 en de API
// ook (geen 401/403 die verraadt dat er iets achter zit).

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { beoordeelSessie, leesSessie, vindLink } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { GEEN_CACHE, isZelfdeOorsprong } from '@/lib/lifeos/leads/toegang'
import { vestigingenUitRijen, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { slugUitHost } from '@/lib/club/kern/subdomein'
import { ONDERDEEL_SLEUTELS, orgInstellingenUitRij } from '@/lib/club/kern/org-instellingen'
import { LOGO_FIT_FACTORY, ORGANISATIE_COOKIE, ORGANISATIE_KOLOMMEN, isUuid, moduleAan, organisatieUitRij, type Module, type Organisatie } from '@/lib/club/kern/organisatie'
import { beheerderCookie, type BeheerderRol } from '@/lib/club/beheerders/beheerder'
import { beheerderVanSessie } from '@/lib/club/beheerders/beheerder-opslag'
import { externeToegangVelden } from '@/lib/club/beheerders/externe-toegang'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'

/** Wie er binnen is: Kane (beheerder) of een eigenaar of clubmanager van een sportschool. */
export type ClubRol = 'beheerder' | BeheerderRol

export interface ClubToegang {
  admin: SupabaseClient
  /**
   * De sportschool die nu open staat: haar id is de user_id waarop alle
   * club_*-tabellen filteren. Voor Fit Factory is dat de vaste eigenaar
   * (LIFEOS_USER_ID); elke andere sportschool heeft een eigen id.
   */
  userId: string
  /** De actieve sportschool, met huisstijl en onderdelen. */
  organisatie: Organisatie
  /** Alle sportscholen die deze persoon mag openen (voor een eigenaar of clubmanager alleen de eigen). */
  organisaties: Organisatie[]
  /**
   * De beheerder_id van de sportscholen (Kane). Voor Kane is dat wie ingelogd
   * is; voor een eigenaar of clubmanager de eigenaar van het organisatierecord.
   */
  beheerderId: string
  /** Kane, of een eigenaar of clubmanager van de actieve sportschool. */
  rol: ClubRol
  /** Alleen Kane wisselt van sportschool, maakt sportscholen aan en beheert beheerders. */
  isKane: boolean
  /** De vestigingen van de actieve sportschool, in vaste volgorde; de standaard eerst. */
  vestigingen: VestigingInfo[]
  /** Wie er werkt, voor het logboek ("Kane"). */
  naam: string
  /** De PT-code van Kane, voor de link terug naar de PT-app; null voor anderen. */
  code: string | null
}

/** De code van de (enige) actieve beheerder-link, of null. */
async function beheerderCode(admin: SupabaseClient): Promise<string | null> {
  const { data, error } = await admin
    .from('pt_lead_links')
    .select('code')
    .eq('rol', 'beheerder')
    .eq('actief', true)
    .limit(1)
    .maybeSingle()
  if (error || !data || typeof data.code !== 'string') return null
  return data.code
}

/** Zonder migratie 401 of bij een leesfout: Fit Factory zoals altijd. */
function standaardOrganisatie(id: string): Organisatie {
  return { id, naam: 'Fit Factory', slogan: 'Meet. Train. Repeat.', logo: LOGO_FIT_FACTORY, kleurAccent: '#B58E5C', thema: 'donker', uit: [], demo: false, slug: null, instellingen: orgInstellingenUitRij({}, ONDERDEEL_SLEUTELS) }
}

/**
 * Op een subdomein (<slug>.aiyourgym.com, schakelaar CLUB_SUBDOMEINEN_ACTIEF aan)
 * bepaalt het adres welke sportschool open staat; de cookie telt dan niet.
 * undefined = geen subdomein; null = subdomein van een sportschool die deze
 * beheerder niet mag openen (dan bestaat Club hier niet: 404).
 */
async function organisatieUitHost(organisaties: readonly Organisatie[]): Promise<Organisatie | null | undefined> {
  if (process.env.CLUB_SUBDOMEINEN_ACTIEF !== '1') return undefined
  const slug = slugUitHost((await headers()).get('host'))
  if (!slug) return undefined
  return organisaties.find((o) => o.slug === slug) ?? null
}

/** De sportscholen van deze beheerder; de eigen (Fit Factory) altijd eerst. */
async function haalOrganisaties(admin: SupabaseClient, beheerderId: string): Promise<Organisatie[]> {
  const { data, error } = await admin.from('club_organisaties').select(ORGANISATIE_KOLOMMEN).eq('beheerder_id', beheerderId).order('aangemaakt_op')
  if (error) console.error('[club] organisaties lezen mislukt', error.message)
  const lijst = (data ?? []).map(organisatieUitRij).filter((o): o is Organisatie => o !== null)
  const eigen = lijst.find((o) => o.id === beheerderId) ?? standaardOrganisatie(beheerderId)
  return [eigen, ...lijst.filter((o) => o.id !== beheerderId)]
}

/** De vestigingen van een sportschool (leeg bij een fout: de pagina's tonen dan een melding). */
async function haalVestigingen(admin: SupabaseClient, organisatieId: string): Promise<VestigingInfo[]> {
  const { data, error } = await admin.from('club_vestigingen').select('vestiging, naam, volgorde, standaard').eq('user_id', organisatieId).order('volgorde').order('naam')
  if (error) console.error('[club] vestigingen lezen mislukt', error.message)
  return vestigingenUitRijen(data ?? [])
}

/** Kane: een geldige beheerder-sessie van de PT-app. */
async function toegangVoorKane(admin: SupabaseClient): Promise<ClubToegang | null> {
  const code = await beheerderCode(admin)
  if (!code) return null
  const token = (await cookies()).get(sessieCookieNaam(code))?.value
  if (!token) return null
  const [link, sessie] = await Promise.all([vindLink(admin, code), leesSessie(admin, token)])
  if (!link || link.rol !== 'beheerder') return null
  const ingelogd = await beoordeelSessie(admin, link, token, sessie, new Date())
  if (!ingelogd) return null
  const organisaties = await haalOrganisaties(admin, link.userId)
  const vanHost = await organisatieUitHost(organisaties)
  if (vanHost === null) return null
  // Anders de gekozen sportschool, alleen als die bij deze beheerder hoort; anders de eigen.
  const gekozen = (await cookies()).get(ORGANISATIE_COOKIE)?.value
  const organisatie = vanHost ?? organisaties.find((o) => o.id === gekozen) ?? organisaties[0]
  const vestigingen = await haalVestigingen(admin, organisatie.id)
  return { admin, userId: organisatie.id, organisatie, organisaties, beheerderId: link.userId, rol: 'beheerder', isKane: true, vestigingen, naam: link.naam, code }
}

/** De sportschool van een eigenaar of clubmanager, met de eigenaar van het record. */
export async function haalEigenOrganisatie(admin: SupabaseClient, id: string): Promise<{ organisatie: Organisatie | null; eigenaarId: string | null }> {
  const { data, error } = await admin.from('club_organisaties').select(`${ORGANISATIE_KOLOMMEN}, beheerder_id`).eq('id', id).maybeSingle()
  if (error) console.error('[club] organisatie lezen mislukt', error.message)
  const eigenaar = (data as { beheerder_id?: unknown } | null)?.beheerder_id
  return { organisatie: organisatieUitRij(data), eigenaarId: isUuid(eigenaar) ? eigenaar : null }
}

/** Een eigenaar of clubmanager met een eigen sessie; alleen met de schakelaar aan. */
async function toegangVoorBeheerder(admin: SupabaseClient): Promise<ClubToegang | null> {
  if (!CLUB_EIGEN_LOGIN) return null
  const token = (await cookies()).get(beheerderCookie())?.value
  if (!token) return null
  const b = await beheerderVanSessie(admin, token, new Date())
  if (!b) return null
  const { organisatie, eigenaarId } = await haalEigenOrganisatie(admin, b.organisatieId)
  const velden = externeToegangVelden(b, organisatie, eigenaarId)
  if (!velden) return null
  // Op het subdomein van een andere sportschool bestaat Club voor deze beheerder niet.
  if ((await organisatieUitHost(velden.organisaties)) === null) return null
  const vestigingen = await haalVestigingen(admin, velden.userId)
  return { admin, ...velden, vestigingen }
}

/** Wie is er binnen: Kane, of een eigenaar of clubmanager? Per request een keer gevraagd. */
export const clubToegang = cache(async (): Promise<ClubToegang | null> => {
  let admin: SupabaseClient
  try {
    admin = createLifeosAdminClient()
  } catch {
    return null
  }
  return (await toegangVoorKane(admin)) ?? (await toegangVoorBeheerder(admin))
})

/** Voor pagina's en layouts: de toegang, of een gewone 404. */
export async function eisClubToegang(): Promise<ClubToegang> {
  const t = await clubToegang()
  if (!t) notFound()
  return t
}

/** Een JSON-fout van de club-API, altijd zonder cache en noindex. */
export function clubFout(fout: string, status: number): NextResponse {
  return NextResponse.json({ fout }, { status, headers: GEEN_CACHE })
}

/** Een JSON-antwoord van de club-API, altijd zonder cache en noindex. */
export function clubJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: GEEN_CACHE })
}

/**
 * De poort voor elke /api/club-route. Niemand binnen: 404 (bestaat niet).
 * Muterende verzoeken (alles behalve GET/HEAD) moeten van onze eigen pagina komen.
 *
 *   const t = await vereisClubToegang(req)
 *   if (t instanceof NextResponse) return t
 */
export async function vereisClubToegang(req: NextRequest): Promise<ClubToegang | NextResponse> {
  const t = await clubToegang()
  if (!t) return clubFout('Niet gevonden.', 404)
  const leest = req.method === 'GET' || req.method === 'HEAD'
  if (!leest && !isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  return t
}

/** Voor pagina's die alleen Kane mag zien (sportscholen, beheerders): anders een gewone 404. */
export async function eisKane(): Promise<ClubToegang> {
  const t = await eisClubToegang()
  if (!t.isKane) notFound()
  return t
}

/** Als vereisClubToegang, maar alleen voor Kane; anderen krijgen een 404. */
export async function vereisKane(req: NextRequest): Promise<ClubToegang | NextResponse> {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return t.isKane ? t : clubFout('Niet gevonden.', 404)
}

/** Een regel in het logboek. Best-effort: een mislukte log breekt de actie niet. */
export async function logActie(t: ClubToegang, actie: string, onderwerp: string | null, vestiging: string | null): Promise<void> {
  const { error } = await t.admin.from('club_logboek').insert({
    user_id: t.userId,
    wie: t.naam.slice(0, 80),
    actie: actie.slice(0, 80),
    onderwerp: onderwerp ? onderwerp.slice(0, 200) : null,
    vestiging,
  })
  if (error) console.error('[club] logboek schrijven mislukt', error.message)
}

/**
 * Voor pagina's van een onderdeel dat een sportschool uit kan zetten: de
 * toegang, of een gewone 404 als het onderdeel bij deze sportschool uit staat.
 */
export async function eisModule(module: Module): Promise<ClubToegang> {
  const t = await eisClubToegang()
  if (!moduleAan(t.organisatie, module)) notFound()
  return t
}
