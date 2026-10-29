import { describe, expect, it } from 'vitest'
import { actueleSportschool } from './versturen'

// Een eigenaar kan de naam en het adres na het aanmelden aanpassen: de proefmail
// noemt altijd de actuele naam uit club_organisaties.

describe('actueleSportschool', () => {
  const k = { organisatieId: 'org-1', sportschool: 'Oude naam', slug: 'oud' }
  it('neemt de actuele naam en het adres over', () => {
    expect(actueleSportschool([k], [{ id: 'org-1', naam: 'Nieuwe naam', slug: 'nieuw' }])).toEqual([{ organisatieId: 'org-1', sportschool: 'Nieuwe naam', slug: 'nieuw' }])
  })
  it('houdt de naam van het aanmelden als de sportschool niet gevonden is of leeg is', () => {
    expect(actueleSportschool([k], [])).toEqual([k])
    expect(actueleSportschool([k], [{ id: 'org-1', naam: ' ', slug: null }])).toEqual([k])
    expect(actueleSportschool([{ ...k, organisatieId: null }], [{ id: 'org-1', naam: 'X', slug: 'x' }])[0].sportschool).toBe('Oude naam')
  })
})
