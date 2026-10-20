import { describe, expect, it } from 'vitest'
import { bouwLeadExport, leadExportBestandsnaam, leadNaamKlopt, LEAD_AL_GEWIST, LEAD_IS_LID, magLeadWissen, wisBlokkade, type LeadExportRuw } from './avg'

const GEHEIM = ['org-1', 'lead-1', 'mw-1', 'lid-1', 'les-1', 'h-1']

function ruw(): LeadExportRuw {
  return {
    lead: {
      id: 'lead-1',
      user_id: 'org-1',
      naam: 'Sanne de Vries',
      email: 'sanne@voorbeeld.nl',
      telefoon: '0612345678',
      vestiging: 'budel',
      bron: 'website',
      interesse: 'Groepslessen',
      status: 'proefles',
      medewerker_id: 'mw-1',
      lid_id: 'lid-1',
      proefles_les_id: 'les-1',
      toestemming_contact: true,
      demo: true,
      aangemaakt_op: '2026-10-01T10:00:00Z',
    },
    historie: [{ id: 'h-1', lead_id: 'lead-1', user_id: 'org-1', soort: 'gebeld', tekst: 'Teruggebeld', auteur: 'Tom', op: '2026-10-02T09:00:00Z' }],
    afspraken: [{ start_op: '2026-10-05T09:00:00Z', vestiging: 'budel', medewerker_id: 'mw-1', status: 'gepland', notitie: 'Rugklachten', club_afspraak_typen: { naam: 'Intake' } }],
  }
}

const META = {
  sportschool: 'Voorbeeld Gym',
  gemaaktOp: new Date('2026-10-20T10:00:00Z'),
  vestigingen: new Map([['budel', 'Budel']]),
  medewerkers: new Map([['mw-1', 'Tom Trainer']]),
}

describe('bouwLeadExport', () => {
  it('geeft Nederlandse sleutels met labels en namen in plaats van codes', () => {
    // Arrange + Act
    const uit = bouwLeadExport(ruw(), META)
    const lead = uit.Belangstellende as Record<string, unknown>
    // Assert
    expect(lead.Naam).toBe('Sanne de Vries')
    expect(lead['E-mail']).toBe('sanne@voorbeeld.nl')
    expect(lead.Vestiging).toBe('Budel')
    expect(lead['Hoe binnengekomen']).toBe('Website')
    expect(lead.Status).toBe('Proefles gepland')
    expect(lead.Contactpersoon).toBe('Tom Trainer')
    expect(lead['Lid geworden']).toBe(true)
    const afspraak = (uit.Afspraken as Record<string, unknown>[])[0]
    expect(afspraak['Soort afspraak']).toBe('Intake')
    expect(afspraak.Met).toBe('Tom Trainer')
    expect((uit.Contactmomenten as Record<string, unknown>[])[0].Tekst).toBe('Teruggebeld')
  })

  it('zet nooit user_id of interne ids in het bestand', () => {
    // Act
    const tekst = JSON.stringify(bouwLeadExport(ruw(), META))
    // Assert
    for (const id of GEHEIM) expect(tekst).not.toContain(`"${id}"`)
    expect(tekst).not.toContain('user_id')
    expect(tekst).not.toContain('demo')
  })

  it('toont een onbekende medewerker nooit met zijn id', () => {
    // Act
    const uit = bouwLeadExport(ruw(), { ...META, medewerkers: new Map<string, string>() })
    // Assert
    expect((uit.Belangstellende as Record<string, unknown>).Contactpersoon).toBe('Medewerker (niet meer bekend)')
  })
})

describe('leadExportBestandsnaam', () => {
  it('maakt een veilige naam zonder accenten', () => {
    const op = new Date('2026-10-20T10:00:00Z')
    expect(leadExportBestandsnaam('Zoë van "Dijk"', op)).toBe('gegevens-lead-zoe-van-dijk-2026-10-20.json')
    expect(leadExportBestandsnaam('***', op)).toBe('gegevens-lead-lead-2026-10-20.json')
  })
})

describe('magLeadWissen', () => {
  it('laat Kane, de eigenaar en de clubmanager wissen, een medewerker niet', () => {
    expect(magLeadWissen({ isKane: true, rol: 'beheerder' })).toBe(true)
    expect(magLeadWissen({ isKane: false, rol: 'eigenaar' })).toBe(true)
    expect(magLeadWissen({ isKane: false, rol: 'clubmanager' })).toBe(true)
    expect(magLeadWissen({ isKane: false, rol: 'medewerker' })).toBe(false)
  })
})

describe('leadNaamKlopt', () => {
  it('negeert hoofdletters, accenten en spaties maar eist de hele naam', () => {
    expect(leadNaamKlopt('  sanne   DE vries ', 'Sanne de Vries')).toBe(true)
    expect(leadNaamKlopt('Zoe Jansen', 'Zoë Jansen')).toBe(true)
    expect(leadNaamKlopt('Sanne', 'Sanne de Vries')).toBe(false)
    expect(leadNaamKlopt(42, 'Sanne de Vries')).toBe(false)
    expect(leadNaamKlopt('', '')).toBe(false)
  })
})

describe('wisBlokkade', () => {
  it('weigert een lead die lid werd of al gewist is', () => {
    expect(wisBlokkade({ lidId: null, geanonimiseerdOp: null })).toBeNull()
    expect(wisBlokkade({ lidId: 'lid-1', geanonimiseerdOp: null })).toBe(LEAD_IS_LID)
    expect(wisBlokkade({ lidId: null, geanonimiseerdOp: '2026-10-20T10:00:00Z' })).toBe(LEAD_AL_GEWIST)
  })
})
