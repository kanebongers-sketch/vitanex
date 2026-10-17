import { describe, expect, it } from 'vitest'
import { leesAdviezen, leesMaaltijden, leesPlan, leesSjabloon } from './invoer'
import { planUitRij, planVoorLid, sjabloonUitRij } from './model'
import { pasSjabloonToe, type PlanConcept } from './sjabloon'
import type { VoedingSjabloon } from './model'

const geldig = { kcal: 2200, eiwitG: 140, koolhydratenG: 240, vetG: 70, doel: 'afvallen', adviezen: ['Elke maaltijd een eiwitbron'], maaltijden: [{ naam: 'Ontbijt', tijd: '07:30', voorbeelden: 'Kwark met havermout' }] }

describe('leesPlan', () => {
  it('neemt een geldig plan over', () => {
    const r = leesPlan(geldig)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.waarde.kcal).toBe(2200)
      expect(r.waarde.maaltijden[0]).toEqual({ naam: 'Ontbijt', tijd: '07:30', voorbeelden: 'Kwark met havermout' })
      expect(r.waarde.berekening).toBeNull()
    }
  })

  it('accepteert getallen als tekst en rondt af', () => {
    const r = leesPlan({ ...geldig, kcal: '2199.6' })
    expect(r.ok && r.waarde.kcal).toBe(2200)
  })

  it('weigert kcal buiten de grenzen en ontbrekende macros', () => {
    expect(leesPlan({ ...geldig, kcal: 500 }).ok).toBe(false)
    expect(leesPlan({ ...geldig, vetG: undefined }).ok).toBe(false)
    expect(leesPlan(null).ok).toBe(false)
    expect(leesPlan([]).ok).toBe(false)
  })

  it('weigert een onbekend doel, laat een leeg doel toe', () => {
    expect(leesPlan({ ...geldig, doel: 'bulken' }).ok).toBe(false)
    const r = leesPlan({ ...geldig, doel: '' })
    expect(r.ok && r.waarde.doel).toBeNull()
  })

  it('bewaart de rekenhulp alleen als die klopt', () => {
    const goed = { gewichtKg: 80, lengteCm: 180, leeftijd: 30, geslacht: 'man', activiteit: 'matig', doel: 'onderhoud', eiwitPerKg: 1.6, vetPercentage: 25 }
    const r1 = leesPlan({ ...geldig, berekening: goed })
    expect(r1.ok && r1.waarde.berekening?.gewichtKg).toBe(80)
    const r2 = leesPlan({ ...geldig, berekening: { ...goed, gewichtKg: 10 } })
    expect(r2.ok && r2.waarde.berekening).toBeNull()
  })

  it('negeert een sjabloon-id dat geen uuid is', () => {
    const r = leesPlan({ ...geldig, sjabloonId: "1; drop table" })
    expect(r.ok && r.waarde.sjabloonId).toBeNull()
  })
})

describe('adviezen en maaltijden', () => {
  it('haalt lege en dubbele adviezen weg', () => {
    const r = leesAdviezen(['  Drink water ', '', 'Drink water', 'Groente bij elke maaltijd'])
    expect(r.ok && r.waarde).toEqual(['Drink water', 'Groente bij elke maaltijd'])
  })

  it('weigert te veel of te lange adviezen', () => {
    expect(leesAdviezen(Array.from({ length: 13 }, (_, i) => `Advies ${i}`)).ok).toBe(false)
    expect(leesAdviezen(['x'.repeat(201)]).ok).toBe(false)
    expect(leesAdviezen('tekst').ok).toBe(false)
  })

  it('slaat helemaal lege maaltijden over en eist een naam bij voorbeelden', () => {
    const r = leesMaaltijden([{ naam: '', voorbeelden: '' }, { naam: 'Lunch', tijd: '', voorbeelden: 'Volkorenbrood met kip' }])
    expect(r.ok && r.waarde).toEqual([{ naam: 'Lunch', tijd: null, voorbeelden: 'Volkorenbrood met kip' }])
    expect(leesMaaltijden([{ naam: '', voorbeelden: 'Appel' }]).ok).toBe(false)
  })

  it('weigert een ongeldige tijd', () => {
    expect(leesMaaltijden([{ naam: 'Ontbijt', tijd: '25:00', voorbeelden: '' }]).ok).toBe(false)
  })
})

describe('leesSjabloon', () => {
  it('laat dagdoelen leeg toe en leest eiwit per kilo met komma', () => {
    const r = leesSjabloon({ naam: 'Afvallen basis', doel: 'afvallen', eiwitPerKg: '1,8', kcal: '' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.waarde.eiwitPerKg).toBe(1.8)
      expect(r.waarde.kcal).toBeNull()
    }
  })

  it('eist een naam en een geldige eiwitnorm', () => {
    expect(leesSjabloon({ naam: ' ' }).ok).toBe(false)
    expect(leesSjabloon({ naam: 'X', eiwitPerKg: 4 }).ok).toBe(false)
  })
})

describe('rijen uit de database', () => {
  it('leest een plan en laat onbruikbare rijen weg', () => {
    const p = planUitRij({ id: 'p1', lid_id: 'l1', kcal: 2000, eiwit_g: 150, koolhydraten_g: 200, vet_g: 60, adviezen: ['A', 3], maaltijden: [{ naam: 'Ontbijt' }, { x: 1 }], notitie: 'Intern', bijgewerkt_op: '2026-10-17T10:00:00Z' })
    expect(p?.adviezen).toEqual(['A'])
    expect(p?.maaltijden).toEqual([{ naam: 'Ontbijt', tijd: null, voorbeelden: '' }])
    expect(planUitRij({ id: 'p1', lid_id: 'l1', kcal: null })).toBeNull()
  })

  it('laat de interne notitie en rekenhulp niet naar de ledenapp gaan', () => {
    const p = planUitRij({ id: 'p1', lid_id: 'l1', kcal: 2000, eiwit_g: 150, koolhydraten_g: 200, vet_g: 60, notitie: 'Intern', berekening: null })
    expect(p).not.toBeNull()
    const voorLid = planVoorLid(p!)
    expect(voorLid).not.toHaveProperty('notitie')
    expect(voorLid).not.toHaveProperty('berekening')
  })

  it('leest een sjabloon met lege dagdoelen', () => {
    const s = sjabloonUitRij({ id: 's1', naam: 'Basis', kcal: null, eiwit_per_kg: '1.8' })
    expect(s?.kcal).toBeNull()
    expect(s?.eiwitPerKg).toBe(1.8)
  })
})

describe('pasSjabloonToe', () => {
  const sjabloon: VoedingSjabloon = { id: 's1', naam: 'Afvallen', omschrijving: null, doel: 'afvallen', eiwitPerKg: 2, kcal: 1900, eiwitG: 150, koolhydratenG: null, vetG: 60, adviezen: ['Eiwit bij elke maaltijd'], maaltijden: [{ naam: 'Ontbijt', tijd: null, voorbeelden: 'Kwark' }], demo: false }
  const leeg: PlanConcept = { kcal: 2400, eiwitG: 120, koolhydratenG: 280, vetG: 80, doel: null, adviezen: ['Oud'], maaltijden: [], berekening: null, sjabloonId: null }

  it('neemt zonder rekenhulp de vaste dagdoelen en houdt wat leeg is', () => {
    const u = pasSjabloonToe(sjabloon, leeg)
    expect(u.bron).toBe('sjabloon')
    expect(u.plan).toMatchObject({ kcal: 1900, eiwitG: 150, koolhydratenG: 280, vetG: 60, doel: 'afvallen', adviezen: ['Eiwit bij elke maaltijd'], sjabloonId: 's1' })
  })

  it('rekent opnieuw met doel en eiwitnorm van het sjabloon als de rekenhulp klopt', () => {
    const berekening = { gewichtKg: 80, lengteCm: 180, leeftijd: 30, geslacht: 'man' as const, activiteit: 'matig' as const, doel: 'onderhoud' as const, eiwitPerKg: 1.6, vetPercentage: 25 }
    const u = pasSjabloonToe(sjabloon, { ...leeg, berekening })
    expect(u.bron).toBe('berekend')
    expect(u.plan.eiwitG).toBe(160)
    expect(u.plan.berekening?.doel).toBe('afvallen')
    expect(u.plan.kcal).toBeLessThan(2760)
  })

  it('verandert de dagdoelen niet als het sjabloon er geen heeft', () => {
    const u = pasSjabloonToe({ ...sjabloon, kcal: null, eiwitG: null, vetG: null, adviezen: [] }, leeg)
    expect(u.bron).toBe('ongewijzigd')
    expect(u.plan.kcal).toBe(2400)
    expect(u.plan.adviezen).toEqual(['Oud'])
  })
})
