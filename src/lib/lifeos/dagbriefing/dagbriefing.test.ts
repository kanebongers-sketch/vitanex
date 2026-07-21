import { describe, it, expect } from 'vitest'
import {
  groetVoor,
  leesModelBriefing,
  deterministischeKern,
  stelDagbriefingSamen,
  feitenTekst,
  dagbriefingSysteem,
  type BriefingModel,
  type DagbriefingFeiten,
} from './dagbriefing'

// Amsterdam is in juli CEST (UTC+2), dus deze lokale tijden zijn ook de wandklok.
const OCHTEND = new Date('2026-07-20T07:00:00+02:00')
const MIDDAG = new Date('2026-07-20T14:00:00+02:00')
const AVOND = new Date('2026-07-20T20:00:00+02:00')

/** Een compleet, gevuld feiten-object. Tests overschrijven wat ze nodig hebben. */
function feiten(overschrijf: Partial<DagbriefingFeiten> = {}): DagbriefingFeiten {
  return {
    taken: { vandaagAantal: 2, vandaagTitels: ['Offerte sturen', 'Ruben bellen'], teLaatAantal: 0, teLaatTitels: [] },
    crm: { teSprekenAantal: 0, teSprekenNamen: [] },
    agenda: { aantal: 1, eerstvolgende: { titel: 'Standup', tijd: '09:00' } },
    welzijn: null,
    finance: null,
    nu: MIDDAG,
    ...overschrijf,
  }
}

/** Een gevuld finance-blok: omzet met winst, iets openstaand, één verlopen factuur. */
const FINANCE = { omzet: 5000, kosten: 1200, winst: 3800, openstaand: 2400, verlopenAantal: 1 }

/** Een nep-model dat teruggeeft wat de test wil — geen netwerk. */
function nepModel(antwoord: unknown): BriefingModel {
  return { schrijf: async () => antwoord }
}

describe('groetVoor — hangt aan het uur, niet aan de cron', () => {
  it('groet per dagdeel (Europe/Amsterdam)', () => {
    expect(groetVoor(OCHTEND)).toBe('Goedemorgen')
    expect(groetVoor(MIDDAG)).toBe('Goedemiddag')
    expect(groetVoor(AVOND)).toBe('Goedenavond')
  })
})

describe('leesModelBriefing — narrowing op de modelgrens', () => {
  it('leest een volledig antwoord', () => {
    const kern = leesModelBriefing({
      briefing: 'Twee taken en een standup.',
      prioriteiten: ['Offerte sturen', 'Ruben bellen'],
      risicos: [],
      kansen: ['Sanne bellen'],
    })
    expect(kern?.briefing).toBe('Twee taken en een standup.')
    expect(kern?.prioriteiten).toEqual(['Offerte sturen', 'Ruben bellen'])
    expect(kern?.kansen).toEqual(['Sanne bellen'])
  })

  it('kapt de lijsten af op hun plafond (4/3/3) en filtert lege strings', () => {
    const kern = leesModelBriefing({
      briefing: 'x',
      prioriteiten: ['a', 'b', 'c', 'd', 'e', 'f'],
      risicos: ['r1', '   ', 'r2', 'r3', 'r4'],
      kansen: [1, 'k1'],
    })
    expect(kern?.prioriteiten).toHaveLength(4)
    expect(kern?.risicos).toEqual(['r1', 'r2', 'r3'])
    expect(kern?.kansen).toEqual(['k1'])
  })

  it('geeft null bij een ontbrekende of lege briefing-zin — dan valt de wrapper terug', () => {
    expect(leesModelBriefing({ prioriteiten: [], risicos: [], kansen: [] })).toBeNull()
    expect(leesModelBriefing({ briefing: '   ' })).toBeNull()
    expect(leesModelBriefing(null)).toBeNull()
  })
})

describe('deterministischeKern — eerlijk, uit exact de feiten', () => {
  it('zet de dag-taken (top-3 vooraan) als prioriteiten', () => {
    const kern = deterministischeKern(feiten())
    expect(kern.prioriteiten).toEqual(['Offerte sturen', 'Ruben bellen'])
  })

  it('valt voor prioriteiten terug op de te-late taken als er niets voor vandaag staat', () => {
    const kern = deterministischeKern(
      feiten({ taken: { vandaagAantal: 0, vandaagTitels: [], teLaatAantal: 1, teLaatTitels: ['Factuur'] } }),
    )
    expect(kern.prioriteiten).toEqual(['Factuur'])
  })

  it('noemt te-late taken als risico, met het echte aantal en de titel', () => {
    const kern = deterministischeKern(
      feiten({ taken: { vandaagAantal: 0, vandaagTitels: [], teLaatAantal: 2, teLaatTitels: ['Factuur'] } }),
    )
    expect(kern.risicos[0]).toContain('2')
    expect(kern.risicos[0]).toContain('over tijd')
    expect(kern.risicos[0]).toContain('Factuur')
  })

  it('markeert een lage pijler als risico met de gemeten score', () => {
    const kern = deterministischeKern(
      feiten({ welzijn: { wellbeingScore: 55, laagstePijler: { label: 'Slaap', score: 30 } } }),
    )
    expect(kern.risicos.some((r) => r.includes('Slaap') && r.includes('30/100'))).toBe(true)
  })

  it('markeert een pijler die NIET laag is niet als risico', () => {
    const kern = deterministischeKern(
      feiten({ welzijn: { wellbeingScore: 80, laagstePijler: { label: 'Voeding', score: 65 } } }),
    )
    expect(kern.risicos.some((r) => r.includes('Voeding'))).toBe(false)
  })

  it('zet te-spreken contacten als kans, met aantal en namen', () => {
    const kern = deterministischeKern(
      feiten({ crm: { teSprekenAantal: 3, teSprekenNamen: ['Jan', 'Ruben', 'Sanne'] } }),
    )
    const kans = kern.kansen.find((k) => k.includes('spreken'))
    expect(kans).toContain('3')
    expect(kans).toContain('Jan')
  })

  it('meldt een sterk welzijn als kans met de echte score', () => {
    const kern = deterministischeKern(
      feiten({ welzijn: { wellbeingScore: 82, laagstePijler: { label: 'Energie', score: 70 } } }),
    )
    expect(kern.kansen.some((k) => k.includes('82/100'))).toBe(true)
  })

  it('verzint geen drukte als er nergens data is', () => {
    const kern = deterministischeKern(
      feiten({
        taken: { vandaagAantal: 0, vandaagTitels: [], teLaatAantal: 0, teLaatTitels: [] },
        crm: { teSprekenAantal: 0, teSprekenNamen: [] },
        agenda: { aantal: 0, eerstvolgende: null },
        welzijn: null,
      }),
    )
    expect(kern.briefing).toContain('Rustige dag')
    expect(kern.prioriteiten).toEqual([])
    expect(kern.risicos).toEqual([])
  })

  it('gebruikt geen cijfer voor een domein zonder data (geen verzonnen welzijnsscore)', () => {
    const kern = deterministischeKern(feiten({ welzijn: null }))
    const alles = [kern.briefing, ...kern.prioriteiten, ...kern.risicos, ...kern.kansen].join(' ')
    expect(alles).not.toContain('/100')
  })

  it('markeert een verlopen factuur als risico als er finance-data is', () => {
    const kern = deterministischeKern(feiten({ finance: FINANCE }))
    expect(kern.risicos.some((r) => r.toLowerCase().includes('verlopen'))).toBe(true)
  })

  it('opent de briefing met het geld-beeld en noemt de openstaande facturen als kans', () => {
    const kern = deterministischeKern(feiten({ finance: FINANCE }))
    expect(kern.briefing).toContain('omzet')
    expect(kern.briefing).toContain('€')
    expect(kern.kansen.some((k) => k.includes('open') && k.includes('€'))).toBe(true)
  })

  it('noemt geen enkel bedrag als finance null is (geen verzonnen geld)', () => {
    const kern = deterministischeKern(feiten({ finance: null }))
    const alles = [kern.briefing, ...kern.prioriteiten, ...kern.risicos, ...kern.kansen].join(' ')
    expect(alles).not.toContain('€')
  })
})

describe('feitenTekst & systeemprompt', () => {
  it('markeert een leeg domein expliciet als "geen data" i.p.v. het te verzwijgen', () => {
    const tekst = feitenTekst(
      feiten({ welzijn: null, crm: { teSprekenAantal: 0, teSprekenNamen: [] } }),
    )
    expect(tekst).toContain('Geen welzijnsdata gemeten')
    expect(tekst).toContain('Iedereen is deze week al gesproken')
  })

  it('verbiedt het model expliciet om getallen te verzinnen', () => {
    const prompt = dagbriefingSysteem(MIDDAG)
    expect(prompt).toContain('Verzin NOOIT')
    expect(prompt.toLowerCase()).toContain('geen data')
  })

  it('neemt de echte finance-cijfers mee in de feitentekst', () => {
    const t = feitenTekst(feiten({ finance: FINANCE }))
    expect(t).toContain('Finance')
    expect(t).toContain('omzet')
    expect(t.toLowerCase()).toContain('verlopen')
  })

  it('markeert finance als "geen data" als het finance-blok null is', () => {
    const t = feitenTekst(feiten({ finance: null }))
    expect(t).toContain('Geen finance-data beschikbaar')
    expect(t).not.toContain('€')
  })

  it('vertelt het model dat het de finance-cijfers mag noemen', () => {
    const prompt = dagbriefingSysteem(MIDDAG).toLowerCase()
    expect(prompt).toContain('finance')
    expect(prompt).toContain('verlopen')
  })
})

describe('stelDagbriefingSamen — end-to-end met een nep-model', () => {
  it('gebruikt het modelantwoord en zet zelf de groet + het moment', async () => {
    const model = nepModel({
      briefing: 'Twee taken en een standup om 09:00.',
      prioriteiten: ['Offerte sturen'],
      risicos: [],
      kansen: [],
    })
    const b = await stelDagbriefingSamen(feiten({ nu: OCHTEND }), model)
    expect(b.groet).toBe('Goedemorgen')
    expect(b.briefing).toBe('Twee taken en een standup om 09:00.')
    expect(b.prioriteiten).toEqual(['Offerte sturen'])
    expect(b.gegenereerdOp).toBe(OCHTEND.toISOString())
  })

  it('valt op de deterministische briefing terug als het model geen sleutel heeft (null)', async () => {
    const b = await stelDagbriefingSamen(feiten(), null)
    // De deterministische kern zet de dag-taken als prioriteiten.
    expect(b.prioriteiten).toEqual(['Offerte sturen', 'Ruben bellen'])
    expect(b.briefing.length).toBeGreaterThan(0)
  })

  it('valt terug bij een modelstoring — één kapotte call blaast de briefing niet op', async () => {
    const kapot: BriefingModel = {
      schrijf: async () => {
        throw new Error('timeout')
      },
    }
    const b = await stelDagbriefingSamen(feiten(), kapot)
    expect(b.prioriteiten).toEqual(['Offerte sturen', 'Ruben bellen'])
  })

  it('valt terug bij een onbruikbaar modelantwoord (geen briefing-zin)', async () => {
    const b = await stelDagbriefingSamen(feiten(), nepModel({ prioriteiten: ['x'] }))
    // Niet de model-prioriteit 'x', maar de deterministische dag-taken.
    expect(b.prioriteiten).toEqual(['Offerte sturen', 'Ruben bellen'])
  })

  it('geeft de finance-feiten als feitentekst aan het model mee', async () => {
    let ontvangen = ''
    const model: BriefingModel = {
      schrijf: async (_systeem, feitenTekst) => {
        ontvangen = feitenTekst
        return { briefing: 'x', prioriteiten: [], risicos: [], kansen: [] }
      },
    }
    await stelDagbriefingSamen(feiten({ finance: FINANCE }), model)
    expect(ontvangen).toContain('omzet')
    expect(ontvangen.toLowerCase()).toContain('verlopen')
  })
})
