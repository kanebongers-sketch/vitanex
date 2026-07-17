// Test voor `vertaalFout`: de vertaling van een Postgres-foutcode naar een reden
// die de route naar een HTTP-status mapt. Klein maar belangrijk — een verkeerde
// vertaling laat een cliëntfout als serverstoring lezen (of andersom).
//
// De reden dat dit bestand bestaat: een route-audit vond dat een onleesbare id
// (`DELETE /notities/abc`) een 502 gaf i.p.v. 400, omdat de 22P02-tak ontbrak.
// Deze test bewaakt dat 'ie er blijft.

import { describe, expect, it } from 'vitest'
import { vertaalFout } from '@/lib/lifeos/notities/opslag'

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

  // De regressie die de route-audit vond: 'abc' als uuid geeft 22P02, en dat is
  // een cliëntfout (400), geen storing (502).
  it('vertaalt een onleesbare uuid (22P02) naar "ongeldig", niet "db"', () => {
    expect(vertaalFout(pgFout('22P02'))).toBe('ongeldig')
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
