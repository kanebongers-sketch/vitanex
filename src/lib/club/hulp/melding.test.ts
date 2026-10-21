import { describe, expect, it } from 'vitest'
import { leesAfhandeling, leesMelding, leesPagina, meldingUitRij, schoneTekst, sorteerMeldingen, telPerStatus, type Melding } from './melding'

const goed = { soort: 'probleem', onderwerp: 'Rooster laadt niet', beschrijving: 'Na het kiezen van Budel blijft het rooster leeg.' }

describe('leesMelding', () => {
  it('een goede melding, met en zonder pagina', () => {
    expect(leesMelding(goed)).toEqual({ ok: true, waarde: { ...goed, pagina: null } })
    const r = leesMelding({ ...goed, pagina: 'https://aiyourgym.com/club/rooster?v=budel#x' })
    expect(r.ok && r.waarde.pagina).toBe('/club/rooster')
  })
  it('ruimt spaties en stuurtekens op', () => {
    const r = leesMelding({ ...goed, onderwerp: '  Rooster \n  laadt\tniet  ', beschrijving: 'Regel een\r\nregel twee\u0007 en nog wat' })
    expect(r.ok && r.waarde.onderwerp).toBe('Rooster laadt niet')
    expect(r.ok && r.waarde.beschrijving).toBe('Regel een\nregel twee en nog wat')
  })
  it('fouten per veld', () => {
    const r = leesMelding({ soort: 'klacht', onderwerp: 'a', beschrijving: 'kort', pagina: 'https://evil.nl/elders' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.fouten).sort()).toEqual(['beschrijving', 'onderwerp', 'pagina', 'soort'])
    expect(leesMelding(null).ok).toBe(false)
    expect(leesMelding({ ...goed, beschrijving: 'x'.repeat(4001) }).ok).toBe(false)
  })
})

describe('leesPagina', () => {
  it('alleen paden binnen Club', () => {
    expect(leesPagina('/club')).toBe('/club')
    expect(leesPagina('/club/leden/importeren')).toBe('/club/leden/importeren')
    expect(leesPagina('/mijn')).toBeNull()
    expect(leesPagina('/club/../api')).toBeNull()
    expect(leesPagina('javascript:alert(1)')).toBeNull()
    expect(leesPagina('')).toBeNull()
    expect(leesPagina(42)).toBeNull()
  })
})

describe('leesAfhandeling', () => {
  it('status met of zonder antwoord', () => {
    expect(leesAfhandeling({ status: 'bezig' })).toEqual({ ok: true, waarde: { status: 'bezig', antwoord: undefined } })
    expect(leesAfhandeling({ status: 'klaar', antwoord: ' Opgelost. ' })).toEqual({ ok: true, waarde: { status: 'klaar', antwoord: 'Opgelost.' } })
    expect(leesAfhandeling({ status: 'klaar', antwoord: '  ' })).toEqual({ ok: true, waarde: { status: 'klaar', antwoord: null } })
  })
  it('foute status of te lang antwoord', () => {
    expect(leesAfhandeling({ status: 'weg' }).ok).toBe(false)
    expect(leesAfhandeling({ status: 'open', antwoord: 'x'.repeat(4001) }).ok).toBe(false)
  })
})

describe('meldingUitRij', () => {
  const rij = { id: 'a', user_id: 'u', soort: 'vraag', onderwerp: 'O', beschrijving: 'B', pagina: null, melder_id: null, melder_naam: 'Kane', melder_rol: 'beheerder', status: 'open', antwoord: null, beantwoord_op: null, aangemaakt_op: '2026-10-17', bijgewerkt_op: '2026-10-17' }
  it('leest een rij', () => {
    expect(meldingUitRij(rij)).toMatchObject({ id: 'a', userId: 'u', soort: 'vraag', melderRol: 'beheerder', status: 'open', melderId: null })
  })
  it('weigert kapotte rijen', () => {
    expect(meldingUitRij(null)).toBeNull()
    expect(meldingUitRij({ ...rij, status: 'raar' })).toBeNull()
    expect(meldingUitRij({ ...rij, soort: 'klacht' })).toBeNull()
  })
})

describe('sorteren en tellen', () => {
  const m = (id: string, status: Melding['status'], op: string): Melding => ({
    id, userId: 'u', soort: 'vraag', onderwerp: id, beschrijving: '', pagina: null, melderId: null, melderNaam: '', melderRol: 'beheerder', status, antwoord: null, beantwoordOp: null, aangemaaktOp: op, bijgewerktOp: op,
  })
  const lijst = [m('a', 'klaar', '2026-10-03'), m('b', 'open', '2026-10-01'), m('c', 'open', '2026-10-02'), m('d', 'bezig', '2026-10-04')]
  it('open eerst, nieuwste eerst', () => {
    expect(sorteerMeldingen(lijst).map((x) => x.id)).toEqual(['c', 'b', 'd', 'a'])
    expect(lijst[0].id).toBe('a')
  })
  it('telt per status', () => {
    expect(telPerStatus(lijst)).toEqual({ open: 2, bezig: 1, klaar: 1 })
  })
  it('schoneTekst', () => {
    expect(schoneTekst(undefined)).toBe('')
  })
})
