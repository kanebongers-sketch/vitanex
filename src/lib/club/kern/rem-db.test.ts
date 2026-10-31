import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { dbRemSleutel, isGeremd, nepRemTik, tikVenster, vensterSeconden, type DbRem } from './rem-db'

const GEHEIM = 'test-geheim-voor-remmen-1234'
const REM: DbRem = { soort: 'test-rem', max: 3, vensterMs: 60_000, bijStoring: 'geheugen' }
const MIGRATIE = fs.readFileSync(path.join(process.cwd(), 'supabase', 'lifeos-migrations', '483_club_remmen.sql'), 'utf8')

describe('sleutel van een rem', () => {
  it('is soort plus HMAC, zonder IP of e-mail in klare tekst', () => {
    const s = dbRemSleutel('lid-inloggen', 'jan@example.com', GEHEIM)
    expect(s).toMatch(/^lid-inloggen:[0-9a-f]{64}$/)
    expect(s).not.toContain('jan')
    expect(dbRemSleutel('lid-inloggen', '203.0.113.9', GEHEIM)).not.toContain('203')
  })

  it('past op de check in de migratie', () => {
    const check = /sleutel ~ '([^']+)'/.exec(MIGRATIE)?.[1]
    expect(check).toBeDefined()
    expect(new RegExp(check as string).test(dbRemSleutel('voeding-ai-dag', 'lid-1', GEHEIM))).toBe(true)
  })

  it('verschilt per soort en per waarde', () => {
    expect(dbRemSleutel('a', 'x', GEHEIM)).not.toBe(dbRemSleutel('b', 'x', GEHEIM))
    expect(dbRemSleutel('a', 'x', GEHEIM)).not.toBe(dbRemSleutel('a', 'y', GEHEIM))
  })

  it('weigert een ongeldige soort', () => {
    expect(() => dbRemSleutel('Met Spatie', 'x', GEHEIM)).toThrow()
    expect(() => dbRemSleutel('', 'x', GEHEIM)).toThrow()
  })
})

describe('venster (zelfde regel als club_rem_tik)', () => {
  it('telt tot het maximum en weigert daarna zonder op te hogen', () => {
    let stand = tikVenster(undefined, 0, 1000, 2)
    expect(stand.mag).toBe(true)
    stand = tikVenster(stand.stand, 10, 1000, 2)
    expect(stand.mag).toBe(true)
    const derde = tikVenster(stand.stand, 20, 1000, 2)
    expect(derde.mag).toBe(false)
    expect(derde.stand.aantal).toBe(2)
  })

  it('begint opnieuw als het venster voorbij is', () => {
    const vol = { aantal: 5, vensterTot: 100 }
    expect(tikVenster(vol, 100, 1000, 5)).toEqual({ stand: { aantal: 1, vensterTot: 1100 }, mag: true })
  })

  it('max 0 is altijd dicht', () => {
    expect(tikVenster(undefined, 0, 1000, 0).mag).toBe(false)
  })

  it('venster in seconden is minstens 1', () => {
    expect(vensterSeconden(10)).toBe(1)
    expect(vensterSeconden(60_000)).toBe(60)
    expect(vensterSeconden(1500)).toBe(2)
  })
})

describe('isGeremd', () => {
  it('telt per waarde in de database', async () => {
    const tik = nepRemTik(() => 0)
    for (let i = 0; i < 3; i++) expect(await isGeremd(REM, '1.2.3.4', { tik })).toBe(false)
    expect(await isGeremd(REM, '1.2.3.4', { tik })).toBe(true)
    expect(await isGeremd(REM, '5.6.7.8', { tik })).toBe(false)
  })

  it('stuurt alleen de gehashte sleutel, venster in seconden en max', async () => {
    const tik = vi.fn(async () => true)
    await isGeremd(REM, 'jan@example.com', { tik })
    const [sleutel, seconden, max] = tik.mock.calls[0] as unknown as [string, number, number]
    expect(sleutel).toMatch(/^test-rem:[0-9a-f]{64}$/)
    expect(seconden).toBe(60)
    expect(max).toBe(3)
  })

  it('valt bij een storing terug op het geheugen (inloggen blijft geremd en bruikbaar)', async () => {
    const geheugen = vi.fn(() => false)
    expect(await isGeremd(REM, 'x', { tik: async () => null, geheugen })).toBe(false)
    expect(geheugen).toHaveBeenCalledTimes(1)
    const dicht = vi.fn(() => true)
    expect(await isGeremd(REM, 'x', { tik: async () => { throw new Error('weg') }, geheugen: dicht })).toBe(true)
  })

  it('gaat bij een storing dicht als de rem dat vraagt (AI-kosten)', async () => {
    const geheugen = vi.fn(() => false)
    expect(await isGeremd({ ...REM, bijStoring: 'dicht' }, 'x', { tik: async () => null, geheugen })).toBe(true)
    expect(geheugen).not.toHaveBeenCalled()
  })
})

describe('migratie 483', () => {
  it('alleen de server mag de functie aanroepen', () => {
    expect(MIGRATIE).toMatch(/revoke all on function public\.club_rem_tik\(text, integer, integer\) from public, anon, authenticated/)
    expect(MIGRATIE).toMatch(/grant execute on function public\.club_rem_tik\(text, integer, integer\) to service_role/)
    expect(MIGRATIE).toMatch(/security definer/)
    expect(MIGRATIE).toMatch(/enable row level security/)
  })

  it('ruimt oude rijen op met pg_cron', () => {
    expect(MIGRATIE).toMatch(/cron\.schedule\('club_remmen_opruimen'/)
  })

  it('verwijdert niets bestaands (alleen toevoegen)', () => {
    expect(MIGRATIE).not.toMatch(/\bdrop\s+(table|column|function)\b/i)
  })
})
