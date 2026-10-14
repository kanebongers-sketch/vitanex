import { describe, expect, it } from 'vitest'
import { splitsNaam } from './naam'

describe('splitsNaam', () => {
  it('splitst een gewone naam op het laatste woord', () => {
    expect(splitsNaam('Sanne Jansen')).toEqual({ voornaam: 'Sanne', achternaam: 'Jansen' })
  })

  it('houdt tussenvoegsels bij de achternaam', () => {
    expect(splitsNaam('Jan van der Berg')).toEqual({ voornaam: 'Jan', achternaam: 'van der Berg' })
    expect(splitsNaam('Lotte de Vries')).toEqual({ voornaam: 'Lotte', achternaam: 'de Vries' })
    expect(splitsNaam("Tim van 't Hof")).toEqual({ voornaam: 'Tim', achternaam: "van 't Hof" })
    expect(splitsNaam('Eva ter Horst')).toEqual({ voornaam: 'Eva', achternaam: 'ter Horst' })
  })

  it('herkent tussenvoegsels ook met hoofdletter', () => {
    expect(splitsNaam('Daan Van Den Heuvel')).toEqual({ voornaam: 'Daan', achternaam: 'Van Den Heuvel' })
  })

  it('houdt meerdere voornamen samen', () => {
    expect(splitsNaam('Anna Maria van Gestel')).toEqual({ voornaam: 'Anna Maria', achternaam: 'van Gestel' })
    expect(splitsNaam('Jan Peter Smits')).toEqual({ voornaam: 'Jan Peter', achternaam: 'Smits' })
  })

  it('ziet een voornaam die op een tussenvoegsel lijkt niet als achternaam', () => {
    expect(splitsNaam('Van Morrison')).toEqual({ voornaam: 'Van', achternaam: 'Morrison' })
  })

  it('ruimt spaties op en geeft een lege achternaam bij een woord', () => {
    expect(splitsNaam('  Bram   de   Wit ')).toEqual({ voornaam: 'Bram', achternaam: 'de Wit' })
    expect(splitsNaam('Sanne')).toEqual({ voornaam: 'Sanne', achternaam: '' })
    expect(splitsNaam('   ')).toEqual({ voornaam: '', achternaam: '' })
  })

  it('valt terug op het laatste woord als er na het tussenvoegsel niets komt', () => {
    expect(splitsNaam('Jan van')).toEqual({ voornaam: 'Jan', achternaam: 'van' })
  })
})
