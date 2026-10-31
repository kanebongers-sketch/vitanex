import { describe, expect, it } from 'vitest'
import { bestaandVoorVestiging, hoeveelheidFormulier, hoofdMetadataFormulier, isVestigingModel, koppelPlan, leesAbonnementBasis, maakSleutel, nieuwAbonnementFormulier } from './vestiging-abonnement'

const ORG = 'de000000-0000-4000-8000-0000000000c1'

describe('een Stripe-abonnement per vestiging (besluit Kane 31-10-2026)', () => {
  it('leest wat we nodig hebben, ook het periode-einde op het item (nieuwe API)', () => {
    const a = leesAbonnementBasis({ id: 'sub_hoofd001', status: 'active', customer: { id: 'cus_klant001' }, default_payment_method: 'pm_123', metadata: { soort: 'vestiging', x: 1 }, items: { data: [{ current_period_end: 1800000000 }] } })
    expect(a).toEqual({ id: 'sub_hoofd001', status: 'active', klantId: 'cus_klant001', betaalmethode: 'pm_123', periodeTot: 1800000000, metadata: { soort: 'vestiging' } })
    expect(isVestigingModel(a!)).toBe(true)
    expect(isVestigingModel({ ...a!, metadata: {} })).toBe(false)
    expect(leesAbonnementBasis({ id: 'x' })).toBeNull()
  })

  it('een eerdere poging die bij Stripe wel lukte nemen we over (nooit een tweede)', () => {
    const lijst = {
      data: [
        { id: 'sub_oud00001', status: 'canceled', metadata: { organisatie_id: ORG, vestiging: 'eersel' } },
        { id: 'sub_ander001', status: 'active', metadata: { organisatie_id: 'ander', vestiging: 'eersel' } },
        { id: 'sub_goed0001', status: 'active', metadata: { organisatie_id: ORG, vestiging: 'eersel' } },
      ],
    }
    expect(bestaandVoorVestiging(lijst, ORG, 'eersel')).toBe('sub_goed0001')
    expect(bestaandVoorVestiging(lijst, ORG, 'budel')).toBeNull()
    expect(bestaandVoorVestiging(null, ORG, 'eersel')).toBeNull()
  })

  it('nieuw abonnement: zelfde pakketten, hoeveelheid = leden (minimaal 1), zelfde factuurdatum, metadata', () => {
    const regels = [{ regel: 'administratie' as const, prijsId: 'price_b1' }, { regel: 'lessen' as const, prijsId: 'price_l1' }]
    const f = nieuwAbonnementFormulier({ klantId: 'cus_klant001', regels, hoeveelheid: 0, organisatieId: ORG, vestiging: 'eersel', slug: 'sterk', betaalmethode: 'pm_1', anker: 2_000_000_000 }, 1_900_000_000)
    expect(f.get('customer')).toBe('cus_klant001')
    expect(f.get('items[0][price]')).toBe('price_b1')
    expect(f.get('items[1][quantity]')).toBe('1')
    expect(f.get('default_payment_method')).toBe('pm_1')
    expect(f.get('billing_cycle_anchor')).toBe('2000000000')
    expect(f.get('proration_behavior')).toBe('create_prorations')
    expect(f.get('metadata[soort]')).toBe('vestiging')
    expect(f.get('metadata[organisatie_id]')).toBe(ORG)
    expect(f.get('metadata[vestiging]')).toBe('eersel')
    // Een anker in het verleden sturen we niet mee (Stripe zou weigeren).
    expect(nieuwAbonnementFormulier({ klantId: 'cus_k', regels: [], hoeveelheid: 5, organisatieId: ORG, vestiging: 'x', slug: 's', betaalmethode: null, anker: 100 }, 1_900_000_000).has('billing_cycle_anchor')).toBe(false)
    expect(maakSleutel(ORG, 'eersel')).toBe(`ayg_vest_${ORG}_eersel`)
  })

  it('hoeveelheid zetten: alle eigen regels in een verzoek, zonder verrekening', () => {
    const f = hoeveelheidFormulier(
      [
        { id: 'si_1', prijsId: 'price_b1', aantal: 3 },
        { id: 'si_x', prijsId: 'price_vreemd', aantal: 1 },
        { id: 'si_2', prijsId: 'price_l1', aantal: 3 },
      ],
      ['price_b1', 'price_l1'],
      120,
    )
    expect(f.get('items[0][id]')).toBe('si_1')
    expect(f.get('items[1][id]')).toBe('si_2')
    expect(f.get('items[1][quantity]')).toBe('120')
    expect(f.has('items[2][id]')).toBe(false)
    expect(f.get('proration_behavior')).toBe('none')
    expect(hoofdMetadataFormulier(ORG, 'budel').get('metadata[vestiging]')).toBe('budel')
  })

  it('koppelplan: het hoofdabonnement naar de standaardvestiging, de rest krijgt er een', () => {
    const v = [
      { sleutel: 'budel', standaard: true },
      { sleutel: 'eersel', standaard: false },
      { sleutel: 'valkenswaard', standaard: false },
    ]
    expect(koppelPlan(v, [], 'sub_hoofd')).toEqual({ hoofdNaar: 'budel', maken: ['eersel', 'valkenswaard'] })
    const rijen = [
      { id: '1', vestiging: 'budel', abonnementId: 'sub_hoofd', status: 'actief' as const },
      { id: '2', vestiging: 'eersel', abonnementId: 'sub_e', status: 'actief' as const },
    ]
    expect(koppelPlan(v, rijen, 'sub_hoofd')).toEqual({ hoofdNaar: null, maken: ['valkenswaard'] })
    // Idempotent: alles klaar = niets te doen.
    expect(koppelPlan(v.slice(0, 2), rijen, 'sub_hoofd')).toEqual({ hoofdNaar: null, maken: [] })
    // Een vastgelopen claim (aanmaken zonder abonnement) proberen we opnieuw.
    expect(koppelPlan(v.slice(0, 2), [rijen[0], { id: '3', vestiging: 'eersel', abonnementId: null, status: 'aanmaken' }], 'sub_hoofd').maken).toEqual(['eersel'])
    // Een opgezegde vestiging maken we nooit vanzelf opnieuw.
    expect(koppelPlan(v.slice(0, 2), [rijen[0], { id: '4', vestiging: 'eersel', abonnementId: 'sub_weg', status: 'opgezegd' }], 'sub_hoofd').maken).toEqual([])
    // Zonder vestigingen: niets (nooit een abonnement zonder vestiging).
    expect(koppelPlan([], [], 'sub_hoofd')).toEqual({ hoofdNaar: null, maken: [] })
  })
})
