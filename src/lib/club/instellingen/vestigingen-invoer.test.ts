import { describe, expect, it } from 'vitest'
import { STANDAARD_OPENINGSTIJDEN, heeftEigenOpeningstijden, isStandaardOpen, leesNieuweVestiging, leesVestigingWijziging, maakVestigingSlug, nieuweVolgorde } from './vestigingen-invoer'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'

describe('vestigingen beheren', () => {
  it('maakt een geldige, unieke slug uit de naam', () => {
    expect(maakVestigingSlug('Eindhoven Centrum', 'K3F9')).toBe('eindhoven-centrum-k3f9')
    expect(maakVestigingSlug("  's-Hertogenbosch Oost! ", 'ab12')).toBe('s-hertogenbosch-oost-ab12')
    expect(maakVestigingSlug('Café Zuid', 'x1')).toBe('cafe-zuid-x1')
    expect(maakVestigingSlug('!!!', 'a1')).toBe('vestiging-a1')
    expect(isVestigingSlug(maakVestigingSlug('x'.repeat(80), 'zz99'))).toBe(true)
  })

  it('leest een nieuwe vestiging', () => {
    expect(leesNieuweVestiging({ naam: '  Noord  ', adres: '' })).toEqual({ ok: true, waarde: { naam: 'Noord', adres: null } })
    expect(leesNieuweVestiging({ naam: ' ' }).ok).toBe(false)
    expect(leesNieuweVestiging({ naam: 'x'.repeat(61) }).ok).toBe(false)
  })

  it('leest een wijziging en weigert lege invoer', () => {
    expect(leesVestigingWijziging({ naam: 'Zuid', standaard: true, verplaats: -1 })).toEqual({ ok: true, waarde: { naam: 'Zuid', standaard: true, verplaats: -1 } })
    expect(leesVestigingWijziging({ verplaats: 2 }).ok).toBe(false)
    expect(leesVestigingWijziging({}).ok).toBe(false)
  })

  it('verplaatst een vestiging een plek en blijft binnen de lijst', () => {
    expect([...nieuweVolgorde(['a', 'b', 'c'], 'b', -1)]).toEqual([['b', 1], ['a', 2], ['c', 3]])
    expect([...nieuweVolgorde(['a', 'b', 'c'], 'c', 1)]).toEqual([['a', 1], ['b', 2], ['c', 3]])
  })
})

describe('contact van een vestiging', () => {
  it('leest telefoon en e-mail en weigert onzin', () => {
    expect(leesVestigingWijziging({ adres: 'Dorpsstraat 1', telefoon: '085-060 3424', email: 'Budel@Voorbeeld.nl' })).toEqual({ ok: true, waarde: { adres: 'Dorpsstraat 1', telefoon: '085-060 3424', email: 'budel@voorbeeld.nl' } })
    expect(leesVestigingWijziging({ telefoon: '' })).toEqual({ ok: true, waarde: { telefoon: null } })
    expect(leesVestigingWijziging({ telefoon: 'bel me' }).ok).toBe(false)
    expect(leesVestigingWijziging({ email: 'geen-mail' }).ok).toBe(false)
  })
})

describe('standaard openingstijden van een nieuwe vestiging', () => {
  it('herkent de plaatshouder en niets anders', () => {
    expect(isStandaardOpen(STANDAARD_OPENINGSTIJDEN)).toBe(true)
    expect(isStandaardOpen({ ...STANDAARD_OPENINGSTIJDEN, 1: ['06:00', '23:00'] })).toBe(false)
    const zonderZondag: Record<string, [string, string]> = { ...STANDAARD_OPENINGSTIJDEN }
    delete zonderZondag['7']
    expect(isStandaardOpen(zonderZondag)).toBe(false)
  })

  it('eigen tijden: minstens een open dag en niet de plaatshouder', () => {
    expect(heeftEigenOpeningstijden(STANDAARD_OPENINGSTIJDEN)).toBe(false)
    expect(heeftEigenOpeningstijden({})).toBe(false)
    expect(heeftEigenOpeningstijden(null)).toBe(false)
    expect(heeftEigenOpeningstijden({ 1: ['06:00', '23:00'] })).toBe(true)
  })
})
