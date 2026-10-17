import { describe, expect, it } from 'vitest'
import type { AfspraakType } from './model'
import { BOEK_HORIZON_DAGEN, boekVenster, eindVan, magGeven, magLidAnnuleren, magLidBoeken, magStatusZetten, magVerplaatsen, volgendeStatussen } from './regels'

const NU = new Date('2026-10-20T10:00:00.000Z')
const UUR = 3_600_000

const TYPE: AfspraakType = {
  id: 't',
  naam: 'Intake',
  duurMin: 45,
  bufferMin: 15,
  kleur: 'amber',
  medewerkerIds: [],
  appBoekbaar: true,
  boekenUrenVooraf: 12,
  annulerenUrenVooraf: 24,
  actief: true,
  volgorde: 1,
}

const over = (uren: number) => new Date(NU.getTime() + uren * UUR)

describe('magGeven', () => {
  const trainer = { id: 'a', rollen: ['trainer'] as const, vestigingen: ['budel'] }
  const instructeur = { id: 'b', rollen: ['instructeur'] as const, vestigingen: ['budel'] }

  it('laat zonder lijst elke trainer van de vestiging toe', () => {
    expect(magGeven(TYPE, trainer, 'budel')).toBe(true)
  })

  it('weigert zonder lijst wie geen trainer is', () => {
    expect(magGeven(TYPE, instructeur, 'budel')).toBe(false)
  })

  it('weigert een medewerker van een andere vestiging', () => {
    expect(magGeven(TYPE, trainer, 'eersel')).toBe(false)
  })

  it('volgt de lijst als die gevuld is, ook voor niet-trainers', () => {
    const type = { medewerkerIds: ['b'] }
    expect(magGeven(type, instructeur, 'budel')).toBe(true)
    expect(magGeven(type, trainer, 'budel')).toBe(false)
  })
})

describe('eindVan', () => {
  it('telt de duur en daarna de buffer op', () => {
    // Act
    const { eind, bezetTot } = eindVan(NU, TYPE)
    // Assert
    expect(eind.toISOString()).toBe('2026-10-20T10:45:00.000Z')
    expect(bezetTot.toISOString()).toBe('2026-10-20T11:00:00.000Z')
  })
})

describe('boekVenster', () => {
  it('begint na de minimale tijd van tevoren en loopt tot de horizon', () => {
    const { vanaf, tot } = boekVenster(TYPE, NU)
    expect(vanaf.toISOString()).toBe(over(12).toISOString())
    expect(tot.getTime() - NU.getTime()).toBe(BOEK_HORIZON_DAGEN * 24 * UUR)
  })
})

describe('magLidBoeken', () => {
  it('staat een tijd ver genoeg vooruit toe', () => {
    expect(magLidBoeken(TYPE, over(13), NU)).toEqual({ ok: true })
  })

  it('weigert te kort van tevoren, met de regel erin', () => {
    const uit = magLidBoeken(TYPE, over(2), NU)
    expect(uit).toEqual({ ok: false, fout: 'Boek minstens 12 uur van tevoren.' })
  })

  it('spreekt bij veelvouden van een dag in dagen', () => {
    const uit = magLidBoeken({ ...TYPE, boekenUrenVooraf: 48 }, over(5), NU)
    expect(uit.ok ? '' : uit.fout).toContain('2 dagen')
  })

  it('weigert een voorbij tijdstip als er geen minimum is', () => {
    const uit = magLidBoeken({ ...TYPE, boekenUrenVooraf: 0 }, over(-1), NU)
    expect(uit.ok ? '' : uit.fout).toBe('Dit tijdstip is al voorbij.')
  })

  it('weigert verder vooruit dan de horizon', () => {
    const uit = magLidBoeken(TYPE, over(24 * (BOEK_HORIZON_DAGEN + 1)), NU)
    expect(uit.ok).toBe(false)
  })

  it('weigert een type dat niet in de app geboekt mag worden', () => {
    expect(magLidBoeken({ ...TYPE, appBoekbaar: false }, over(30), NU).ok).toBe(false)
    expect(magLidBoeken({ ...TYPE, actief: false }, over(30), NU).ok).toBe(false)
  })
})

describe('magLidAnnuleren', () => {
  it('staat annuleren ruim van tevoren toe', () => {
    expect(magLidAnnuleren(TYPE, { status: 'gepland', start: over(30).toISOString() }, NU)).toEqual({ ok: true })
  })

  it('weigert annuleren binnen de grens', () => {
    const uit = magLidAnnuleren(TYPE, { status: 'gepland', start: over(10).toISOString() }, NU)
    expect(uit.ok ? '' : uit.fout).toContain('24 uur')
  })

  it('staat annuleren precies op de grens toe', () => {
    expect(magLidAnnuleren(TYPE, { status: 'gepland', start: over(24).toISOString() }, NU).ok).toBe(true)
  })

  it('weigert een afspraak die niet meer gepland staat', () => {
    expect(magLidAnnuleren(TYPE, { status: 'geannuleerd', start: over(30).toISOString() }, NU).ok).toBe(false)
  })
})

describe('statussen', () => {
  const toekomst = { status: 'gepland' as const, start: over(5).toISOString() }
  const verleden = { status: 'gepland' as const, start: over(-1).toISOString() }

  it('biedt voor een komende afspraak alleen annuleren', () => {
    expect(volgendeStatussen(toekomst, NU)).toEqual(['geannuleerd'])
  })

  it('biedt na de start geweest, niet gekomen en annuleren', () => {
    expect(volgendeStatussen(verleden, NU)).toEqual(['geweest', 'niet_gekomen', 'geannuleerd'])
  })

  it('laat een vergissing terugzetten naar gepland', () => {
    expect(volgendeStatussen({ ...verleden, status: 'geweest' }, NU)).toContain('gepland')
  })

  it('maakt geannuleerd definitief', () => {
    expect(volgendeStatussen({ ...verleden, status: 'geannuleerd' }, NU)).toEqual([])
    expect(magStatusZetten({ ...verleden, status: 'geannuleerd' }, 'gepland', NU).ok).toBe(false)
  })

  it('weigert geweest voor de afspraak begonnen is', () => {
    expect(magStatusZetten(toekomst, 'geweest', NU).ok).toBe(false)
  })

  it('accepteert dezelfde status zonder fout', () => {
    expect(magStatusZetten(toekomst, 'gepland', NU)).toEqual({ ok: true })
  })
})

describe('magVerplaatsen', () => {
  it('kan alleen bij een geplande afspraak', () => {
    expect(magVerplaatsen({ status: 'gepland' }).ok).toBe(true)
    expect(magVerplaatsen({ status: 'geweest' }).ok).toBe(false)
  })
})
