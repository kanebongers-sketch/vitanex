// GET /api/lifeos/blok/vandaag — wat staat er vandaag, met per oefening je vorige
// prestatie en het gewichtsvoorstel van de progressie-engine.
//
// De client stuurt zijn eigen `datum` (YYYY-MM-DD) en `weekdag` (0=zondag) mee: de
// server weet niet in welke tijdzone Kane leeft, de browser wel. Zonder die twee
// vallen we terug op de servertijd — dezelfde afspraak als de agenda-routes.
//
// Het blok start automatisch op de eerste dag dat je dit opent (zie
// `haalOfStartBlok`), zodat "open app → zie training van vandaag" meteen werkt.

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { planVoorDatum, planVoorSessie, isSessieCode, BLOK_WEEK, type DagPlan } from '@/lib/lifeos/blok/programma'
import { haalOfStartBlok } from '@/lib/lifeos/blok/instellingen'
import { haalSessieOpDatum, haalSets, haalLaatstePrestatie } from '@/lib/lifeos/blok/opslag'
import { bepaalAdvies, voorgesteldGewicht } from '@/lib/lifeos/blok/progressie'
import type { KrachtSessie } from '@/lib/lifeos/blok/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/

/** De datum + weekdag van de client, of de servertijd als vangnet. */
function leesDagContext(req: NextRequest): { datum: string; weekdag: number } {
  const params = req.nextUrl.searchParams
  const datum = params.get('datum')
  const weekdagRuw = Number(params.get('weekdag'))

  if (datum !== null && DATUM_PATROON.test(datum) && Number.isInteger(weekdagRuw) && weekdagRuw >= 0 && weekdagRuw <= 6) {
    return { datum, weekdag: weekdagRuw }
  }
  const nu = new Date()
  return { datum: datumSleutel(nu), weekdag: nu.getDay() }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { datum, weekdag } = leesDagContext(req)

  const start = await haalOfStartBlok(toegang.admin, toegang.userId, datum)
  if (!start.ok) return NextResponse.json({ fout: 'Kon je blok niet laden.' }, { status: 502 })

  // Een zelfgekozen sessie (`?sessie=lower_b`) overschrijft het weekschema. Zonder
  // die param volgt het schema uit de weekdag. De week (en modulatie) blijft altijd
  // uit de datum komen — je kiest wélke training, niet in welke week je zit.
  const gekozen = req.nextUrl.searchParams.get('sessie')
  const plan = isSessieCode(gekozen)
    ? planVoorSessie(start.waarde, datum, gekozen)
    : planVoorDatum(start.waarde, datum, weekdag)

  if (plan === null) {
    // Buiten de 4 weken: het blok is klaar (of nog niet begonnen). De UI toont dan
    // de evaluatie/herstart, geen sessie.
    return NextResponse.json({ inBlok: false, startDatum: start.waarde, datum })
  }

  // De 7 sessies waaruit je kunt kiezen (voor de keuzebalk), plus welke nu actief is.
  const keuzes = BLOK_WEEK.map((d) => ({ code: d.code, titel: d.titel, soort: d.soort }))

  const basis = {
    inBlok: true as const,
    datum,
    week: plan.week,
    profiel: { naam: plan.profiel.naam, doel: plan.profiel.doel, advies: plan.profiel.advies },
    soort: plan.dag.soort,
    titel: plan.dag.titel,
    focus: plan.dag.focus,
    gekozenCode: plan.dag.code,
    keuzes,
  }

  if (plan.dag.soort === 'rust') {
    return NextResponse.json({ ...basis, rust: { toelichting: plan.dag.toelichting } })
  }

  if (plan.dag.soort === 'cardio') {
    return NextResponse.json({
      ...basis,
      cardio: {
        duurBereik: plan.dag.duurBereik,
        rpeDoel: plan.dag.rpeDoel,
        hartslagZone: plan.dag.hartslagZone ?? null,
        stations: plan.dag.stations ?? null,
        rondes: plan.rondes ?? null,
        toelichting: plan.dag.toelichting,
      },
    })
  }

  // Krachtsessie: haal de bestaande sessie + per oefening de vorige prestatie.
  const oefeningen = await bouwOefeningen(toegang.admin, toegang.userId, datum, plan)

  return NextResponse.json({
    ...basis,
    warmup: (plan.dag as KrachtSessie).warmup,
    duurMinuten: (plan.dag as KrachtSessie).duurMinuten,
    sessie: oefeningen.sessie,
    oefeningen: oefeningen.lijst,
  })
}

/**
 * Bouwt per oefening: het doel, je vorige prestatie, het advies + voorstel, en de
 * sets die je vandaag al logde. De historie-fetches lopen parallel — het zijn er
 * ~8 en ze zijn onafhankelijk.
 */
async function bouwOefeningen(admin: SupabaseClient, userId: string, datum: string, plan: DagPlan) {
  const sessie = plan.dag.soort === 'kracht' ? await haalSessieOpDatum(admin, userId, datum, plan.dag.code) : null
  const sessieRij = sessie && sessie.ok ? sessie.waarde : null
  const gelogdeSets = sessieRij ? await haalSets(admin, sessieRij.id) : null
  const gelogd = gelogdeSets && gelogdeSets.ok ? gelogdeSets.waarde : []

  const dag = plan.dag as KrachtSessie
  const lijst = await Promise.all(
    dag.oefeningen.map(async (o) => {
      const hist = await haalLaatstePrestatie(admin, userId, o.naam, datum)
      const vorige = hist.ok ? hist.waarde : []
      const advies = bepaalAdvies(o.doel, vorige.map((s) => ({ herhalingen: s.herhalingen, gewichtKg: s.gewichtKg, rir: s.rir })))
      return {
        naam: o.naam,
        sets: o.doel.sets,
        repMin: o.doel.repMin,
        repMax: o.doel.repMax,
        stap: o.doel.stap,
        rirMin: o.doel.rirDoel[0],
        rirMax: o.doel.rirDoel[1],
        rustSec: o.rustSec,
        tempo: o.tempo ?? null,
        notitie: o.notitie ?? null,
        perKant: o.perKant ?? false,
        vorige: vorige.map((s) => ({ herhalingen: s.herhalingen, gewichtKg: s.gewichtKg, rir: s.rir })),
        advies: advies.soort,
        adviesUitleg: 'uitleg' in advies ? advies.uitleg : null,
        voorstelKg: voorgesteldGewicht(advies),
        gelogd: gelogd
          .filter((s) => s.oefening === o.naam)
          .map((s) => ({ setNummer: s.setNummer, herhalingen: s.herhalingen, gewichtKg: s.gewichtKg, rir: s.rir })),
      }
    }),
  )

  return {
    sessie: sessieRij ? { trainingId: sessieRij.id, voltooidOp: sessieRij.voltooidOp } : null,
    lijst,
  }
}
