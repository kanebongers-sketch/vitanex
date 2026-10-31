import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, LID_STATUS_LABEL, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { leesLidWijziging } from '@/lib/club/leden/invoer'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { haalVerwijderverzoek } from '@/lib/club/leden/avg/opslag'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { vormToegestaan, vormVanLid } from '@/lib/club/leden/hub/lidmaatschap'
import { TOELICHTING_MAX, leesOpzegReden, opzegActie, vraagtOpzegReden, type OpzegInvoer } from '@/lib/club/behoud/opzegreden'
import { bewaarOpzegging, verwijderOpzegging } from '@/lib/club/behoud/opslag'

/** Postgres: kolom bestaat niet (migratie 464 nog niet uitgevoerd). */
const KOLOM_ONTBREEKT = '42703'

// PATCH /api/club/leden/[id]  { coachId?, tags?, status?, abonnement?, lidSinds?, einddatum?, pauzeVan?, pauzeTot?, opzegReden? }
// Coach, tags, de status en het lidmaatschap (vorm, start, pauze, einddatum),
// allemaal vanaf de ledenkaart (besluit Kane 27-10-2026: alles vanuit het lid).
// Contact komt uit de ledenadministratie (Ledenbestand inlezen). De vorm moet
// een bestaande vorm van de sportschool zijn (of de naam die het lid al had).
// Loopt er een verzoek tot verwijderen (AVG), dan blijft de status vast:
// terugdraaien gaat via de privacykaart. De pauzedatums staan in kolommen uit
// migratie 464; zolang die er niet is, slaat de rest wel op en meldt de kaart dat.
// Opzeggen of stoppen vraagt een reden uit een vaste lijst (opzegReden: { reden,
// toelichting? }, migratie 482); bij gezondheid alleen de categorie.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_leden', id)
  if (buiten) return buiten
  const body: unknown = await req.json().catch(() => null)
  const wijziging = leesLidWijziging(body)
  if (!wijziging.ok) return clubFout(wijziging.fout, 400)
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)

  const { coachId, tags, status, lidSinds, einddatum, pauzeVan, pauzeTot } = wijziging.waarde
  let abonnement = wijziging.waarde.abonnement
  if (abonnement !== undefined) {
    const vormen = await haalVormen(t.admin, t.userId)
    if (vormen === null) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
    if (!vormToegestaan(vormen, lid.abonnement, abonnement)) return clubFout('Kies een lidmaatschapsvorm die je sportschool heeft.', 400)
    // Altijd de naam zoals de vorm heet (hoofdletters en spaties), zodat de koppeling met de vorm klopt.
    abonnement = abonnement === null ? null : (vormVanLid(vormen, abonnement)?.naam ?? abonnement)
  }
  if (status !== undefined && status !== lid.status) {
    const verzoek = await haalVerwijderverzoek(t.admin, t.userId, lid.id)
    if (verzoek === undefined) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
    if (verzoek) return clubFout('Dit lid wordt verwijderd (AVG). Draai dat eerst terug bij Privacy voordat je de status wijzigt.', 409)
  }
  let opzeg: OpzegInvoer | null = null
  if (status !== undefined && vraagtOpzegReden(lid.status, status)) {
    const ruw = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).opzegReden : undefined
    const gelezen = leesOpzegReden(ruw)
    if (!gelezen.ok) return clubFout(gelezen.fout === 'teLang' ? `De toelichting is hoogstens ${TOELICHTING_MAX} tekens.` : 'Kies waarom dit lid gaat.', 400)
    opzeg = gelezen.waarde
  }
  let coachNaam: string | null = null
  if (coachId) {
    const trainers = await haalMedewerkers(t.admin, t.userId, lid.vestiging, 'trainer')
    const coach = trainers?.find((m) => m.id === coachId)
    if (!coach) return clubFout('Deze coach werkt niet als trainer in deze vestiging.', 400)
    coachNaam = coach.naam
  }

  const update = {
    ...(coachId !== undefined ? { coach_id: coachId } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(abonnement !== undefined ? { abonnement } : {}),
    ...(lidSinds !== undefined ? { lid_sinds: lidSinds } : {}),
    ...(einddatum !== undefined ? { einddatum } : {}),
    bijgewerkt_op: new Date().toISOString(),
  }
  // Eerst de reden, zodat een opzegging nooit zonder reden in de cijfers staat.
  const reden = opzeg && status
    ? await bewaarOpzegging(t.admin, t.userId, { ...opzeg, lidId: lid.id, vestiging: lid.vestiging, actie: opzegActie(status), einddatum: einddatum ?? null, door: t.naam, demo: lid.demo })
    : null
  if (reden?.soort === 'fout') return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  const { error } = await t.admin.from('club_leden').update(update).eq('user_id', t.userId).eq('id', lid.id)
  if (error) {
    console.error('[club] lid bijwerken mislukt', error.message)
    if (reden?.soort === 'ok') await verwijderOpzegging(t.admin, t.userId, reden.id)
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  const pauze = await bewaarPauze(t.admin, t.userId, lid.id, pauzeVan, pauzeTot)
  if (pauze === 'fout') return clubFout('De pauzedatums zijn niet opgeslagen. Probeer het opnieuw.', 500)
  const wat = [
    coachId !== undefined ? `coach ${coachNaam ?? 'geen'}` : null,
    tags !== undefined ? `tags ${tags.join(', ') || 'geen'}` : null,
    status !== undefined ? `status ${LID_STATUS_LABEL[status].toLowerCase()}` : null,
    abonnement !== undefined ? `lidmaatschap ${abonnement ?? 'geen'}` : null,
    lidSinds !== undefined ? `lid sinds ${lidSinds ?? 'leeg'}` : null,
    einddatum !== undefined ? `einddatum ${einddatum ?? 'leeg'}` : null,
    pauze === 'ok' ? `pauze ${pauzeVan ?? 'leeg'} tot ${pauzeTot ?? 'open'}` : null,
  ].filter(Boolean).join(', ')
  await logActie(t, 'Lid bijgewerkt', `${volledigeNaam(lid)}: ${wat}`, lid.vestiging)
  return clubJson({ ok: true, pauzeNietOpgeslagen: pauze === 'ontbreekt', redenNietOpgeslagen: reden?.soort === 'ontbreekt' })
}

type PauzeUitkomst = 'niets' | 'ok' | 'ontbreekt' | 'fout'

/** De pauzedatums apart, zodat de rest blijft werken zolang migratie 464 er nog niet is. */
async function bewaarPauze(admin: SupabaseClient, userId: string, lidId: string, van: string | null | undefined, tot: string | null | undefined): Promise<PauzeUitkomst> {
  if (van === undefined && tot === undefined) return 'niets'
  const update = { ...(van !== undefined ? { pauze_van: van } : {}), ...(tot !== undefined ? { pauze_tot: tot } : {}) }
  const { error } = await admin.from('club_leden').update(update).eq('user_id', userId).eq('id', lidId)
  if (!error) return 'ok'
  if (error.code === KOLOM_ONTBREEKT) return 'ontbreekt'
  console.error('[club] pauze van lid bewaren mislukt', error.message)
  return 'fout'
}
