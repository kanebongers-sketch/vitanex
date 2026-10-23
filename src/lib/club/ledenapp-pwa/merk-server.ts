// ─── Club ledenapp: welke sportschool hoort bij dit verzoek (SERVER-ONLY) ──
// Voor het manifest en de iconen van /mijn. Volgorde:
//   1. Kane met een geldige sessie (voorvertoning): de sportschool die open
//      staat in Club (cookie club-org, gecontroleerd in clubToegang; op een
//      subdomein kiest clubToegang zelf die van het adres).
//   2. Alleen als de ledenapp open is voor leden (LEDENAPP_OPEN):
//      a. de sportschool van het ingelogde lid (organisatieId uit de lid-sessie),
//      b. het adres: aiyourgym.com/<slug>, of <slug>.aiyourgym.com met subdomeinen aan,
//      c. anders een neutrale "Club".
// Is de ledenapp nog dicht, dan bestaat er voor anderen niets: de routes geven
// een gewone 404 (Club is geheim tot de presentatie).

import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { clubToegang } from '@/lib/club/toegang'
import { adresVanVerzoek } from '@/lib/club/kern/adres-verzoek'
import { ORGANISATIE_KOLOMMEN, isUuid, moduleAan, organisatieUitRij, type Organisatie } from '@/lib/club/kern/organisatie'
import { LOGO_BUCKET } from '@/lib/club/kern/organisatie-opslag'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { merkUitOrganisatie, type MerkBron } from './merk'

/** Tot de presentatie dicht: dezelfde schakelaar als de inlog van leden. */
export const LEDENAPP_OPEN = CLUB_LEDEN_LOGIN

export type MerkUitslag = { soort: 'merk'; bron: MerkBron } | { soort: 'neutraal' } | { soort: 'verborgen' }

export interface MerkVraag {
  /** club_organisaties.id uit de sessie van een ingelogd lid, als die er is. */
  lidOrganisatieId?: string | null
}

function adminOfNull(): SupabaseClient | null {
  try {
    return clubDatabase()
  } catch (fout) {
    console.error('[club-app] geen databaseverbinding', fout instanceof Error ? fout.message : fout)
    return null
  }
}

async function zoekOrganisatie(admin: SupabaseClient, kolom: 'id' | 'slug', waarde: string): Promise<Organisatie | null> {
  const { data, error } = await admin.from('club_organisaties').select(ORGANISATIE_KOLOMMEN).eq(kolom, waarde).maybeSingle()
  if (error) console.error('[club-app] sportschool lezen mislukt', error.message)
  return organisatieUitRij(data)
}

/** De sportschool van het adres (subdomein of aiyourgym.com/<slug>); undefined = geen adres, null = onbekend of niet te lezen. */
async function vanSubdomein(admin: SupabaseClient | null): Promise<Organisatie | null | undefined> {
  const slug = (await adresVanVerzoek())?.slug
  if (!slug) return undefined
  return admin ? zoekOrganisatie(admin, 'slug', slug) : null
}

/** Een sportschool met de ledenapp uit telt voor leden niet. */
function voorLeden(org: Organisatie | null): MerkUitslag {
  return org && moduleAan(org, 'app') ? { soort: 'merk', bron: merkUitOrganisatie(org) } : { soort: 'verborgen' }
}

export async function ledenappMerkVoorVerzoek(vraag: MerkVraag = {}): Promise<MerkUitslag> {
  const t = await clubToegang()
  if (t) return { soort: 'merk', bron: merkUitOrganisatie(t.organisatie) }
  if (!LEDENAPP_OPEN) return { soort: 'verborgen' }

  const admin = adminOfNull()
  if (isUuid(vraag.lidOrganisatieId)) return voorLeden(admin ? await zoekOrganisatie(admin, 'id', vraag.lidOrganisatieId) : null)
  const sub = await vanSubdomein(admin)
  if (sub === undefined) return { soort: 'neutraal' }
  return voorLeden(sub)
}

/** Het logo als data-URL voor ImageResponse, of null (dan wordt het de letter). */
export async function icoonLogoDataUrl(pad: string | null): Promise<string | null> {
  if (!pad) return null
  const admin = adminOfNull()
  if (!admin) return null
  const { data, error } = await admin.storage.from(LOGO_BUCKET).download(pad)
  if (error || !data) {
    if (error) console.error('[club-app] logo lezen mislukt', error.message)
    return null
  }
  const type = pad.endsWith('.png') ? 'image/png' : 'image/jpeg'
  return `data:${type};base64,${Buffer.from(await data.arrayBuffer()).toString('base64')}`
}
