// GET /api/lifeos/agenda/callback — Google stuurt de gebruiker hier terug.
//
// Dit is het gevoeligste punt van de hele koppeling: wie hier binnenkomt met een
// code, krijgt tokens op een account gezet. De state is daarom geen formaliteit.
//
// Geen founder-gate: dit is een top-level browser-redirect vanaf Google, zónder
// Authorization-header. De bescherming is de HMAC-state (alleen onze eigen,
// founder-gated koppel-route kan er een maken) plus het HttpOnly-cookie dat die
// koppel-route zette. De service-role client halen we rechtstreeks op.
//
// De eigenaar van de rij is de vaste `lifeosUserId()`, niet iets uit de request:
// LifeOS is single-tenant, dus er valt niets te kiezen. Zie de uitleg bij het
// cookie hieronder — dit spiegelt bewust `inbox/callback/route.ts`.

import { NextResponse, type NextRequest } from 'next/server'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { leesState } from '@/lib/lifeos/auth/oauth-state'
import { googleConfig, wisselCodeIn } from '@/lib/lifeos/agenda/google'
import { bewaarKoppeling, KOPPEL_COOKIE } from '@/lib/lifeos/agenda/koppeling'

function appUrl(): string | null {
  const url = process.env.APP_URL
  return url ? url.replace(/\/+$/, '') : null
}

export async function GET(req: NextRequest) {
  const basis = appUrl()
  if (!basis) {
    return NextResponse.json({ fout: 'Serverconfiguratie onvolledig.' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)

  // 1. State eerst. Een ongeldige of verlopen state betekent dat deze callback
  //    niet bij een flow hoort die wij gestart zijn — dat is CSRF, en daar
  //    redirecten we niet vriendelijk voor terug: harde 400, geen code-inwisseling,
  //    niets opgeslagen.
  //
  //    Ook de dienst moet kloppen: een geldige state voor Whoop is geen
  //    toestemming om hier een agenda te koppelen.
  const state = leesState(searchParams.get('state'))
  if (!state || state.dienst !== 'google_calendar') {
    return NextResponse.json({ fout: 'Ongeldige of verlopen state.' }, { status: 400 })
  }

  // 2. Pas daarna kijken of de gebruiker toestemming gaf. Geweigerd is een
  //    normale keuze, geen fout: rustig terug naar de app.
  const geweigerd = searchParams.get('error')
  if (geweigerd) {
    return NextResponse.redirect(`${basis}/home?agenda=geweigerd`)
  }

  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.json({ fout: 'Geen autorisatiecode ontvangen.' }, { status: 400 })
  }

  // Het cookie is het tweede slot naast de HMAC-state: het wordt alleen gezet
  // door `/koppel`, en dat endpoint zit achter de founder-gate. De aanwezigheid
  // ervan bindt deze callback aan een flow die een ingelogde founder startte.
  //
  // Let op wat het NIET doet: het kiest de rij-eigenaar niet. De waarde uit het
  // cookie ging hier ooit rechtstreeks als `userId` naar `bewaarKoppeling` — een
  // cookie is client-materiaal, en al blokkeert de HMAC-state het in de praktijk,
  // diepteverdediging hoort niet op één slot te leunen. De inbox-callback deed het
  // meteen goed; deze trekt gelijk. De eigenaar is de vaste `lifeosUserId()`.
  const koppelCookie = req.cookies.get(KOPPEL_COOKIE)?.value
  if (!koppelCookie) {
    return NextResponse.redirect(`${basis}/home?agenda=fout&reden=verlopen`)
  }

  const config = googleConfig()
  if (!config) {
    return NextResponse.redirect(`${basis}/home?agenda=fout&reden=niet_ingericht`)
  }

  const admin = createLifeosAdminClient()

  const uitkomst = await wisselCodeIn(config, code)
  if (uitkomst.staat !== 'ok') {
    return NextResponse.redirect(`${basis}/home?agenda=fout&reden=token`)
  }

  const bewaard = await bewaarKoppeling(admin, lifeosUserId(), uitkomst.tokens)
  if (!bewaard.ok) {
    return NextResponse.redirect(`${basis}/home?agenda=fout&reden=${bewaard.reden}`)
  }

  const antwoord = NextResponse.redirect(`${basis}/home?agenda=gekoppeld`)
  // Het cookie heeft zijn werk gedaan; laat het niet slingeren.
  antwoord.cookies.delete({ name: KOPPEL_COOKIE, path: '/api/lifeos/agenda' })
  return antwoord
}
