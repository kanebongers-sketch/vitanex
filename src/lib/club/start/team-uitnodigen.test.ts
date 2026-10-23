import { describe, expect, it } from 'vitest'
import { uitnodigLink, uitnodigMelding, uitnodigStand } from './team-uitnodigen'

describe('uitnodigStand', () => {
  it('nodigt uit als er een e-mailadres is en nog geen login', () => {
    expect(uitnodigStand('a@b.nl', 'geen', true)).toEqual({ knop: 'Uitnodigen', chip: null, hint: null })
  })

  it('geeft geen knop zonder e-mailadres', () => {
    const s = uitnodigStand(null, 'geen', true)
    expect(s.knop).toBeNull()
    expect(s.hint).toContain('e-mailadres')
  })

  it('laat een actieve login met rust', () => {
    expect(uitnodigStand('a@b.nl', 'actief', true)).toMatchObject({ knop: null, chip: { label: 'Kan inloggen' } })
  })

  it('biedt een nieuwe link bij een lopende of verlopen uitnodiging', () => {
    expect(uitnodigStand('a@b.nl', 'uitgenodigd', true).knop).toBe('Opnieuw uitnodigen')
    expect(uitnodigStand('a@b.nl', 'verlopen', true).knop).toBe('Opnieuw uitnodigen')
  })

  it('nodigt een medewerker met de oude pincode uit om over te stappen', () => {
    expect(uitnodigStand('a@b.nl', 'oud', true).knop).toBe('Uitnodigen')
  })

  it('zegt eerlijk dat inloggen uit staat', () => {
    expect(uitnodigStand('a@b.nl', 'geen', false)).toMatchObject({ knop: null, hint: 'Inloggen voor medewerkers staat nog uit.' })
  })
})

describe('uitnodigLink', () => {
  const pad = '/clubinloggen/medewerker/abc'
  it('zet het pad op het adres van de sportschool', () => {
    expect(uitnodigLink(pad, 'https://aiyourgym.com/budel', 'https://aiyourgym.com')).toBe('https://aiyourgym.com/budel/clubinloggen/medewerker/abc')
  })
  it('valt terug op dit domein en laat een schuine streep aan het eind weg', () => {
    expect(uitnodigLink(pad, null, 'https://aiyourgym.com/')).toBe('https://aiyourgym.com/clubinloggen/medewerker/abc')
  })
  it('weigert alles wat geen uitnodigingspad is', () => {
    expect(uitnodigLink('https://elders.nl/x', null, 'https://aiyourgym.com')).toBeNull()
    expect(uitnodigLink(null, null, 'https://aiyourgym.com')).toBeNull()
  })
})

describe('uitnodigMelding', () => {
  it('zegt eerlijk of er is gemaild', () => {
    expect(uitnodigMelding('verstuurd', 'Sanne', 'sanne@gym.nl')).toMatchObject({ ok: true })
    expect(uitnodigMelding('verstuurd', 'Sanne', 'sanne@gym.nl').tekst).toContain('gemaild naar sanne@gym.nl')
    expect(uitnodigMelding('niet_ingesteld', 'Sanne', 'sanne@gym.nl').tekst).toContain('niets gemaild')
    expect(uitnodigMelding('mislukt', 'Sanne', 'sanne@gym.nl').tekst).toContain('Mailen lukte nu niet')
    expect(uitnodigMelding(null, 'Sanne', 'sanne@gym.nl').ok).toBe(false)
  })
})
