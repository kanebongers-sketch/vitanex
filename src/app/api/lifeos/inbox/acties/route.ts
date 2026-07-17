// POST /api/lifeos/inbox/acties — archiveren, gelezen markeren, labelen.
//
// De schrijf-kant van functie 2. Elke actie hier gebeurt omdat Kane erop KLIKTE:
// dit endpoint wordt nooit door het model aangeroepen en er zit geen automatiek
// achter. Dat is dezelfde asymmetrie als bij `analyseer/route.ts`, dat alleen
// vóórstelt — met dit verschil: daar kost een misser een overbodige knop, hier
// kost hij een mail die uit je inbox verdwijnt. Dus: geen autonomie, punt.
//
// Wat je hier NIET kunt: een mail verwijderen (`gmail.modify` kan het niet, en
// dat is een kenmerk), of een mail versturen (zie de kop van `gmail.ts` — dat is
// sinds de scope-uitbreiding code-discipline en geen scope-slot meer).
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import {
  archiveer,
  markeerGelezen,
  wijzigLabels,
  actieFoutHttp,
} from '@/lib/lifeos/inbox/gmail-acties'

// `no-store`: dit gaat over andermans post. Geen enkele cache — browser, CDN of
// proxy — mag hier een kopie van houden.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

const SOORTEN = ['archiveer', 'markeer_gelezen', 'label'] as const
type ActieSoort = (typeof SOORTEN)[number]

interface Verzoek {
  soort: ActieSoort
  externId: string
  toevoegen: string[]
  verwijderen: string[]
}

type Uitkomst = { ok: true; waarde: Verzoek } | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Een lijst label-id's uit onbekende invoer. Geen lijst = geen labels. */
function leesLabels(v: unknown): string[] | null {
  if (v === null || v === undefined) return []
  if (!Array.isArray(v)) return null
  const ids = v.map(tekst)
  return ids.some((id) => id === null) ? null : ids.filter((id): id is string => id !== null)
}

/** Systeemgrens: narrowen, niet casten. */
function leesVerzoek(body: unknown): Uitkomst {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const soort = tekst(body.soort)
  if (soort === null || !(SOORTEN as readonly string[]).includes(soort)) {
    return { ok: false, fout: `Onbekende actie. Kies uit: ${SOORTEN.join(', ')}.` }
  }

  const externId = tekst(body.extern_id)
  if (externId === null) return { ok: false, fout: 'extern_id ontbreekt.' }

  const toevoegen = leesLabels(body.toevoegen)
  const verwijderen = leesLabels(body.verwijderen)
  if (toevoegen === null || verwijderen === null) {
    return { ok: false, fout: 'Labels moeten een lijst met label-ids zijn.' }
  }

  if (soort === 'label' && toevoegen.length === 0 && verwijderen.length === 0) {
    return { ok: false, fout: 'Geef minstens één label om toe te voegen of te verwijderen.' }
  }

  return { ok: true, waarde: { soort: soort as ActieSoort, externId, toevoegen, verwijderen } }
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const verzoek = leesVerzoek(body)
  if (!verzoek.ok) {
    return NextResponse.json({ fout: verzoek.fout }, { status: 400, headers: CACHE_HEADERS })
  }

  const { soort, externId, toevoegen, verwijderen } = verzoek.waarde

  try {
    if (soort === 'archiveer') {
      await archiveer(toegang.admin, toegang.userId, externId)
    } else if (soort === 'markeer_gelezen') {
      await markeerGelezen(toegang.admin, toegang.userId, externId)
    } else {
      await wijzigLabels(toegang.admin, toegang.userId, externId, { toevoegen, verwijderen })
    }
    return NextResponse.json({ gelukt: true }, { headers: CACHE_HEADERS })
  } catch (fout) {
    const http = actieFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status, headers: CACHE_HEADERS })
    throw fout // onverwacht → 500, niet stil verzwolgen
  }
}
