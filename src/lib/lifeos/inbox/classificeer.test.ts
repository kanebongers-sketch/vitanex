import { describe, expect, test } from 'vitest'
import { classificeer, triageer, type MailMeta } from './classificeer'

// De classificatie bepaalt wat Kane NIET te zien krijgt. Elke regel hieronder is
// dus een belofte over wat er niet stilletjes verdwijnt. Vandaar per heuristiek
// een test die 'm laat vuren én een die 'm laat zwijgen — een regel die altijd
// vuurt is net zo kapot als een regel die nooit vuurt.

/** Een gewone mail van een mens, direct aan jou. Alle tests wijken hiervan af. */
function mail(afwijking: Partial<MailMeta> = {}): MailMeta {
  return {
    id: 'm1',
    threadId: 't1',
    afzenderNaam: 'Jan Jansen',
    afzenderAdres: 'jan@example.nl',
    onderwerp: 'Voorstel voor volgende week',
    ontvangenOp: new Date('2026-07-16T09:00:00Z'),
    aanMij: true,
    heeftAfmeldlink: false,
    precedence: null,
    labels: ['INBOX', 'UNREAD'],
    ...afwijking,
  }
}

describe('classificeer — vraagt actie', () => {
  test('een mail van een mens, direct aan jou, vraagt iets', () => {
    // Arrange
    const m = mail()
    // Act
    const oordeel = classificeer(m)
    // Assert
    expect(oordeel.vraagtActie).toBe(true)
    expect(oordeel.reden).toBe('Direct aan jou geadresseerd.')
  })

  test('een vraagteken in het onderwerp levert een preciezere reden', () => {
    const oordeel = classificeer(mail({ onderwerp: 'Kun je hier morgen naar kijken?' }))

    expect(oordeel.vraagtActie).toBe(true)
    expect(oordeel.reden).toBe('Er staat een vraag in het onderwerp.')
  })

  test('zonder onderwerp valt hij terug op "direct aan jou" en verdwijnt niet', () => {
    const oordeel = classificeer(mail({ onderwerp: null }))

    expect(oordeel.vraagtActie).toBe(true)
  })

  test('CATEGORY_UPDATES wordt niet weggefilterd — daar zit ook post tussen', () => {
    // Bewuste keuze, geen omissie: Gmail sorteert facturen en bezorgberichten
    // hieronder. Wie deze categorie in bulk wegfiltert, mist een aanmaning.
    const oordeel = classificeer(mail({ labels: ['INBOX', 'UNREAD', 'CATEGORY_UPDATES'] }))

    expect(oordeel.vraagtActie).toBe(true)
  })

  test('een afzender die alleen "reply" heet is geen no-reply', () => {
    // De regex moet op het hele lokale deel ankeren. Zonder anker vangt hij
    // `reply@`, `noreply-team@` en `bounces-are-fun@` mee.
    const oordeel = classificeer(mail({ afzenderAdres: 'reply@example.nl' }))

    expect(oordeel.vraagtActie).toBe(true)
  })

  test('een onbekende afzender zonder adres verdwijnt niet', () => {
    // Geen adres = de no-reply-regel kan niets vaststellen. Dan niet gokken:
    // de bias staat op tonen.
    const oordeel = classificeer(mail({ afzenderAdres: null, afzenderNaam: null }))

    expect(oordeel.vraagtActie).toBe(true)
  })
})

describe('classificeer — vraagt niets', () => {
  test('een afmeldlink maakt het een nieuwsbrief', () => {
    const oordeel = classificeer(mail({ heeftAfmeldlink: true }))

    expect(oordeel.vraagtActie).toBe(false)
    expect(oordeel.reden).toBe('Nieuwsbrief: er zit een afmeldlink in de headers.')
  })

  test.each(['bulk', 'list', 'junk', 'auto_reply'])('Precedence: %s is bulk', (precedence) => {
    const oordeel = classificeer(mail({ precedence }))

    expect(oordeel.vraagtActie).toBe(false)
    expect(oordeel.reden).toBe('Bulkbericht: verstuurd aan een lijst, niet aan jou.')
  })

  test('Precedence is hoofdletterongevoelig', () => {
    // `Precedence: Bulk` komt in het wild voor. Een case-gevoelige check laat
    // die er dan gewoon doorheen.
    expect(classificeer(mail({ precedence: 'Bulk' })).vraagtActie).toBe(false)
  })

  test('een onbekende Precedence-waarde filtert niets weg', () => {
    expect(classificeer(mail({ precedence: 'first-class' })).vraagtActie).toBe(true)
  })

  test.each([
    ['CATEGORY_PROMOTIONS', 'Gmail sorteerde dit onder Reclame.'],
    ['CATEGORY_SOCIAL', 'Gmail sorteerde dit onder Sociaal.'],
    ['CATEGORY_FORUMS', 'Gmail sorteerde dit onder Forums.'],
  ])('%s is geen actie', (label, reden) => {
    const oordeel = classificeer(mail({ labels: ['INBOX', 'UNREAD', label] }))

    expect(oordeel.vraagtActie).toBe(false)
    expect(oordeel.reden).toBe(reden)
  })

  test.each([
    'noreply@example.nl',
    'no-reply@example.nl',
    'no_reply@example.nl',
    'donotreply@example.nl',
    'do-not-reply@example.nl',
    'mailer-daemon@example.nl',
    'postmaster@example.nl',
    'bounce@example.nl',
    'bounces@example.nl',
  ])('%s kan niets van je vragen', (afzenderAdres) => {
    const oordeel = classificeer(mail({ afzenderAdres }))

    expect(oordeel.vraagtActie).toBe(false)
    expect(oordeel.reden).toBe('Afzender is een no-reply-adres: je kunt er niet op antwoorden.')
  })

  test('NO-REPLY in hoofdletters telt ook', () => {
    expect(classificeer(mail({ afzenderAdres: 'NoReply@Example.NL' })).vraagtActie).toBe(false)
  })

  test('in de cc staan is ter kennisgeving', () => {
    const oordeel = classificeer(mail({ aanMij: false }))

    expect(oordeel.vraagtActie).toBe(false)
    expect(oordeel.reden).toContain('Niet aan jou geadresseerd')
  })

  test('een vraagteken in het onderwerp redt een nieuwsbrief niet', () => {
    // De volgorde is het ontwerp: bulk-signalen van de afzender wegen zwaarder
    // dan een vraagteken in een marketingkop ("Klaar voor de zomer?").
    const oordeel = classificeer(mail({ heeftAfmeldlink: true, onderwerp: 'Klaar voor de zomer?' }))

    expect(oordeel.vraagtActie).toBe(false)
  })
})

describe('classificeer — elk oordeel heeft een reden', () => {
  test.each([
    ['gewone mail', mail()],
    ['nieuwsbrief', mail({ heeftAfmeldlink: true })],
    ['bulk', mail({ precedence: 'bulk' })],
    ['reclame', mail({ labels: ['CATEGORY_PROMOTIONS'] })],
    ['no-reply', mail({ afzenderAdres: 'noreply@x.nl' })],
    ['cc', mail({ aanMij: false })],
  ])('%s krijgt een niet-lege reden', (_naam, m) => {
    // Een oordeel zonder onderbouwing is niet te controleren. Dit bewaakt dat
    // een nieuwe regel niet stilletjes zonder reden geschreven wordt.
    expect(classificeer(m).reden.length).toBeGreaterThan(0)
  })
})

describe('triageer', () => {
  test('geen mail levert een lege triage, geen fout', () => {
    const triage = triageer([])

    expect(triage.gescand).toBe(0)
    expect(triage.vraagtActie).toEqual([])
    expect(triage.overige).toEqual([])
  })

  test('gelezen post (geen UNREAD-label) hoort bij overige, niet bij de to-do', () => {
    // Je hebt 'm al gezien: relevant om terug te vinden, maar niet je to-do.
    const triage = triageer([
      mail({ id: 'gelezen', labels: ['INBOX'] }),
      mail({ id: 'ongelezen', labels: ['INBOX', 'UNREAD'] }),
    ])

    expect(triage.vraagtActie.map((b) => b.mail.id)).toEqual(['ongelezen'])
    expect(triage.overige.map((b) => b.mail.id)).toEqual(['gelezen'])
  })

  test('vraagtActie en overige samen dekken elke mail precies één keer', () => {
    // De belofte van "alles van vandaag": niets valt dubbel of stil weg.
    const mails = [
      mail({ id: 'post' }),
      mail({ id: 'nieuwsbrief', heeftAfmeldlink: true }),
      mail({ id: 'gelezen', labels: ['INBOX'] }),
    ]
    const triage = triageer(mails)

    expect(triage.vraagtActie.map((b) => b.mail.id)).toEqual(['post'])
    expect([...triage.vraagtActie, ...triage.overige].map((b) => b.mail.id).sort()).toEqual([
      'gelezen',
      'nieuwsbrief',
      'post',
    ])
  })

  test('overige is nieuwste eerst', () => {
    const triage = triageer([
      mail({ id: 'oud', heeftAfmeldlink: true, ontvangenOp: new Date('2026-07-16T08:00:00Z') }),
      mail({ id: 'nieuw', heeftAfmeldlink: true, ontvangenOp: new Date('2026-07-16T11:00:00Z') }),
    ])

    expect(triage.overige.map((b) => b.mail.id)).toEqual(['nieuw', 'oud'])
  })

  test('alleen nieuwsbrieven: niets vraagt iets, maar ze zijn wel geteld', () => {
    // `gescand` is de verantwoording: 0 van de 3 is een ander verhaal dan 0 van
    // de 0. De UI moet dat verschil kunnen tonen.
    const triage = triageer([
      mail({ id: 'a', heeftAfmeldlink: true }),
      mail({ id: 'b', heeftAfmeldlink: true }),
      mail({ id: 'c', heeftAfmeldlink: true }),
    ])

    expect(triage.gescand).toBe(3)
    expect(triage.vraagtActie).toEqual([])
  })

  test('alles bulk levert niets op', () => {
    const triage = triageer([
      mail({ id: 'a', precedence: 'bulk' }),
      mail({ id: 'b', labels: ['CATEGORY_PROMOTIONS'] }),
      mail({ id: 'c', afzenderAdres: 'noreply@x.nl' }),
    ])

    expect(triage.gescand).toBe(3)
    expect(triage.vraagtActie).toEqual([])
  })

  test('scheidt de post van de ruis en telt alles', () => {
    const triage = triageer([
      mail({ id: 'nieuwsbrief', heeftAfmeldlink: true }),
      mail({ id: 'post' }),
      mail({ id: 'reclame', labels: ['CATEGORY_PROMOTIONS'] }),
    ])

    expect(triage.gescand).toBe(3)
    expect(triage.vraagtActie.map((b) => b.mail.id)).toEqual(['post'])
  })

  test('nieuwste eerst', () => {
    const triage = triageer([
      mail({ id: 'oud', ontvangenOp: new Date('2026-07-16T08:00:00Z') }),
      mail({ id: 'nieuw', ontvangenOp: new Date('2026-07-16T11:00:00Z') }),
      mail({ id: 'midden', ontvangenOp: new Date('2026-07-16T09:30:00Z') }),
    ])

    expect(triage.vraagtActie.map((b) => b.mail.id)).toEqual(['nieuw', 'midden', 'oud'])
  })

  test('muteert de invoer niet', () => {
    // `sort` is in-place. Zonder de kopie die `map`/`filter` maken zou triageer
    // de array van de aanroeper omgooien.
    const invoer = [
      mail({ id: 'oud', ontvangenOp: new Date('2026-07-16T08:00:00Z') }),
      mail({ id: 'nieuw', ontvangenOp: new Date('2026-07-16T11:00:00Z') }),
    ]

    triageer(invoer)

    expect(invoer.map((m) => m.id)).toEqual(['oud', 'nieuw'])
  })

  test('draagt de reden mee naar buiten', () => {
    const triage = triageer([mail({ onderwerp: 'Lukt dat?' })])

    expect(triage.vraagtActie[0]?.oordeel.reden).toBe('Er staat een vraag in het onderwerp.')
  })
})
