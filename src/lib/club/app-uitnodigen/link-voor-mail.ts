// ─── Club, leden op de app: de link in de mail (SERVER-ONLY) ────────────────
// De cron roept dit aan op het moment van versturen, zodat de link vers is en
// nooit in de wachtrij staat. Alles wordt opnieuw nagerekend: de ledenapp is
// open, staat aan bij de sportschool, het lid mag de app gebruiken en de link
// is niet ingetrokken. Anders geen mail, met een korte reden.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalEigenOrganisatie } from '@/lib/club/toegang'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { haalLid } from '@/lib/club/kern/lid'
import { vestigingenUitRijen } from '@/lib/club/kern/vestigingen'
import { CLUB_DOMEIN, aygUrl } from '@/lib/club/kern/subdomein'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { linkBasis, startPad } from '@/lib/club/ledenlogin/regels'
import { geefUitnodigingCode } from '@/lib/club/ledenlogin/opslag'
import { lidMagApp } from '@/lib/club/ledenlogin/toegang'

export type LinkVoorMail = { ok: true; url: string } | { ok: false; reden: string }

/** De volledige url van de persoonlijke link voor deze code. */
export function linkUrl(slug: string | null, code: string): string {
  const basis = linkBasis(slug, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', CLUB_DOMEIN)
  return basis ? `${basis}${startPad(code)}` : aygUrl(startPad(code))
}

/**
 * Een werkende uitnodiging: de huidige als die nog werkt, anders een nieuwe.
 * Nooit het wachtwoord of de sessies wissen (dan kon iedereen die het adres
 * kent het lid uitloggen). Ingetrokken door de sportschool: niets.
 */
async function codeVan(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<LinkVoorMail | string> {
  const uit = await geefUitnodigingCode(admin, userId, lidId, nu)
  if (uit.staat === 'ok') return uit.code
  return { ok: false, reden: uit.staat === 'ingetrokken' ? 'Link ingetrokken door de sportschool' : 'Link maken mislukt' }
}

/** De link voor de mail, of waarom er geen mail gaat. */
export async function ledenappLinkVoorMail(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<LinkVoorMail> {
  if (!CLUB_LEDEN_LOGIN) return { ok: false, reden: 'Ledenapp nog niet open (CLUB_LEDEN_LOGIN)' }
  const [{ organisatie }, lid, vestigingen] = await Promise.all([
    haalEigenOrganisatie(admin, userId),
    haalLid(admin, userId, lidId),
    admin.from('club_vestigingen').select('vestiging, naam, volgorde, standaard').eq('user_id', userId),
  ])
  if (!organisatie || organisatie.id !== userId || !moduleAan(organisatie, 'app')) return { ok: false, reden: 'Ledenapp staat uit bij de sportschool' }
  if (!lidMagApp(lid, vestigingenUitRijen(vestigingen.data ?? []))) return { ok: false, reden: 'Lid mag de app niet gebruiken' }
  const code = await codeVan(admin, userId, lidId, nu)
  return typeof code === 'string' ? { ok: true, url: linkUrl(organisatie.slug, code) } : code
}
