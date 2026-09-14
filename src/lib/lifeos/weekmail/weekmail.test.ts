import { describe, expect, test } from 'vitest'
import { afgerondeTakenSinds, koudeContacten, bouwWeekmail, type WeekmailInvoer } from './weekmail'
import type { Taak } from '@/lib/lifeos/taken/taken'
import type { Persoon } from '@/lib/lifeos/crm/crm'

const MAANDAG = new Date(2026, 8, 14) // ma 14 sep 2026

function taak(over: Partial<Taak> = {}): Taak {
  return {
    id: crypto.randomUUID(),
    titel: 'Taak',
    notitie: null,
    categorie: null,
    klaar: false,
    klaarOp: null,
    datum: null,
    top3Positie: null,
    impact: null,
    inspanningMinuten: null,
    energie: null,
    deadline: null,
    projectId: null,
    aangemaaktOp: '2026-09-01T00:00:00Z',
    ...over,
  }
}

function persoon(over: Partial<Persoon> = {}): Persoon {
  return {
    id: crypto.randomUUID(),
    naam: 'Naam',
    groep: 'pt_klant',
    status: 'actieve_klant',
    sortering: 0,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
    laatsteContactOp: null,
    sessiesPerWeek: null,
    locatie: null,
    vakantieTot: null,
    abonnement: null,
    duo: false,
    aangemaaktOp: '2026-01-01T00:00:00Z',
    ...over,
  }
}

describe('afgerondeTakenSinds', () => {
  const vanaf = new Date(2026, 8, 7)
  const tot = new Date(2026, 8, 14)

  test('alleen afgevinkte taken binnen het venster', () => {
    const taken = [
      taak({ titel: 'Deze week', klaar: true, klaarOp: '2026-09-10T09:00:00Z' }),
      taak({ titel: 'Nog open', klaar: false }),
      taak({ titel: 'Vorige week', klaar: true, klaarOp: '2026-09-01T09:00:00Z' }),
      taak({ titel: 'Na venster', klaar: true, klaarOp: '2026-09-20T09:00:00Z' }),
    ]
    expect(afgerondeTakenSinds(taken, vanaf, tot).map((t) => t.titel)).toEqual(['Deze week'])
  })

  test('onleesbare klaarOp telt niet mee', () => {
    const taken = [taak({ klaar: true, klaarOp: 'geen-datum' })]
    expect(afgerondeTakenSinds(taken, vanaf, tot)).toEqual([])
  })

  test('klaar zonder klaarOp telt niet mee', () => {
    expect(afgerondeTakenSinds([taak({ klaar: true, klaarOp: null })], vanaf, tot)).toEqual([])
  })
})

describe('koudeContacten', () => {
  test('koud = lang geleden gesproken; nooit-gesproken telt niet', () => {
    const personen = [
      persoon({ naam: 'Koud', laatsteContactOp: '2026-06-01T00:00:00Z' }), // maanden terug
      persoon({ naam: 'Warm', laatsteContactOp: '2026-09-12T00:00:00Z' }), // net
      persoon({ naam: 'Nooit', laatsteContactOp: null }),
    ]
    const koud = koudeContacten(personen, MAANDAG)
    expect(koud.map((c) => c.naam)).toEqual(['Koud'])
    expect(koud[0].dagen).toBeGreaterThan(30)
  })

  test('langst-stil bovenaan', () => {
    const personen = [
      persoon({ naam: 'Recenter', laatsteContactOp: '2026-07-01T00:00:00Z' }),
      persoon({ naam: 'Ouder', laatsteContactOp: '2026-03-01T00:00:00Z' }),
    ]
    expect(koudeContacten(personen, MAANDAG).map((c) => c.naam)).toEqual(['Ouder', 'Recenter'])
  })
})

describe('bouwWeekmail', () => {
  const basis: WeekmailInvoer = { afgerondeTaken: [], finance: null, koudeContacten: [], zelf: null }

  test('lege week: eerlijke "niets afgevinkt", geen finance-/contact-sectie', () => {
    const mail = bouwWeekmail(MAANDAG, basis)
    expect(mail.onderwerp).toContain('terugblik')
    expect(mail.tekst).toContain('Niets afgevinkt deze week')
    expect(mail.html).not.toContain('Finance')
    expect(mail.html).not.toContain('Verwaterend contact')
  })

  test('afgeronde taken verschijnen met telling', () => {
    const mail = bouwWeekmail(MAANDAG, { ...basis, afgerondeTaken: ['A', 'B', 'C'] })
    expect(mail.tekst).toContain('AFGEROND (3)')
    expect(mail.html).toContain('Afgerond (3)')
    expect(mail.html).toContain('A')
  })

  test('finance-sectie toont omzet/kosten/winst', () => {
    const mail = bouwWeekmail(MAANDAG, {
      ...basis,
      finance: { maandLabel: 'september', omzet: 5000, kosten: 1200, winst: 3800, openstaand: 900, verlopenAantal: 1 },
    })
    expect(mail.tekst).toContain('FINANCE (september)')
    expect(mail.tekst).toContain('Winst')
    expect(mail.tekst).toContain('over de vervaldatum')
    expect(mail.html).toContain('Finance — september')
  })

  test('verwaterende contacten met duur', () => {
    const mail = bouwWeekmail(MAANDAG, {
      ...basis,
      koudeContacten: [{ naam: 'Jan', dagen: 90 }],
    })
    expect(mail.tekst).toContain('VERWATEREND CONTACT')
    expect(mail.tekst).toContain('Jan')
    expect(mail.tekst).toContain('maanden')
  })

  test('zelf-evaluatie: benoemd + gecorrigeerd verschijnen', () => {
    const mail = bouwWeekmail(MAANDAG, { ...basis, zelf: { hernoemd: 5, gecorrigeerd: 2 } })
    expect(mail.tekst).toContain('VAN LIFEOS ZELF')
    expect(mail.tekst).toContain('5 afspraken automatisch')
    expect(mail.tekst).toContain('Je corrigeerde me 2 keer')
    expect(mail.html).toContain('Van LifeOS zelf')
  })

  test('zelf-evaluatie: niets gedaan = geen sectie', () => {
    const mail = bouwWeekmail(MAANDAG, { ...basis, zelf: { hernoemd: 0, gecorrigeerd: 0 } })
    expect(mail.tekst).not.toContain('VAN LIFEOS ZELF')
    expect(mail.html).not.toContain('Van LifeOS zelf')
  })

  test('enkelvoud in de zelf-evaluatie', () => {
    const mail = bouwWeekmail(MAANDAG, { ...basis, zelf: { hernoemd: 1, gecorrigeerd: 1 } })
    expect(mail.tekst).toContain('1 afspraak automatisch')
    expect(mail.tekst).toContain('die afspraak laat ik voortaan met rust')
  })

  test('escapet gebruikerstekst in taken en namen', () => {
    const mail = bouwWeekmail(MAANDAG, {
      ...basis,
      afgerondeTaken: ['<script>x</script>'],
      koudeContacten: [{ naam: 'A & B', dagen: 40 }],
    })
    expect(mail.html).not.toContain('<script>x</script>')
    expect(mail.html).toContain('&lt;script&gt;')
    expect(mail.html).toContain('A &amp; B')
  })
})
