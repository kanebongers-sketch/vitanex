// ─── AI Your Gym, Club: het slot (SERVER-ONLY) ──────────────────────────────
// Drie ingangen, alleen op aiyourgym.com en de subdomeinen (src/proxy.ts):
//   1. De platform-eigenaar (Kane, master account): een eigen sessie na
//      e-mailadres en wachtwoord (src/lib/club/platform-login). Ziet alle
//      sportscholen en wisselt ertussen. Los van de PT-app: geen gedeelde cookie.
//   2. Een eigenaar of clubmanager van een sportschool (club_beheerders), met
//      een eigen sessie na e-mailadres en wachtwoord. Ziet ALLEEN de eigen
//      sportschool. Alleen als de schakelaar CLUB_EIGEN_LOGIN aan staat.
//   3. Een medewerker (club_medewerkers) met een eigen sessie na e-mailadres en
//      wachtwoord (uitgenodigd door de eigenaar of clubmanager). Ziet alleen de eigen
//      sportschool, alleen de eigen vestigingen en alleen de onderdelen van
//      zijn rollen. Ook alleen met CLUB_EIGEN_LOGIN aan.
// Alle anderen: /club bestaat niet. Pagina's geven een gewone 404 en de API
// ook (geen 401/403 die verraadt dat er iets achter zit).

import { cache } from 'react'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { GEEN_CACHE, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { platformCookie } from '@/lib/club/platform-login/platform'
import { platformVanSessie } from '@/lib/club/platform-login/opslag'
import { vestigingenUitRijen, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { adresVanVerzoek } from '@/lib/club/kern/adres-verzoek'
import { kiesOrganisatie, type AdresRegel } from '@/lib/club/kern/pad-adres'
import { ONDERDEEL_SLEUTELS, orgInstellingenUitRij } from '@/lib/club/kern/org-instellingen'
import { LOGO_FIT_FACTORY, ORGANISATIE_COOKIE, ORGANISATIE_KOLOMMEN, isUuid, moduleAan, organisatieUitRij, type Module, type Organisatie } from '@/lib/club/kern/organisatie'
import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import { beheerderCookie, type BeheerderRol } from '@/lib/club/beheerders/beheerder'
import { beheerderVanSessie } from '@/lib/club/beheerders/beheerder-opslag'
import { externeToegangVelden } from '@/lib/club/beheerders/externe-toegang'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { magApi, magBeheerdersBeheren, magOnderdeel, toegestaneOnderdelen } from '@/lib/club/beheerders/rechten'
import { medewerkerCookie } from '@/lib/club/medewerker-login/medewerker-login'
import { medewerkerVanSessie } from '@/lib/club/medewerker-login/opslag'
import { magApiAlsMedewerker } from '@/lib/club/medewerker-login/rechten'
import { medewerkerToegangVelden } from '@/lib/club/medewerker-login/toegang-velden'

/** Wie er binnen is: de platform-eigenaar (rol beheerder), een eigenaar of clubmanager van een sportschool, of een medewerker. */
export type ClubRol = 'beheerder' | BeheerderRol | 'medewerker'

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
  /** Alleen de platform-eigenaar (master account van Kane) wisselt van sportschool en maakt sportscholen aan. */
  isPlatformEigenaar: boolean
  /** Het id in club_beheerders (eigenaar, clubmanager) of club_medewerkers (medewerker); null voor Kane. */
  persoonId: string | null
  /** De onderdelen die deze persoon ziet (sleutels uit shell/onderdelen.ts); null = alles. */
  onderdelen: readonly string[] | null
  /** De vestigingen van de actieve sportschool, in vaste volgorde; de standaard eerst. */
  vestigingen: VestigingInfo[]
  /** De rollen van een ingelogde medewerker; leeg voor Kane en beheerders. */
  medewerkerRollen?: readonly MedewerkerRol[]
  /** Wie er werkt, voor het logboek ("Kane", of de naam van de medewerker). */
  naam: string
}

/** Zonder migratie 401 of bij een leesfout: Fit Factory zoals altijd. */
function standaardOrganisatie(id: string): Organisatie {
  return { id, naam: 'Fit Factory', slogan: 'Meet. Train. Repeat.', logo: LOGO_FIT_FACTORY, kleurAccent: '#B58E5C', thema: 'donker', uit: [], demo: false, slug: null, instellingen: orgInstellingenUitRij({}, ONDERDEEL_SLEUTELS) }
}

/**
 * Het adres van het verzoek bepaalt welke sportschool open staat: het subdomein
 * (<slug>.aiyourgym.com, schakelaar CLUB_SUBDOMEINEN_ACTIEF aan) of anders het
 * pad aiyourgym.com/<slug> (src/lib/club/kern/pad-adres.ts, met de regels per
 * soort sessie). undefined = het adres zegt niets; null = het adres hoort bij
 * een sportschool die deze persoon niet mag openen (dan bestaat Club hier niet: 404).
 */
async function organisatieUitHost(organisaties: readonly Organisatie[], regel: AdresRegel = 'vast'): Promise<Organisatie | null | undefined> {
  return kiesOrganisatie(organisaties, await adresVanVerzoek(), regel)
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

/** De platform-eigenaar: een geldige sessie van het master account (e-mailadres en wachtwoord). */
async function toegangVoorPlatform(admin: SupabaseClient): Promise<ClubToegang | null> {
  const token = (await cookies()).get(platformCookie())?.value
  if (!token) return null
  const account = await platformVanSessie(admin, token, new Date())
  if (!account) return null
  // De sportscholen en de vestigingen van de waarschijnlijk gekozen sportschool tegelijk.
  const gekozen = (await cookies()).get(ORGANISATIE_COOKIE)?.value
  const gok = isUuid(gekozen) ? gekozen : account.beheerderId
  const [organisaties, gokVestigingen] = await Promise.all([haalOrganisaties(admin, account.beheerderId), haalVestigingen(admin, gok)])
  // Het pad (aiyourgym.com/<slug>) of het subdomein is hard; de cookie van de laatst geopende omgeving een keuze.
  const vanHost = await organisatieUitHost(organisaties, 'voorkeur')
  if (vanHost === null) return null
  // Anders de gekozen sportschool, alleen als die bij dit account hoort; anders de eigen.
  const organisatie = vanHost ?? organisaties.find((o) => o.id === gekozen) ?? organisaties[0]
  const vestigingen = organisatie.id === gok ? gokVestigingen : await haalVestigingen(admin, organisatie.id)
  return {
    admin, userId: organisatie.id, organisatie, organisaties, beheerderId: account.beheerderId, rol: 'beheerder',
    isPlatformEigenaar: true, persoonId: null, onderdelen: null, vestigingen, medewerkerRollen: [], naam: account.naam,
  }
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
  // De vestigingen horen bij dezelfde sportschool (externeToegangVelden eist dat het id klopt).
  const [{ organisatie, eigenaarId }, vestigingen] = await Promise.all([haalEigenOrganisatie(admin, b.organisatieId), haalVestigingen(admin, b.organisatieId)])
  const velden = externeToegangVelden(b, organisatie, eigenaarId)
  if (!velden) return null
  // Op het subdomein van een andere sportschool bestaat Club voor deze beheerder niet.
  if ((await organisatieUitHost(velden.organisaties)) === null) return null
  return { admin, ...velden, onderdelen: toegestaneOnderdelen(velden, velden.organisatie.instellingen.rechten), vestigingen, medewerkerRollen: [] }
}

/** Een medewerker met een eigen sessie; alleen met de schakelaar aan. */
async function toegangVoorMedewerker(admin: SupabaseClient): Promise<ClubToegang | null> {
  if (!CLUB_EIGEN_LOGIN) return null
  const token = (await cookies()).get(medewerkerCookie())?.value
  if (!token) return null
  const gevonden = await medewerkerVanSessie(admin, token, new Date())
  if (!gevonden) return null
  const [{ organisatie, eigenaarId }, vestigingen] = await Promise.all([
    haalEigenOrganisatie(admin, gevonden.toegang.userId),
    haalVestigingen(admin, gevonden.toegang.userId),
  ])
  // Op het subdomein van een andere sportschool bestaat Club voor deze medewerker niet.
  if (!organisatie || (await organisatieUitHost([organisatie])) === null) return null
  const velden = medewerkerToegangVelden({ ...gevonden, organisatie, eigenaarId, vestigingen })
  if (!velden) return null
  const { rollen, ...rest } = velden
  return { admin, ...rest, medewerkerRollen: rollen }
}

/**
 * Hoort deze sportschool bij het adres van dit verzoek? Voor inloggen en
 * inloglinks: op het subdomein of pad (aiyourgym.com/<slug>) van een andere
 * sportschool niet, en ook niet als de cookie de omgeving van een andere
 * sportschool noemt; op gewoon aiyourgym.com wel.
 */
export async function hostPastBij(org: Organisatie): Promise<boolean> {
  return (await organisatieUitHost([org], 'streng')) !== null
}

/**
 * Voor een bestaande sessie (bijvoorbeeld van een lid): alleen het subdomein
 * of het pad telt. Op het adres van een andere sportschool bestaat de sessie niet.
 */
export async function sessiePastBijAdres(org: Organisatie): Promise<boolean> {
  return (await organisatieUitHost([org], 'vast')) !== null
}

/** Wie is er binnen: de platform-eigenaar, een eigenaar of clubmanager, of een medewerker? Per request een keer gevraagd. */
export const clubToegang = cache(async (): Promise<ClubToegang | null> => {
  let admin: SupabaseClient
  try {
    admin = clubDatabase()
  } catch {
    return null
  }
  return (await toegangVoorPlatform(admin)) ?? (await toegangVoorBeheerder(admin)) ?? (await toegangVoorMedewerker(admin))
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
  // Een clubmanager: alleen de API's van onderdelen die de eigenaar hem geeft.
  if (!magApi(t.onderdelen, req.nextUrl.pathname, req.method)) return clubFout('Niet gevonden.', 404)
  // Een medewerker: daarnaast nooit de sportschoolbrede acties (vestigingen, inloglinks).
  if (t.rol === 'medewerker' && !magApiAlsMedewerker(req.nextUrl.pathname, req.method)) return clubFout('Niet gevonden.', 404)
  const leest = req.method === 'GET' || req.method === 'HEAD'
  if (!leest && !isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  return t
}

/** Voor pagina's die alleen Kane mag zien (sportscholen, beheerders): anders een gewone 404. */
export async function eisPlatformEigenaar(): Promise<ClubToegang> {
  const t = await eisClubToegang()
  if (!t.isPlatformEigenaar) notFound()
  return t
}

/** Als vereisClubToegang, maar alleen voor Kane; anderen krijgen een 404. */
export async function vereisPlatformEigenaar(req: NextRequest): Promise<ClubToegang | NextResponse> {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return t.isPlatformEigenaar ? t : clubFout('Niet gevonden.', 404)
}

/** Wat een opslagfunctie van de toegang nodig heeft: de database, de sportschool en wie er werkt. */
export type ClubSchrijver = Pick<ClubToegang, 'admin' | 'userId' | 'naam'>

/** Een regel in het logboek. Best-effort: een mislukte log breekt de actie niet. */
export async function logActie(t: ClubSchrijver, actie: string, onderwerp: string | null, vestiging: string | null): Promise<void> {
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
/** Beheerders (eigenaren en clubmanagers) en het adres: Kane en de eigenaar. Anderen een 404. */
export async function eisBeheerdersBeheer(): Promise<ClubToegang> {
  const t = await eisClubToegang()
  if (!magBeheerdersBeheren(t)) notFound()
  return t
}

export async function vereisBeheerdersBeheer(req: NextRequest): Promise<ClubToegang | NextResponse> {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return magBeheerdersBeheren(t) ? t : clubFout('Niet gevonden.', 404)
}

/** Voor de layout van een onderdeel: een clubmanager zonder recht op dit onderdeel krijgt een 404. */
export async function eisOnderdeel(sleutel: string): Promise<ClubToegang> {
  const t = await eisClubToegang()
  if (!magOnderdeel(t.onderdelen, sleutel)) notFound()
  return t
}

export async function eisModule(module: Module): Promise<ClubToegang> {
  const t = await eisClubToegang()
  if (!moduleAan(t.organisatie, module)) notFound()
  return t
}
