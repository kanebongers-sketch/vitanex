// POST /api/lifeos/pt-gesprekken/afronden — een coaching afronden.
//
// Eén handeling sluit de cyclus én rolt 'm door:
//   1. de evaluatie (3 scores + notitie) opslaan in pt_coaching;
//   2. een samenvatting in de CRM-tijdlijn van de persoon loggen;
//   3. de VOLGENDE afspraak inplannen (datum/tijd die je koos — flexibel) en de
//      klant uitnodigen via z'n mailadres.
//
// De evaluatie is leidend: lukt stap 3 niet, dan is de coaching tóch vastgelegd
// en meldt het antwoord `afspraakFout` zodat je de volgende handmatig kunt zetten.
// Zo verlies je nooit je observatie door een agenda-hik.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { logGebeurtenis } from '@/lib/lifeos/crm/historie'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { maakAgendaEvent, schrijfFoutHttp } from '@/lib/lifeos/agenda/schrijven'
import { coachgesprekTitel } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { evaluatieSamenvatting, leesEvaluatie, type AfrondResultaat } from '@/lib/lifeos/pt-coaching/pt-coaching'
import { slaEvaluatieOp } from '@/lib/lifeos/pt-coaching/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** De volgende afspraak duurt standaard een half uur; alleen de start kies je. */
const GESPREK_DUUR_MIN = 30

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ fout: 'Ongeldige invoer.' }, { status: 400 })
  }
  const { persoonId, volgendeStartOp } = body as { persoonId?: unknown; volgendeStartOp?: unknown }

  if (typeof persoonId !== 'string' || persoonId.length === 0) {
    return NextResponse.json({ fout: 'Onbekende PT-klant.' }, { status: 400 })
  }
  const evaluatie = leesEvaluatie((body as { evaluatie?: unknown }).evaluatie)
  if (!evaluatie.ok) {
    return NextResponse.json({ fout: evaluatie.fout }, { status: 400 })
  }

  // De persoon zelf ophalen (naam + mail voor de uitnodiging), server-side — de
  // client stuurt alleen het id, niet de naam/mail die we vertrouwen.
  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_klant')
  if (!personen.ok) {
    return NextResponse.json({ fout: 'Kon je PT-klanten niet lezen.' }, { status: 502 })
  }
  const persoon = personen.waarde.find((p) => p.id === persoonId)
  if (!persoon) {
    return NextResponse.json({ fout: 'Deze PT-klant bestaat niet.' }, { status: 404 })
  }

  // 1. De evaluatie opslaan. Dít is de kern — mislukt het, dan stoppen we.
  const bewaard = await slaEvaluatieOp(toegang.admin, toegang.userId, persoonId, evaluatie.waarde)
  if (!bewaard.ok) {
    return NextResponse.json({ fout: 'Kon de evaluatie niet opslaan.' }, { status: 502 })
  }

  // 2. Een samenvatting in de CRM-tijdlijn. Best-effort: de evaluatie staat al
  //    veilig in pt_coaching, dus een mislukte logregel mag het niet omvallen.
  await logGebeurtenis(toegang.admin, toegang.userId, persoonId, {
    soort: 'notitie',
    notitie: evaluatieSamenvatting(evaluatie.waarde),
  }).catch(() => undefined)

  // 3. De volgende afspraak. Optioneel: gaf je geen datum mee, dan sla je dit over
  //    (je plant later handmatig in via de kaart). Wél een datum → inplannen +
  //    uitnodigen.
  let afspraakFout: string | null = null
  if (typeof volgendeStartOp === 'string' && volgendeStartOp.trim().length > 0) {
    const start = new Date(volgendeStartOp)
    if (Number.isNaN(start.getTime())) {
      afspraakFout = 'De datum/tijd voor de volgende afspraak was ongeldig; plan de volgende handmatig in.'
    } else {
      const eind = new Date(start.getTime() + GESPREK_DUUR_MIN * 60_000)
      const kalenderId = await leesGekozenKalender(toegang.admin, toegang.userId)
      try {
        await maakAgendaEvent(
          toegang.admin,
          toegang.userId,
          {
            titel: coachgesprekTitel(persoon.naam),
            startOp: start.toISOString(),
            eindOp: eind.toISOString(),
            genodigden: persoon.email ? [persoon.email] : [],
          },
          kalenderId,
        )
      } catch (fout) {
        const http = schrijfFoutHttp(fout)
        afspraakFout = http?.bericht ?? 'De volgende afspraak kon niet worden aangemaakt.'
      }
    }
  }

  const resultaat: AfrondResultaat = { afspraakFout }
  return NextResponse.json(resultaat, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' },
  })
}
