// Het klantdossier bevat gezondheidsgegevens. Deze tests leggen vast dat elke
// schrijfactie eerst controleert dat de klant nú van de trainer achter de link
// is — ook als een dossier-rij nog een oude persoon_id draagt (klant verplaatst
// vóór migratie 361) — en dat het aantal metingen per klant begrensd is.

import { describe, expect, test } from 'vitest'
import type { LeadLink } from '@/lib/lifeos/leads/links'
import type { MetingInvoer } from './metingen'
import { MAX_METINGEN_PER_KLANT, bewaarIntake, haalMetingen, verwijderMeting, voegMetingToe } from './dossier-opslag'
import { nepSupabase, type Tabellen } from './nep-supabase.test-helper'

const USER = 'u-1'
const JOEY = '22222222-2222-4222-8222-222222222222'
const SAM = '33333333-3333-4333-8333-333333333333'
const KLANT = '55555555-5555-4555-8555-555555555555'

const link = (persoonId: string): LeadLink => ({
  rol: 'pt', userId: USER, persoonId, code: 'x', naam: 'X', pinStatus: 'actief', pinHash: null, mislukt: 0, geblokkeerdTot: null,
})

const metingRij = (id: string, persoonId: string) => ({
  id, klant_id: KLANT, user_id: USER, persoon_id: persoonId, datum: '2026-09-01', soort: 'start', gewicht_kg: '82.0', vet_pct: null,
  taille_cm: null, heup_cm: null, borst_cm: null, arm_cm: null, been_cm: null, cardiotest: null, kracht_oefening: null, kracht_rm: null,
  kracht_kg: null, fotos_gemaakt: false, notitie: null,
})

const meting: MetingInvoer = {
  datum: '2026-10-01', soort: 'tussen', gewichtKg: 80, vetPct: null, tailleCm: null, heupCm: null, borstCm: null, armCm: null, beenCm: null,
  cardiotest: null, krachtOefening: null, krachtRm: null, krachtKg: null, fotosGemaakt: false, notitie: null,
}

/** Klant is verplaatst naar Sam; de meting draagt nog Joey's persoon_id (scheve staat van vóór migratie 361). */
function naVerplaatsing(): Tabellen {
  return {
    pt_klanten: [{ id: KLANT, user_id: USER, persoon_id: SAM }],
    pt_metingen: [metingRij('m1', JOEY)],
    pt_intakes: [],
  }
}

describe('na een verplaatsing houdt de oude trainer niets', () => {
  test('verwijderMeting: oude trainer → niet_gevonden, de meting blijft staan', async () => {
    const db = naVerplaatsing()
    expect(await verwijderMeting(nepSupabase(db), link(JOEY), KLANT, 'm1')).toEqual({ ok: false, reden: 'niet_gevonden' })
    expect(db.pt_metingen).toHaveLength(1)
  })

  test('voegMetingToe en bewaarIntake: oude trainer → niet_gevonden, niets geschreven', async () => {
    const db = naVerplaatsing()
    expect(await voegMetingToe(nepSupabase(db), link(JOEY), KLANT, meting)).toEqual({ ok: false, reden: 'niet_gevonden' })
    expect(await bewaarIntake(nepSupabase(db), link(JOEY), KLANT, { med_hart: true })).toEqual({ ok: false, reden: 'niet_gevonden' })
    expect(db.pt_metingen).toHaveLength(1)
    expect(db.pt_intakes).toHaveLength(0)
  })

  test('de nieuwe trainer schrijft wél, op zijn eigen persoon_id', async () => {
    const db = naVerplaatsing()
    const uit = await voegMetingToe(nepSupabase(db), link(SAM), KLANT, meting)
    expect(uit.ok).toBe(true)
    expect(db.pt_metingen.at(-1)?.persoon_id).toBe(SAM)
  })
})

describe('metingen per klant zijn begrensd', () => {
  test('op het maximum → te_veel; haalMetingen toont nooit minder dan er is', async () => {
    const db: Tabellen = {
      pt_klanten: [{ id: KLANT, user_id: USER, persoon_id: JOEY }],
      pt_metingen: Array.from({ length: MAX_METINGEN_PER_KLANT }, (_, i) => metingRij(`m-${i}`, JOEY)),
    }
    expect(await voegMetingToe(nepSupabase(db), link(JOEY), KLANT, meting)).toEqual({ ok: false, reden: 'te_veel' })
    const alle = await haalMetingen(nepSupabase(db), link(JOEY), KLANT)
    expect(alle.ok && alle.waarde.length).toBe(MAX_METINGEN_PER_KLANT)
  })
})
