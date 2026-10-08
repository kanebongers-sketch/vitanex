import { describe, expect, test } from 'vitest'
import { manifestPad, ptManifest } from './manifest'

describe('ptManifest', () => {
  test("eigen naam, start-URL en scope per PT'er", () => {
    const m = ptManifest('joey', 'Joey')
    expect(m).toMatchObject({
      id: '/joey',
      name: 'Fit Factory PT · Joey',
      short_name: 'Fit Factory PT',
      start_url: '/joey',
      scope: '/joey',
      display: 'standalone',
    })
    expect(m.icons?.length).toBeGreaterThan(0)
    expect(manifestPad('joey')).toBe('/joey/manifest.webmanifest')
  })
  test('short_name is de app-naam (past onder het icoon), kleuren uit de Fit Factory-huisstijl', () => {
    const m = ptManifest('x', 'Maximiliaan-Alexander')
    expect(m.short_name).toBe('Fit Factory PT')
    expect(m.theme_color).toBe('#101014')
    expect(m.icons?.some((i) => i.purpose === 'maskable')).toBe(true)
  })
})
