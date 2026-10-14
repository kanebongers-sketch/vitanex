import { describe, expect, it } from 'vitest'
import {
  LESTYPE_SCHEMA,
  MEDEWERKER_SCHEMA,
  SERIE_SCHEMA,
  ZAAL_SCHEMA,
  controleerLooptijd,
  leesNieuw,
  leesRegelsInvoer,
  leesVolgensSchema,
} from './validatie'

const ID = '33333333-3333-4333-8333-333333333333'
const OPEN = [{ van: '06:00', tot: '23:00' }, null, null, null, null, null, null]
const REGELS = { annuleerUren: 2, noShowDrempel: 3, noShowBlokkadeDagen: 7, reserveerDagenVooruit: 7, maxOpenReserveringen: 5, checkinVensterMin: 15 }

describe('leesRegelsInvoer', () => {
  it('geeft regels en openingstijden in databasevorm', () => {
    const r = leesRegelsInvoer({ vestiging: 'budel', regels: REGELS, openingstijden: OPEN })
    expect(r).toEqual({
      ok: true,
      waarde: {
        vestiging: 'budel',
        regels: { annuleer_uren: 2, no_show_drempel: 3, no_show_blokkade_dagen: 7, reserveer_dagen_vooruit: 7, max_open_reserveringen: 5, checkin_venster_min: 15 },
        openingstijden: { '1': ['06:00', '23:00'] },
      },
    })
  })

  it('weigert waarden buiten de grenzen in plaats van ze stil aan te passen', () => {
    const r = leesRegelsInvoer({ vestiging: 'budel', regels: { ...REGELS, annuleerUren: 100 }, openingstijden: OPEN })
    expect(r.ok).toBe(false)
    expect(leesRegelsInvoer({ vestiging: 'parijs', regels: REGELS, openingstijden: OPEN }).ok).toBe(false)
  })
})

describe('zalen en lestypen', () => {
  it('leest een nieuwe zaal met standaard actief', () => {
    expect(leesNieuw({ naam: ' Zaal 3 ', capaciteit: '20' }, ZAAL_SCHEMA, { actief: true })).toEqual({ ok: true, waarde: { naam: 'Zaal 3', capaciteit: 20, actief: true } })
    expect(leesNieuw({ naam: '', capaciteit: 20 }, ZAAL_SCHEMA, { actief: true }).ok).toBe(false)
  })

  it('wijzigt alleen meegegeven velden', () => {
    expect(leesVolgensSchema({ actief: false }, ZAAL_SCHEMA, true)).toEqual({ ok: true, waarde: { actief: false } })
    expect(leesVolgensSchema({}, ZAAL_SCHEMA, true).ok).toBe(false)
  })

  it('zet invoernamen om naar kolomnamen', () => {
    const r = leesNieuw({ naam: 'Yoga', soort: 'mind_body', duurMin: 60, intensiteit: 1 }, LESTYPE_SCHEMA, { actief: true, omschrijving: null })
    expect(r).toMatchObject({ ok: true, waarde: { naam: 'Yoga', soort: 'mind_body', duur_min: 60, intensiteit: 1, omschrijving: null } })
    expect(leesNieuw({ naam: 'X', soort: 'boksen', duurMin: 60, intensiteit: 1 }, LESTYPE_SCHEMA, { actief: true }).ok).toBe(false)
  })
})

describe('weekrooster', () => {
  const serie = { lestypeId: ID, zaalId: '', instructeurId: ID, weekdag: 2, starttijd: '19:00', duurMin: 45, capaciteit: 18, vanaf: '2026-10-14', tot: null, actief: true }

  it('leest een serie, lege zaal wordt null', () => {
    expect(leesNieuw(serie, SERIE_SCHEMA, {})).toMatchObject({ ok: true, waarde: { zaal_id: null, starttijd: '19:00', weekdag: 2 } })
  })

  it('weigert een ongeldige tijd of weekdag', () => {
    expect(leesNieuw({ ...serie, starttijd: '25:00' }, SERIE_SCHEMA, {}).ok).toBe(false)
    expect(leesNieuw({ ...serie, weekdag: 8 }, SERIE_SCHEMA, {}).ok).toBe(false)
  })

  it('controleert de looptijd', () => {
    expect(controleerLooptijd({ vanaf: '2026-10-14', tot: '2026-10-01' })).not.toBeNull()
    expect(controleerLooptijd({ vanaf: '2026-10-14', tot: null })).toBeNull()
  })
})

describe('medewerkers', () => {
  it('leest rollen en vestigingen zonder dubbelen', () => {
    const r = leesNieuw({ naam: 'Kim', email: 'KIM@voorbeeld.nl', rollen: ['instructeur', 'instructeur'], vestigingen: ['budel'] }, MEDEWERKER_SCHEMA, { actief: true })
    expect(r).toEqual({ ok: true, waarde: { naam: 'Kim', email: 'kim@voorbeeld.nl', rollen: ['instructeur'], vestigingen: ['budel'], actief: true } })
  })

  it('weigert een onbekende rol, geen rol of een fout e-mailadres', () => {
    expect(leesNieuw({ naam: 'Kim', rollen: ['baas'], vestigingen: ['budel'] }, MEDEWERKER_SCHEMA, { actief: true }).ok).toBe(false)
    expect(leesNieuw({ naam: 'Kim', rollen: [], vestigingen: ['budel'] }, MEDEWERKER_SCHEMA, { actief: true }).ok).toBe(false)
    expect(leesNieuw({ naam: 'Kim', email: 'kim@', rollen: ['balie'], vestigingen: ['budel'] }, MEDEWERKER_SCHEMA, { actief: true }).ok).toBe(false)
  })
})
