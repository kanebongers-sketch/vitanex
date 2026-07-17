// Tests voor de prioriteitsberekening. De kern van wat hier bewaakt wordt is
// niet "rekent de formule goed" maar "verzint hij niets" — een score op een taak
// waarover niets bekend is, is de fout die dit bestand moet voorkomen.

import { describe, expect, it } from 'vitest'
import type { Taak } from '@/lib/lifeos/taken/taken'
import {
  beoordeelTaak,
  dagenTussen,
  deadlineDruk,
  energiePast,
  impactDruk,
  leesImpact,
  leesInspanning,
  ordenTaken,
  passendInBlok,
  type SlimmeTaak,
} from '@/lib/lifeos/taken/prioriteit'

const VANDAAG = '2026-07-17'

function taak(overschrijf: Partial<SlimmeTaak> = {}): SlimmeTaak {
  const basis: SlimmeTaak = {
    id: 'id-1',
    titel: 'Een taak',
    notitie: null,
    klaar: false,
    klaarOp: null,
    datum: null,
    top3Positie: null,
    aangemaaktOp: '2026-07-17T09:00:00.000Z',
    impact: null,
    deadline: null,
    inspanningMinuten: null,
    energie: null,
    projectId: null,
  }
  return { ...basis, ...overschrijf }
}

describe('dagenTussen', () => {
  it('telt hele dagen vooruit', () => {
    expect(dagenTussen('2026-07-17', '2026-07-20')).toBe(3)
  })

  it('geeft een negatief getal als de doeldag in het verleden ligt', () => {
    expect(dagenTussen('2026-07-17', '2026-07-15')).toBe(-2)
  })

  it('geeft 0 op dezelfde dag', () => {
    expect(dagenTussen('2026-07-17', '2026-07-17')).toBe(0)
  })

  // Dit is de reden dat de functie via Date.UTC rekent en niet via een kaal
  // millisecondenverschil op lokale datums: de nacht van 25 op 26 oktober 2026
  // duurt in Amsterdam 25 uur. Een kaal verschil geeft daar 1,04 dag → rond naar
  // 1, maar over een langer bereik stapelt die fout tot een hele dag.
  it('telt correct over de zomertijdgrens heen', () => {
    expect(dagenTussen('2026-10-24', '2026-10-26')).toBe(2)
    expect(dagenTussen('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('geeft null bij een ongeldige sleutel', () => {
    expect(dagenTussen('gisteren', '2026-07-17')).toBeNull()
    expect(dagenTussen('2026-07-17', '2026-02-31')).toBeNull()
  })
})

describe('deadlineDruk', () => {
  it('duwt maximaal als de deadline voorbij is', () => {
    expect(deadlineDruk('2026-07-16', VANDAAG)).toBe(100)
  })

  it('loopt af naarmate de deadline verder weg ligt', () => {
    const vandaag = deadlineDruk('2026-07-17', VANDAAG)
    const morgen = deadlineDruk('2026-07-18', VANDAAG)
    const week = deadlineDruk('2026-07-23', VANDAAG)
    const ooit = deadlineDruk('2027-07-17', VANDAAG)

    expect(vandaag).toBeGreaterThan(morgen as number)
    expect(morgen).toBeGreaterThan(week as number)
    expect(week).toBeGreaterThan(ooit as number)
  })

  // De trapwaarden zelf pinnen, niet alleen de ordening. Zonder dit blijft een
  // regressie die twee stappen omwisselt of `<= 3` naar `< 3` verandert groen —
  // de ordening klopt dan nog steeds. De sprongen staan op vandaag/morgen/3/7/30.
  it('geeft de exacte trapwaarde per afstand', () => {
    expect(deadlineDruk('2026-07-17', VANDAAG)).toBe(95) // vandaag
    expect(deadlineDruk('2026-07-18', VANDAAG)).toBe(75) // morgen
    expect(deadlineDruk('2026-07-20', VANDAAG)).toBe(55) // 3 dagen (grens <= 3)
    expect(deadlineDruk('2026-07-21', VANDAAG)).toBe(35) // 4 dagen (net erover)
    expect(deadlineDruk('2026-07-24', VANDAAG)).toBe(35) // 7 dagen (grens <= 7)
    expect(deadlineDruk('2026-07-25', VANDAAG)).toBe(15) // 8 dagen (net erover)
    expect(deadlineDruk('2026-08-16', VANDAAG)).toBe(15) // 30 dagen (grens <= 30)
    expect(deadlineDruk('2026-08-17', VANDAAG)).toBe(5) // 31 dagen (net erover)
  })

  it('geeft null bij een onleesbare datum', () => {
    expect(deadlineDruk('binnenkort', VANDAAG)).toBeNull()
  })
})

describe('impactDruk', () => {
  it('mapt de schaal 1-5 naar 0-100', () => {
    expect(impactDruk(1)).toBe(0)
    expect(impactDruk(2)).toBe(25)
    expect(impactDruk(3)).toBe(50)
    expect(impactDruk(4)).toBe(75)
    expect(impactDruk(5)).toBe(100)
  })

  it('weigert waarden buiten de schaal', () => {
    expect(impactDruk(0)).toBeNull()
    expect(impactDruk(6)).toBeNull()
    expect(impactDruk(2.5)).toBeNull()
  })
})

describe('beoordeelTaak', () => {
  // De belangrijkste test van dit bestand.
  it('geeft GEEN score als impact en deadline allebei ontbreken', () => {
    const oordeel = beoordeelTaak(taak(), VANDAAG)

    expect(oordeel.score).toBeNull()
    expect(oordeel.ontbreekt).toContain('impact')
    expect(oordeel.ontbreekt).toContain('deadline')
    expect(oordeel.redenen.join(' ')).toContain('kan dit niet wegen')
  })

  it('scoort op impact alleen als de deadline ontbreekt', () => {
    const oordeel = beoordeelTaak(taak({ impact: 5 }), VANDAAG)

    // Volledig gewicht naar impact — niet 40% van 100 (= 40), want dan zou een
    // onbekend feit een bekend feit verwateren.
    expect(oordeel.score).toBe(100)
    expect(oordeel.ontbreekt).toContain('deadline')
    expect(oordeel.ontbreekt).not.toContain('impact')
  })

  it('scoort op deadline alleen als impact ontbreekt', () => {
    const oordeel = beoordeelTaak(taak({ deadline: '2026-07-16' }), VANDAAG)

    expect(oordeel.score).toBe(100)
    expect(oordeel.ontbreekt).toContain('impact')
  })

  it('weegt beide signalen als ze er allebei zijn', () => {
    // deadline vandaag = 95 * 0.6 = 57; impact 1 = 0 * 0.4 = 0 → 57
    const oordeel = beoordeelTaak(taak({ deadline: VANDAAG, impact: 1 }), VANDAAG)
    expect(oordeel.score).toBe(57)
  })

  it('meldt een verlopen deadline in gewoon Nederlands', () => {
    const oordeel = beoordeelTaak(taak({ deadline: '2026-07-16' }), VANDAAG)
    expect(oordeel.redenen.join(' ')).toContain('gisteren')
  })

  it('herkent een top-3-taak van vandaag', () => {
    const oordeel = beoordeelTaak(taak({ top3Positie: 1, datum: VANDAAG }), VANDAAG)
    expect(oordeel.isTop3).toBe(true)
  })

  // Een top-3-positie van gisteren is geen top-3 van vandaag. Zonder deze regel
  // zou de lijst van vandaag stilletjes gedomineerd worden door de wil van
  // eergisteren.
  it('rekent een top-3-positie van een andere dag niet mee', () => {
    const oordeel = beoordeelTaak(taak({ top3Positie: 1, datum: '2026-07-16' }), VANDAAG)
    expect(oordeel.isTop3).toBe(false)
  })

  it('noemt de tijdsinschatting als die bekend is', () => {
    const oordeel = beoordeelTaak(taak({ impact: 3, inspanningMinuten: 45 }), VANDAAG)
    expect(oordeel.redenen.join(' ')).toContain('45 minuten')
    expect(oordeel.ontbreekt).not.toContain('inspanning')
  })
})

describe('ordenTaken', () => {
  it('zet de top-3 bovenaan, op positie, ongeacht de score', () => {
    const geordend = ordenTaken(
      [
        taak({ id: 'hoog', impact: 5, deadline: '2026-07-16' }),
        taak({ id: 'top3-2', top3Positie: 2, datum: VANDAAG }),
        taak({ id: 'top3-1', top3Positie: 1, datum: VANDAAG }),
      ],
      VANDAAG,
    )

    // De wil wint van het advies: 'hoog' scoort 100 maar staat onder de top-3.
    expect(geordend.map((o) => o.taak.id)).toEqual(['top3-1', 'top3-2', 'hoog'])
  })

  it('sorteert beoordeelde taken op score, hoogste eerst', () => {
    const geordend = ordenTaken(
      [taak({ id: 'laag', impact: 1 }), taak({ id: 'hoog', impact: 5 }), taak({ id: 'mid', impact: 3 })],
      VANDAAG,
    )

    expect(geordend.map((o) => o.taak.id)).toEqual(['hoog', 'mid', 'laag'])
  })

  it('zet taken zonder oordeel achteraan, niet tussen de gescoorde taken', () => {
    const geordend = ordenTaken(
      [taak({ id: 'onbekend' }), taak({ id: 'laag', impact: 1 })],
      VANDAAG,
    )

    // 'laag' scoort 0. Zonder de aparte bak zou 'onbekend' (score null) daar
    // omheen kunnen sorteren alsof null een getal is.
    expect(geordend.map((o) => o.taak.id)).toEqual(['laag', 'onbekend'])
    expect(geordend[1].score).toBeNull()
  })

  it('muteert de invoer niet', () => {
    const invoer: readonly SlimmeTaak[] = Object.freeze([
      taak({ id: 'b', impact: 1 }),
      taak({ id: 'a', impact: 5 }),
    ])

    expect(() => ordenTaken(invoer, VANDAAG)).not.toThrow()
    expect(invoer[0].id).toBe('b')
  })
})

describe('passendInBlok', () => {
  it('laat een taak zonder tijdsinschatting weg — passen is niet te weten', () => {
    const oordelen = ordenTaken([taak({ id: 'geen-schatting', impact: 5 })], VANDAAG)
    expect(passendInBlok(oordelen, 60)).toHaveLength(0)
  })

  it('laat een taak weg die niet in het blok past', () => {
    const oordelen = ordenTaken([taak({ impact: 5, inspanningMinuten: 90 })], VANDAAG)
    expect(passendInBlok(oordelen, 60)).toHaveLength(0)
  })

  it('houdt een taak die precies past', () => {
    const oordelen = ordenTaken([taak({ impact: 5, inspanningMinuten: 60 })], VANDAAG)
    expect(passendInBlok(oordelen, 60)).toHaveLength(1)
  })

  it('laat afgevinkte taken weg', () => {
    const oordelen = ordenTaken(
      [taak({ impact: 5, inspanningMinuten: 30, klaar: true, klaarOp: '2026-07-17T10:00:00.000Z' })],
      VANDAAG,
    )
    expect(passendInBlok(oordelen, 60)).toHaveLength(0)
  })

  it('filtert op energie als je die meegeeft', () => {
    const oordelen = ordenTaken(
      [
        taak({ id: 'diep', impact: 5, inspanningMinuten: 30, energie: 'hoog' }),
        taak({ id: 'licht', impact: 4, inspanningMinuten: 30, energie: 'laag' }),
      ],
      VANDAAG,
    )

    const bijLageEnergie = passendInBlok(oordelen, 60, 'laag')
    expect(bijLageEnergie.map((o) => o.taak.id)).toEqual(['licht'])
  })
})

describe('energiePast', () => {
  it('laat een taak zonder energie-label altijd door', () => {
    expect(energiePast(null, 'laag')).toBe(true)
  })

  it('staat een lichtere taak toe bij hoge energie', () => {
    expect(energiePast('laag', 'hoog')).toBe(true)
    expect(energiePast('midden', 'hoog')).toBe(true)
  })

  // De asymmetrie is het hele punt: dit is de planningsfout die de regel bestaat
  // om te voorkomen.
  it('weigert een zware taak bij lage energie', () => {
    expect(energiePast('hoog', 'laag')).toBe(false)
    expect(energiePast('midden', 'laag')).toBe(false)
  })

  it('staat een even zware taak toe', () => {
    expect(energiePast('hoog', 'hoog')).toBe(true)
  })
})

describe('leesImpact / leesInspanning — systeemgrens', () => {
  it('leest null als "niet opgegeven", niet als fout', () => {
    expect(leesImpact(null)).toBeNull()
    expect(leesImpact(undefined)).toBeNull()
    expect(leesInspanning(null)).toBeNull()
  })

  it('accepteert geldige waarden', () => {
    expect(leesImpact(3)).toBe(3)
    expect(leesInspanning(45)).toBe(45)
  })

  it('geeft undefined (= fout) bij waarden buiten de schaal', () => {
    expect(leesImpact(0)).toBeUndefined()
    expect(leesImpact(6)).toBeUndefined()
    expect(leesInspanning(0)).toBeUndefined()
    expect(leesInspanning(481)).toBeUndefined()
  })

  it('weigert niet-gehele getallen en tekst', () => {
    expect(leesImpact(2.5)).toBeUndefined()
    expect(leesImpact('3')).toBeUndefined()
    expect(leesInspanning('45')).toBeUndefined()
  })
})

// Vangnet: `SlimmeTaak` moet een echte `Taak` blijven. Loopt het takenmodel uit
// elkaar met de scoringslaag, dan faalt dit hier en niet pas in productie.
describe('typecontract', () => {
  it('een SlimmeTaak is toewijsbaar aan Taak', () => {
    const t: Taak = taak({ impact: 3 })
    expect(t.titel).toBe('Een taak')
  })
})
