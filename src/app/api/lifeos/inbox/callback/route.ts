// GET /api/lifeos/inbox/callback — Google stuurt de gebruiker hier terug.
//
// Het gevoeligste punt van de koppeling: wie hier binnenkomt met een code, krijgt
// een token op een account gezet dat andermans post kan lezen. De state is dus
// geen formaliteit.
//
// Deze route kan NIET op `vereisLifeosToegang` draaien: Google's redirect is een
// top-level GET zonder Authorization-header, dus er is geen Bearer-token om te
// verifiëren. De beveiliging leunt daarom op twee sloten die allebei uit de
// founder-gate op `/api/lifeos/inbox/koppel` komen:
//
//   1. de HMAC-state (alleen onze server kan er een maken, en alleen `/koppel`
//      geeft er een uit — en dat endpoint is founder-gated), en
//   2. het HttpOnly-cookie dat `/koppel` zet nadat de founder-gate is gepasseerd.
//
// De eigenaar van de rij is de vaste `lifeosUserId()`, niet iets uit de request:
// LifeOS is single-tenant, dus er valt niets te kiezen.

import { NextResponse, type NextRequest } from 'next/server'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { beoordeelState } from '@/lib/lifeos/auth/oauth-state'
import { wisselCodeIn } from '@/lib/lifeos/agenda/google'
import { gmailConfig } from '@/lib/lifeos/inbox/gmail'
import { bewaarKoppeling, KOPPEL_COOKIE, KOPPEL_COOKIE_PAD } from '@/lib/lifeos/inbox/koppeling'

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

  // 1. State eerst, vóór alles. Twee gevallen, bewust uit elkaar gehouden:
  //
  //    a. Verlopen, maar wél door ons ondertekend en voor deze dienst — dat is
  //       geen aanval maar een trage gebruiker (het OAuth-scherm duurde te lang).
  //       Alleen wie het geheim heeft kan een geldige handtekening maken, dus dit
  //       is aantoonbaar een flow die wíj startten. Rustig terug naar /home met
  //       een "start opnieuw"-melding i.p.v. een kale JSON-400.
  //
  //    b. Ongeldig of voor een andere dienst — die state hoort niet bij een flow
  //       die wij gestart zijn (een geldige state voor de agenda is geen
  //       toestemming om hier een mailbox te koppelen). Dat is het CSRF-geval:
  //       harde 400, geen code-inwisseling, niets opgeslagen.
  const oordeel = beoordeelState(searchParams.get('state'))
  if (oordeel.staat === 'verlopen' && oordeel.dienst === 'gmail') {
    return NextResponse.redirect(`${basis}/home?inbox=fout&reden=verlopen`)
  }
  if (oordeel.staat !== 'geldig' || oordeel.dienst !== 'gmail') {
    return NextResponse.json({ fout: 'Ongeldige of verlopen state.' }, { status: 400 })
  }

  // 2. Pas daarna kijken of de gebruiker toestemming gaf. Geweigerd is een normale
  //    keuze, geen fout: rustig terug naar de app.
  const geweigerd = searchParams.get('error')
  if (geweigerd) {
    return NextResponse.redirect(`${basis}/home?inbox=geweigerd`)
  }

  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.json({ fout: 'Geen autorisatiecode ontvangen.' }, { status: 400 })
  }

  // Het cookie is het tweede slot: het wordt alleen gezet door `/koppel`, en dat
  // endpoint zit achter de founder-gate. De aanwezigheid ervan bindt deze callback
  // aan een flow die een ingelogde founder startte. De rij-eigenaar zelf is de
  // vaste `lifeosUserId()` — het cookie kiest dat niet, het bewijst alleen dat de
  // flow legitiem begon.
  const koppelCookie = req.cookies.get(KOPPEL_COOKIE)?.value
  if (!koppelCookie) {
    return NextResponse.redirect(`${basis}/home?inbox=fout&reden=verlopen`)
  }

  const config = gmailConfig()
  if (!config) {
    return NextResponse.redirect(`${basis}/home?inbox=fout&reden=niet_ingericht`)
  }

  // `wisselCodeIn` komt uit agenda/google.ts — zelfde provider, zelfde
  // token-endpoint. Alleen de redirect_uri in `config` wijkt af, en die moet
  // exact matchen met wat we in de autorisatie-URL zetten.
  const uitkomst = await wisselCodeIn(config, code)
  if (uitkomst.staat !== 'ok') {
    return NextResponse.redirect(`${basis}/home?inbox=fout&reden=token`)
  }

  const bewaard = await bewaarKoppeling(createLifeosAdminClient(), lifeosUserId(), uitkomst.tokens)
  if (!bewaard.ok) {
    return NextResponse.redirect(`${basis}/home?inbox=fout&reden=${bewaard.reden}`)
  }

  const antwoord = NextResponse.redirect(`${basis}/home?inbox=gekoppeld`)
  // Het cookie heeft zijn werk gedaan; laat het niet slingeren.
  antwoord.cookies.delete({ name: KOPPEL_COOKIE, path: KOPPEL_COOKIE_PAD })
  return antwoord
}
