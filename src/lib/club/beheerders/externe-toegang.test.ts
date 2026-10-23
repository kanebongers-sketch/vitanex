// Tenant-scheiding: een eigenaar of clubmanager krijgt precies de eigen
// sportschool, nooit een andere en nooit de keuzelijst van Kane.

import { describe, expect, it } from 'vitest'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import { ONDERDEEL_SLEUTELS, orgInstellingenUitRij } from '@/lib/club/kern/org-instellingen'
import type { Beheerder } from './beheerder'
import { externeToegangVelden } from './externe-toegang'

const KANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const GYM_B = 'be000000-0000-4000-8000-0000000000b2'

const org = (id: string, naam: string): Organisatie => ({ id, naam, slogan: null, logo: null, kleurAccent: '#B58E5C', thema: 'donker', uit: [], demo: false, slug: null, instellingen: orgInstellingenUitRij({}, ONDERDEEL_SLEUTELS) })

const SANNE: Beheerder = {
  id: '11111111-1111-4111-8111-111111111111', organisatieId: GYM_A, naam: 'Sanne de Vries', email: null, rol: 'clubmanager',
  code: 'abcdefghijklmnopqrstuvwx', actief: true, pinStatus: 'actief', pinHash: 'x', wachtwoordHash: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null,
}

describe('externeToegangVelden', () => {
  it('userId is de eigen sportschool en er is maar een sportschool te kiezen', () => {
    const v = externeToegangVelden(SANNE, org(GYM_A, 'Gym A'), KANE)
    expect(v).not.toBeNull()
    expect(v?.userId).toBe(GYM_A)
    expect(v?.organisatie.id).toBe(GYM_A)
    expect(v?.organisaties.map((o) => o.id)).toEqual([GYM_A])
    expect(v?.isPlatformEigenaar).toBe(false)
    expect(v?.rol).toBe('clubmanager')
    expect(v?.naam).toBe('Sanne')
  })
  it('een andere sportschool dan de eigen: geen toegang', () => {
    expect(externeToegangVelden(SANNE, org(GYM_B, 'Gym B'), KANE)).toBeNull()
  })
  it('zonder organisatie of eigenaar: geen toegang', () => {
    expect(externeToegangVelden(SANNE, null, KANE)).toBeNull()
    expect(externeToegangVelden(SANNE, org(GYM_A, 'Gym A'), null)).toBeNull()
  })
})
