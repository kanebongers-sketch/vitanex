import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALLES_IN_GEBRUIK, leesAllesTonen, somOfOnbekend } from './in-gebruik'
import { inGebruik, nogLeeg } from '@/components/club/shell/onderdelen'

// Verbergen tot gebruikt (ontwerp "Club in 10 minuten", regel 4).

describe('in gebruik', () => {
  it('"Alles tonen" staat alleen aan met een echte true', () => {
    expect(leesAllesTonen({ menu: { alles_tonen: true } })).toBe(true)
    expect(leesAllesTonen({ menu: { alles_tonen: 'ja' } })).toBe(false)
    expect(leesAllesTonen({ menu: null })).toBe(false)
    expect(leesAllesTonen(null)).toBe(false)
    expect(leesAllesTonen('kapot')).toBe(false)
  })

  it('een onbekend aantal maakt het geheel onbekend', () => {
    expect(somOfOnbekend([1, 2, 0])).toBe(3)
    expect(somOfOnbekend([1, null])).toBeNull()
    expect(somOfOnbekend([])).toBe(0)
  })

  it('kan de stand niet gelezen worden, dan staat alles er', () => {
    expect(nogLeeg(ALLES_IN_GEBRUIK)).toEqual([])
    expect(inGebruik('taken', { takenlijsten: null, prikbord: null, allesTonen: false })).toBe(true)
  })

  it('de lezer filtert elke telling op de sportschool en laat een fout nooit iets verbergen', () => {
    const bron = fs.readFileSync(path.join(__dirname, 'in-gebruik-opslag.ts'), 'utf8')
    const queries = bron.match(/\.from\('club_[a-z_]+'\)[^\n]*/g) ?? []
    expect(queries.length).toBeGreaterThanOrEqual(4)
    for (const q of queries) expect(q, q).toMatch(/\.eq\('(user_id|id)', (t\.)?userId\)/)
    expect(bron).toMatch(/return true/)
  })
})
