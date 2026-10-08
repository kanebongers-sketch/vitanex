import { describe, expect, test } from 'vitest'
import { maakVerslagPdf, verslagBestandsnaam } from './pdf'

describe('verslag-pdf', () => {
  test('bestandsnaam: naam + dag, zonder rare tekens', () => {
    expect(verslagBestandsnaam('Michael', new Date('2026-09-30T18:00:00Z'))).toBe('Coachgesprek-Michael-2026-09-30.pdf')
    expect(verslagBestandsnaam('Chloé de Vries', new Date('2026-09-30T23:30:00Z'))).toBe('Coachgesprek-Chloe-de-Vries-2026-10-01.pdf')
  })

  test('maakt een echte pdf', async () => {
    const pdf = await maakVerslagPdf({
      naam: 'Michael',
      op: new Date('2026-09-30T18:00:00Z'),
      scores: { algemeen: 4, energie: 3, voortgang: 5 },
      notitie: 'Goed gesprek over planning en klanten.',
      aandachtspunt: 'Avonden minder vol plannen.',
      volgende: new Date('2026-10-14T18:00:00Z'),
    })
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(1000)
  })

  test('met de voorbereiding van de PT\'er erin', async () => {
    const pdf = await maakVerslagPdf({
      naam: 'Joey',
      op: new Date('2026-10-08T18:00:00Z'),
      scores: { algemeen: 4, energie: 4, voortgang: 3 },
      notitie: null,
      aandachtspunt: null,
      voorbereiding: {
        week: '2026-10-05', bijgewerktOp: '2026-10-07T19:10:00.000Z', energie: 2,
        gewonnen: 'Twee intakes, één werd klant.', lastig: 'Avonden te vol.', bespreken: null, focus: 'Minder avonden.',
      },
    })
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  })
})
