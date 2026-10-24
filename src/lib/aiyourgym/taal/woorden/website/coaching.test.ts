import { describe, expect, it } from 'vitest'
import { voorbeeldOefeningen } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { SITE_COACHING_NAMEN, siteCoaching } from './coaching'

// Elke oefening waarvan de website coaching laat zien, heeft die coaching ook in
// het Engels. Een nieuwe oefening op de website zonder Engels laat deze test falen.

/** Oefeningen met coaching buiten het voorbeeldschema (mockups/Oefening.tsx en HeldDashboard.tsx). */
const LOSSE_OEFENINGEN = ['Front squat']

describe('coaching op de website', () => {
  it('het voorbeeldschema heeft in beide talen dezelfde oefeningen', () => {
    const nl = voorbeeldOefeningen('nl').map((o) => o.naam)
    const en = voorbeeldOefeningen('en').map((o) => o.naam)
    expect(nl.length).toBeGreaterThan(0)
    expect(en).toEqual(nl)
  })

  it('elke oefening op de website heeft Engelse coaching', () => {
    const namen = [...voorbeeldOefeningen('nl').map((o) => o.naam), ...LOSSE_OEFENINGEN]
    const zonder = namen.filter((n) => !siteCoaching(n, 'en'))
    expect(zonder).toEqual([])
    for (const n of namen) expect(SITE_COACHING_NAMEN).toContain(n)
  })

  it('het Nederlands is de tekst uit de bibliotheek', () => {
    for (const n of SITE_COACHING_NAMEN) expect(siteCoaching(n, 'nl')?.kernpunten.length).toBeGreaterThanOrEqual(3)
  })
})
