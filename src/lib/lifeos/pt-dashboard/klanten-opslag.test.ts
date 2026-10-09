// De opslag van PT-klanten draait op één invariant: alles is gescoped op de
// trainer achter de link (user_id + persoon_id). Deze tests leggen vast:
//   - verplaatsen neemt het dossier (intake, metingen) mee naar de nieuwe trainer,
//     en raakt niets van andere klanten of andere trainers;
//   - verplaatsen is compare-and-set: een klant die niet (meer) van de trainer is,
//     verhuist niet — ook niet gedeeltelijk;
//   - nieuwe klanten zijn begrensd per uur (zelfde grens als leads).

import { describe, expect, test } from 'vitest'
import type { LeadLink } from '@/lib/lifeos/leads/links'
import type { KlantInvoer } from './abonnementen'
import { MAX_KLANTEN_PER_UUR, verplaatsKlant, voegKlantToe } from './klanten-opslag'
import { nepSupabase, type Tabellen } from './nep-supabase.test-helper'

const USER = 'u-1'
const JOEY = '22222222-2222-4222-8222-222222222222'
const SAM = '33333333-3333-4333-8333-333333333333'
const KLANT = '55555555-5555-4555-8555-555555555555'
const ANDERE_KLANT = '66666666-6666-4666-8666-666666666666'

const link = (persoonId: string): LeadLink => ({
  rol: 'pt', userId: USER, persoonId, code: 'x', naam: 'X', pinStatus: 'actief', pinHash: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0,
})

const klantRij = (id: string, persoonId: string, over: Record<string, unknown> = {}) => ({
  id, user_id: USER, persoon_id: persoonId, naam: 'Klant', contact: null, duo_partner: null, locatie: 'budel', abonnement: '1x',
  startdatum: '2026-09-01', status: 'actief', opgezegd_op: null, notitie: null, lead_id: null, prijs_afwijkend: null, stop_reden: null,
  aangemaakt_op: '2026-10-01T10:00:00.000Z', ...over,
})

function tabellen(): Tabellen {
  return {
    pt_klanten: [klantRij(KLANT, JOEY), klantRij(ANDERE_KLANT, JOEY)],
    pt_intakes: [
      { klant_id: KLANT, user_id: USER, persoon_id: JOEY, antwoorden: { med_hart: true } },
      { klant_id: ANDERE_KLANT, user_id: USER, persoon_id: JOEY, antwoorden: {} },
    ],
    pt_metingen: [
      { id: 'm1', klant_id: KLANT, user_id: USER, persoon_id: JOEY, datum: '2026-09-01' },
      { id: 'm2', klant_id: KLANT, user_id: USER, persoon_id: JOEY, datum: '2026-10-01' },
      { id: 'm3', klant_id: ANDERE_KLANT, user_id: USER, persoon_id: JOEY, datum: '2026-09-01' },
    ],
  }
}

describe('verplaatsKlant', () => {
  test('neemt intake en metingen mee naar de nieuwe trainer; andere klanten blijven staan', async () => {
    const db = tabellen()
    const uit = await verplaatsKlant(nepSupabase(db), link(JOEY), KLANT, SAM)
    expect(uit.ok).toBe(true)
    expect(db.pt_klanten.find((k) => k.id === KLANT)?.persoon_id).toBe(SAM)
    expect(db.pt_intakes.find((i) => i.klant_id === KLANT)?.persoon_id).toBe(SAM)
    expect(db.pt_metingen.filter((m) => m.klant_id === KLANT).map((m) => m.persoon_id)).toEqual([SAM, SAM])
    // De andere klant van Joey is niet aangeraakt.
    expect(db.pt_klanten.find((k) => k.id === ANDERE_KLANT)?.persoon_id).toBe(JOEY)
    expect(db.pt_intakes.find((i) => i.klant_id === ANDERE_KLANT)?.persoon_id).toBe(JOEY)
    expect(db.pt_metingen.find((m) => m.id === 'm3')?.persoon_id).toBe(JOEY)
  })

  test('klant die niet (meer) van deze trainer is → niet_gevonden en niets verhuist (race bij dubbel verplaatsen)', async () => {
    const db = tabellen()
    // Sam heeft 'm al: de link van de beheerder werkt nog "als Joey".
    db.pt_klanten[0].persoon_id = SAM
    const uit = await verplaatsKlant(nepSupabase(db), link(JOEY), KLANT, '44444444-4444-4444-8444-444444444444')
    expect(uit).toEqual({ ok: false, reden: 'niet_gevonden' })
    expect(db.pt_klanten[0].persoon_id).toBe(SAM)
    expect(db.pt_intakes[0].persoon_id).toBe(JOEY)
  })

  test('een andere eigenaar (user_id) komt er nooit bij', async () => {
    const db = tabellen()
    const uit = await verplaatsKlant(nepSupabase(db), { ...link(JOEY), userId: 'iemand-anders' }, KLANT, SAM)
    expect(uit).toEqual({ ok: false, reden: 'niet_gevonden' })
    expect(db.pt_klanten[0].persoon_id).toBe(JOEY)
  })
})

describe('voegKlantToe — grens per uur', () => {
  const invoer: KlantInvoer = {
    naam: 'Nieuw', contact: null, duoPartner: null, club: 'budel', abonnement: '1x', startdatum: '2026-10-09',
    status: 'actief', opgezegdOp: null, notitie: null, leadId: null, stopReden: null,
  }
  const NU = new Date('2026-10-09T12:00:00.000Z')

  test('na het maximum in het afgelopen uur → te_veel; oudere klanten tellen niet mee', async () => {
    const db: Tabellen = {
      pt_klanten: Array.from({ length: MAX_KLANTEN_PER_UUR }, (_, i) => klantRij(`k-${i}`, JOEY, { aangemaakt_op: '2026-10-09T11:30:00.000Z' })),
      pt_leads: [],
    }
    expect(await voegKlantToe(nepSupabase(db), link(JOEY), invoer, NU)).toEqual({ ok: false, reden: 'te_veel' })
    expect(db.pt_klanten).toHaveLength(MAX_KLANTEN_PER_UUR)

    // Dezelfde klanten, maar van twee uur geleden: dan mag het gewoon.
    for (const k of db.pt_klanten) k.aangemaakt_op = '2026-10-09T09:00:00.000Z'
    const uit = await voegKlantToe(nepSupabase(db), link(JOEY), invoer, NU)
    expect(uit.ok).toBe(true)
    expect(db.pt_klanten).toHaveLength(MAX_KLANTEN_PER_UUR + 1)
    expect(db.pt_klanten.at(-1)?.persoon_id).toBe(JOEY)
  })

  test('de grens is per trainer: klanten van een ander tellen niet mee', async () => {
    const db: Tabellen = {
      pt_klanten: Array.from({ length: MAX_KLANTEN_PER_UUR }, (_, i) => klantRij(`k-${i}`, SAM, { aangemaakt_op: '2026-10-09T11:30:00.000Z' })),
      pt_leads: [],
    }
    expect((await voegKlantToe(nepSupabase(db), link(JOEY), invoer, NU)).ok).toBe(true)
  })
})
