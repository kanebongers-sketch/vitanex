// GET  /api/club/leden/aanmeldlinks?v=<vestiging>  de aanmeldlinks van een vestiging
// POST /api/club/leden/aanmeldlinks  { vestiging, vormId?, soort, geldig, naam? }  een nieuwe link
// Aanmeldlinks en QR-codes (besluit Kane 30-10-2026): leden melden zich nooit
// aan via een openbare pagina, alleen via een link of QR van de sportschool.
// Onderdeel Leden (lezen = zien, maken = bewerken). Alleen eigen vestigingen.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { leesLinkInvoer, vormenVoorVestiging } from '@/lib/club/nieuwe-leden/regels'
import { haalLinks, linkVoorScherm, maakLink } from '@/lib/club/nieuwe-leden/links-opslag'
import { aanmeldMailKlaar } from '@/lib/club/nieuwe-leden/mail'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const f = NIEUWE_LEDEN[await getTaal()].fouten
  const v = req.nextUrl.searchParams.get('v') ?? ''
  if (!t.vestigingen.some((x) => x.sleutel === v)) return clubFout(f.vestiging, 400)
  const links = await haalLinks(t.admin, t.userId, v)
  if (!links) return clubFout(f.laden, 500)
  const nu = new Date()
  return clubJson({ links: links.map((l) => linkVoorScherm(l, nu)), mailKlaar: aanmeldMailKlaar() })
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const f = NIEUWE_LEDEN[await getTaal()].fouten
  const gelezen = await leesJsonOfTeGroot(req, 1000)
  if (gelezen instanceof NextResponse) return gelezen
  const vormen = await haalVormen(t.admin, t.userId)
  if (!vormen) return clubFout(f.laden, 500)
  const ruw = typeof gelezen.body === 'object' && gelezen.body !== null ? (gelezen.body as Record<string, unknown>) : {}
  const vestiging = typeof ruw.vestiging === 'string' ? ruw.vestiging : ''
  const invoer = leesLinkInvoer(gelezen.body, t.vestigingen.map((x) => x.sleutel), vormenVoorVestiging(vormen, vestiging).map((x) => x.id))
  if (!invoer.ok) return clubFout(f[invoer.fout], 400)
  const nu = new Date()
  const link = await maakLink(t.admin, t.userId, invoer.waarde, t.naam, nu)
  if (!link) return clubFout(f.opslaan, 500)
  await logActie(t, 'Aanmeldlink gemaakt', link.naam ?? (link.maxGebruik === 1 ? 'eenmalig' : 'herbruikbaar'), link.vestiging)
  return clubJson({ link: linkVoorScherm(link, nu), mailKlaar: aanmeldMailKlaar() }, 201)
}
