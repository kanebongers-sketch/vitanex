import { describe, it, expect } from 'vitest'
import {
  leesNieuwGeheugen,
  leesGeheugenId,
  geheugenVanRij,
  isGeheugenSoort,
  MAX_INHOUD_LENGTE,
} from './geheugen'

const ID = '11111111-1111-4111-8111-111111111111'

describe('leesNieuwGeheugen — de systeemgrens', () => {
  it('leest een geldig feit en trimt de inhoud', () => {
    // Arrange
    const body = { soort: 'voorkeur', inhoud: "  Ik train liever 's ochtends  " }

    // Act
    const uitkomst = leesNieuwGeheugen(body)

    // Assert
    expect(uitkomst).toEqual({
      ok: true,
      waarde: { soort: 'voorkeur', inhoud: "Ik train liever 's ochtends" },
    })
  })

  it('weigert een soort buiten de allowlist', () => {
    // Arrange — een typfout die in de database een 23514 zou worden.
    const body = { soort: 'voorkeuren', inhoud: 'iets' }

    // Act
    const uitkomst = leesNieuwGeheugen(body)

    // Assert — hier een leesbare zin, niet "23514" uit Postgres.
    expect(uitkomst.ok).toBe(false)
    if (uitkomst.ok) throw new Error('hoort te falen')
    expect(uitkomst.fout).toContain('voorkeur, feit, doel')
  })

  it('weigert witruimte als inhoud', () => {
    // Arrange — ziet er gevuld uit, is het niet.
    // Act
    const uitkomst = leesNieuwGeheugen({ soort: 'feit', inhoud: '   \n  ' })

    // Assert
    expect(uitkomst).toEqual({ ok: false, fout: 'Een leeg geheugen is geen geheugen.' })
  })

  it('weigert inhoud boven het plafond', () => {
    // Arrange — elk geheugen gaat bij ELKE vraag mee in de prompt; zonder plafond
    // is één geplakte e-mail genoeg om de context te verdrinken.
    const body = { soort: 'feit', inhoud: 'a'.repeat(MAX_INHOUD_LENGTE + 1) }

    // Act
    const uitkomst = leesNieuwGeheugen(body)

    // Assert
    expect(uitkomst.ok).toBe(false)
    if (uitkomst.ok) throw new Error('hoort te falen')
    expect(uitkomst.fout).toContain(String(MAX_INHOUD_LENGTE))
  })

  it('laat inhoud precies op het plafond door', () => {
    // Arrange — de grens is inclusief; anders wijkt hij af van de check-constraint.
    // Act
    const uitkomst = leesNieuwGeheugen({ soort: 'doel', inhoud: 'a'.repeat(MAX_INHOUD_LENGTE) })

    // Assert
    expect(uitkomst.ok).toBe(true)
  })

  it('negeert een meegestuurde bron', () => {
    // Arrange — een client die zichzelf een herkomst probeert te geven.
    const body = { soort: 'feit', inhoud: 'Ik woon in Eersel', bron: 'gesprek met Vita' }

    // Act
    const uitkomst = leesNieuwGeheugen(body)

    // Assert — `bron` zet de route server-side. Zou de client 'm mogen meesturen,
    // dan is de herkomst geen bewijs meer maar een bewering.
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) throw new Error('hoort te lukken')
    expect(uitkomst.waarde).not.toHaveProperty('bron')
  })

  it.each([[null], [undefined], ['tekst'], [[]], [42]])('weigert %s als body', (body) => {
    // Act
    const uitkomst = leesNieuwGeheugen(body)

    // Assert
    expect(uitkomst).toEqual({ ok: false, fout: 'Ongeldige invoer.' })
  })
})

describe('leesGeheugenId', () => {
  it('accepteert een uuid', () => {
    expect(leesGeheugenId(ID)).toEqual({ ok: true, waarde: ID })
  })

  it.each([['1'], [''], ['../../etc'], [null]])('weigert %s', (v) => {
    expect(leesGeheugenId(v).ok).toBe(false)
  })
})

describe('geheugenVanRij — de databasegrens', () => {
  it('leest een complete rij', () => {
    // Arrange
    const rij = {
      id: ID,
      soort: 'feit',
      inhoud: 'Ik woon in Eersel',
      bron: 'handmatig',
      aangemaakt_op: '2026-07-15T09:00:00.000Z',
    }

    // Act & Assert
    expect(geheugenVanRij(rij)).toEqual({
      id: ID,
      soort: 'feit',
      inhoud: 'Ik woon in Eersel',
      bron: 'handmatig',
      aangemaaktOp: '2026-07-15T09:00:00.000Z',
    })
  })

  it('leest een lege bron als onbekend', () => {
    // Arrange — 040: null = onbekend → behandel als onbevestigd.
    const rij = { id: ID, soort: 'doel', inhoud: 'x', bron: null, aangemaakt_op: '2026-07-15T09:00:00.000Z' }

    // Act & Assert
    expect(geheugenVanRij(rij)?.bron).toBeNull()
  })

  it('laat een rij met een onbekende soort vallen in plaats van te casten', () => {
    // Arrange — een soort die na een verruimde allowlist zou kunnen opduiken.
    const rij = { id: ID, soort: 'stemming', inhoud: 'x', bron: null, aangemaakt_op: '2026-07-15T09:00:00.000Z' }

    // Act & Assert — narrowen, niet casten: een onbekende soort hoort niet stil
    // als geldig type de UI in te wandelen.
    expect(geheugenVanRij(rij)).toBeNull()
  })

  it.each([[{}], [null], ['rij'], [{ id: ID, soort: 'feit' }]])('weigert %s', (rij) => {
    expect(geheugenVanRij(rij)).toBeNull()
  })
})

describe('isGeheugenSoort', () => {
  it.each([['voorkeur'], ['feit'], ['doel']])('kent %s', (s) => {
    expect(isGeheugenSoort(s)).toBe(true)
  })

  it.each([['Feit'], ['voorkeuren'], [''], [null], [1]])('kent %s niet', (s) => {
    expect(isGeheugenSoort(s)).toBe(false)
  })
})
