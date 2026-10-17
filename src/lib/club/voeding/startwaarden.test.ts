import { describe, expect, it } from 'vitest'
import type { MeetPunt } from '@/lib/club/voortgang/tijdlijn'
import { controleerInvoer } from './rekenhulp'
import { laatsteMeting, startConcept, startVelden, veldenNaarInvoer } from './startwaarden'

const punten: MeetPunt[] = [
  { id: 'a', bron: 'intake', datum: '2026-06-01', waarden: { gewicht_kg: 92, lengte_cm: 182 } },
  { id: 'b', bron: 'meting', datum: '2026-09-15', waarden: { gewicht_kg: 88.5 } },
]

describe('startwaarden', () => {
  it('pakt de nieuwste meting per meetwaarde', () => {
    expect(laatsteMeting(punten, 'gewicht_kg')).toBe(88.5)
    expect(laatsteMeting(punten, 'lengte_cm')).toBe(182)
    expect(laatsteMeting([], 'lengte_cm')).toBeNull()
  })

  it('vult zonder plan in met metingen, leeftijd en geslacht', () => {
    const v = startVelden(undefined, { geslacht: 'vrouw', geboortedatum: '1990-01-01' }, punten, '2026-10-17')
    expect(v).toMatchObject({ gewicht: '88.5', lengte: '182', leeftijd: '36', geslacht: 'vrouw', doel: 'onderhoud' })
    expect(controleerInvoer(veldenNaarInvoer(v))).toEqual([])
  })

  it('laat geslacht leeg als het onbekend is, en de rekenhulp meldt dat', () => {
    const v = startVelden(undefined, { geslacht: null, geboortedatum: null }, [], '2026-10-17')
    expect(v.geslacht).toBe('')
    expect(controleerInvoer(veldenNaarInvoer(v))).toContain('Kies een geslacht')
  })

  it('leest een komma als decimaalteken', () => {
    const v = startVelden(undefined, { geslacht: 'man', geboortedatum: '1990-01-01' }, punten, '2026-10-17')
    expect(veldenNaarInvoer({ ...v, gewicht: '80,5' }).gewichtKg).toBe(80.5)
  })

  it('geeft zonder plan een redelijk leeg concept', () => {
    expect(startConcept(undefined)).toMatchObject({ kcal: 2000, adviezen: [], sjabloonId: null })
  })
})
