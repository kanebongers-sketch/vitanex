import { describe, expect, it } from 'vitest'
import { EIWIT_PER_DOEL, indeling, isTrainerActie, leesLidPlan, lidPlanModus, regelsUitRij, rekenVoorLid, STANDAARD_REGELS, voorstelVan } from './eigen'
import { planUitRij, planVoorLid, voornaamVan, voorstelUit } from './model'

const geldig = { doel: 'afvallen', kcal: 2000, eiwitG: 140, koolhydratenG: 200, vetG: 60, adviezen: ['Water drinken'], maaltijden: [{ naam: 'Ontbijt', tijd: '08:00', voorbeelden: '' }] }
const berekening = { gewichtKg: 80, lengteCm: 180, leeftijd: 35, geslacht: 'man', activiteit: 'matig', doel: 'afvallen', eiwitPerKg: 1.8, vetPercentage: 25 }

describe('regels en modus', () => {
  it('standaard mogen leden het plan van de trainer niet overschrijven', () => {
    expect(STANDAARD_REGELS.ledenOverschrijven).toBe(false)
    expect(regelsUitRij(null)).toEqual({ ledenOverschrijven: false })
    expect(regelsUitRij({ leden_overschrijven: 'ja' })).toEqual({ ledenOverschrijven: false })
    expect(regelsUitRij({ leden_overschrijven: true })).toEqual({ ledenOverschrijven: true })
  })

  it('zonder plan of met een eigen plan slaat het lid op', () => {
    expect(lidPlanModus(undefined, STANDAARD_REGELS)).toBe('opslaan')
    expect(lidPlanModus(null, STANDAARD_REGELS)).toBe('opslaan')
    expect(lidPlanModus({ bron: 'lid' }, STANDAARD_REGELS)).toBe('opslaan')
  })

  it('bij een plan van de trainer: voorstel, tenzij de sportschool overschrijven toestaat', () => {
    expect(lidPlanModus({ bron: 'trainer' }, STANDAARD_REGELS)).toBe('voorstel')
    expect(lidPlanModus({ bron: 'trainer' }, { ledenOverschrijven: true })).toBe('opslaan')
  })
})

describe('leesLidPlan', () => {
  it('bewaart geen lichaamsgegevens zonder toestemming', () => {
    const r = leesLidPlan({ plan: { ...geldig, berekening }, bewaarGegevens: false })
    expect(r.ok && r.waarde.plan.berekening).toBe(null)
    expect(r.ok && r.waarde.bewaarGegevens).toBe(false)
  })

  it('bewaart ze wel met toestemming en een kloppende berekening', () => {
    const r = leesLidPlan({ plan: { ...geldig, berekening }, bewaarGegevens: true })
    expect(r.ok && r.waarde.plan.berekening?.gewichtKg).toBe(80)
    expect(r.ok && r.waarde.bewaarGegevens).toBe(true)
  })

  it('toestemming zonder berekening telt niet', () => {
    const r = leesLidPlan({ plan: geldig, bewaarGegevens: true })
    expect(r.ok && r.waarde.bewaarGegevens).toBe(false)
  })

  it('negeert notitie en sjabloon van buiten en eist een doel', () => {
    const r = leesLidPlan({ plan: { ...geldig, notitie: 'stiekem', sjabloonId: '6f1c7c1e-0000-4000-8000-000000000001' } })
    expect(r.ok && r.waarde.plan.notitie).toBe(null)
    expect(r.ok && r.waarde.plan.sjabloonId).toBe(null)
    expect(leesLidPlan({ plan: { ...geldig, doel: null } }).ok).toBe(false)
    expect(leesLidPlan({ plan: { ...geldig, kcal: 300 } }).ok).toBe(false)
    expect(leesLidPlan('onzin').ok).toBe(false)
  })

  it('een voorstel heeft nooit lichaamsgegevens', () => {
    const r = leesLidPlan({ plan: { ...geldig, berekening }, bewaarGegevens: true })
    if (!r.ok) throw new Error(r.fout)
    expect(Object.keys(voorstelVan(r.waarde.plan)).sort()).toEqual(['adviezen', 'doel', 'eiwitG', 'kcal', 'koolhydratenG', 'maaltijden', 'vetG'])
  })
})

describe('rekenhulp voor het lid', () => {
  it('volgt de eiwitnorm van het doel en Mifflin-St Jeor', () => {
    const { invoer, uitkomst } = rekenVoorLid({ gewichtKg: 80, lengteCm: 180, leeftijd: 35, geslacht: 'man', activiteit: 'matig' }, 'onderhoud')
    expect(invoer.eiwitPerKg).toBe(EIWIT_PER_DOEL.onderhoud)
    // 10 x 80 + 6,25 x 180 min 5 x 35 plus 5 = 1755; maal 1,55 = 2720,25, afgerond op 10.
    expect(uitkomst.rustverbruik).toBe(1755)
    expect(uitkomst.kcal).toBe(2720)
    expect(uitkomst.eiwitG).toBe(128)
  })
})

describe('dagindeling', () => {
  it('geeft vaste tijden en bewaart voorbeelden bij dezelfde naam', () => {
    const vier = indeling(4, ['Ontbijt', 'Lunch', 'Tussendoor', 'Avondeten'], [{ naam: 'Lunch', tijd: '13:00', voorbeelden: 'Brood' }])
    expect(vier.map((m) => m.tijd)).toEqual(['07:30', '12:30', '15:30', '18:30'])
    expect(vier[1].voorbeelden).toBe('Brood')
    expect(indeling(6, ['a', 'b', 'c', 'd', 'e', 'f'])).toHaveLength(6)
  })
})

describe('model: bron, voorstel en wat het lid ziet', () => {
  const rij = { id: 'p', lid_id: 'l', kcal: 2000, eiwit_g: 120, koolhydraten_g: 230, vet_g: 65, bijgewerkt_door: 'Daan de Vries', berekening }

  it('een oude rij zonder bron is van de trainer', () => {
    const p = planUitRij(rij)
    expect(p?.bron).toBe('trainer')
    expect(p && planVoorLid(p).trainerNaam).toBe('Daan')
  })

  it('de berekening gaat alleen terug naar het lid bij een eigen plan met toestemming', () => {
    const trainer = planUitRij(rij)
    const eigenZonder = planUitRij({ ...rij, bron: 'lid' })
    const eigenMet = planUitRij({ ...rij, bron: 'lid', lid_toestemming_op: '2026-10-30T10:00:00Z' })
    expect(trainer && planVoorLid(trainer).eigenBerekening).toBe(null)
    expect(eigenZonder && planVoorLid(eigenZonder).eigenBerekening).toBe(null)
    expect(eigenMet && planVoorLid(eigenMet).eigenBerekening?.gewichtKg).toBe(80)
    expect(eigenMet && planVoorLid(eigenMet).trainerNaam).toBe(null)
  })

  it('leest een voorstel alleen als het klopt', () => {
    expect(voorstelUit({ kcal: 2100, eiwitG: 130, koolhydratenG: 220, vetG: 70, doel: 'aankomen' })?.doel).toBe('aankomen')
    expect(voorstelUit({ kcal: 100, eiwitG: 1, koolhydratenG: 1, vetG: 1 })).toBe(null)
    expect(voorstelUit('x')).toBe(null)
    const p = planUitRij({ ...rij, voorstel: { kcal: 2100, eiwitG: 130, koolhydratenG: 220, vetG: 70 }, voorstel_op: '2026-10-30T10:00:00Z' })
    expect(p && planVoorLid(p).voorstelOp).toBe('2026-10-30T10:00:00Z')
  })

  it('voornaam: geen naam voor demo of leeg', () => {
    expect(voornaamVan('Demo')).toBe(null)
    expect(voornaamVan(null)).toBe(null)
    expect(voornaamVan('  Sanne ')).toBe('Sanne')
  })

  it('kent alleen de drie trainer-acties', () => {
    expect(isTrainerActie('overnemen')).toBe(true)
    expect(isTrainerActie('wissen')).toBe(false)
  })
})
