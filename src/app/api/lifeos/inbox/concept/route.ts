// POST /api/lifeos/inbox/concept — laat Vita een concept-antwoord schrijven en
// zet het in je Gmail-concepten.
//
// ─── HET EINDIGT ALTIJD ALS CONCEPT ─────────────────────────────────────────
// Deze route schrijft naar `drafts`, nooit naar `send`. Kane opent het concept in
// Gmail, leest het, past het aan en drukt zelf op verzenden. Er is geen vlag om
// dat over te slaan en die hoort er nooit te komen — een mail die namens hem de
// deur uit gaat zonder dat hij 'm zag, kun je niet terugnemen.
//
// Wat het model kreeg: de afzender en de onderwerpregel die de triage al toonde.
// NIET de body — die lezen we nergens (zie `gmail.ts`). Het concept is daarom een
// OPENING, geen antwoord, en het systeemprompt verbiedt het model expliciet om te
// doen alsof het de mail gelezen heeft. De UI zegt dat er ook bij.
//
// De client stuurt de metadata mee die hij al had, dus we raken Gmail niet aan om
// te lezen — alleen om het concept aan te maken. Zelfde patroon als
// `analyseer/route.ts`.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesConceptVerzoek, schrijfConcept, type ConceptModel } from '@/lib/lifeos/inbox/concept'
import { maakAnthropicConceptModel } from '@/lib/lifeos/inbox/concept-model'
import { maakConcept, actieFoutHttp } from '@/lib/lifeos/inbox/gmail-acties'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const verzoek = leesConceptVerzoek(body)
  if (!verzoek.ok) {
    return NextResponse.json({ fout: verzoek.fout }, { status: 400, headers: CACHE_HEADERS })
  }

  let model: ConceptModel
  try {
    model = maakAnthropicConceptModel()
  } catch {
    // Geen API-sleutel = we kunnen niet schrijven. Dat is een storing, geen leeg
    // concept: fout ≠ leeg. Zelfde tak als in `analyseer/route.ts`.
    return NextResponse.json(
      { fout: 'Vita kan nu geen concept schrijven.' },
      { status: 503, headers: CACHE_HEADERS },
    )
  }

  const voorstel = await schrijfConcept(verzoek.mail, model)
  if (!voorstel) {
    // `null` = het lukte niet. Een leeg concept in je Concepten zou eruitzien als
    // werk en dat is erger dan een eerlijke melding.
    return NextResponse.json(
      { fout: 'Vita kon geen bruikbaar concept maken. Probeer het zo nog eens.' },
      { status: 502, headers: CACHE_HEADERS },
    )
  }

  try {
    const concept = await maakConcept(toegang.admin, toegang.userId, {
      // Geen ontvanger: wij kennen het adres van de afzender niet (de triage geeft
      // bewust alleen de weergavenaam door — zie `inbox.ts`). Gmail vult 'm zelf
      // in zodra het concept aan de thread hangt; anders zet Kane 'm erbij. Een
      // adres verzinnen uit een naam is precies wat dit product niet doet.
      aan: null,
      onderwerp: voorstel.onderwerp,
      body: voorstel.tekst,
      ...(verzoek.threadId ? { threadId: verzoek.threadId } : {}),
    })

    return NextResponse.json(
      { concept, onderwerp: voorstel.onderwerp },
      { status: 201, headers: CACHE_HEADERS },
    )
  } catch (fout) {
    const http = actieFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status, headers: CACHE_HEADERS })
    throw fout // onverwacht → 500, niet stil verzwolgen
  }
}
