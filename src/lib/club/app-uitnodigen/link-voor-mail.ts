// ─── Club, leden op de app: de link in de mail (SERVER-ONLY) ────────────────
// De cron roept dit aan op het moment van versturen, zodat de link vers is en
// nooit in de wachtrij staat. Alles wordt opnieuw nagerekend: de ledenapp is
// open, staat aan bij de sportschool, het lid mag de app gebruiken en de link
// is niet ingetrokken. Anders geen mail, met een korte reden.

import type { SupabaseClient } from '@supabase/supabase-js'
import { ptUrl } from '@/lib/fit-factory/domein'
import { haalEigenOrganisatie } from '@/lib/club/toegang'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { haalLid } from '@/lib/club/kern/lid'
import { vestigingenUitRijen } from '@/lib/club/kern/vestigingen'
import { CLUB_DOMEIN } from '@/lib/club/kern/subdomein'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { linkBasis, startPad } from '@/lib/club/ledenlogin/regels'
import { haalLinkOverzicht, maakLidLink } from '@/lib/club/ledenlogin/opslag'
import { lidMagApp } from '@/lib/club/ledenlogin/toegang'
import { linkKeuze } from './regels'

export type LinkVoorMail = { ok: true; url: string } | { ok: false; reden: string }

/** De volledige url van de persoonlijke link voor deze code. */
export function linkUrl(slug: string | null, code: string): string {
  const basis = linkBasis(slug, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', CLUB_DOMEIN)
  return basis ? `${basis}${startPad(code)}` : ptUrl(startPad(code))
}

async function codeVan(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<LinkVoorMail | string> {
  const overzicht = await haalLinkOverzicht(admin, userId, lidId, nu)
  if (!overzicht) return { ok: false, reden: 'Link kon niet worden gelezen' }
  const keuze = linkKeuze(overzicht.staat)
  if (keuze === 'niet') return { ok: false, reden: 'Link ingetrokken door de sportschool' }
  if (keuze === 'hergebruik' && overzicht.code) return overzicht.code
  if (!(await maakLidLink(admin, userId, lidId, nu))) return { ok: false, reden: 'Link maken mislukt' }
  const nieuw = await haalLinkOverzicht(admin, userId, lidId, nu)
  return nieuw?.code ?? { ok: false, reden: 'Link maken mislukt' }
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
