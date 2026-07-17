// Tests voor de CRM-kern: de groep↔status-regel en de invoervalidatie. De kern
// die bewaakt wordt: een status die niet bij een groep hoort (een klant-status op
// een teamlid) mag NOOIT door de grens komen — de DB kent alleen de unie, deze
// laag kent de precieze combinatie.

import { describe, expect, it } from 'vitest'
import {
  GROEPEN,
  GROEP_DEFS,
  beginStatus,
  isGeldigeStatusVoorGroep,
  isGroep,
  leesNieuwePersoon,
  leesPersoonWijziging,
  statusDef,
  statussenVoorGroep,
} from '@/lib/lifeos/crm/crm'

describe('groepen en statussen', () => {
  it('kent precies drie groepen', () => {
    expect(GROEPEN).toEqual(['pt_klant', 'budel_team', 'pt_team'])
    expect(GROEP_DEFS).toHaveLength(3)
  })

  it('isGroep herkent geldige en weigert ongeldige groepen', () => {
    expect(isGroep('pt_klant')).toBe(true)
    expect(isGroep('pt_klanten')).toBe(false)
    expect(isGroep(42)).toBe(false)
    expect(isGroep(null)).toBe(false)
  })

  it('geeft de klant-pipeline op volgorde', () => {
    const keys = statussenVoorGroep('pt_klant').map((s) => s.key)
    expect(keys).toEqual([
      'moet_benaderen',
      'benaderd',
      'wacht_op_reactie',
      'afspraak_ingepland',
      'actieve_klant',
      'inactief',
    ])
  })

  it('geeft beide teams dezelfde (simpelere) statusset', () => {
    const budel = statussenVoorGroep('budel_team').map((s) => s.key)
    const pt = statussenVoorGroep('pt_team').map((s) => s.key)
    expect(budel).toEqual(pt)
    expect(budel).toEqual(['nieuw', 'actief', 'aandacht_nodig', 'gesprek_plannen', 'inactief'])
  })

  it('elke statusset heeft oplopende, aaneengesloten volgorde vanaf 0', () => {
    for (const groep of GROEPEN) {
      const volgordes = statussenVoorGroep(groep).map((s) => s.volgorde)
      expect(volgordes).toEqual(volgordes.map((_, i) => i))
    }
  })

  it('beginStatus is de eerste kolom van de groep', () => {
    expect(beginStatus('pt_klant')).toBe('moet_benaderen')
    expect(beginStatus('budel_team')).toBe('nieuw')
  })
})

describe('isGeldigeStatusVoorGroep — de kernregel', () => {
  it('accepteert een status die bij de groep hoort', () => {
    expect(isGeldigeStatusVoorGroep('pt_klant', 'afspraak_ingepland')).toBe(true)
    expect(isGeldigeStatusVoorGroep('pt_team', 'aandacht_nodig')).toBe(true)
  })

  // De fout die deze laag bestaat om te voorkomen: een klant-status op een teamlid.
  it('weigert een status van een andere groep', () => {
    expect(isGeldigeStatusVoorGroep('budel_team', 'afspraak_ingepland')).toBe(false)
    expect(isGeldigeStatusVoorGroep('pt_klant', 'aandacht_nodig')).toBe(false)
  })

  it('weigert een verzonnen status', () => {
    expect(isGeldigeStatusVoorGroep('pt_klant', 'benaderdd')).toBe(false)
  })

  it("'inactief' hoort bij beide soorten groepen", () => {
    expect(isGeldigeStatusVoorGroep('pt_klant', 'inactief')).toBe(true)
    expect(isGeldigeStatusVoorGroep('budel_team', 'inactief')).toBe(true)
  })

  it('statusDef geeft de definitie of null', () => {
    expect(statusDef('pt_klant', 'moet_benaderen')?.tint).toBe('actie')
    expect(statusDef('pt_klant', 'aandacht_nodig')).toBeNull()
  })
})

describe('leesNieuwePersoon', () => {
  it('leest een minimale persoon (alleen naam + groep) met de begin-status', () => {
    const uit = leesNieuwePersoon({ naam: '  Jan  ', groep: 'pt_klant' })
    expect(uit.ok).toBe(true)
    if (uit.ok) {
      expect(uit.waarde.naam).toBe('Jan') // getrimd
      expect(uit.waarde.status).toBe('moet_benaderen') // begin-kolom
      expect(uit.waarde.followUpDatum).toBeNull()
    }
  })

  it('accepteert een expliciete status die bij de groep hoort', () => {
    const uit = leesNieuwePersoon({ naam: 'Kim', groep: 'budel_team', status: 'actief' })
    expect(uit.ok && uit.waarde.status).toBe('actief')
  })

  it('weigert een status die niet bij de groep hoort', () => {
    const uit = leesNieuwePersoon({ naam: 'Kim', groep: 'budel_team', status: 'actieve_klant' })
    expect(uit.ok).toBe(false)
  })

  it('weigert een lege naam en een onbekende groep', () => {
    expect(leesNieuwePersoon({ naam: '   ', groep: 'pt_klant' }).ok).toBe(false)
    expect(leesNieuwePersoon({ naam: 'Jan', groep: 'iets' }).ok).toBe(false)
  })

  it('weigert een ongeldige follow-up-datum en accepteert een geldige', () => {
    expect(leesNieuwePersoon({ naam: 'Jan', groep: 'pt_klant', followUpDatum: '2026/07/17' }).ok).toBe(false)
    const goed = leesNieuwePersoon({ naam: 'Jan', groep: 'pt_klant', followUpDatum: '2026-07-17' })
    expect(goed.ok && goed.waarde.followUpDatum).toBe('2026-07-17')
  })

  it('leest lege optionele velden als null, niet als lege string', () => {
    const uit = leesNieuwePersoon({ naam: 'Jan', groep: 'pt_klant', telefoon: '  ', bijzonderheden: '' })
    expect(uit.ok).toBe(true)
    if (uit.ok) {
      expect(uit.waarde.telefoon).toBeNull()
      expect(uit.waarde.bijzonderheden).toBeNull()
    }
  })
})

describe('leesPersoonWijziging', () => {
  it('wijzigt alleen de meegestuurde velden', () => {
    const uit = leesPersoonWijziging({ status: 'benaderd' }, 'pt_klant')
    expect(uit.ok).toBe(true)
    if (uit.ok) {
      expect(uit.waarde).toEqual({ status: 'benaderd' })
    }
  })

  it('valideert een nieuwe status tegen de MEEGEGEVEN groep', () => {
    expect(leesPersoonWijziging({ status: 'actieve_klant' }, 'pt_klant').ok).toBe(true)
    expect(leesPersoonWijziging({ status: 'actieve_klant' }, 'budel_team').ok).toBe(false)
  })

  it('accepteert een float-sortering (voor slepen tussen twee tegels)', () => {
    const uit = leesPersoonWijziging({ sortering: 1.5 }, 'pt_klant')
    expect(uit.ok && uit.waarde.sortering).toBe(1.5)
  })

  it('kan de follow-up-datum wissen met null', () => {
    const uit = leesPersoonWijziging({ followUpDatum: null }, 'pt_klant')
    expect(uit.ok).toBe(true)
    if (uit.ok) expect(uit.waarde.followUpDatum).toBeNull()
  })

  it('weigert een lege wijziging', () => {
    expect(leesPersoonWijziging({}, 'pt_klant').ok).toBe(false)
  })

  it('weigert een niet-eindige sortering', () => {
    expect(leesPersoonWijziging({ sortering: Infinity }, 'pt_klant').ok).toBe(false)
    expect(leesPersoonWijziging({ sortering: 'eerste' }, 'pt_klant').ok).toBe(false)
  })
})
