import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leesDoelen, leesFavoriet, leesInstelling, leesLog, leesPer100, leesProduct } from './invoer'
import { BRONNEN, INSTELLING_KOLOMMEN, regelUitRij, instellingenUitRij, isDatum } from './model'
import { AI_TEKST_VERSIE } from './opslag'

// Systeemgrens van het dagboek: wat de ledenapp stuurt. Met waarden per 100
// gram rekent de server zelf; zonder geldt wat het lid invulde.

const per100 = { kcal: 57, eiwitG: 9.5, koolhydratenG: 4, vetG: 0.2, vezelsG: null }
const basis = { datum: '2026-10-29', maaltijd: 'ontbijt', naam: 'Magere kwark', bron: 'zoeken' }

describe('leesLog', () => {
  it('rekent de macro\'s zelf uit met per100 en gram, en negeert meegestuurde getallen', () => {
    const r = leesLog({ ...basis, gram: 250, per100, productSleutel: 'off:8718452000000', kcal: 99999 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.waarde).toMatchObject({ kcal: 143, eiwitG: 23.8, koolhydratenG: 10, vetG: 0.5, gram: 250, productSleutel: 'off:8718452000000' })
  })

  it('neemt handmatige waarden over binnen de grenzen', () => {
    const r = leesLog({ ...basis, bron: 'handmatig', naam: 'Soep', kcal: 210.4, eiwitG: 8, koolhydratenG: '20,5', vetG: 9 })
    expect(r.ok && r.waarde).toMatchObject({ kcal: 210, koolhydratenG: 20.5, per100: null, gram: null })
  })

  it('weigert foute dagen, maaltijden, namen, porties en waarden', () => {
    expect(leesLog({ ...basis, datum: '2026-02-30', kcal: 1 }).ok).toBe(false)
    expect(leesLog({ ...basis, maaltijd: 'brunch', kcal: 1 }).ok).toBe(false)
    expect(leesLog({ ...basis, naam: '  ', kcal: 1 }).ok).toBe(false)
    expect(leesLog({ ...basis, per100 }).ok).toBe(false)
    expect(leesLog({ ...basis, per100, gram: 9000 }).ok).toBe(false)
    expect(leesLog({ ...basis, kcal: -5 }).ok).toBe(false)
    expect(leesLog({ ...basis, per100: { kcal: 5000 }, gram: 100 }).ok).toBe(false)
    expect(leesLog(null).ok).toBe(false)
  })

  it('valt terug op handmatig en negeert een vreemde productsleutel', () => {
    const r = leesLog({ ...basis, bron: 'hack', productSleutel: 'eigen:../../x', kcal: 100 })
    expect(r.ok && r.waarde).toMatchObject({ bron: 'handmatig', productSleutel: null })
  })

  it('neemt een huishoudmaat alleen mee als die bestaat', () => {
    expect(leesLog({ ...basis, per100, gram: 70, maat: 'snee', aantal: 2 }).ok && leesLog({ ...basis, per100, gram: 70, maat: 'snee', aantal: 2 })).toMatchObject({ waarde: { maat: 'snee', aantal: 2 } })
    expect(leesLog({ ...basis, per100, gram: 70, maat: 'emmer', aantal: 2 })).toMatchObject({ waarde: { maat: null, aantal: null } })
  })
})

describe('producten, favorieten en doelen', () => {
  it('leest een eigen product en controleert de barcode', () => {
    expect(leesProduct({ naam: 'Mijn granola', per100: { kcal: 450, eiwitG: 10, koolhydratenG: 60, vetG: 18 }, barcode: '' }).ok).toBe(true)
    expect(leesProduct({ naam: 'X', per100: { kcal: 450 }, barcode: '12ab' }).ok).toBe(false)
    expect(leesProduct({ naam: 'X', per100: { kcal: 450, eiwitG: 120 } }).ok).toBe(false)
    expect(leesPer100({ kcal: '57,5' })?.kcal).toBe(57.5)
  })

  it('een favoriet heeft een geldige productsleutel', () => {
    expect(leesFavoriet({ productSleutel: 'off:8718452000000', naam: 'Kwark', per100 }).ok).toBe(true)
    expect(leesFavoriet({ productSleutel: 'gewoon', naam: 'Kwark', per100 }).ok).toBe(false)
  })

  it('eigen doelen met de grenzen van de database; null haalt weg', () => {
    expect(leesDoelen({ kcal: 2000, eiwitG: 150, koolhydratenG: 200, vetG: 70 }).ok).toBe(true)
    expect(leesDoelen({ kcal: 500, eiwitG: 150, koolhydratenG: 200, vetG: 70 }).ok).toBe(false)
    expect(leesDoelen(null)).toEqual({ ok: true, waarde: null })
  })

  it('instellingen: start en delen alleen met een echte ja of nee', () => {
    expect(leesInstelling({ soort: 'start', trainerZien: false })).toEqual({ ok: true, waarde: { soort: 'start', trainerZien: false } })
    expect(leesInstelling({ soort: 'trainer', trainerZien: 'ja' }).ok).toBe(false)
    expect(leesInstelling({ soort: 'iets' }).ok).toBe(false)
  })
})

describe('model', () => {
  it('leest een rij uit de database, en een kapotte rij niet', () => {
    const r = regelUitRij({ id: 'a', datum: '2026-10-29', maaltijd: 'diner', naam: 'Pasta', kcal: 650, eiwit_g: '30.5', koolhydraten_g: 80, vet_g: 20, bron: 'zoeken', per_100g: { kcal: 130 }, product_sleutel: 'off:12345678' })
    expect(r).toMatchObject({ kcal: 650, eiwitG: 30.5, per100: { kcal: 130, eiwitG: 0 }, productSleutel: 'off:12345678' })
    expect(regelUitRij({ id: 'a', datum: 'gisteren', maaltijd: 'diner', naam: 'x', kcal: 1 })).toBeNull()
  })

  it('zonder rij is het dagboek niet gestart en deelt het niets', () => {
    expect(instellingenUitRij(null)).toEqual({ gestartOp: null, trainerZien: false, trainerZienOp: null, eigenDoelen: null, aiToestemmingOp: null })
    expect(isDatum('2026-13-01')).toBe(false)
  })
})

describe('migratie 466 past bij de code', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', 'lifeos-migrations', '466_club_voeding_dagboek.sql'), 'utf8')

  it('heeft dezelfde maaltijden en bronnen als het model', () => {
    expect(sql).toContain("maaltijd in ('ontbijt', 'lunch', 'diner', 'tussendoor')")
    // De check in 466 kent 'spraak' nog (alleen toevoegen); elke bron van het model moet erin staan.
    const check = sql.match(/bron in \(([^)]*)\)/)?.[1] ?? ''
    for (const bron of BRONNEN) expect(check).toContain(`'${bron}'`)
    expect(BRONNEN).not.toContain('spraak')
  })

  it('zet RLS aan en geforceerd op elke nieuwe tabel en ruimt het dagboek op na de termijn', () => {
    expect(sql).toContain("array['club_voeding_instellingen', 'club_voeding_logs', 'club_voeding_producten', 'club_voeding_favorieten']")
    expect(sql).toContain('force row level security')
    expect(sql).toMatch(/delete from public\.club_voeding_logs where user_id = r\.user_id and datum </)
  })
})

describe('toestemming voor de AI-schatting', () => {
  it('leest geven en intrekken, en weigert iets anders', () => {
    expect(leesInstelling({ soort: 'ai', aan: true })).toEqual({ ok: true, waarde: { soort: 'ai', aan: true } })
    expect(leesInstelling({ soort: 'ai', aan: false })).toEqual({ ok: true, waarde: { soort: 'ai', aan: false } })
    expect(leesInstelling({ soort: 'ai', aan: 'ja' }).ok).toBe(false)
    expect(leesInstelling({ soort: 'ai' }).ok).toBe(false)
  })

  it('leest het tijdstip van de toestemming uit de rij', () => {
    expect(instellingenUitRij({ gestart_op: '2026-10-29T08:00:00Z', ai_toestemming_op: '2026-10-29T09:00:00Z' }).aiToestemmingOp).toBe('2026-10-29T09:00:00Z')
    expect(instellingenUitRij({ gestart_op: '2026-10-29T08:00:00Z', ai_toestemming_op: null }).aiToestemmingOp).toBeNull()
  })

  it('migratie 468 voegt de kolommen toe die de code leest', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase', 'lifeos-migrations', '468_club_voeding_ai_toestemming.sql'), 'utf8')
    expect(sql).toContain('add column if not exists ai_toestemming_op timestamptz')
    expect(sql).toContain('add column if not exists ai_tekst_versie text')
    expect(INSTELLING_KOLOMMEN).toContain('ai_toestemming_op')
    expect(AI_TEKST_VERSIE.length).toBeLessThanOrEqual(40)
  })
})
