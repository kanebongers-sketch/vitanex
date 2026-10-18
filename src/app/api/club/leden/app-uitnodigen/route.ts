// GET  /api/club/leden/app-uitnodigen?v=<vestiging>&v=...&zonder=1  hoeveel uitnodigingen er zouden gaan
// POST /api/club/leden/app-uitnodigen  { vestigingen: string[], alleenZonderApp: boolean }
// Leden uitnodigen voor de ledenapp: per lid een mail in de wachtrij van de
// meldingen (soort app_uitnodiging, ontdubbeld per lid per dag), gespreid
// over de rondes van de cron. Onderdeel Leden (rechten.ts: /api/club/leden).
// Alleen de vestigingen die deze persoon ziet. Nooit bij een demo-sportschool,
// nooit naar demo-leden, en niets als mails of de ledenapp nog uit staan.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { DEMO_SPORTSCHOOL_ID } from '@/lib/club/meldingen/beleid'
import { BLOKKADE_TEKST, duurTekst, leesUitnodigInvoer, mailKlaar, uitnodigBlokkade, type Selectie } from '@/lib/club/app-uitnodigen/regels'
import { bekijkUitnodigingen, planUitnodigingen } from '@/lib/club/app-uitnodigen/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function blokkade(t: ClubToegang) {
  return uitnodigBlokkade({
    ledenLoginAan: CLUB_LEDEN_LOGIN,
    appModuleAan: moduleAan(t.organisatie, 'app'),
    demo: t.organisatie.demo || t.userId === DEMO_SPORTSCHOOL_ID,
    mailKlaar: mailKlaar(process.env),
  })
}

function tellingen(s: Selectie) {
  return { teSturen: s.teSturen.length, zonderEmail: s.zonderEmail, heeftApp: s.heeftApp, afgemeld: s.afgemeld, demo: s.demo }
}

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const invoer = leesUitnodigInvoer({ vestigingen: zoek.getAll('v'), alleenZonderApp: zoek.get('zonder') !== '0' }, t.vestigingen.map((v) => v.sleutel))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const selectie = await bekijkUitnodigingen(t.admin, t.userId, invoer.waarde)
  if (!selectie) return clubFout('De leden konden niet worden geladen.', 500)
  const b = blokkade(t)
  return clubJson({ ...tellingen(selectie), blokkade: b ? BLOKKADE_TEKST[b] : null })
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 4000)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesUitnodigInvoer(gelezen.body, t.vestigingen.map((v) => v.sleutel))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const b = blokkade(t)
  if (b) return clubFout(BLOKKADE_TEKST[b], 409)
  const uitslag = await planUitnodigingen(t.admin, t.organisatie, invoer.waarde, new Date())
  if (!uitslag) return clubFout('Inplannen lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, 'Leden uitgenodigd voor de app', `${uitslag.gepland} uitnodigingen gepland`, invoer.waarde.vestigingen.length === 1 ? invoer.waarde.vestigingen[0] : null)
  return clubJson({ ...tellingen(uitslag.selectie), gepland: uitslag.gepland, alVandaag: uitslag.alVandaag, duur: duurTekst(uitslag.gepland) })
}
