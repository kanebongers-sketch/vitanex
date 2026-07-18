import { describe, expect, test } from 'vitest'
import { gmailLink, leesInboxVandaag, naarInboxVandaag, naarTriageMailJson } from './inbox'
import type { BeoordeeldeMail } from './classificeer'

// Onze eigen API is óók een systeemgrens. Deze tests bewaken twee dingen: dat een
// kapot antwoord `null` wordt (en dus de foutstaat haalt) in plaats van half door
// de UI te lekken, en dat er geen mailinhoud in de vorm over de draad sluipt.

function beoordeeld(afwijking: Partial<BeoordeeldeMail['mail']> = {}): BeoordeeldeMail {
  return {
    mail: {
      id: 'm1',
      threadId: 't1',
      afzenderNaam: 'Jan Jansen',
      afzenderAdres: 'jan@example.nl',
      onderwerp: 'Voorstel',
      ontvangenOp: new Date('2026-07-16T09:00:00Z'),
      aanMij: true,
      heeftAfmeldlink: false,
      precedence: null,
      labels: [],
      ...afwijking,
    },
    oordeel: { vraagtActie: true, reden: 'Direct aan jou geadresseerd.' },
  }
}

describe('gmailLink', () => {
  test('bouwt een deeplink naar de mail', () => {
    expect(gmailLink('18f2a')).toBe('https://mail.google.com/mail/u/0/#inbox/18f2a')
  })

  test('escapet het id', () => {
    // Een id uit een externe API gaat niet ongefilterd een URL in.
    expect(gmailLink('a/b?c')).toBe('https://mail.google.com/mail/u/0/#inbox/a%2Fb%3Fc')
  })
})

describe('naarTriageMailJson', () => {
  test('toont de naam van de afzender', () => {
    expect(naarTriageMailJson(beoordeeld()).afzender).toBe('Jan Jansen')
  })

  test('valt terug op het adres als er geen naam is', () => {
    // Anders staat er een lege regel en is de kaart onbruikbaar.
    const json = naarTriageMailJson(beoordeeld({ afzenderNaam: null }))

    expect(json.afzender).toBe('jan@example.nl')
  })

  test('stuurt geen adres mee als er een naam is', () => {
    // Dataminimalisatie: het adres van een derde hoeft de browser niet in als de
    // naam volstaat om 'm te herkennen.
    const json = naarTriageMailJson(beoordeeld())

    expect(JSON.stringify(json)).not.toContain('jan@example.nl')
  })

  test('draagt de reden mee', () => {
    expect(naarTriageMailJson(beoordeeld()).reden).toBe('Direct aan jou geadresseerd.')
  })

  test('draagt de thread-id mee', () => {
    // De kern van de fix: zonder dit veld over de draad kan een concept-antwoord
    // niet ónder het gesprek belanden en komt het los te staan.
    expect(naarTriageMailJson(beoordeeld()).threadId).toBe('t1')
  })
})

describe('naarInboxVandaag', () => {
  test('geeft de tellers en de mails door', () => {
    const antwoord = naarInboxVandaag({ gescand: 12, vraagtActie: [beoordeeld()] }, 0)

    expect(antwoord).toEqual({
      gekoppeld: true,
      gescand: 12,
      nietGelezen: 0,
      vraagtActie: [
        {
          id: 'm1',
          threadId: 't1',
          afzender: 'Jan Jansen',
          onderwerp: 'Voorstel',
          ontvangenOp: '2026-07-16T09:00:00.000Z',
          reden: 'Direct aan jou geadresseerd.',
        },
      ],
    })
  })

  test('draagt onleesbare mails naar buiten', () => {
    // Dit getal mag nergens onderweg verdwijnen: zonder dit is de noemer een leugen.
    expect(naarInboxVandaag({ gescand: 3, vraagtActie: [] }, 6).nietGelezen).toBe(6)
  })
})

describe('leesInboxVandaag', () => {
  const geldig = {
    gekoppeld: true,
    gescand: 2,
    nietGelezen: 0,
    vraagtActie: [
      {
        id: 'm1',
        threadId: 't1',
        afzender: 'Jan',
        onderwerp: 'Voorstel',
        ontvangenOp: '2026-07-16T09:00:00.000Z',
        reden: 'Direct aan jou geadresseerd.',
      },
    ],
  }

  test('leest een geldig antwoord', () => {
    expect(leesInboxVandaag(geldig)).toEqual(geldig)
  })

  test('een ontbrekende thread-id valt terug op leeg, geen fout', () => {
    // Oude of gecachte antwoorden kunnen `threadId` missen. Die mail mag daar niet
    // om verdwijnen: de narrowing vult `''` in (→ hooguit "concept niet in
    // thread"), en het antwoord blijft geldig.
    const zonderThread = {
      ...geldig,
      vraagtActie: [{ ...geldig.vraagtActie[0], threadId: undefined }],
    }

    const antwoord = leesInboxVandaag(zonderThread)

    expect(antwoord).not.toBeNull()
    if (antwoord?.gekoppeld) {
      expect(antwoord.vraagtActie[0]?.threadId).toBe('')
    }
  })

  test('leest de niet-gekoppelde tak', () => {
    expect(leesInboxVandaag({ gekoppeld: false })).toEqual({ gekoppeld: false })
  })

  test('een lege triage is geldig, geen fout', () => {
    const antwoord = leesInboxVandaag({ gekoppeld: true, gescand: 0, nietGelezen: 0, vraagtActie: [] })

    expect(antwoord).toEqual({ gekoppeld: true, gescand: 0, nietGelezen: 0, vraagtActie: [] })
  })

  test.each([
    ['null', null],
    ['een string', 'nee'],
    ['een array', []],
    ['een leeg object', {}],
    ['gekoppeld ontbreekt', { gescand: 0, nietGelezen: 0, vraagtActie: [] }],
    ['gescand ontbreekt', { gekoppeld: true, nietGelezen: 0, vraagtActie: [] }],
    ['nietGelezen ontbreekt', { gekoppeld: true, gescand: 0, vraagtActie: [] }],
    ['vraagtActie is geen array', { gekoppeld: true, gescand: 0, nietGelezen: 0, vraagtActie: {} }],
    ['gescand is negatief', { gekoppeld: true, gescand: -1, nietGelezen: 0, vraagtActie: [] }],
    ['gescand is geen heel getal', { gekoppeld: true, gescand: 1.5, nietGelezen: 0, vraagtActie: [] }],
    ['gescand is een string', { gekoppeld: true, gescand: '2', nietGelezen: 0, vraagtActie: [] }],
  ])('%s is geen geldig antwoord', (_naam, ruw) => {
    expect(leesInboxVandaag(ruw)).toBeNull()
  })

  test('één kapotte mail maakt het hele antwoord kapot', () => {
    // Stil overslaan zou een mail laten verdwijnen zonder dat iemand het merkt —
    // en dat is hier precies het gevaar. Liever de foutstaat.
    const antwoord = leesInboxVandaag({
      ...geldig,
      vraagtActie: [geldig.vraagtActie[0], { id: 'm2' }],
    })

    expect(antwoord).toBeNull()
  })

  test('een mail zonder reden is kapot', () => {
    // De reden is verplicht: een oordeel dat je niet kunt narekenen hoort de UI
    // niet te halen.
    const antwoord = leesInboxVandaag({
      ...geldig,
      vraagtActie: [{ ...geldig.vraagtActie[0], reden: '' }],
    })

    expect(antwoord).toBeNull()
  })

  test('afzender en onderwerp mogen ontbreken', () => {
    // Niet elke mail heeft een weergavenaam of onderwerp. Dat is geen kapot
    // antwoord — de UI vangt het op met een nette placeholder.
    const antwoord = leesInboxVandaag({
      ...geldig,
      vraagtActie: [{ ...geldig.vraagtActie[0], afzender: null, onderwerp: null }],
    })

    expect(antwoord).not.toBeNull()
  })
})
