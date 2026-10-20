import { describe, expect, it } from 'vitest'
import { DEMO_LEDEN_CSV, demoInlezen } from './demo-leden'
import { eersteDag, eersteDagStand } from './eerste-dag'
import type { StartFeiten } from './stappen'

describe('demo-ledenlijst', () => {
  const uit = demoInlezen('2026-10-20')

  it('herkent de kolommen zelf', () => {
    expect(uit.herkend).toEqual(['Voornaam', 'Tussenvoegsel', 'Achternaam', 'E-mail', 'Telefoon', 'Geboortedatum', 'Abonnement', 'Lid sinds'])
  })

  it('laat zien wat er met elke rij gebeurt', () => {
    expect(uit.rijen).toHaveLength(7)
    expect(uit.telling).toEqual({ nieuw: 5, bijwerken: 0, gelijk: 0, dubbel: 1, fout: 1 })
    expect(uit.rijen.map((r) => r.regel)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(uit.rijen[0]).toMatchObject({ naam: 'Sanne de Vries', uitkomst: 'nieuw', melding: null })
  })

  it('meldt waarschuwingen, dubbelen en fouten in gewone taal', () => {
    const daan = uit.rijen.find((r) => r.naam.startsWith('Daan'))
    expect(daan?.uitkomst).toBe('nieuw')
    expect(daan?.melding).toMatch(/e-mail/i)
    expect(uit.rijen.find((r) => r.naam.startsWith('Fatima'))?.melding).toMatch(/Geboortedatum/)
    expect(uit.rijen.find((r) => r.uitkomst === 'dubbel')?.regel).toBe(7)
    expect(uit.rijen.find((r) => r.uitkomst === 'fout')).toMatchObject({ regel: 8, melding: 'Voornaam of achternaam ontbreekt.' })
  })

  it('gebruikt alleen verzonnen adressen', () => {
    for (const regel of DEMO_LEDEN_CSV.split('\n').slice(1)) {
      const mail = regel.split(';')[3]
      expect(mail === '' || /@example(\.com)?$/.test(mail), mail).toBe(true)
    }
  })

  it('geeft een fout per rij als de verplichte kolommen ontbreken', () => {
    const zonder = demoInlezen('2026-10-20', 'Naam;Mail\nSanne;s@example.com')
    expect(zonder.telling.fout).toBe(1)
    expect(zonder.telling.nieuw).toBe(0)
  })
})

describe('klaar voor je eerste dag', () => {
  const LEEG: StartFeiten = { heeftLogo: false, vestigingenIngericht: 0, lestypen: 0, vasteLessen: 0, medewerkers: 0, leden: 0, uit: [] }

  it('geeft alle punten met links naar de juiste plek', () => {
    const punten = eersteDag(LEEG, 'budel')
    expect(punten.map((p) => p.id)).toEqual(['huisstijl', 'tijden', 'rooster', 'team', 'leden', 'checkin', 'app', 'sluiting'])
    expect(punten.find((p) => p.id === 'leden')?.pad).toBe('/clubkane/leden/importeren?v=budel')
    expect(eersteDag(LEEG, null).find((p) => p.id === 'checkin')?.pad).toBe('/clubkane/checkin')
  })

  it('leest af wat al staat', () => {
    const punten = eersteDag({ ...LEEG, heeftLogo: true, leden: 120, vasteLessen: 4 }, 'budel')
    expect(punten.filter((p) => p.af === true).map((p) => p.id)).toEqual(['huisstijl', 'rooster', 'leden'])
    expect(punten.find((p) => p.id === 'checkin')?.af).toBeNull()
    expect(eersteDagStand(punten)).toEqual({ af: 3, meetbaar: 5 })
  })

  it('laat onderdelen die uit staan weg', () => {
    const ids = eersteDag({ ...LEEG, uit: ['rooster', 'app', 'leden'] }, null).map((p) => p.id)
    expect(ids).not.toContain('rooster')
    expect(ids).not.toContain('app')
    expect(ids).not.toContain('leden')
    expect(ids).toContain('team')
  })
})
