// POST /api/lifeos/agenda/focusblok — zet een vrij blok om in een echte afspraak.
//
// Het gat dat `/agenda/vandaag` zelf benoemde: die route rekent al uit wat er vrij
// is, maar niemand deed er iets mee. Dit endpoint pakt het eerstvolgende passende
// vrije blok en zet je focus- of trainingsblok er echt in — in Google, niet alleen
// op het scherm.
//
// ─── DE SERVER HERREKENT ALTIJD ─────────────────────────────────────────────
// De client stuurt hooguit `vanafOp` (het blok waarop je klikte). Wélke ruimte er
// is, bepaalt deze route zelf uit de cache. Een client met een verouderd beeld kan
// dus geen blok forceren op een tijd die inmiddels bezet is: dan past het niet meer
// en krijgt hij een nette 409. Precies zoals `agenda/events` de invoer hervalideert.
//
// ─── TZ=Europe/Amsterdam IS EEN HARDE EIS ───────────────────────────────────
// `werkVenster` gebruikt lokale `setHours` (zie `vrije-blokken.ts:63-65`), en
// `datumSleutel` leest de lokale dag. Draait de server in UTC, dan loopt "vandaag"
// 's zomers twee uur uit de pas en zoekt deze route ruimte in het verkeerde venster
// — dan plant hij je training om 06:00. Zet `TZ=Europe/Amsterdam`. Zie .env.example.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { koppelingStaat } from '@/lib/lifeos/agenda/koppeling'
import { haalEventsUitCache } from '@/lib/lifeos/agenda/opslag'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { vrijeBlokken, werkVenster } from '@/lib/lifeos/agenda/vrije-blokken'
import {
  langsteVrijeMinuten,
  leesFocusVerzoek,
  naarNieuwEvent,
  planWensen,
} from '@/lib/lifeos/agenda/inplannen'
import { maakAgendaEvent, schrijfFoutHttp } from '@/lib/lifeos/agenda/schrijven'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  // Valideer op de grens, vóór we de database of Google raken.
  const body: unknown = await req.json().catch(() => null)
  const verzoek = leesFocusVerzoek(body)
  if (!verzoek.ok) {
    return NextResponse.json({ fout: verzoek.fout }, { status: 400 })
  }

  const staat = await koppelingStaat(toegang.admin, toegang.userId)
  if (staat.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon de koppeling niet lezen.' }, { status: 502 })
  }
  if (staat.staat === 'niet_gekoppeld') {
    // Eigen tak, geen lege ruimte: "niet gekoppeld" is geen "geen tijd".
    return NextResponse.json({ fout: 'Je agenda is niet gekoppeld.' }, { status: 409 })
  }

  // De dag volgt uit `vanafOp`; zonder dat: vandaag. Zo hoeft de client geen
  // tweede parameter te sturen die met de eerste in tegenspraak kan zijn.
  const nu = new Date()
  const dag = verzoek.vanafOp ?? nu
  const dagStart = new Date(dag)
  dagStart.setHours(0, 0, 0, 0)
  const dagEind = new Date(dagStart)
  dagEind.setDate(dagEind.getDate() + 1)

  const events = await haalEventsUitCache(toegang.admin, toegang.userId, dagStart, dagEind)
  if (!events.ok) {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  // Alleen vandaag knippen we het verleden weg — zelfde regel als /vandaag.
  const isVandaag = datumSleutel(nu) === datumSleutel(dag)
  const blokken = vrijeBlokken(events.waarde, werkVenster(dag), isVandaag ? { nu } : {})

  const { toewijzingen } = planWensen(blokken, [verzoek.wens], {
    ...(verzoek.vanafOp ? { vanafOp: verzoek.vanafOp } : {}),
  })
  const toewijzing = toewijzingen[0]

  if (!toewijzing) {
    // Geen ruimte is geen storing en geen lege lijst — het is een volle dag. Zeg
    // hoe vol: "je langste blok is 30 minuten" is bruikbaar, "past niet" niet.
    const langste = langsteVrijeMinuten(blokken, verzoek.vanafOp ?? undefined)
    return NextResponse.json(
      {
        fout:
          langste === null
            ? `Geen vrij blok meer op ${datumSleutel(dag)}.`
            : `Geen vrij blok van ${verzoek.wens.minuten} minuten meer op ${datumSleutel(dag)}. Je langste vrije blok is ${langste} minuten.`,
        langsteVrijeMinuten: langste,
      },
      { status: 409 },
    )
  }

  try {
    const event = await maakAgendaEvent(toegang.admin, toegang.userId, naarNieuwEvent(toewijzing))
    return NextResponse.json({ event }, { status: 201 })
  } catch (fout) {
    const http = schrijfFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status })
    throw fout // onverwacht → 500, niet stil verzwolgen
  }
}
