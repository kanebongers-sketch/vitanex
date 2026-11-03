import { describe, expect, it } from 'vitest'
import { RECHTEN } from '@/lib/club/kern/medewerker'
import { ONDERDELEN, PLEKKEN, MAX_SCHERMEN, PRIKBORD_KLAAR, doelVoorToets, inGebruik, isHier, menuOnderdeel, nogLeeg, onderbalkPlekken, plekOp, plekkenMet, schermenVan, sectiesVoor, toetsTekst } from './onderdelen'
import { clubHref } from './kop-hulp'
import { ledenItems, ledenUitAntwoord, zoekHref, zoekItems, zoektLeden } from './zoeken'
import { stappenNaarLid } from './ClubKruimel'

// Vijf plekken (ontwerp "Club in 10 minuten", docs/club/EENVOUD-10-MINUTEN.md):
// Vandaag, Leden, Rooster, Training en Beheer; op de telefoon dezelfde vijf
// onderin zonder Meer; altijd binnen de rechten van de rol.

const TRAINER = ['vandaag', ...RECHTEN.trainer]
const INSTRUCTEUR = ['vandaag', ...RECHTEN.instructeur]
const labels = (lijst: readonly { label: string }[]) => lijst.map((o) => o.label)
const sleutels = (lijst: readonly { sleutel: string }[]) => lijst.map((o) => o.sleutel)
const STAND_LEEG = { takenlijsten: 0, prikbord: 0, allesTonen: false }

describe('vijf plekken', () => {
  it('in vaste volgorde, met eigen letters', () => {
    expect(labels(PLEKKEN)).toEqual(['Vandaag', 'Leden', 'Rooster', 'Training', 'Beheer'])
    expect(PLEKKEN.map((p) => toetsTekst(p))).toEqual(['G V', 'G L', 'G R', 'G T', 'G B'])
  })

  it('wie alles mag, ziet de vijf met hun schermen, hoogstens drie per plek', () => {
    expect(labels(plekkenMet([], null))).toEqual(['Vandaag', 'Leden', 'Rooster', 'Training', 'Beheer'])
    expect(labels(schermenVan('vandaag'))).toEqual(['Vandaag', 'Taken', PRIKBORD_KLAAR ? 'Prikbord' : 'Notities'])
    expect(labels(schermenVan('leden'))).toEqual(['Leden', 'Leads', 'Ledenapp'])
    expect(labels(schermenVan('rooster'))).toEqual(['Lessen', 'Agenda', 'Diensten'])
    expect(labels(schermenVan('training'))).toEqual(["Schema's", 'Voeding'])
    expect(labels(schermenVan('beheer'))).toEqual(['Cijfers', 'Instellingen'])
    for (const p of PLEKKEN) expect(schermenVan(p.sleutel).length).toBeLessThanOrEqual(MAX_SCHERMEN)
  })

  it('elk onderdeel heeft een plek, en niets staat dubbel in het menu', () => {
    const inMenu = PLEKKEN.flatMap((p) => sleutels(schermenVan(p.sleutel)))
    expect(new Set(inMenu).size).toBe(inMenu.length)
    for (const o of ONDERDELEN) expect(PLEKKEN.map((p) => p.sleutel), o.sleutel).toContain(o.plek)
  })

  it('wat onder een scherm woont, staat er niet naast (Berichten onder Ledenapp, Rapporten onder Cijfers)', () => {
    const inMenu = PLEKKEN.flatMap((p) => sleutels(schermenVan(p.sleutel)))
    for (const s of ['berichten', 'community', 'challenges', 'rapporten', 'afspraken', 'checkin', 'opvolgen', 'hulp', 'huisstijl']) expect(inMenu).not.toContain(s)
  })

  it('mag je het scherm erboven niet, maar dit wel, dan staat het in zijn plaats: er verdwijnt geen functie', () => {
    // Trainer (oude rechten): Afspraken maar geen Agenda.
    expect(labels(schermenVan('rooster', [], TRAINER))).toEqual(['Lessen', 'Afspraken', 'Diensten'])
    // Clubmanager met Berichten maar zonder Ledenapp.
    expect(labels(schermenVan('leden', [], ['vandaag', 'leden', 'berichten', 'community']))).toEqual(['Leden', 'Berichten'])
    // Administratie met Rapporten maar zonder Cijfers.
    expect(labels(schermenVan('beheer', [], ['rapporten'], { instellingen: false }))).toEqual(['Rapporten'])
  })

  it('Instellingen staat alleen in Beheer voor wie iets mag instellen', () => {
    expect(sleutels(schermenVan('beheer', [], ['vandaag', 'cijfers'], { instellingen: false }))).toEqual(['cijfers'])
    expect(sleutels(schermenVan('beheer', [], ['vandaag', 'cijfers'], { instellingen: true }))).toEqual(['cijfers', 'beheer'])
    expect(sleutels(plekkenMet([], ['vandaag', 'leden'], { instellingen: false }))).not.toContain('beheer')
  })

  it('instructeur: Vandaag en Rooster', () => {
    expect(labels(plekkenMet([], INSTRUCTEUR, { instellingen: false }))).toEqual(['Vandaag', 'Rooster'])
    expect(labels(schermenVan('rooster', [], INSTRUCTEUR))).toEqual(['Lessen', 'Diensten'])
  })

  it('een onderdeel dat uit staat of niet is afgenomen, staat er niet', () => {
    expect(labels(schermenVan('vandaag', ['taken'], null))).not.toContain('Taken')
    expect(labels(schermenVan('training', ['training'], null))).toEqual(['Voeding'])
  })
})

describe('verbergen tot gebruikt', () => {
  it('Taken (en het Prikbord) pas als er iets in staat; onbekend telt als in gebruik', () => {
    expect(inGebruik('taken', STAND_LEEG)).toBe(false)
    expect(inGebruik('taken', { ...STAND_LEEG, takenlijsten: 2 })).toBe(true)
    expect(inGebruik('taken', { ...STAND_LEEG, takenlijsten: null })).toBe(true)
    expect(inGebruik('leden', STAND_LEEG)).toBe(true)
    expect(inGebruik('taken', { ...STAND_LEEG, allesTonen: true })).toBe(true)
    expect(nogLeeg(STAND_LEEG)).toContain('taken')
    expect(nogLeeg({ ...STAND_LEEG, allesTonen: true })).toEqual([])
  })

  it('een leeg scherm valt uit het menu, behalve als je er bent of als de plek anders leeg wordt', () => {
    const leeg = nogLeeg(STAND_LEEG)
    expect(labels(schermenVan('vandaag', [], null, { nogLeeg: leeg }))).not.toContain('Taken')
    expect(labels(schermenVan('vandaag', [], null, { nogLeeg: leeg, pad: '/club/taken/week' }))).toContain('Taken')
    expect(labels(schermenVan('vandaag', [], ['taken'], { nogLeeg: leeg }))).toEqual(['Taken'])
  })
})

describe('onderbalk (telefoon)', () => {
  it('de vijf plekken zonder Meer, dezelfde als op de pc', () => {
    expect(labels(onderbalkPlekken([], null))).toEqual(labels(plekkenMet([], null)))
    expect(onderbalkPlekken([], null)).toHaveLength(5)
  })

  it('trainer: vier plekken, nooit iets buiten de rechten', () => {
    expect(labels(onderbalkPlekken([], TRAINER, { instellingen: false }))).toEqual(['Vandaag', 'Leden', 'Rooster', 'Training'])
    for (const rol of Object.values(RECHTEN)) {
      const mag = ['vandaag', ...rol]
      for (const p of onderbalkPlekken([], mag, { instellingen: false })) {
        for (const o of schermenVan(p.sleutel, [], mag, { instellingen: false })) expect(mag, o.sleutel).toContain(o.sleutel)
      }
    }
  })

  it('met een plek is er geen onderbalk', () => {
    expect(onderbalkPlekken([], ['personeel'], { instellingen: false })).toEqual([])
  })
})

describe('waar je bent', () => {
  it('elk pad licht zijn plek en scherm op', () => {
    const gevallen: [string, string, string][] = [
      ['/club', 'vandaag', 'vandaag'],
      ['/club/taken/week', 'vandaag', 'taken'],
      ['/club/checkin/kiosk', 'vandaag', 'vandaag'],
      ['/club/opvolgen', 'vandaag', 'vandaag'],
      ['/club/leden/abc', 'leden', 'leden'],
      ['/club/berichten', 'leden', 'app'],
      ['/club/community', 'leden', 'app'],
      ['/club/afspraken', 'rooster', 'agenda'],
      ['/club/rapporten', 'beheer', 'cijfers'],
      ['/club/beheer/team', 'beheer', 'beheer'],
      ['/club/huisstijl', 'beheer', 'beheer'],
      ['/club/instellingen/zalen', 'beheer', 'beheer'],
      ['/club/koppelingen', 'beheer', 'beheer'],
      ['/club/training', 'training', 'schemas'],
    ]
    for (const [pad, plek, scherm] of gevallen) {
      expect(plekOp(pad), pad).toBe(plek)
      expect(menuOnderdeel(pad)?.sleutel, pad).toBe(scherm)
    }
  })

  it('Hulp, Wat is nieuw en het platform horen bij geen plek', () => {
    for (const pad of ['/club/hulp', '/club/hulp/meldingen', '/club/nieuw', '/club/platform']) expect(plekOp(pad), pad).toBeNull()
  })

  it('staat een onderdeel in de plaats van zijn scherm, dan licht het zelf op', () => {
    const afspraken = ONDERDELEN.find((o) => o.sleutel === 'afspraken')
    expect(afspraken && isHier(afspraken, '/club/afspraken')).toBe(true)
  })
})

describe('sneltoetsen (G en dan een letter)', () => {
  it('elke letter hoort bij een plek of een onderdeel, nooit dubbel', () => {
    const letters = [...PLEKKEN.map((p) => p.toets), ...ONDERDELEN.flatMap((o) => (o.toets ? [o.toets] : []))]
    expect(new Set(letters).size).toBe(letters.length)
    expect(letters).not.toContain('g')
  })

  it('V, L, R, T en B openen de plekken', () => {
    expect(doelVoorToets('v', [], TRAINER)).toBe('')
    expect(doelVoorToets('L', [], TRAINER)).toBe('/leden')
    expect(doelVoorToets('r', [], TRAINER)).toBe('/rooster')
    expect(doelVoorToets('t', [], TRAINER)).toBe('/training')
    expect(doelVoorToets('b', [], null)).toBe('/cijfers')
    expect(doelVoorToets('b', [], TRAINER, false)).toBeNull()
  })

  it('de oude letters blijven: G K Taken, G E Leads, G A Agenda, G N, G I, G H, G C en G O', () => {
    expect(doelVoorToets('k', [], TRAINER)).toBe('/taken')
    expect(doelVoorToets('e', [], TRAINER)).toBe('/leads')
    expect(doelVoorToets('a', [], null)).toBe('/agenda')
    expect(doelVoorToets('n', [], null)).toBe(PRIKBORD_KLAAR ? '/prikbord' : '/notities')
    expect(doelVoorToets('i', [], null)).toBe('/beheer')
    expect(doelVoorToets('h', [], ['vandaag'], false)).toBe('/hulp')
    expect(clubHref(doelVoorToets('c', [], TRAINER) ?? '', 'budel')).toBe('/club?v=budel#checkin')
    expect(clubHref(doelVoorToets('o', [], TRAINER) ?? '', 'budel')).toBe('/club?v=budel#opvolgen')
  })

  it('niets wat de rol niet mag of wat uit staat', () => {
    expect(doelVoorToets('k', [], INSTRUCTEUR)).toBeNull()
    expect(doelVoorToets('i', [], TRAINER, false)).toBeNull()
    expect(doelVoorToets('c', ['checkin'], TRAINER)).toBeNull()
    expect(doelVoorToets('c', [], TRAINER.filter((s) => s !== 'vandaag'))).toBeNull()
    expect(doelVoorToets('x', [], null)).toBeNull()
  })

  it('de toets staat in het zoekvenster: de plek op haar eerste scherm', () => {
    const items = zoekItems({ uit: [], toegestaan: TRAINER, medewerker: true, betalenAan: false }, false)
    expect(items.find((i) => i.id === 'menu-leden')?.toets).toBe('G L')
    expect(items.find((i) => i.id === 'menu-taken')?.toets).toBe('G K')
    expect(toetsTekst({ toets: undefined })).toBeNull()
  })
})

describe('secties op Vandaag', () => {
  it('check-in en opvolgen, binnen de rechten', () => {
    expect(sectiesVoor([], null).map((o) => o.sectie)).toEqual(['checkin', 'opvolgen'])
    expect(sectiesVoor([], INSTRUCTEUR)).toEqual([])
    expect(sectiesVoor(['checkin'], TRAINER).map((o) => o.sleutel)).toEqual(['opvolgen'])
  })

  it('een link met anker houdt de vestiging voor het anker', () => {
    expect(clubHref('#taken', 'budel')).toBe('/club?v=budel#taken')
    expect(clubHref('#taken', null)).toBe('/club#taken')
    expect(clubHref('/leden', 'budel')).toBe('/club/leden?v=budel')
  })
})

describe('leden zoeken', () => {
  it('pas vanaf twee tekens', () => {
    expect(zoektLeden('a')).toBe(false)
    expect(zoektLeden(' an ')).toBe(true)
  })

  it('leest alleen geldige rijen uit het antwoord', () => {
    expect(ledenUitAntwoord({ leden: [{ id: 'x', naam: 'Anna', lidnummer: 'FF1', status: 'Actief' }, { naam: 'zonder id' }, null] })).toEqual([
      { id: 'x', naam: 'Anna', lidnummer: 'FF1', status: 'Actief' },
    ])
    expect(ledenUitAntwoord(null)).toEqual([])
    expect(ledenUitAntwoord({ leden: 'nee' })).toEqual([])
  })

  it('een lid opent de ledenkaart, de laatste regel de lijst met de zoekterm', () => {
    const items = ledenItems([{ id: 'abc', naam: 'Anna de Vries', lidnummer: 'FF1', status: 'Actief' }], ' anna ')
    expect(items.map((i) => i.label)).toEqual(['Anna de Vries', 'Alle leden met "anna"'])
    expect(items[0].uitleg).toBe('Lidnummer FF1 · Actief')
    expect(zoekHref(items[0], 'budel')).toBe('/club/leden/abc?v=budel')
    expect(zoekHref(items[1], 'budel')).toBe('/club/leden?q=anna&v=budel')
  })
})

describe('kruimelpad naar een lid', () => {
  it('Leden › naam, met de vestiging', () => {
    expect(stappenNaarLid(true, { id: 'abc', naam: 'Anna' }, 'budel')).toEqual([
      { label: 'Leden', href: '/club/leden?v=budel' },
      { label: 'Anna', href: '/club/leden/abc?v=budel' },
    ])
  })

  it('leeg voor wie Leden niet mag', () => {
    expect(stappenNaarLid(false, { id: 'abc', naam: 'Anna' }, 'budel')).toEqual([])
  })
})
