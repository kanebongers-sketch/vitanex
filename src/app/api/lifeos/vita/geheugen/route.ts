// ─── LifeOS — /api/lifeos/vita/geheugen ─────────────────────────────────────
// Wat Vita over Kane onthoudt: lezen, vastleggen, wissen.
//
// `vita_geheugen` bestond sinds migratie 040 en werd door `context.ts` gelezen,
// maar nergens geschreven — de sectie "Wat ik over Kane onthoud" stond dus altijd
// leeg, elke request opnieuw meebetaald in tokens. Dit is de ontbrekende kant.
//
// ─── DE GRENS: ALLEEN KANE SCHRIJFT HIER ────────────────────────────────────
//
//   Vita legt niets vast. Niet uit een gesprek, niet "omdat hij het opving".
//   Dat is geen belofte maar een eigenschap van de constructie:
//
//     1. Het model heeft geen tool-use in `/api/lifeos/vita/vraag`. Het kan deze
//        route niet aanroepen — het produceert tekst, meer niet.
//     2. Deze route zit achter `vereisLifeosToegang` (de founder-gate) en vuurt
//        alleen op een expliciete handeling van Kane.
//     3. `bron` wordt HIER gezet, niet door de client meegegeven. Een opgeslagen
//        herkomst kan dus niet liegen.
//
//   Zie de kop van `lib/lifeos/vita/geheugen.ts` voor waarom dat de hele reden is
//   dat deze route bestaat zoals hij bestaat.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesGeheugenId, leesNieuwGeheugen } from '@/lib/lifeos/vita/geheugen'
import {
  bewaarGeheugen,
  haalGeheugen,
  wisGeheugen,
  type Reden,
} from '@/lib/lifeos/vita/geheugen-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * De herkomst van alles wat via deze route binnenkomt.
 *
 * Vast, niet uit de body: deze route heeft precies één schrijver (Kane, via de
 * UI). Komt er ooit een tweede pad — bijvoorbeeld "Vita stelt voor te onthouden" —
 * dan hoort dat zijn eigen bron te zetten én zijn eigen staat te hebben
 * (voorgesteld ≠ bevestigd). Deze constante mag daar geen dubbelrol in krijgen.
 */
const BRON = 'handmatig'

/**
 * Rem op de schrijfkant. Niet tegen een aanvaller — de founder-gate is het slot —
 * maar tegen een dubbelklik, een loop in de UI en een per ongeluk herhaalde fetch.
 *
 * EERLIJKE PRIJS: in-memory en dus PER PROCES. Draaien er meerdere instances, dan
 * geldt deze grens per instance en niet globaal; na een herstart is de teller leeg.
 * Voor een single-tenant app achter een founder-gate is dat genoeg. Noem het geen
 * quota — dat is het niet.
 */
const SCHRIJF_MAX = 20
const SCHRIJF_VENSTER_MS = 60_000

/** Lezen mag ruimer: het kost geen model en geen schrijf. */
const LEES_MAX = 60
const LEES_VENSTER_MS = 60_000

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}

const KOPPEN = {
  // Persoonlijke data: nooit in een gedeelde cache, en varieer op de
  // Authorization-header zodat de browsercache niets tussen sessies lekt.
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Eén databasereden → één antwoord. Nooit de ruwe Postgres-fout naar buiten. */
function redenFout(reden: Reden): Response {
  if (reden === 'dubbel') return fout('Dat onthoud ik al.', 409)
  if (reden === 'niet_gevonden') return fout('Dat geheugen bestaat niet (meer).', 404)
  if (reden === 'ongeldig') return fout('Dat kan ik zo niet opslaan.', 400)
  return fout('Ik kon je geheugen niet opslaan.', 503)
}

// ─── Lezen ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  if (isRateLimited(`vita:geheugen:lees:${toegang.userId}`, LEES_MAX, LEES_VENSTER_MS)) {
    return fout('Even te veel verzoeken achter elkaar. Probeer het zo opnieuw.', 429)
  }

  const uitkomst = await haalGeheugen(toegang.admin, toegang.userId)
  // Een gevallen query is geen leeg geheugen. Zou dit `[]` teruggeven, dan vertelt
  // een storing de gebruiker dat Vita niets over hem weet — precies de fout die
  // dit project overal uitroeit.
  if (!uitkomst.ok) return fout('Ik kon je geheugen niet ophalen.', 503)

  return Response.json({ geheugen: uitkomst.waarde }, { headers: KOPPEN })
}

// ─── Vastleggen ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  if (isRateLimited(`vita:geheugen:schrijf:${toegang.userId}`, SCHRIJF_MAX, SCHRIJF_VENSTER_MS)) {
    return fout('Even te veel verzoeken achter elkaar. Probeer het zo opnieuw.', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fout('Body is geen geldige JSON.', 400)
  }

  const invoer = leesNieuwGeheugen(body)
  if (!invoer.ok) return fout(invoer.fout, 400)

  const uitkomst = await bewaarGeheugen(toegang.admin, toegang.userId, {
    ...invoer.waarde,
    bron: BRON,
  })
  if (!uitkomst.ok) return redenFout(uitkomst.reden)

  return Response.json({ geheugen: uitkomst.waarde }, { status: 201, headers: KOPPEN })
}

// ─── Wissen ─────────────────────────────────────────────────────────────────

/**
 * Wist één feit. Het id komt uit de query (`?id=…`), niet uit een body: een DELETE
 * met body mag wel, maar niet elke tussenlaag houdt 'm heel.
 *
 * Wissen is hard en definitief — geen archiefvlag. Wat Vita over je onthoudt, moet
 * je écht weg kunnen halen; "gearchiveerd maar nog in de database" is niet wat
 * iemand bedoelt die op vergeten drukt.
 */
export async function DELETE(request: NextRequest): Promise<Response> {
  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  if (isRateLimited(`vita:geheugen:schrijf:${toegang.userId}`, SCHRIJF_MAX, SCHRIJF_VENSTER_MS)) {
    return fout('Even te veel verzoeken achter elkaar. Probeer het zo opnieuw.', 429)
  }

  const id = leesGeheugenId(request.nextUrl.searchParams.get('id'))
  if (!id.ok) return fout(id.fout, 400)

  const uitkomst = await wisGeheugen(toegang.admin, toegang.userId, id.waarde)
  if (!uitkomst.ok) return redenFout(uitkomst.reden)

  return Response.json({ ok: true }, { headers: KOPPEN })
}
