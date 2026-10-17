import { describe, expect, it } from 'vitest'
import {
  REGEL_DEFINITIES,
  REGEL_SLEUTELS,
  SJABLOON_MAX,
  geldigeDrempel,
  leesRegelInvoer,
  regelNaarRij,
  regelUitRij,
  regelsCompleet,
  standaardRegel,
  uitlegMetDrempel,
  wieTekst,
  wieWaarde,
} from './regels'

const MW = '11111111-2222-4333-8444-555555555555'

describe('standaardregels', () => {
  it('heeft zeven regels, allemaal standaard aan', () => {
    const regels = REGEL_SLEUTELS.map(standaardRegel)
    expect(regels).toHaveLength(7)
    expect(regels.every((r) => r.aan)).toBe(true)
  })

  it('standaard drempels uit de opdracht', () => {
    expect(standaardRegel('niet_gezien').drempel).toBe(14)
    expect(standaardRegel('welkom').drempel).toBe(7)
    expect(standaardRegel('mijlpaal').drempel).toBe(50)
    expect(standaardRegel('verjaardag').drempel).toBeNull()
  })

  it('elke voorbeeldtekst gebruikt alleen bekende plekken en past in het maximum', () => {
    for (const d of Object.values(REGEL_DEFINITIES)) {
      expect(d.sjabloon.length).toBeLessThanOrEqual(SJABLOON_MAX)
      for (const m of d.sjabloon.matchAll(/\{([^}]*)\}/g)) expect(['voornaam', 'vestiging', 'dagen', 'bezoeken']).toContain(m[1])
    }
  })
})

describe('regelUitRij en regelsCompleet', () => {
  it('leest een rij uit de database', () => {
    const r = regelUitRij({ regel: 'niet_gezien', aan: false, drempel: 21, rol: 'manager', medewerker_id: null, sjabloon: 'Hoi {voornaam}' })
    expect(r).toEqual({ sleutel: 'niet_gezien', aan: false, drempel: 21, wie: { soort: 'rol', rol: 'manager' }, sjabloon: 'Hoi {voornaam}' })
  })

  it('een vaste medewerker gaat voor een rol', () => {
    expect(regelUitRij({ regel: 'welkom', rol: 'trainer', medewerker_id: MW })?.wie).toEqual({ soort: 'medewerker', id: MW })
  })

  it('een drempel buiten de grenzen wordt de standaard', () => {
    expect(regelUitRij({ regel: 'niet_gezien', drempel: 2 })?.drempel).toBe(14)
    expect(geldigeDrempel('risico', '60')).toBe(60)
    expect(geldigeDrempel('opzegging', 5)).toBeNull()
  })

  it('onbekende regels vallen weg', () => {
    expect(regelUitRij({ regel: 'spam' })).toBeNull()
    expect(regelUitRij(null)).toBeNull()
  })

  it('vult ontbrekende regels aan met de standaard, in vaste volgorde', () => {
    const regels = regelsCompleet([{ regel: 'mijlpaal', aan: false, drempel: 100 }])
    expect(regels.map((r) => r.sleutel)).toEqual([...REGEL_SLEUTELS])
    expect(regels[6]).toMatchObject({ aan: false, drempel: 100 })
    expect(regels[0]).toEqual(standaardRegel('welkom'))
  })

  it('naar een rij en terug blijft gelijk', () => {
    for (const s of REGEL_SLEUTELS) {
      const r = { ...standaardRegel(s), wie: { soort: 'medewerker' as const, id: MW } }
      expect(regelUitRij(regelNaarRij(r))).toEqual(r)
    }
    const iedereen = { ...standaardRegel('welkom'), wie: { soort: 'iedereen' as const } }
    expect(regelUitRij(regelNaarRij(iedereen))).toEqual(iedereen)
  })
})

describe('leesRegelInvoer', () => {
  const goed = { sleutel: 'niet_gezien', aan: true, drempel: 21, wie: 'rol:trainer', sjabloon: '  Hoi {voornaam}  ' }

  it('accepteert nette invoer en knipt spaties weg', () => {
    const u = leesRegelInvoer(goed)
    expect(u).toEqual({ ok: true, waarde: { sleutel: 'niet_gezien', aan: true, drempel: 21, wie: { soort: 'rol', rol: 'trainer' }, sjabloon: 'Hoi {voornaam}' } })
  })

  it('weigert een drempel buiten de grenzen met een duidelijke melding', () => {
    const u = leesRegelInvoer({ ...goed, drempel: 200 })
    expect(u).toEqual({ ok: false, fout: 'Kies bij "dagen niet geweest" een heel getal van 5 tot 90.' })
  })

  it('negeert de drempel bij een regel zonder drempel', () => {
    const u = leesRegelInvoer({ ...goed, sleutel: 'verjaardag', drempel: 'onzin' })
    expect(u.ok && u.waarde.drempel).toBeNull()
  })

  it('weigert onbekende regel, wie en lege of te lange tekst', () => {
    expect(leesRegelInvoer({ ...goed, sleutel: 'x' }).ok).toBe(false)
    expect(leesRegelInvoer({ ...goed, wie: 'rol:baas' }).ok).toBe(false)
    expect(leesRegelInvoer({ ...goed, wie: 'mw:geen-id' }).ok).toBe(false)
    expect(leesRegelInvoer({ ...goed, sjabloon: '   ' }).ok).toBe(false)
    expect(leesRegelInvoer({ ...goed, sjabloon: 'a'.repeat(SJABLOON_MAX + 1) }).ok).toBe(false)
    expect(leesRegelInvoer('tekst').ok).toBe(false)
  })

  it('leest een medewerker en iedereen', () => {
    const mw = leesRegelInvoer({ ...goed, wie: `mw:${MW}` })
    expect(mw.ok && mw.waarde.wie).toEqual({ soort: 'medewerker', id: MW })
    const ied = leesRegelInvoer({ ...goed, wie: 'iedereen' })
    expect(ied.ok && ied.waarde.wie).toEqual({ soort: 'iedereen' })
  })

  it('aan is alleen aan bij true', () => {
    const u = leesRegelInvoer({ ...goed, aan: 'ja' })
    expect(u.ok && u.waarde.aan).toBe(false)
  })
})

describe('weergave', () => {
  it('wieTekst en wieWaarde', () => {
    const namen = new Map([[MW, 'Sanne']])
    expect(wieTekst({ soort: 'rol', rol: 'manager' }, namen)).toBe('Clubmanager')
    expect(wieTekst({ soort: 'medewerker', id: MW }, namen)).toBe('Sanne')
    expect(wieTekst({ soort: 'iedereen' }, namen)).toBe('Iedereen')
    expect(wieWaarde({ soort: 'medewerker', id: MW })).toBe(`mw:${MW}`)
  })

  it('zet de drempel in de uitleg', () => {
    expect(uitlegMetDrempel({ ...standaardRegel('niet_gezien'), drempel: 21 })).toContain('21 dagen')
  })
})
