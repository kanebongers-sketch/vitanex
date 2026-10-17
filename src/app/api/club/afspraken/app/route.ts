// GET  /api/club/afspraken/app?lid=<id>: komende afspraken van het lid en wat
//      het lid zelf kan boeken (typen met hun trainers).
// POST /api/club/afspraken/app: het lid boekt zelf een vrij tijdslot, met de
//      boekregels van het type. Trainer null = maakt niet uit.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { nlNaarUtc } from '@/lib/club/rooster/tijd'
import { leesAppBoeking } from '@/lib/club/afspraken/invoer'
import { haalAfspraken, haalType, haalTypen, maakAfspraak, metNamen } from '@/lib/club/afspraken/opslag'
import { BOEK_HORIZON_DAGEN, boekVenster, eindVan, magGeven, magLidAnnuleren, magLidBoeken } from '@/lib/club/afspraken/regels'
import { controleerTijd, leesJson } from '@/lib/club/afspraken/api'
import { lidVoorApp } from '@/lib/club/afspraken/app-api'

const DAG = 86_400_000
const NIET_MEER_VRIJ = 'Dit tijdstip is net niet meer vrij. Kies een ander moment.'

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lid = await lidVoorApp(t, req.nextUrl.searchParams.get('lid'))
  if (lid instanceof NextResponse) return lid
  const nu = new Date()
  const [typen, medewerkers, afspraken] = await Promise.all([
    haalTypen(t.admin, t.userId),
    haalMedewerkers(t.admin, t.userId, lid.vestiging),
    haalAfspraken(t.admin, t.userId, { van: nu, tot: new Date(nu.getTime() + 90 * DAG), lidId: lid.id }),
  ])
  if (!typen || !medewerkers || !afspraken) return clubFout('Je afspraken konden niet worden geladen.', 500)
  const komend = await metNamen(t.admin, t.userId, afspraken.filter((a) => a.status === 'gepland'), typen)
  if (!komend) return clubFout('Je afspraken konden niet worden geladen.', 500)
  const naam = new Map(medewerkers.map((m) => [m.id, m.naam]))
  const typeVan = new Map(typen.map((ty) => [ty.id, ty]))
  return clubJson({
    horizonDagen: BOEK_HORIZON_DAGEN,
    komend: komend.map((a) => {
      const type = typeVan.get(a.typeId)
      const annuleren = type ? magLidAnnuleren(type, a, nu) : { ok: false as const, fout: 'Bel of mail de sportschool om te annuleren.' }
      return {
        id: a.id,
        start: a.start,
        eind: a.eind,
        typeNaam: a.typeNaam,
        kleur: a.kleur,
        trainer: naam.get(a.medewerkerId) ?? 'Trainer',
        magAnnuleren: annuleren.ok,
        annulerenUitleg: annuleren.ok ? null : annuleren.fout,
      }
    }),
    typen: typen
      .filter((ty) => ty.actief && ty.appBoekbaar)
      .map((ty) => ({
        id: ty.id,
        naam: ty.naam,
        duurMin: ty.duurMin,
        kleur: ty.kleur,
        boekenUrenVooraf: ty.boekenUrenVooraf,
        annulerenUrenVooraf: ty.annulerenUrenVooraf,
        trainers: medewerkers.filter((m) => magGeven(ty, m, lid.vestiging)).map((m) => ({ id: m.id, naam: m.naam })),
      }))
      .filter((ty) => ty.trainers.length > 0),
  })
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesAppBoeking(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const b = invoer.waarde
  const lid = await lidVoorApp(t, b.lidId)
  if (lid instanceof NextResponse) return lid
  const type = await haalType(t.admin, t.userId, b.typeId)
  if (!type) return clubFout('Dit soort afspraak bestaat niet.', 404)
  const nu = new Date()
  const mag = magLidBoeken(type, nlNaarUtc(b.datum, b.tijd), nu)
  if (!mag.ok) return clubFout(mag.fout, 409)
  const { vanaf, tot } = boekVenster(type, nu)
  const controle = await controleerTijd(t, { vestiging: lid.vestiging, type, datum: b.datum, tijd: b.tijd, medewerkerId: b.medewerkerId, vanaf, tot })
  if (!controle.ok) return clubFout(controle.status === 409 ? NIET_MEER_VRIJ : controle.fout, controle.status)
  const { eind, bezetTot } = eindVan(controle.start, type)
  const uit = await maakAfspraak(t.admin, t.userId, {
    vestiging: lid.vestiging,
    typeId: type.id,
    medewerkerId: controle.medewerkerId,
    lidId: lid.id,
    leadId: null,
    start: controle.start,
    eind,
    bezetTot,
    notitie: null,
    geboektDoor: 'app',
  })
  if (!uit.ok) return clubFout(uit.status === 409 && !uit.fout.includes('lid') ? NIET_MEER_VRIJ : uit.fout, uit.status)
  await logActie(t, 'afspraak geboekt in de app', `${type.naam}, ${volledigeNaam(lid)}`, lid.vestiging)
  return clubJson({ afspraak: { id: uit.waarde.id, start: uit.waarde.start } }, 201)
}
