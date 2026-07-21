// Bewaakt de literale Team-KPI-data. De belangrijkste regel: de som van de
// trainer-omzetten moet exact de MRR uit de Fit Factory-import zijn (€ 13.567).
// Zo vangt de test een typefout in één trainer-omzet direct af.

import { describe, expect, it } from 'vitest'
import { TEAM_KPI, TEAM_TOTAAL } from '@/lib/lifeos/team/team-data'

// De bekende MRR uit de import — de "waarheid" waartegen we de som ijken.
const FF_MRR = 13567

describe('team-data', () => {
  it('som van trainer-omzetten is gelijk aan de MRR uit de import', () => {
    const som = TEAM_KPI.reduce((s, t) => s + t.omzet, 0)
    expect(som).toBe(FF_MRR)
    expect(TEAM_TOTAAL.omzet).toBe(FF_MRR)
  })

  it('totalen kloppen met de rijen', () => {
    expect(TEAM_TOTAAL.trainers).toBe(TEAM_KPI.length)
    expect(TEAM_TOTAAL.klanten).toBe(TEAM_KPI.reduce((s, t) => s + t.klanten, 0))
    expect(TEAM_TOTAAL.klanten).toBe(43)
    expect(TEAM_TOTAAL.trainers).toBe(9)
  })

  it('is gesorteerd op omzet, hoogste eerst', () => {
    for (let i = 1; i < TEAM_KPI.length; i++) {
      expect(TEAM_KPI[i - 1].omzet).toBeGreaterThanOrEqual(TEAM_KPI[i].omzet)
    }
  })

  it('gemPerKlant is de afgeronde omzet per klant', () => {
    for (const t of TEAM_KPI) {
      expect(t.gemPerKlant).toBe(Math.round(t.omzet / t.klanten))
      expect(t.klanten).toBeGreaterThan(0)
      expect(t.vestigingen.length).toBeGreaterThan(0)
    }
  })
})
