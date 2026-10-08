import { describe, expect, test } from 'vitest'
import { checkinTekst, huidigeWeek, leesCheckin, leesCheckinInvoer, momentLabel, weekLabel, weekVan } from './checkin'

describe('weekVan', () => {
  test('elke dag valt in de week van zijn maandag', () => {
    expect(weekVan('2026-10-05')).toBe('2026-10-05') // maandag zelf
    expect(weekVan('2026-10-08')).toBe('2026-10-05') // woensdag
    expect(weekVan('2026-10-11')).toBe('2026-10-05') // zondag hoort bij de week ervoor
    expect(weekVan('2026-10-12')).toBe('2026-10-12')
  })
  test('over maand- en jaargrens', () => {
    expect(weekVan('2026-11-01')).toBe('2026-10-26')
    expect(weekVan('2027-01-01')).toBe('2026-12-28')
  })
  test('huidigeWeek rekent in Nederlandse tijd', () => {
    // Zondag 23:30 UTC = maandag 01:30 in Amsterdam (zomertijd voorbij: UTC+1).
    expect(huidigeWeek(new Date('2026-11-01T23:30:00Z'))).toBe('2026-11-02')
    expect(huidigeWeek(new Date('2026-11-01T22:30:00Z'))).toBe('2026-10-26')
  })
})

describe('leesCheckinInvoer', () => {
  test('geen object of helemaal leeg → fout', () => {
    expect(leesCheckinInvoer(null).ok).toBe(false)
    expect(leesCheckinInvoer([]).ok).toBe(false)
    const leeg = leesCheckinInvoer({ energie: null, gewonnen: '   ', lastig: '' })
    expect(leeg).toEqual({ ok: false, fout: 'Vul minstens je energie of één vraag in.' })
  })
  test('energie buiten 1–5 → fout, geen gok', () => {
    expect(leesCheckinInvoer({ energie: 7 }).ok).toBe(false)
    expect(leesCheckinInvoer({ energie: '4' }).ok).toBe(false)
    expect(leesCheckinInvoer({ energie: 2.5 }).ok).toBe(false)
  })
  test('alleen energie is genoeg; tekst wordt getrimd en spaties samengevouwen', () => {
    const r = leesCheckinInvoer({ energie: 4, bespreken: '  Klant   Sanne\n\n\n\nstopt  ' })
    expect(r).toEqual({ ok: true, waarde: { energie: 4, gewonnen: null, lastig: null, bespreken: 'Klant Sanne\n\nstopt', focus: null } })
  })
  test('te lange tekst wordt ingekort per veld', () => {
    const r = leesCheckinInvoer({ gewonnen: 'a'.repeat(900), focus: 'b'.repeat(900) })
    expect(r.ok && r.waarde.gewonnen?.length).toBe(600)
    expect(r.ok && r.waarde.focus?.length).toBe(300)
  })
  test('onbekende velden en een week uit de browser worden genegeerd', () => {
    const r = leesCheckinInvoer({ energie: 3, week: '2020-01-06', userId: 'x' })
    expect(r.ok && Object.keys(r.waarde).sort()).toEqual(['bespreken', 'energie', 'focus', 'gewonnen', 'lastig'])
  })
})

describe('leesCheckin (JSON)', () => {
  const goed = { week: '2026-10-05', bijgewerktOp: '2026-10-08T12:32:00.000Z', energie: 5, gewonnen: 'Twee intakes', lastig: null, bespreken: null, focus: 'Bellen' }
  test('komt heel door', () => {
    expect(leesCheckin(goed)).toEqual(goed)
  })
  test('kapot → null', () => {
    expect(leesCheckin({ ...goed, week: 'maandag' })).toBeNull()
    expect(leesCheckin({ ...goed, energie: 9 })).toBeNull()
    expect(leesCheckin({ ...goed, bijgewerktOp: undefined })).toBeNull()
    expect(leesCheckin('x')).toBeNull()
  })
  test('tekst voor het verslag: alleen ingevulde vragen + wanneer', () => {
    expect(checkinTekst(leesCheckin(goed)!)).toBe(
      'Energie: 5/5 (Top)\nGing goed: Twee intakes\nFocus volgende week: Bellen\nIngevuld do 8 okt om 14:32',
    )
  })
})

describe('labels', () => {
  test('week en moment', () => {
    expect(weekLabel('2026-10-05')).toBe('week van 5 okt')
    expect(momentLabel('2026-10-08T12:32:00.000Z')).toBe('do 8 okt om 14:32')
  })
})
