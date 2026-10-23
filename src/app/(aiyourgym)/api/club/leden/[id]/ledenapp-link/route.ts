// GET  /api/club/leden/[id]/ledenapp-link  hoe de ledenapp-link van dit lid ervoor staat
// POST /api/club/leden/[id]/ledenapp-link  { actie: 'maak' | 'intrekken' | 'uitloggen' }
//   maak       een nieuwe uitnodiging (oude link en wachtwoord ongeldig, alle toestellen uit)
//   intrekken  inloggen werkt niet meer en alle toestellen zijn uitgelogd
//   uitloggen  alle toestellen uitloggen, het wachtwoord blijft
// Voor de sportschool (onderdeel Leden). Nooit een hash; het lid moet bij
// deze sportschool en een eigen vestiging horen.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { CLUB_DOMEIN } from '@/lib/club/kern/subdomein'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { leesLinkActie, linkBasis } from '@/lib/club/ledenlogin/regels'
import { haalLinkOverzicht, maakLidLink, trekLidLinkIn, wisSessies } from '@/lib/club/ledenlogin/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

async function lidVan(t: ClubToegang, ctx: Context): Promise<Lid | NextResponse> {
  const { id } = await ctx.params
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid || !hoortBij(t.vestigingen, lid.vestiging)) return clubFout('Dit lid bestaat niet (meer).', 404)
  return lid
}

async function overzicht(t: ClubToegang, lid: Lid): Promise<NextResponse> {
  const link = await haalLinkOverzicht(t.admin, t.userId, lid.id, new Date())
  if (!link) return clubFout('De ledenapp-link kon niet worden geladen.', 500)
  return clubJson({ link, basis: linkBasis(t.organisatie.slug, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', CLUB_DOMEIN) })
}

export async function GET(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lid = await lidVan(t, ctx)
  if (lid instanceof NextResponse) return lid
  return overzicht(t, lid)
}

const LOG: Record<string, string> = { maak: 'Ledenapp-link gemaakt', intrekken: 'Ledenapp-link ingetrokken', uitloggen: 'Ledenapp overal uitgelogd' }

export async function POST(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lid = await lidVan(t, ctx)
  if (lid instanceof NextResponse) return lid
  const gelezen = await leesJsonOfTeGroot(req, 200)
  if (gelezen instanceof NextResponse) return gelezen
  const actie = leesLinkActie(gelezen.body)
  if (!actie) return clubFout('Onbekende actie.', 400)
  const nu = new Date()
  const gelukt =
    actie === 'maak' ? await maakLidLink(t.admin, t.userId, lid.id, nu)
      : actie === 'intrekken' ? await trekLidLinkIn(t.admin, t.userId, lid.id, nu)
        : await wisSessies(t.admin, t.userId, lid.id)
  if (!gelukt) return clubFout('Dat lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, LOG[actie], volledigeNaam(lid), lid.vestiging)
  return overzicht(t, lid)
}
