import { describe, expect, it } from 'vitest'
import { OVERSTAP_CHECKLIST, alleIds, bewaarVoortgang, leesVoortgang, totaleVoortgang, voortgangVan, wissel } from './overstapchecklist'

describe('overstapchecklist', () => {
  it('heeft unieke id’s en groepen met punten', () => {
    const ids = alleIds()
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(OVERSTAP_CHECKLIST.map((g) => g.sleutel)).size).toBe(OVERSTAP_CHECKLIST.length)
    for (const g of OVERSTAP_CHECKLIST) expect(g.punten.length).toBeGreaterThanOrEqual(3)
  })

  it('volgt de schrijfregels en vraagt nergens om een e-mailadres van de bezoeker', () => {
    const tekst = JSON.stringify(OVERSTAP_CHECKLIST)
    expect(tekst).not.toMatch(/[–—]| - /)
    expect(tekst).not.toMatch(/[éèëêáàóòúùíì]/i)
    expect(tekst).not.toMatch(/fit ?factory|virtuagym|sportivity/i)
  })

  it('leest alleen bekende id’s terug en overleeft kapotte opslag', () => {
    expect(leesVoortgang(null).size).toBe(0)
    expect(leesVoortgang('{kapot').size).toBe(0)
    expect(leesVoortgang('{"a":1}').size).toBe(0)
    expect([...leesVoortgang('["ledenlijst","bestaat-niet",3]')]).toEqual(['ledenlijst'])
  })

  it('wisselt zonder de oude set te veranderen en bewaart in lijstvolgorde', () => {
    const leeg: ReadonlySet<string> = new Set()
    const een = wissel(leeg, 'poster')
    const twee = wissel(een, 'startdatum')
    expect(leeg.size).toBe(0)
    expect(bewaarVoortgang(twee)).toBe('["startdatum","poster"]')
    expect(wissel(twee, 'poster').has('poster')).toBe(false)
    expect([...leesVoortgang(bewaarVoortgang(twee))].sort()).toEqual(['poster', 'startdatum'])
  })

  it('rekent de voortgang uit, pas 100 als alles af is', () => {
    const punten = OVERSTAP_CHECKLIST[0].punten
    expect(voortgangVan(new Set(), punten)).toEqual({ klaar: 0, totaal: punten.length, procent: 0 })
    expect(voortgangVan(new Set([punten[0].id]), punten).klaar).toBe(1)
    const bijnaAlles = new Set(alleIds().slice(1))
    expect(totaleVoortgang(bijnaAlles).procent).toBeLessThan(100)
    expect(totaleVoortgang(new Set(alleIds())).procent).toBe(100)
    expect(voortgangVan(new Set(), []).procent).toBe(0)
  })
})
