import { describe, expect, test } from 'vitest'
import { manifestPad, ptManifest } from './manifest'

describe('ptManifest', () => {
  test("eigen naam, start-URL en scope per PT'er", () => {
    const m = ptManifest('joey', 'Joey')
    expect(m).toMatchObject({
      id: '/joey',
      name: 'Fit Factory PT · Joey',
      short_name: 'Joey',
      start_url: '/joey',
      scope: '/joey',
      display: 'standalone',
    })
    expect(m.icons?.length).toBeGreaterThan(0)
    expect(manifestPad('joey')).toBe('/joey/manifest.webmanifest')
  })
  test('lange naam → korte generieke short_name', () => {
    expect(ptManifest('x', 'Maximiliaan-Alexander').short_name).toBe('PT-dashboard')
  })
})
