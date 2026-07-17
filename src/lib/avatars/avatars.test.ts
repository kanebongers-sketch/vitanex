import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  avatarPad,
  isOpslagPad,
  padUitPubliekeUrl,
  tekenAvatarUrl,
  GELDIGHEID_SECONDEN,
  _leegCache,
} from './avatars'

beforeEach(() => _leegCache())

describe('avatarPad', () => {
  it('leidt het pad af uit het user-id', () => {
    expect(avatarPad('abc-123')).toBe('abc-123/avatar.jpg')
  })
})

describe('isOpslagPad — pad of oude URL?', () => {
  it('herkent een pad', () => {
    expect(isOpslagPad('abc-123/avatar.jpg')).toBe(true)
  })

  it('laat volledige URLs met rust', () => {
    expect(isOpslagPad('https://x.supabase.co/storage/v1/object/public/avatars/a/avatar.jpg')).toBe(false)
    expect(isOpslagPad('http://localhost/x.jpg')).toBe(false)
    expect(isOpslagPad('data:image/png;base64,iVBOR')).toBe(false)
    expect(isOpslagPad('blob:https://app/1234')).toBe(false)
  })

  it('leeg is geen pad', () => {
    expect(isOpslagPad('')).toBe(false)
  })
})

describe('padUitPubliekeUrl — de datamigratie van 047 in code', () => {
  it('haalt het pad uit een publieke avatar-URL', () => {
    expect(
      padUitPubliekeUrl('https://x.supabase.co/storage/v1/object/public/avatars/u1/avatar.jpg'),
    ).toBe('u1/avatar.jpg')
  })

  it('gooit de cache-bust weg', () => {
    expect(
      padUitPubliekeUrl('https://x.supabase.co/storage/v1/object/public/avatars/u1/avatar.jpg?t=1699999'),
    ).toBe('u1/avatar.jpg')
  })

  it('geeft null bij een URL die er niet over gaat', () => {
    expect(padUitPubliekeUrl('https://elders.nl/foto.jpg')).toBeNull()
    expect(padUitPubliekeUrl('u1/avatar.jpg')).toBeNull()
  })
})

describe('tekenAvatarUrl — bundelen en cachen', () => {
  it('bundelt alles uit dezelfde tick tot één aanroep', async () => {
    // Dit is de hele reden dat deze module bestaat: een teamlijst rendert
    // tientallen Avatars tegelijk. Zonder bundelen is dat een N+1.
    const tekenaar = vi.fn(async (paden: string[]) =>
      new Map(paden.map(p => [p, `https://signed/${p}`])),
    )

    const [a, b, c] = await Promise.all([
      tekenAvatarUrl('u1/avatar.jpg', tekenaar),
      tekenAvatarUrl('u2/avatar.jpg', tekenaar),
      tekenAvatarUrl('u3/avatar.jpg', tekenaar),
    ])

    expect(tekenaar).toHaveBeenCalledTimes(1)
    expect(tekenaar.mock.calls[0][0].sort()).toEqual(['u1/avatar.jpg', 'u2/avatar.jpg', 'u3/avatar.jpg'])
    expect(a).toBe('https://signed/u1/avatar.jpg')
    expect(b).toBe('https://signed/u2/avatar.jpg')
    expect(c).toBe('https://signed/u3/avatar.jpg')
  })

  it('vraagt hetzelfde pad maar één keer, ook binnen één tick', async () => {
    const tekenaar = vi.fn(async (paden: string[]) =>
      new Map(paden.map(p => [p, `https://signed/${p}`])),
    )

    await Promise.all([
      tekenAvatarUrl('u1/avatar.jpg', tekenaar),
      tekenAvatarUrl('u1/avatar.jpg', tekenaar),
    ])

    expect(tekenaar.mock.calls[0][0]).toEqual(['u1/avatar.jpg'])
  })

  it('hergebruikt de cache in een volgende tick', async () => {
    const tekenaar = vi.fn(async (paden: string[]) =>
      new Map(paden.map(p => [p, `https://signed/${p}`])),
    )

    await tekenAvatarUrl('u1/avatar.jpg', tekenaar)
    await tekenAvatarUrl('u1/avatar.jpg', tekenaar)

    expect(tekenaar).toHaveBeenCalledTimes(1)
  })

  it('tekent opnieuw zodra de URL bijna verlopen is', async () => {
    const tekenaar = vi.fn(async (paden: string[]) =>
      new Map(paden.map(p => [p, `https://signed/${p}`])),
    )

    let klok = 1_000_000
    const nu = () => klok

    await tekenAvatarUrl('u1/avatar.jpg', tekenaar, nu)
    expect(tekenaar).toHaveBeenCalledTimes(1)

    // Een URL die tijdens het kijken verloopt is een kapot plaatje, dus we
    // verversen ruim vóór het einde.
    klok += GELDIGHEID_SECONDEN * 1000
    await tekenAvatarUrl('u1/avatar.jpg', tekenaar, nu)
    expect(tekenaar).toHaveBeenCalledTimes(2)
  })

  it('geeft null als de tekenaar het pad niet teruggeeft (RLS weigert, of geen foto)', async () => {
    const tekenaar = vi.fn(async () => new Map<string, string>())
    expect(await tekenAvatarUrl('u1/avatar.jpg', tekenaar)).toBeNull()
  })

  it('cachet een mislukking niet — een weigering nu is geen weigering straks', async () => {
    const leeg = vi.fn(async () => new Map<string, string>())
    await tekenAvatarUrl('u1/avatar.jpg', leeg)

    const vol = vi.fn(async (paden: string[]) =>
      new Map(paden.map(p => [p, `https://signed/${p}`])),
    )
    expect(await tekenAvatarUrl('u1/avatar.jpg', vol)).toBe('https://signed/u1/avatar.jpg')
  })
})
