import { describe, expect, it } from 'vitest'
import {
  codeOordeel, kiesVorm, leesAanmeldAfronden, leesAanmeldStart, leesGeboortedatum, leesLinkInvoer, leesSnelToevoegen, leesTelefoon,
  linkStaat, linkUitRij, linkVelden, remAanmelden, vormenVoorVestiging,
} from './regels'
import { snelleStartUitIntake, startschemaPad } from './intake'
import { bouwIntake, gezondheidOpen, kanVerderLichaam, type IntakeKeuze } from './intake-keuze'

const NU = new Date('2026-10-30T10:00:00Z')
const CODE = 'abcdefghijklmnopqrstuvwx'
const V1 = '11111111-1111-4111-8111-111111111111'

describe('aanmeldlinks', () => {
  it('stand: open, verlopen, vol en ingetrokken', () => {
    const basis = { ingetrokkenOp: null, verlooptOp: '2026-11-06T10:00:00Z', maxGebruik: 1, gebruikt: 0 }
    expect(linkStaat(basis, NU)).toBe('open')
    expect(linkStaat({ ...basis, gebruikt: 1 }, NU)).toBe('vol')
    expect(linkStaat({ ...basis, verlooptOp: '2026-10-30T09:59:59Z' }, NU)).toBe('verlopen')
    expect(linkStaat({ ...basis, ingetrokkenOp: '2026-10-29T00:00:00Z' }, NU)).toBe('ingetrokken')
    expect(linkStaat({ ...basis, maxGebruik: null, gebruikt: 500, verlooptOp: null }, NU)).toBe('open')
  })

  it('invoer: eenmalig is een persoon en nooit zonder einddatum', () => {
    expect(leesLinkInvoer({ vestiging: 'centrum', soort: 'eenmalig', geldig: 0 }, ['centrum'], [])).toEqual({ ok: false, fout: 'geldig' })
    const ok = leesLinkInvoer({ vestiging: 'centrum', soort: 'eenmalig', geldig: 7, naam: '  Flyer  ' }, ['centrum'], [])
    expect(ok).toEqual({ ok: true, waarde: { vestiging: 'centrum', vormId: null, soort: 'eenmalig', geldig: 7, naam: 'Flyer' } })
    if (ok.ok) expect(linkVelden(ok.waarde, NU)).toMatchObject({ max_gebruik: 1, verloopt_op: '2026-11-06T10:00:00.000Z' })
  })

  it('invoer: alleen eigen vestigingen en vormen', () => {
    expect(leesLinkInvoer({ vestiging: 'elders', soort: 'herbruikbaar', geldig: 90 }, ['centrum'], [])).toEqual({ ok: false, fout: 'vestiging' })
    expect(leesLinkInvoer({ vestiging: 'centrum', soort: 'herbruikbaar', geldig: 90, vormId: V1 }, ['centrum'], [])).toEqual({ ok: false, fout: 'vorm' })
    const r = leesLinkInvoer({ vestiging: 'centrum', soort: 'herbruikbaar', geldig: 0, vormId: V1 }, ['centrum'], [V1])
    expect(r.ok && linkVelden(r.waarde, NU)).toMatchObject({ max_gebruik: null, verloopt_op: null, vorm_id: V1 })
  })

  it('een rij met een kapotte code telt niet', () => {
    expect(linkUitRij({ id: V1, user_id: V1, vestiging: 'c', code: 'kort', aangemaakt_op: 'x' })).toBeNull()
    expect(linkUitRij({ id: V1, user_id: V1, vestiging: 'c', code: CODE, aangemaakt_op: 'x', gebruikt: 2 })?.gebruikt).toBe(2)
  })
})

describe('aanmelden: invoer', () => {
  const goed = { code: CODE, voornaam: ' Noor ', achternaam: 'de  Vries', email: 'Noor@Voorbeeld.NL', telefoon: '', geboortedatum: '', akkoord: true }

  it('stap 1 leest en normaliseert de gegevens', () => {
    expect(leesAanmeldStart(goed, NU)).toEqual({ soort: 'ok', waarde: { code: CODE, voornaam: 'Noor', achternaam: 'de Vries', email: 'noor@voorbeeld.nl', telefoon: null, geboortedatum: null } })
  })

  it('stap 1 weigert zonder akkoord, met een rare link, en herkent een robot', () => {
    expect(leesAanmeldStart({ ...goed, akkoord: false }, NU)).toEqual({ soort: 'ongeldig', veld: 'akkoord' })
    expect(leesAanmeldStart({ ...goed, code: 'x' }, NU)).toEqual({ soort: 'ongeldig', veld: 'link' })
    expect(leesAanmeldStart({ ...goed, website: 'spam.nl' }, NU)).toEqual({ soort: 'robot' })
    expect(leesAanmeldStart({ ...goed, email: 'geen-adres' }, NU)).toEqual({ soort: 'ongeldig', veld: 'email' })
  })

  it('telefoon en geboortedatum zijn optioneel, maar moeten kloppen als ze er staan', () => {
    expect(leesTelefoon('+31 6 1234 5678')).toBe('+31 6 1234 5678')
    expect(leesTelefoon('bel me')).toBe(false)
    expect(leesGeboortedatum('1994-03-12', NU)).toBe('1994-03-12')
    expect(leesGeboortedatum('2020-01-01', NU)).toBe(false)
    expect(leesGeboortedatum('1994-02-30', NU)).toBe(false)
  })

  it('afronden wil een token, 6 cijfers en een wachtwoord', () => {
    const token = 'a'.repeat(43)
    expect(leesAanmeldAfronden({ token, mailCode: '123 456', wachtwoord: 'x', vormId: 'geen-uuid' })).toEqual({ token, mailCode: '123456', wachtwoord: 'x', vormId: null })
    expect(leesAanmeldAfronden({ token, mailCode: '12345', wachtwoord: 'x' })).toBeNull()
    expect(leesAanmeldAfronden({ token: 'kort', mailCode: '123456', wachtwoord: 'x' })).toBeNull()
  })

  it('de rem: netwerk en link geven 429, een adres te vaak gaat stil', () => {
    expect(remAanmelden(0, 0, 0)).toBe('ok')
    expect(remAanmelden(10, 0, 0)).toBe('netwerk')
    expect(remAanmelden(0, 0, 60)).toBe('link')
    expect(remAanmelden(0, 3, 0)).toBe('stil')
  })

  it('de code: goed, fout, op en verlopen', () => {
    const a = { pogingen: 0, verlooptOp: '2026-10-30T10:30:00Z', afgerondOp: null, codeHash: 'h' }
    expect(codeOordeel(a, true, NU)).toBe('goed')
    expect(codeOordeel(a, false, NU)).toBe('fout')
    expect(codeOordeel({ ...a, codeHash: null }, true, NU)).toBe('fout')
    expect(codeOordeel({ ...a, pogingen: 5 }, true, NU)).toBe('op')
    expect(codeOordeel({ ...a, afgerondOp: 'x' }, true, NU)).toBe('verlopen')
    expect(codeOordeel({ ...a, verlooptOp: '2026-10-30T09:00:00Z' }, true, NU)).toBe('verlopen')
  })

  it('de vorm: vast in de link gaat voor, anders alleen een toegestane keuze', () => {
    expect(kiesVorm('vast', 'ander', ['ander'])).toBe('vast')
    expect(kiesVorm(null, 'ander', ['ander'])).toBe('ander')
    expect(kiesVorm(null, 'vreemd', ['ander'])).toBeNull()
    expect(vormenVoorVestiging([{ actief: true, vestigingen: null }, { actief: false, vestigingen: null }, { actief: true, vestigingen: ['oost'] }], 'centrum')).toHaveLength(1)
  })
})

describe('snel toevoegen', () => {
  it('naam en e-mail zijn genoeg; uitnodigen staat standaard aan', () => {
    expect(leesSnelToevoegen({ voornaam: 'Sem', achternaam: 'Bakker', email: 'SEM@voorbeeld.nl', vestiging: 'centrum' }, ['centrum'], [])).toEqual({
      ok: true, waarde: { voornaam: 'Sem', achternaam: 'Bakker', email: 'sem@voorbeeld.nl', telefoon: null, vestiging: 'centrum', vormId: null, uitnodigen: true },
    })
    expect(leesSnelToevoegen({ voornaam: 'Sem', achternaam: '', email: 'sem@voorbeeld.nl', vestiging: 'centrum' }, ['centrum'], [])).toEqual({ ok: false, fout: 'achternaam' })
    expect(leesSnelToevoegen({ voornaam: 'Sem', achternaam: 'B', email: 'sem@voorbeeld.nl', vestiging: 'centrum', uitnodigen: false }, ['centrum'], []).ok).toBe(true)
  })
})

describe('intake van het lid', () => {
  const keuze: IntakeKeuze = { doelen: ['revalidatie', 'conditie'], gewicht: '', lengte: '', toestemming: true, gezondheid: {}, toelichting: {}, zones: [], niveau: 2, dagen: 7, minuten: 45, voorkeuren: ['thuis'] }

  it('het startschema volgt de intake (doel dat een lid kan kiezen, hooguit 6 dagen, thuis)', () => {
    const s = snelleStartUitIntake({ doelen: keuze.doelen, dagenPerWeek: 7, niveau: 2, voorkeuren: ['thuis'] })
    expect(s).toEqual({ doel: 'conditie', dagen: 6, niveau: 2, materiaal: 'thuis' })
    expect(startschemaPad(s)).toBe('/mijn?tab=schema&start=intake&doel=conditie&dagen=6&niveau=2&materiaal=thuis')
  })

  it('scherm 2: een tikfout in gewicht of lengte houdt tegen, leeg mag', () => {
    expect(kanVerderLichaam({ gewicht: '', lengte: '', toestemming: true })).toBeNull()
    expect(kanVerderLichaam({ gewicht: '8', lengte: '', toestemming: true })).toBe('gewicht')
    expect(kanVerderLichaam({ gewicht: '80', lengte: '1,80', toestemming: true })).toBe('lengte')
    expect(kanVerderLichaam({ gewicht: 'x', lengte: '', toestemming: false })).toBeNull()
  })

  it('scherm 3: overgeslagen is null (niet "overal nee"), ja met uitleg gaat mee', () => {
    expect(gezondheidOpen(keuze)).toBe(7)
    expect((bouwIntake(keuze).antwoorden as Record<string, unknown>).gezondheid).toBeNull()
    const met = bouwIntake({ ...keuze, gezondheid: { hart: true, borstpijn: false, duizelig: false, gewricht: false, bloeddruk: true, zwanger: false, anders: false }, toelichting: { hart: 'Ritmestoornis', bloeddruk: 'Betablokker' } })
    expect((met.antwoorden as Record<string, unknown>).gezondheid).toEqual({ blessures: [], blessureToelichting: null, klachten: 'hart: Ritmestoornis', medicatie: 'Betablokker', parqJa: ['hart', 'bloeddruk'] })
  })
})
