// Test voor `vertaalFout`: de vertaling van een Postgres-foutcode naar een reden
// die de route naar een HTTP-status mapt. Klein maar belangrijk — een verkeerde
// vertaling laat een cliëntfout als serverstoring lezen (of andersom). Een
// onleesbare id (`DELETE /crm/personen/abc`) MOET 400 geven, niet 502.

import { describe, expect, it } from 'vitest'
import { vertaalFout } from '@/lib/lifeos/crm/fout'

function pgFout(code: string): { code: string } {
  return { code }
}

describe('vertaalFout', () => {
  it('vertaalt een unieke-index-schending naar "bezet" (→ 409)', () => {
    expect(vertaalFout(pgFout('23505'))).toBe('bezet')
  })

  it('vertaalt een check-constraint naar "ongeldig" (→ 400)', () => {
    expect(vertaalFout(pgFout('23514'))).toBe('ongeldig')
  })

  it('vertaalt een foreign-key-schending naar "ongeldig" (→ 400)', () => {
    // Een historie-regel voor een persoon-id dat niet bestaat is een cliëntfout.
    expect(vertaalFout(pgFout('23503'))).toBe('ongeldig')
  })

  it('vertaalt een onleesbare uuid (22P02) naar "ongeldig", niet "db"', () => {
    expect(vertaalFout(pgFout('22P02'))).toBe('ongeldig')
  })

  it('vertaalt een kapot tijd-formaat (22007) naar "ongeldig", niet "db"', () => {
    // `laatste_contact_op` is de enige vrije tijd-string die de client stuurt.
    expect(vertaalFout(pgFout('22007'))).toBe('ongeldig')
  })

  it('valt terug op "db" (→ 502) bij een onbekende code', () => {
    expect(vertaalFout(pgFout('08006'))).toBe('db')
  })

  it('valt terug op "db" als er geen code is', () => {
    expect(vertaalFout(null)).toBe('db')
    expect(vertaalFout({})).toBe('db')
    expect(vertaalFout({ code: 42 })).toBe('db')
    expect(vertaalFout('een string')).toBe('db')
  })
})
