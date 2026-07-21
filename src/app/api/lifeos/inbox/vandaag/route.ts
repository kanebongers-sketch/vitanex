// GET /api/lifeos/inbox/vandaag — de triage.
//
// Leest Gmail LIVE. Bewust geen cache-tabel zoals de agenda die heeft, en dat is
// de belangrijkste beslissing in deze functie:
//
//   1. Er valt niets zinnigs te cachen. "Ongelezen van de laatste 24 uur" is per
//      definitie vers; een gecachet antwoord is meteen onwaar zodra je een mail
//      leest of er een binnenkomt.
//   2. Cachen zou betekenen: onderwerpregels en afzenders van derden opslaan in
//      Kane's database. Die mensen gaven daar nooit toestemming voor, en een
//      onderwerpregel lekt meer dan je denkt ("uitslag onderzoek", "je factuur
//      staat open"). Niet opslaan is hier geen beperking maar het ontwerp.
//   3. Het is snel genoeg: max 40 berichten, metadata-only.
//
// Gevolg: er is géén migratie voor deze functie. Het enige dat blijft staan is
// het OAuth-token, en dat hoort in `koppelingen` — die tabel bestaat al en heeft
// 'gmail' al in zijn check-constraint (001_fundament.sql).

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { forceerVernieuwing, geldigToken } from '@/lib/lifeos/inbox/koppeling'
import { haalTriageMails, type MailsUitkomst } from '@/lib/lifeos/inbox/gmail'
import { triageer } from '@/lib/lifeos/inbox/classificeer'
import { naarInboxVandaag, OPNIEUW_KOPPELEN, type InboxVandaag } from '@/lib/lifeos/inbox/inbox'

// `no-store`, niet `max-age`: dit is post. Geen enkele cache — geen browser, geen
// CDN, geen proxy — mag hier een kopie van houden.
//
// `Vary: Authorization` staat er ondanks `no-store` toch bij, en dat is geen
// bijgeloof: een gedeelde cache die `no-store` negeert of verkeerd implementeert
// heeft dan alsnog de juiste sleutel. Twee sloten op een deur die dicht hoort te
// blijven. De les komt uit MentaForce (zie README).
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const token = await geldigToken(toegang.admin, toegang.userId)

  if (token.staat === 'fout') {
    // Fout ≠ leeg. Een 502 laat de kaart zijn foutstaat tonen; een lege lijst zou
    // Kane vertellen dat niemand iets van hem wil terwijl we niet gekeken hebben.
    return NextResponse.json({ fout: 'Kon je mailkoppeling niet lezen.' }, { status: 502 })
  }

  if (token.staat === 'niet_gekoppeld') {
    // Eigen tak, geen lege lijst. Dekt ook het geval dat Google de toestemming
    // heeft ingetrokken — bij een consent-scherm in "Testing" gebeurt dat elke
    // 7 dagen vanzelf. De weg terug is dan simpelweg: opnieuw koppelen.
    const antwoord: InboxVandaag = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }

  const mails = await haalMetTweedeKans(toegang.admin, toegang.userId, token.toegangstoken)

  if (mails.staat === 'verlopen') {
    // Gmail zei 401, en zelfs ná een verse refresh accepteert hij 'm niet: de
    // toestemming is écht ingetrokken. Zelfde situatie als de `niet_gekoppeld`-tak
    // hierboven, dus zelfde antwoord — en dat is geen lege inbox maar de
    // koppel-staat: de kaart toont de koppelknop in plaats van te beweren dat er
    // geen post ligt. Vóór de retry eindigde dit als een kale 502 "koppel
    // opnieuw", wat hetzelfde zei maar zonder de knop erbij.
    const antwoord: InboxVandaag = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }

  if (mails.staat === 'api_uit') {
    // Gmail gaf 403 met `accessNotConfigured`/`SERVICE_DISABLED`: de Gmail-API
    // staat uit in het Google Cloud-project. Opnieuw koppelen lost dit NIET op
    // (dat geeft dezelfde 403 terug) — de API moet aan, net als de Agenda-API die
    // in hetzelfde project wél aanstaat. Bewust géén `OPNIEUW_KOPPELEN`-sein: de
    // kaart toont dan een gewone foutmelding met de juiste instructie i.p.v. een
    // koppelknop die in een cirkel leidt.
    return NextResponse.json(
      {
        fout:
          'De Gmail-API staat nog uit in Google Cloud. Zet ‘m aan voor hetzelfde project als je Agenda (console.cloud.google.com → APIs → Gmail API → Inschakelen) en probeer opnieuw.',
      },
      { status: 502 },
    )
  }

  if (mails.staat === 'scope_ontbreekt') {
    // Gmail gaf 403: de koppeling heeft te weinig scope (alleen leesrechten, van
    // vóór de schrijf-uitbreiding). Dat is een INSTRUCTIE, geen storing — dus geen
    // kale 502 maar het `opnieuw_koppelen`-sein (in `fout`, herkenbaar voor de
    // kaart) met een uitleg. De kaart toont dan een "opnieuw koppelen"-knop i.p.v.
    // te beweren dat er iets stuk is. Zelfde patroon als de agenda-kalenders.
    return NextResponse.json(
      {
        fout: OPNIEUW_KOPPELEN,
        bericht: 'Koppel Gmail opnieuw — je gaf eerder alleen leesrechten.',
      },
      { status: 409 },
    )
  }

  if (mails.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je inbox niet lezen.' }, { status: 502 })
  }

  return NextResponse.json(naarInboxVandaag(triageer(mails.mails), mails.nietGelezen), {
    headers: CACHE_HEADERS,
  })
}

/**
 * De triage ophalen, met precies één tweede kans bij een 401 mid-flight.
 *
 * `geldigToken` ververst PROACTIEF (2 minuten marge) en dekt daarmee het normale
 * geval — niet het echte: een token dat volgens ons nog 40 minuten geldig is maar
 * dat Gmail weigert. Dat gebeurt vaker dan je denkt: staat het OAuth-consent-scherm
 * op "Testing", dan verloopt het refresh-token elke 7 dagen, en een
 * wachtwoordwijziging trekt Gmail-tokens sowieso in.
 *
 * Zonder deze retry kreeg Kane dan "koppel opnieuw" terwijl één refresh het had
 * opgelost. Precies één keer, geen lus: blijft het 401 ná een verse refresh, dan
 * is opnieuw koppelen het juiste antwoord.
 *
 * `forceerVernieuwing` houdt de discipline overeind: alleen een echte intrekking
 * (`invalid_grant`) wordt `niet_gekoppeld`; een netwerkfout blijft `fout` en komt
 * hier als `fout` terug — nooit als "niet gekoppeld".
 */
async function haalMetTweedeKans(
  admin: SupabaseClient,
  userId: string,
  token: string,
): Promise<MailsUitkomst> {
  const eerste = await haalTriageMails(token)
  if (eerste.staat !== 'verlopen') return eerste

  const vers = await forceerVernieuwing(admin, userId)
  if (vers.staat === 'niet_gekoppeld') return { staat: 'verlopen' }
  if (vers.staat === 'fout') return { staat: 'fout', reden: vers.reden }

  return haalTriageMails(vers.toegangstoken)
}
