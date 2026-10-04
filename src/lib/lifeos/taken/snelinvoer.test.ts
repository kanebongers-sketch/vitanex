import { describe, expect, test } from 'vitest'
import { leesSnelleTaak } from './snelinvoer'

const WOENSDAG = new Date(2026, 8, 30) // wo 30 sep 2026

describe('leesSnelleTaak', () => {
  test('dag + categorie eruit, rest is de titel', () => {
    expect(leesSnelleTaak('morgen Ruben bellen #werk', WOENSDAG)).toEqual({ titel: 'Ruben bellen', datum: '2026-10-01', deadline: null, categorie: 'Werk' })
  })

  test('geen dag of categorie → ooit, hele tekst is de titel', () => {
    expect(leesSnelleTaak('offerte sturen', WOENSDAG)).toEqual({ titel: 'Offerte sturen', datum: null, deadline: null, categorie: null })
  })

  test('vandaag, overmorgen, volgende week', () => {
    expect(leesSnelleTaak('vandaag btw', WOENSDAG).datum).toBe('2026-09-30')
    expect(leesSnelleTaak('btw overmorgen', WOENSDAG).datum).toBe('2026-10-02')
    expect(leesSnelleTaak('evaluatie volgende week', WOENSDAG).datum).toBe('2026-10-05')
  })

  test('weekdag = eerstvolgende keer, vandaag inbegrepen', () => {
    expect(leesSnelleTaak('vrijdag social media post', WOENSDAG).datum).toBe('2026-10-02')
    expect(leesSnelleTaak('woensdag x', WOENSDAG).datum).toBe('2026-09-30')
    expect(leesSnelleTaak('maandag planning', WOENSDAG).datum).toBe('2026-10-05')
    expect(leesSnelleTaak('za boodschappen', WOENSDAG).datum).toBe('2026-10-03')
  })

  test('datums: 3/10, 3-10, 3 okt; voorbij → volgend jaar', () => {
    expect(leesSnelleTaak('3/10 factuur', WOENSDAG).datum).toBe('2026-10-03')
    expect(leesSnelleTaak('factuur 3-10', WOENSDAG).datum).toBe('2026-10-03')
    expect(leesSnelleTaak('verjaardag Rick 12 okt', WOENSDAG).datum).toBe('2026-10-12')
    expect(leesSnelleTaak('apk 1/3', WOENSDAG).datum).toBe('2027-03-01')
  })

  test('woorden die op een dag lijken maar geen los woord zijn tellen niet', () => {
    expect(leesSnelleTaak('domeinnaam verlengen', WOENSDAG).datum).toBeNull()
    expect(leesSnelleTaak('marketing plan', WOENSDAG).datum).toBeNull()
    expect(leesSnelleTaak('ma bellen', WOENSDAG)).toEqual({ titel: 'Ma bellen', datum: null, deadline: null, categorie: null })
    expect(leesSnelleTaak('zo snel mogelijk offerte', WOENSDAG).datum).toBeNull()
  })

  test('alleen een dag, zonder taak → dan is dat de taak zelf', () => {
    expect(leesSnelleTaak('morgen', WOENSDAG)).toEqual({ titel: 'morgen', datum: null, deadline: null, categorie: null })
  })

  test('deadline: "vóór vr" zet de deadline, niet de geplande dag', () => {
    expect(leesSnelleTaak('offerte sturen vóór vr', WOENSDAG)).toEqual({
      titel: 'Offerte sturen', datum: null, deadline: '2026-10-02', categorie: null,
    })
    expect(leesSnelleTaak('btw uiterlijk 3 okt', WOENSDAG).deadline).toBe('2026-10-03')
    expect(leesSnelleTaak('deadline morgen rapport', WOENSDAG).deadline).toBe('2026-10-01')
  })

  test('geplande dag én deadline in één regel', () => {
    expect(leesSnelleTaak('morgen offerte vóór vrijdag #werk', WOENSDAG)).toEqual({
      titel: 'Offerte', datum: '2026-10-01', deadline: '2026-10-02', categorie: 'Werk',
    })
  })

  test('"volgende week vrijdag" is die vrijdag, en "vrijdag" blijft niet in de titel', () => {
    expect(leesSnelleTaak('volgende week vrijdag evaluatie', WOENSDAG)).toEqual({
      titel: 'Evaluatie', datum: '2026-10-09', deadline: null, categorie: null,
    })
  })

  test('"voor" zonder dag erachter blijft gewoon in de titel', () => {
    expect(leesSnelleTaak('cadeau voor Sanne', WOENSDAG)).toEqual({
      titel: 'Cadeau voor Sanne', datum: null, deadline: null, categorie: null,
    })
  })
})
