import { describe, expect, it } from 'vitest'
import { isVraagId, leesVerplaatsing, leesVraagInvoer } from './invoer'
import { kernDef } from './kern'
import { vraagUitRij } from './rij'

describe('leesVraagInvoer', () => {
  it('leest een eigen keuzevraag met schone, unieke opties', () => {
    const u = leesVraagInvoer({ vraag: '  Hoe heb je   ons gevonden? ', soort: 'keuze', opties: ['Google', ' google ', '', 'Instagram'], sectie: 'Kennismaking', verplicht: true }, null)
    expect(u).toEqual({
      ok: true,
      waarde: { vraag: 'Hoe heb je ons gevonden?', uitleg: null, soort: 'keuze', opties: ['Google', 'Instagram'], verplicht: true, gezondheid: false, sectie: 'Kennismaking', actief: true },
    })
  })

  it('weigert een korte vraag, geen sectie, een onbekende soort of te weinig opties', () => {
    expect(leesVraagInvoer({ vraag: 'Hi', soort: 'kort', sectie: 'X' }, null).ok).toBe(false)
    expect(leesVraagInvoer({ vraag: 'Een vraag', soort: 'kort', sectie: ' ' }, null).ok).toBe(false)
    expect(leesVraagInvoer({ vraag: 'Een vraag', soort: 'foto', sectie: 'X' }, null).ok).toBe(false)
    expect(leesVraagInvoer({ vraag: 'Een vraag', soort: 'meerkeuze', opties: ['a'], sectie: 'X' }, null).ok).toBe(false)
    expect(leesVraagInvoer(null, null).ok).toBe(false)
  })

  it('kort een te lange vraag in en laat opties weg bij een open vraag', () => {
    const u = leesVraagInvoer({ vraag: 'x'.repeat(300), soort: 'lang', opties: ['a', 'b'], sectie: 'X' }, null)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde.vraag).toHaveLength(160)
    expect(u.waarde.opties).toEqual([])
  })

  it('houdt bij een kernvraag soort, opties en gezondheid vast', () => {
    const u = leesVraagInvoer({ vraag: 'Welke medicijnen gebruik je?', soort: 'keuze', gezondheid: false, verplicht: true, sectie: 'Gezondheid', actief: false }, kernDef('medicatie'))
    expect(u.ok && u.waarde).toMatchObject({ soort: 'kort', gezondheid: true, verplicht: false, actief: false })
    const vast = leesVraagInvoer({ vraag: 'Je doelen', sectie: 'Doelen', actief: false }, kernDef('doelen'))
    expect(vast.ok && vast.waarde.actief).toBe(true)
  })
})

describe('leesVerplaatsing en ids', () => {
  it('leest een vraag of sectie met een richting', () => {
    expect(leesVerplaatsing({ wat: 'vraag', id: 'kern:doelen', richting: 'omlaag' })).toEqual({ ok: true, waarde: { wat: 'vraag', id: 'kern:doelen', richting: 'omlaag' } })
    expect(leesVerplaatsing({ wat: 'sectie', sectie: 'Leefstijl', richting: 'omhoog' }).ok).toBe(true)
    expect(leesVerplaatsing({ wat: 'vraag', id: 'x', richting: 'omhoog' }).ok).toBe(false)
    expect(leesVerplaatsing({ wat: 'sectie', sectie: 'X', richting: 'links' }).ok).toBe(false)
  })

  it('kent uuids en kern-ids', () => {
    expect(isVraagId('11111111-1111-4111-8111-111111111111')).toBe(true)
    expect(isVraagId('kern:parq_hart')).toBe(true)
    expect(isVraagId('kern:x')).toBe(false)
  })
})

describe('vraagUitRij', () => {
  it('leest een rij en laat een kapotte rij vallen', () => {
    expect(vraagUitRij({ id: 'a', sleutel: 'onbekend', vraag: 'Vraag?', soort: 'keuze', opties: ['x', 3, 'y'], sectie: '', volgorde: 5 })).toMatchObject({
      sleutel: null, opties: ['x', 'y'], sectie: 'Overig', actief: true,
    })
    expect(vraagUitRij({ id: 'a', vraag: 'Vraag?', soort: 'foto' })).toBeNull()
    expect(vraagUitRij('x')).toBeNull()
  })
})
