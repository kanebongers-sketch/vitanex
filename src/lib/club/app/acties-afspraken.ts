// ─── Club, ledenapp: afspraken van een lid (SERVER-ONLY) ────────────────────
// De stappen achter "Afspraken" in de ledenapp, los van hoe het lid bepaald
// wordt. De voorvertoning (/api/club/afspraken/app, lid uit de vraag na een
// beheerder-sessie) en de leden-API (/api/club/lid/afspraken, lid uit de
// ledensessie) gebruiken dezelfde regels: boekregels van het type, hooguit
// MAX_OPEN_APP open afspraken, alleen het eigen lid.

import type { NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, type ClubSchrijver } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { isDatum, nlNaarUtc } from '@/lib/club/rooster/tijd'
import { isUuid, leesAppBoeking } from '@/lib/club/afspraken/invoer'
import { haalAfspraak, haalAfspraken, haalType, haalTypen, maakAfspraak, metNamen, telOpenAfsprakenVanLid, werkAfspraakBij } from '@/lib/club/afspraken/opslag'
import { BOEK_HORIZON_DAGEN, boekVenster, eindVan, magGeven, magLidAnnuleren, magLidBoeken } from '@/lib/club/afspraken/regels'
import { zoekSloten } from '@/lib/club/afspraken/sloten-opslag'
import { controleerTijd, trainersVoorType } from '@/lib/club/afspraken/api'
import { STAP_MIN } from '@/lib/club/afspraken/sloten'

/** Hoeveel geplande afspraken een lid via de app tegelijk mag hebben. */
export const MAX_OPEN_APP = 2

const DAG = 86_400_000
const NIET_MEER_VRIJ = 'Dit tijdstip is net niet meer vrij. Kies een ander moment.'

/** Komende afspraken van het lid en wat het zelf kan boeken. */
export async function afsprakenVoorLid(s: ClubSchrijver, lid: Lid): Promise<NextResponse> {
  const nu = new Date()
  const [typen, medewerkers, afspraken] = await Promise.all([
    haalTypen(s.admin, s.userId),
    haalMedewerkers(s.admin, s.userId, lid.vestiging),
    haalAfspraken(s.admin, s.userId, { van: nu, tot: new Date(nu.getTime() + 90 * DAG), lidId: lid.id }),
  ])
  if (!typen || !medewerkers || !afspraken) return clubFout('Je afspraken konden niet worden geladen.', 500)
  const komend = await metNamen(s.admin, s.userId, afspraken.filter((a) => a.status === 'gepland'), typen)
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

export interface SlotVraag {
  type: string | null
  datum: string | null
  medewerker: string | null
}

/** Vrije tijden voor dit lid, met de boekregels van het type. */
export async function slotenVoorLid(s: ClubSchrijver, lid: Lid, v: SlotVraag): Promise<NextResponse> {
  if (!isUuid(v.type)) return clubFout('Kies een soort afspraak.', 400)
  if (!isDatum(v.datum)) return clubFout('Kies een geldige datum.', 400)
  if (v.medewerker && !isUuid(v.medewerker)) return clubFout('Onbekende trainer.', 400)
  const type = await haalType(s.admin, s.userId, v.type)
  if (!type || !type.actief || !type.appBoekbaar) return clubFout('Dit soort afspraak kun je niet zelf boeken.', 404)
  const trainers = await trainersVoorType(s, lid.vestiging, type)
  if (!trainers) return clubFout('De trainers konden niet worden geladen.', 500)
  const ids = v.medewerker ? trainers.filter((m) => m.id === v.medewerker).map((m) => m.id) : trainers.map((m) => m.id)
  const { vanaf, tot } = boekVenster(type, new Date())
  const sloten = await zoekSloten(s.admin, s.userId, { vestiging: lid.vestiging, type, datum: v.datum, medewerkerIds: ids, vanaf, tot })
  if (!sloten) return clubFout('De vrije tijden konden niet worden geladen.', 500)
  const naam = new Map(trainers.map((m) => [m.id, m.naam]))
  return clubJson({ sloten: sloten.map((sl) => ({ ...sl, medewerkerNaam: naam.get(sl.medewerkerId) ?? '' })) })
}

/** Het lid boekt zelf een vrij tijdslot. Een lidId in de body telt niet: `lid` is leidend. */
export async function boekAfspraakVoorLid(s: ClubSchrijver, lid: Lid, body: unknown): Promise<NextResponse> {
  const ruw = typeof body === 'object' && body !== null && !Array.isArray(body) ? { ...(body as Record<string, unknown>), lidId: lid.id } : body
  const invoer = leesAppBoeking(ruw)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const b = invoer.waarde
  const type = await haalType(s.admin, s.userId, b.typeId)
  if (!type || !type.actief || !type.appBoekbaar) return clubFout('Dit soort afspraak bestaat niet.', 404)
  const nu = new Date()
  // Alleen tijden uit het raster dat de app toont (elke 15 minuten): geen versnipperde agenda.
  const [uur, minuut] = b.tijd.split(':').map(Number)
  if ((uur * 60 + minuut) % STAP_MIN !== 0) return clubFout(NIET_MEER_VRIJ, 409)
  // Een lid kan niet de hele agenda vullen: hooguit MAX_OPEN_APP geplande afspraken tegelijk.
  const open = await telOpenAfsprakenVanLid(s.admin, s.userId, lid.id, nu)
  if (open === null) return clubFout('Boeken lukt nu niet. Probeer het opnieuw.', 500)
  if (open >= MAX_OPEN_APP) return clubFout(`Je hebt al ${open} geplande afspraken. Na je volgende afspraak kun je weer een nieuwe maken.`, 409)
  const mag = magLidBoeken(type, nlNaarUtc(b.datum, b.tijd), nu)
  if (!mag.ok) return clubFout(mag.fout, 409)
  const { vanaf, tot } = boekVenster(type, nu)
  const controle = await controleerTijd(s, { vestiging: lid.vestiging, type, datum: b.datum, tijd: b.tijd, medewerkerId: b.medewerkerId, vanaf, tot })
  if (!controle.ok) return clubFout(controle.status === 409 ? NIET_MEER_VRIJ : controle.fout, controle.status)
  const { eind, bezetTot } = eindVan(controle.start, type)
  const uit = await maakAfspraak(s.admin, s.userId, {
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
  await logActie(s, 'afspraak geboekt in de app', `${type.naam}, ${volledigeNaam(lid)}`, lid.vestiging)
  return clubJson({ afspraak: { id: uit.waarde.id, start: uit.waarde.start } }, 201)
}

/** Het lid annuleert een eigen afspraak, binnen de annuleerregel van het type. */
export async function annuleerAfspraakVoorLid(s: ClubSchrijver, lid: Lid, id: string): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout('Afspraak niet gevonden.', 404)
  const afspraak = await haalAfspraak(s.admin, s.userId, id)
  if (!afspraak || afspraak.lidId !== lid.id) return clubFout('Afspraak niet gevonden.', 404)
  const type = await haalType(s.admin, s.userId, afspraak.typeId)
  if (!type) return clubFout('Annuleren lukt nu niet. Bel of mail de sportschool.', 409)
  const mag = magLidAnnuleren(type, afspraak, new Date())
  if (!mag.ok) return clubFout(mag.fout, 409)
  // Alleen een afspraak die nog gepland staat (niet een die de trainer net op 'geweest' zette).
  const uit = await werkAfspraakBij(s.admin, s.userId, id, { status: 'geannuleerd', geannuleerd_op: new Date().toISOString() }, 'gepland')
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  await logActie(s, 'afspraak geannuleerd in de app', `${type.naam}, ${volledigeNaam(lid)}`, lid.vestiging)
  return clubJson({ ok: true })
}
