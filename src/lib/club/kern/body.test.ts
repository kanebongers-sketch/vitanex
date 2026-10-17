import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from './body'

const maak = (tekst: string) => new NextRequest('http://localhost/api/club/x', { method: 'POST', body: tekst })

describe('leesJsonOfTeGroot', () => {
  it('geeft de JSON terug', async () => {
    const uit = await leesJsonOfTeGroot(maak('{"a":1}'), 100)
    expect('body' in uit && uit.body).toEqual({ a: 1 })
  })
  it('weigert een te grote body met 413', async () => {
    const uit = await leesJsonOfTeGroot(maak(JSON.stringify({ a: 'x'.repeat(500) })), 100)
    expect('status' in uit && uit.status).toBe(413)
  })
  it('geeft null bij kapotte JSON', async () => {
    const uit = await leesJsonOfTeGroot(maak('{kapot'), 100)
    expect('body' in uit && uit.body).toBeNull()
  })
})
