import { describe, expect, it } from 'vitest'
import type { LedenappMerk } from '@/lib/club/ledenlogin/contract'
import { contrast } from '@/lib/club/kern/huisstijl'
import {
  ICOON_MATEN,
  eersteLetter,
  icoonUrl,
  korteNaam,
  ledenappManifest,
  leesIcoonSoort,
  manifestUrl,
  merkKleuren,
  merkVersie,
} from './manifest'
import { ledenappMetadata, ledenappViewport } from './metadata'

const MERK: LedenappMerk = {
  organisatieId: 'de000000-0000-4000-8000-0000000000c1',
  naam: 'Voorbeeld Gym',
  slug: 'voorbeeldgym',
  kleurAccent: '#2D6CDF',
  thema: 'donker',
  logoUrl: null,
}

describe('ledenappManifest', () => {
  it('geeft naam, start en scope /mijn en standalone voor een sportschool', () => {
    const m = ledenappManifest(MERK)
    expect(m.name).toBe('Voorbeeld Gym')
    expect(m.short_name).toBe('Voorbeeld')
    expect(m.start_url).toBe('/mijn')
    expect(m.scope).toBe('/mijn')
    expect(m.id).toBe('/mijn')
    expect(m.display).toBe('standalone')
    expect(m.lang).toBe('nl')
  })

  it('neemt de achtergrond van het thema als theme_color en background_color', () => {
    expect(ledenappManifest(MERK).theme_color).toBe('#0A0B09')
    const licht = ledenappManifest({ ...MERK, thema: 'licht' })
    expect(licht.theme_color).toBe('#F4F3EF')
    expect(licht.background_color).toBe('#F4F3EF')
  })

  it('heeft iconen 192, 512 en een maskable 512 met een versie per huisstijl', () => {
    const icons = ledenappManifest(MERK).icons ?? []
    expect(icons.map((i) => `${i.sizes}:${i.purpose}`)).toEqual(['192x192:any', '512x512:any', '512x512:maskable'])
    for (const i of icons) expect(i.src).toMatch(/^\/api\/club\/ledenapp\/icoon\?soort=(192|512|maskable)&v=[0-9a-z]+$/)
  })

  it('valt zonder sportschool terug op een neutrale Club met de vaste iconen', () => {
    const m = ledenappManifest(null)
    expect(m.name).toBe('Club')
    expect(m.short_name).toBe('Club')
    expect((m.icons ?? []).map((i) => i.src)).toEqual(['/club-app/icoon-192.png', '/club-app/icoon-512.png', '/club-app/icoon-maskable-512.png'])
  })

  it('gebruikt geen gedachtestreepjes in de teksten', () => {
    for (const m of [ledenappManifest(MERK), ledenappManifest(null)]) {
      expect(`${m.name} ${m.short_name} ${m.description}`).not.toMatch(/[–—]| - /)
    }
  })

  it('valt bij een lege naam terug op Club', () => {
    expect(ledenappManifest({ ...MERK, naam: '   ' }).name).toBe('Club')
  })
})

describe('merkKleuren', () => {
  it('geeft een accent met genoeg contrast tegen de achtergrond en leesbare inkt', () => {
    for (const merk of [MERK, { ...MERK, kleurAccent: '#101010' }, { ...MERK, kleurAccent: '#FFF8E0', thema: 'licht' as const }, null]) {
      const k = merkKleuren(merk)
      expect(contrast(k.accent, k.achtergrond)).toBeGreaterThanOrEqual(3)
      expect(contrast(k.inkt, k.accent)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('negeert een ongeldige kleur', () => {
    expect(merkKleuren({ ...MERK, kleurAccent: 'rood' }).accent).toMatch(/^#[0-9A-F]{6}$/)
  })
})

describe('hulpjes', () => {
  it('eersteLetter pakt de eerste letter of het eerste cijfer, zonder accent', () => {
    expect(eersteLetter('Fit Factory')).toBe('F')
    expect(eersteLetter('  émile gym')).toBe('E')
    expect(eersteLetter('24/7 Fitness')).toBe('2')
    expect(eersteLetter('!!!')).toBe('C')
  })

  it('korteNaam houdt korte namen heel en kort lange af', () => {
    expect(korteNaam('Fit Factory')).toBe('Fit Factory')
    expect(korteNaam('Sportcentrum De Kempen')).toBe('Sportcentrum')
    expect(korteNaam('Superlangenaamzonderspaties')).toBe('Superlangena')
    expect(korteNaam('')).toBe('Club')
  })

  it('merkVersie verandert als de huisstijl verandert', () => {
    expect(merkVersie(MERK)).toBe(merkVersie({ ...MERK }))
    expect(merkVersie(MERK)).not.toBe(merkVersie({ ...MERK, kleurAccent: '#FF0000' }))
    expect(merkVersie(MERK)).not.toBe(merkVersie({ ...MERK, logoUrl: '/api/club/organisatie/logo?pad=x' }))
    expect(merkVersie(null)).toBe('0')
  })

  it('leesIcoonSoort accepteert alleen bekende soorten', () => {
    expect(leesIcoonSoort('192')).toBe('192')
    expect(leesIcoonSoort('apple')).toBe('apple')
    expect(leesIcoonSoort('1024')).toBeNull()
    expect(leesIcoonSoort(null)).toBeNull()
  })

  it('heeft de juiste maten', () => {
    expect(ICOON_MATEN.apple.px).toBe(180)
    expect(ICOON_MATEN.maskable).toMatchObject({ px: 512, maskable: true })
    expect(icoonUrl(null, 'apple')).toBe('/club-app/apple-touch-icon.png')
    expect(manifestUrl(MERK)).toMatch(/^\/api\/club\/ledenapp\/manifest\?v=/)
  })
})

describe('metadata en viewport', () => {
  it('zet manifest, apple-web-app en iconen', () => {
    const md = ledenappMetadata(MERK)
    expect(md.manifest).toBe(manifestUrl(MERK))
    expect(md.appleWebApp).toMatchObject({ capable: true, title: 'Voorbeeld', statusBarStyle: 'black-translucent' })
    expect(md.robots).toMatchObject({ index: false })
    expect(JSON.stringify(md.icons)).toContain('soort=apple')
  })

  it('kiest de statusbalk en het kleurschema naar het thema', () => {
    expect(ledenappMetadata({ ...MERK, thema: 'licht' }).appleWebApp).toMatchObject({ statusBarStyle: 'default' })
    expect(ledenappViewport(MERK)).toMatchObject({ viewportFit: 'cover', themeColor: '#0A0B09', colorScheme: 'dark' })
    expect(ledenappViewport(null).themeColor).toBe('#0A0B09')
  })
})
