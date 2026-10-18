import { describe, expect, it } from 'vitest'
import { LOGO_FIT_FACTORY, organisatieUitRij, type Organisatie } from '@/lib/club/kern/organisatie'
import { merkUitOrganisatie } from './merk'

const ID = 'de000000-0000-4000-8000-0000000000c1'

function org(logo: string | null): Organisatie {
  const o = organisatieUitRij({ id: ID, naam: 'Voorbeeld Gym', logo, kleur_accent: '#2d6cdf', thema: 'licht', slug: 'voorbeeldgym' })
  if (!o) throw new Error('testorganisatie ongeldig')
  return o
}

describe('merkUitOrganisatie', () => {
  it('neemt naam, kleur, thema en slug over', () => {
    const { merk } = merkUitOrganisatie(org(null))
    expect(merk).toEqual({ organisatieId: ID, naam: 'Voorbeeld Gym', slug: 'voorbeeldgym', kleurAccent: '#2D6CDF', thema: 'licht', logoUrl: null })
  })

  it('geeft een PNG-logo door voor het icoon', () => {
    const bron = merkUitOrganisatie(org(`${ID}/logo-abc.png`))
    expect(bron.icoonLogoPad).toBe(`${ID}/logo-abc.png`)
    expect(bron.merk.logoUrl).toBe(`/api/club/organisatie/logo?pad=${encodeURIComponent(`${ID}/logo-abc.png`)}`)
  })

  it('gebruikt een SVG of WebP niet voor het icoon, wel als logo', () => {
    for (const ext of ['svg', 'webp']) {
      const bron = merkUitOrganisatie(org(`${ID}/logo-abc.${ext}`))
      expect(bron.icoonLogoPad).toBeNull()
      expect(bron.merk.logoUrl).not.toBeNull()
    }
  })

  it('het ingebouwde Fit Factory-logo wordt de letter', () => {
    const bron = merkUitOrganisatie(org(LOGO_FIT_FACTORY))
    expect(bron.merk.logoUrl).toBeNull()
    expect(bron.icoonLogoPad).toBeNull()
  })
})
