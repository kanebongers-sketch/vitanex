import { describe, expect, test } from 'vitest'
import { botsingen, locatieVan, reistijd, rust, type BewaakAfspraak } from './bewaker'
import type { AgendaCategorie } from './categorie'

function a(titel: string, startIso: string, eindIso: string, categorie: AgendaCategorie = 'pt_klant', locatie: string | null = null): BewaakAfspraak {
  return { id: titel + startIso, titel, startOp: new Date(startIso), eindOp: new Date(eindIso), heleDag: false, locatie, categorie }
}

describe('botsingen', () => {
  test('twee afspraken tegelijk (echte agenda 29 sep)', () => {
    const uit = botsingen([
      a('Coachgesprek PT - Kane (Brandon)', '2026-09-29T10:00:00Z', '2026-09-29T10:30:00Z', 'pt_team'),
      a('Coachgesprek PT - Kane (Peter)', '2026-09-29T10:00:00Z', '2026-09-29T10:30:00Z', 'pt_team'),
    ])
    expect(uit).toHaveLength(1)
    expect(uit[0].tekst).toContain('overlappen')
    expect(uit[0].tekst).toContain('12:00')
  })

  test('een lang werkblok met afspraken erin is geen botsing', () => {
    expect(
      botsingen([
        a('Werken in Budel', '2026-09-22T16:00:00Z', '2026-09-22T19:30:00Z', 'budel_team'),
        a('PT Elize Van Den Akker Budel', '2026-09-22T18:30:00Z', '2026-09-22T19:30:00Z'),
      ]),
    ).toEqual([])
  })

  test('aansluitend is geen overlap', () => {
    expect(
      botsingen([a('Joris Bax PT', '2026-09-23T15:30:00Z', '2026-09-23T16:30:00Z'), a('Nicolle PT', '2026-09-23T16:30:00Z', '2026-09-23T17:30:00Z')]),
    ).toEqual([])
  })
})

describe('reistijd', () => {
  test('andere locatie zonder tijd ertussen', () => {
    const uit = reistijd([
      a('Joris Bax PT Bergeijk', '2026-10-01T15:30:00Z', '2026-10-01T16:30:00Z'),
      a('Elize PT Budel', '2026-10-01T16:40:00Z', '2026-10-01T17:40:00Z'),
    ])
    expect(uit).toHaveLength(1)
    expect(uit[0].tekst).toContain('10 min reistijd van Bergeijk')
    expect(uit[0].tekst).toContain('naar Budel')
  })

  test('zelfde locatie, of genoeg tijd, of onbekende locatie → niets', () => {
    expect(reistijd([a('X PT Budel', '2026-10-01T15:00:00Z', '2026-10-01T16:00:00Z'), a('Y PT Budel', '2026-10-01T16:00:00Z', '2026-10-01T17:00:00Z')])).toEqual([])
    expect(reistijd([a('X PT Budel', '2026-10-01T15:00:00Z', '2026-10-01T16:00:00Z'), a('Y PT Someren', '2026-10-01T16:30:00Z', '2026-10-01T17:30:00Z')])).toEqual([])
    expect(reistijd([a('X PT', '2026-10-01T15:00:00Z', '2026-10-01T16:00:00Z'), a('Y PT Someren', '2026-10-01T16:00:00Z', '2026-10-01T17:00:00Z')])).toEqual([])
  })

  test('locatie uit het locatieveld', () => {
    expect(locatieVan(a('Kevin PT', '2026-10-01T15:00:00Z', '2026-10-01T16:00:00Z', 'pt_klant', 'Fit Factory Someren'))).toBe('Someren')
  })
})

describe('rust', () => {
  const dagen = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']
  const laat = (dag: string, cat: AgendaCategorie = 'pt_klant') => a('PT', `${dag}T18:00:00Z`, `${dag}T19:00:00Z`, cat) // 20:00–21:00 NL

  test('vier avonden op rij tot laat → melding met dagen', () => {
    const uit = rust(dagen.slice(0, 4).map((d) => laat(d)), dagen)
    expect(uit.map((m) => m.tekst)).toEqual(['4 avonden op rij werk tot 20:30 of later (ma t/m do) — plan ergens een vrije avond.'])
  })

  test('drie op rij → niets; persoonlijke avond telt niet als werk', () => {
    expect(rust(dagen.slice(0, 3).map((d) => laat(d)), dagen)).toEqual([])
    const metFeest = [laat(dagen[0]), laat(dagen[1]), laat(dagen[2], 'persoonlijk'), laat(dagen[3])]
    expect(rust(metFeest, dagen)).toEqual([])
  })

  test('geen enkele vrije avond in 7 dagen', () => {
    const vol = dagen.map((d) => a('Werk', `${d}T16:30:00Z`, `${d}T17:30:00Z`, 'budel_team')) // tot 19:30 NL
    expect(rust(vol, dagen).map((m) => m.tekst)).toEqual(['De komende 7 dagen heb je geen enkele vrije avond — houd er één vrij.'])
  })
})
