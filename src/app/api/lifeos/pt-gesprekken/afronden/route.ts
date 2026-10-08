// POST /api/lifeos/pt-gesprekken/afronden — een coaching afronden.
//
// Eén handeling sluit de cyclus én rolt 'm door:
//   1. de evaluatie (3 scores + notitie) opslaan in pt_coaching;
//   2. een samenvatting in de CRM-tijdlijn van de persoon loggen;
//   3. de VOLGENDE afspraak inplannen (datum/tijd die je koos — flexibel) en de
//      klant uitnodigen via z'n mailadres;
//   4. de open aandachtspunten van vorige keer beoordelen, en een nieuw
//      aandachtspunt als open punt vastleggen;
//   5. het verslag als pdf naar je eigen inbox mailen.
//
// De evaluatie is leidend: lukt stap 3 niet, dan is de coaching tóch vastgelegd
// en meldt het antwoord `afspraakFout` zodat je de volgende handmatig kunt zetten.
// Zo verlies je nooit je observatie door een agenda-hik.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang, type LifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { logGebeurtenis } from '@/lib/lifeos/crm/historie'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { maakAgendaEvent, schrijfFoutHttp } from '@/lib/lifeos/agenda/schrijven'
import { coachgesprekTitel } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { evaluatieSamenvatting, leesEvaluatie, type AfrondResultaat, type EvaluatieInvoer } from '@/lib/lifeos/pt-coaching/pt-coaching'
import { haalLaatsteEvaluaties, nieuwAandachtspunt, slaEvaluatieOp, verwerkOordelen } from '@/lib/lifeos/pt-coaching/opslag'
import { leesOordelen } from '@/lib/lifeos/pt-coaching/aandachtspunten'
import { mailVerslag } from '@/lib/lifeos/pt-coaching/verslag-mail'
import { GESPREK_DUUR_MIN, RITME_DAGEN } from '@/lib/lifeos/pt-gesprek/ritme'
import { haalLeadsVoor } from '@/lib/lifeos/leads/opslag'
import { dagSleutelNl, vatLeadsSamen, type LeadSamenvatting } from '@/lib/lifeos/leads/leads'
import { haalKlantenVoor } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { klantRegel, vatKlantenSamen } from '@/lib/lifeos/pt-dashboard/abonnementen'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** De volgende afspraak duurt standaard een half uur; alleen de start kies je. */

/**
 * Eén keer afronden = één evaluatie, één uitnodiging, één mail. Het formulier
 * stuurt een eigen sleutel mee; een dubbelklik of een retry met dezelfde sleutel
 * krijgt het eerste resultaat terug in plaats van alles nog eens te doen.
 * Geheugen per proces is genoeg: retries komen binnen seconden.
 */
const AL_AFGEROND = new Map<string, { op: number; resultaat: Promise<AfrondResultaat | null> }>()
const SLEUTEL_VENSTER_MS = 10 * 60 * 1000

function leesSleutel(body: object): string | null {
  const s = (body as { sleutel?: unknown }).sleutel
  return typeof s === 'string' && s.length > 0 && s.length <= 100 ? s : null
}

function ruimSleutelsOp(nu: number): void {
  for (const [k, v] of AL_AFGEROND) if (nu - v.op > SLEUTEL_VENSTER_MS) AL_AFGEROND.delete(k)
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ fout: 'Ongeldige invoer.' }, { status: 400 })
  }
  const { persoonId, volgendeStartOp } = body as { persoonId?: unknown; volgendeStartOp?: unknown }

  const sleutel = leesSleutel(body)
  if (sleutel) {
    const nu = Date.now()
    ruimSleutelsOp(nu)
    const eerder = AL_AFGEROND.get(sleutel)
    if (eerder) {
      const resultaat = await eerder.resultaat
      if (resultaat) return NextResponse.json(resultaat, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
      return NextResponse.json({ fout: 'Dit gesprek wordt al afgerond.' }, { status: 409 })
    }
  }

  if (typeof persoonId !== 'string' || persoonId.length === 0) {
    return NextResponse.json({ fout: 'Onbekend PT-teamlid.' }, { status: 400 })
  }
  const evaluatie = leesEvaluatie((body as { evaluatie?: unknown }).evaluatie)
  if (!evaluatie.ok) {
    return NextResponse.json({ fout: evaluatie.fout }, { status: 400 })
  }

  // Vanaf hier één keer per sleutel: wie tegelijk met dezelfde sleutel binnenkomt,
  // wacht op dit resultaat (zie AL_AFGEROND).
  // Een onverwachte worp wordt een nette 502 (en geeft de sleutel vrij), zodat de
  // map nooit een afgewezen belofte vasthoudt waar een retry tien minuten op stukloopt.
  const werk = rondAf(toegang, body, persoonId, volgendeStartOp, evaluatie.waarde).catch((fout: unknown) => {
    console.error('[pt-gesprekken/afronden] afronden mislukt', fout)
    return NextResponse.json({ fout: 'Afronden mislukt. Kijk of de evaluatie er al staat voor je opnieuw probeert.' }, { status: 502 })
  })
  if (sleutel) {
    AL_AFGEROND.set(sleutel, {
      op: Date.now(),
      resultaat: werk.then((u) => (u instanceof NextResponse ? null : u)),
    })
  }
  const uitkomst = await werk
  if (uitkomst instanceof NextResponse) {
    // Mislukt vóór er iets is opgeslagen: een nieuwe poging moet gewoon kunnen.
    if (sleutel) AL_AFGEROND.delete(sleutel)
    return uitkomst
  }
  return NextResponse.json(uitkomst, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' },
  })
}

/** Het eigenlijke afronden. Een NextResponse = een fout vóór of tijdens het opslaan. */
async function rondAf(
  toegang: LifeosToegang,
  body: object,
  persoonId: string,
  volgendeStartOp: unknown,
  evaluatieWaarde: EvaluatieInvoer,
): Promise<AfrondResultaat | NextResponse> {
  const evaluatie = { waarde: evaluatieWaarde }
  // De persoon zelf ophalen (naam + mail voor de uitnodiging), server-side — de
  // client stuurt alleen het id, niet de naam/mail die we vertrouwen.
  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_team')
  if (!personen.ok) {
    return NextResponse.json({ fout: 'Kon je PT-team niet lezen.' }, { status: 502 })
  }
  const persoon = personen.waarde.find((p) => p.id === persoonId)
  if (!persoon) {
    return NextResponse.json({ fout: 'Dit PT-teamlid bestaat niet.' }, { status: 404 })
  }

  // 0. De leads sinds het vorige verslag — vóór het opslaan, anders is "vorige" dit verslag.
  const { leads, klanten } = await leadsSindsVorige(toegang, persoonId)

  // 1. De evaluatie opslaan. Dít is de kern — mislukt het, dan stoppen we.
  const bewaard = await slaEvaluatieOp(toegang.admin, toegang.userId, persoonId, evaluatie.waarde)
  if (!bewaard.ok) {
    return NextResponse.json({ fout: 'Kon de evaluatie niet opslaan.' }, { status: 502 })
  }

  // 1b. Aandachtspunten: eerst de oude beoordelen, dan het nieuwe vastleggen (zodat
  //     het nieuwe niet meteen "een gesprek open" telt). Best-effort.
  const opvolging = await verwerkOordelen(
    toegang.admin, toegang.userId, persoonId, leesOordelen((body as { oordelen?: unknown }).oordelen),
  ).catch((fout) => {
    console.error('[pt-gesprekken/afronden] aandachtspunten beoordelen mislukt', fout)
    return []
  })
  if (evaluatie.waarde.aandachtspunt) {
    await nieuwAandachtspunt(toegang.admin, toegang.userId, persoonId, evaluatie.waarde.aandachtspunt, bewaard.waarde.id).catch(
      (fout) => console.error('[pt-gesprekken/afronden] nieuw aandachtspunt mislukt', fout),
    )
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
  let volgende: Date | null = null
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
        volgende = start
      } catch (fout) {
        const http = schrijfFoutHttp(fout)
        afspraakFout = http?.bericht ?? 'De volgende afspraak kon niet worden aangemaakt.'
      }
    }
  }

  // 5. Het verslag als pdf mailen. Best-effort, net als de afspraak.
  const mailFout = await mailVerslag({
    naam: persoon.naam,
    op: new Date(bewaard.waarde.aangemaaktOp),
    scores: bewaard.waarde.scores,
    notitie: bewaard.waarde.notitie,
    aandachtspunt: bewaard.waarde.aandachtspunt,
    volgende,
    opvolging,
    leads,
    klanten,
  })

  return { afspraakFout, mailFout, evaluatieId: bewaard.waarde.id }
}

/** Lead- en klantstand voor het verslag; best-effort (leeg bij een fout). */
async function leadsSindsVorige(
  toegang: LifeosToegang,
  persoonId: string,
): Promise<{ leads: LeadSamenvatting | null; klanten: string | null }> {
  try {
    const [laatste, leads, klanten] = await Promise.all([
      haalLaatsteEvaluaties(toegang.admin, toegang.userId, [persoonId]),
      haalLeadsVoor(toegang.admin, toegang.userId, [persoonId]),
      haalKlantenVoor(toegang.admin, toegang.userId, [persoonId]),
    ])
    const vorige = laatste.get(persoonId)
    const nu = new Date()
    const sinds = vorige ? new Date(vorige.aangemaaktOp) : new Date(nu.getTime() - RITME_DAGEN * 24 * 60 * 60 * 1000)
    const vandaag = dagSleutelNl(nu)
    return {
      leads: vatLeadsSamen(leads.get(persoonId) ?? [], sinds, vandaag),
      klanten: klantRegel(vatKlantenSamen(klanten.get(persoonId) ?? [], vandaag)),
    }
  } catch {
    return { leads: null, klanten: null }
  }
}
