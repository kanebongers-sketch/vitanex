import { describe, it, expect } from 'vitest'
import {
  planWensen,
  langsteVrijeMinuten,
  naarNieuwEvent,
  leesFocusVerzoek,
  STANDAARD_FOCUS_MINUTEN,
  STANDAARD_FOCUS_TITEL,
  MAX_FOCUS_MINUTEN,
  type PlanWens,
} from './inplannen'
import { MIN_BLOK_MINUTEN, type VrijBlok } from './vrije-blokken'
import { MAX_TITEL_LENGTE } from './schrijven'

// Vaste dag, lokale tijd — net als vrije-blokken.test.ts. Geen `new Date()` in
// de test zelf, anders valt hij om 23:59 anders uit dan om 09:00.
function op(uur: number, minuut = 0): Date {
  return new Date(2026, 6, 20, uur, minuut, 0, 0)
}

function blok(vanUur: number, totUur: number, vanMin = 0, totMin = 0): VrijBlok {
  const startOp = op(vanUur, vanMin)
  const eindOp = op(totUur, totMin)
  return {
    startOp,
    eindOp,
    minuten: Math.round((eindOp.getTime() - startOp.getTime()) / 60_000),
  }
}

function wens(titel: string, minuten: number): PlanWens {
  return { titel, minuten, energie: null }
}

describe('planWensen', () => {
  it('plant een wens aan het begin van het eerste passende blok', () => {
    const { toewijzingen, nietGeplaatst } = planWensen([blok(9, 11)], [wens('Deep work', 60)])

    expect(nietGeplaatst).toEqual([])
    expect(toewijzingen).toHaveLength(1)
    expect(toewijzingen[0]?.startOp).toEqual(op(9))
    expect(toewijzingen[0]?.eindOp).toEqual(op(10))
  })

  it('slaat een te klein blok over en pakt het eerstvolgende dat past', () => {
    const { toewijzingen } = planWensen([blok(9, 9, 0, 30), blok(13, 15)], [wens('Training', 60)])

    expect(toewijzingen[0]?.startOp).toEqual(op(13))
  })

  it('zet meerdere wensen rug aan rug in hetzelfde blok', () => {
    // Dit is het hele punt van time-blocking: een gat van 2 uur draagt 45 + 60.
    const { toewijzingen, nietGeplaatst } = planWensen(
      [blok(9, 11)],
      [wens('Offerte', 45), wens('Deep work', 60)],
    )

    expect(nietGeplaatst).toEqual([])
    expect(toewijzingen[0]?.startOp).toEqual(op(9))
    expect(toewijzingen[0]?.eindOp).toEqual(op(9, 45))
    expect(toewijzingen[1]?.startOp).toEqual(op(9, 45))
    expect(toewijzingen[1]?.eindOp).toEqual(op(10, 45))
  })

  it('gaat door naar het volgende blok zodra het eerste vol is', () => {
    const { toewijzingen } = planWensen(
      [blok(9, 10), blok(14, 16)],
      [wens('Eerste', 60), wens('Tweede', 60)],
    )

    expect(toewijzingen[0]?.startOp).toEqual(op(9))
    expect(toewijzingen[1]?.startOp).toEqual(op(14))
  })

  it('respecteert de volgorde: die is de prioriteit, niet de pasvorm', () => {
    // 'Belangrijk' komt eerst en krijgt dus het vroegste blok — ook al zou
    // 'Klein' er "netter" in passen. Dit bestand herschikt niet.
    const { toewijzingen } = planWensen([blok(9, 10)], [wens('Belangrijk', 60), wens('Klein', 45)])

    expect(toewijzingen).toHaveLength(1)
    expect(toewijzingen[0]?.wens.titel).toBe('Belangrijk')
  })

  it('meldt wat niet paste in plaats van het te laten verdwijnen', () => {
    const { toewijzingen, nietGeplaatst } = planWensen(
      [blok(9, 10)],
      [wens('Past', 60), wens('Past niet', 90)],
    )

    expect(toewijzingen).toHaveLength(1)
    expect(nietGeplaatst).toHaveLength(1)
    expect(nietGeplaatst[0]?.titel).toBe('Past niet')
  })

  it('geeft een lege uitkomst bij geen blokken — geen fout, gewoon een volle dag', () => {
    const { toewijzingen, nietGeplaatst } = planWensen([], [wens('Deep work', 60)])

    expect(toewijzingen).toEqual([])
    expect(nietGeplaatst).toHaveLength(1)
  })

  it('plant niets bij een lege wensenlijst', () => {
    expect(planWensen([blok(9, 17)], [])).toEqual({ toewijzingen: [], nietGeplaatst: [] })
  })

  it('muteert de invoer niet', () => {
    const blokken = [blok(9, 11)]
    const kopie = [...blokken.map((b) => ({ ...b }))]
    planWensen(blokken, [wens('Deep work', 60)])
    expect(blokken).toEqual(kopie)
  })

  it('behandelt een wens van 0 of minder minuten als onplaatsbaar', () => {
    // Geen afspraak zonder duur — dat is dezelfde regel als in `schrijven.ts`.
    const { toewijzingen, nietGeplaatst } = planWensen([blok(9, 17)], [wens('Leeg', 0)])
    expect(toewijzingen).toEqual([])
    expect(nietGeplaatst).toHaveLength(1)
  })
})

describe('planWensen — vanafOp', () => {
  it('plant niet in het verleden: het blok begint bij `vanafOp`', () => {
    const { toewijzingen } = planWensen([blok(9, 12)], [wens('Deep work', 60)], {
      vanafOp: op(10, 30),
    })

    expect(toewijzingen[0]?.startOp).toEqual(op(10, 30))
    expect(toewijzingen[0]?.eindOp).toEqual(op(11, 30))
  })

  it('laat blokken vallen die volledig vóór `vanafOp` liggen', () => {
    const { toewijzingen } = planWensen([blok(9, 10), blok(14, 16)], [wens('Deep work', 60)], {
      vanafOp: op(11),
    })

    expect(toewijzingen[0]?.startOp).toEqual(op(14))
  })

  it('selecteert één specifiek blok — dat is wat de "plan dit blok"-knop doet', () => {
    // De knop stuurt de starttijd van hét blok mee; het eerste passende blok
    // vanaf dat moment ís dat blok. Eén regel, twee toepassingen.
    const { toewijzingen } = planWensen(
      [blok(9, 10, 30), blok(13, 15)],
      [wens('Focusblok', 60)],
      { vanafOp: op(13) },
    )

    expect(toewijzingen[0]?.startOp).toEqual(op(13))
  })

  it('weigert als het gekozen blok inmiddels te klein is geworden', () => {
    // De client kan een verouderd beeld hebben; de server herrekent en zegt nee.
    const { toewijzingen, nietGeplaatst } = planWensen([blok(9, 12)], [wens('Deep work', 60)], {
      vanafOp: op(11, 30),
    })

    expect(toewijzingen).toEqual([])
    expect(nietGeplaatst).toHaveLength(1)
  })
})

describe('langsteVrijeMinuten', () => {
  it('geeft null als er geen ruimte is', () => {
    expect(langsteVrijeMinuten([])).toBeNull()
  })

  it('geeft de langste aaneengesloten ruimte', () => {
    expect(langsteVrijeMinuten([blok(9, 10), blok(13, 16), blok(17, 18)])).toBe(180)
  })

  it('houdt rekening met `vanafOp`', () => {
    expect(langsteVrijeMinuten([blok(9, 12)], op(11))).toBe(60)
  })
})

describe('naarRuimtes — sortering (via planWensen)', () => {
  // `naarRuimtes` is module-privé; het normaliseert blokken en sorteert ze
  // oplopend op starttijd. Dat gedrag is zichtbaar via planWensen: het eerste
  // passende blok is dan het chronologisch vroegste, ook als de agenda de blokken
  // in omgekeerde volgorde aanlevert.
  it('plant in het chronologisch vroegste blok, ook bij omgekeerde invoervolgorde', () => {
    const { toewijzingen } = planWensen(
      [blok(14, 15), blok(9, 10)],
      [wens('Eerste', 60), wens('Tweede', 60)],
    )

    expect(toewijzingen.map((t) => t.startOp)).toEqual([op(9), op(14)])
  })
})

describe('naarNieuwEvent', () => {
  it('zet een toewijzing om in de invoer voor maakAgendaEvent', () => {
    const { toewijzingen } = planWensen([blok(9, 11)], [wens('Deep work', 60)])
    const event = naarNieuwEvent(toewijzingen[0]!)

    expect(event.titel).toBe('Deep work')
    expect(event.startOp).toBe(op(9).toISOString())
    expect(event.eindOp).toBe(op(10).toISOString())
  })

  it('zegt eerlijk dat LifeOS het plande', () => {
    const { toewijzingen } = planWensen([blok(9, 11)], [wens('Deep work', 60)])
    expect(naarNieuwEvent(toewijzingen[0]!).beschrijving).toContain('LifeOS')
  })
})

describe('leesFocusVerzoek', () => {
  it('accepteert een lege body en vult de standaarden in', () => {
    const uitkomst = leesFocusVerzoek({})
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.wens).toEqual({
      titel: STANDAARD_FOCUS_TITEL,
      minuten: STANDAARD_FOCUS_MINUTEN,
      energie: null,
    })
    expect(uitkomst.vanafOp).toBeNull()
  })

  it('accepteert een ontbrekende body', () => {
    expect(leesFocusVerzoek(null).ok).toBe(true)
  })

  it('leest titel, minuten, energie en vanafOp', () => {
    const uitkomst = leesFocusVerzoek({
      titel: '  Offerte afmaken  ',
      minuten: 90,
      energie: 'hoog',
      vanafOp: '2026-07-20T11:00:00.000Z',
    })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.wens).toEqual({ titel: 'Offerte afmaken', minuten: 90, energie: 'hoog' })
    expect(uitkomst.vanafOp).toEqual(new Date('2026-07-20T11:00:00.000Z'))
  })

  it('valt terug op de standaardtitel bij een lege titel', () => {
    const uitkomst = leesFocusVerzoek({ titel: '   ' })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.wens.titel).toBe(STANDAARD_FOCUS_TITEL)
  })

  it('weigert een blok korter dan de minimale blokgrootte', () => {
    const uitkomst = leesFocusVerzoek({ minuten: MIN_BLOK_MINUTEN - 1 })
    expect(uitkomst).toEqual({ ok: false, fout: expect.stringContaining(String(MIN_BLOK_MINUTEN)) })
  })

  it('weigert een blok langer dan een werkdag', () => {
    expect(leesFocusVerzoek({ minuten: MAX_FOCUS_MINUTEN + 1 }).ok).toBe(false)
  })

  it('accepteert de duur exact op de ondergrens', () => {
    const uitkomst = leesFocusVerzoek({ minuten: MIN_BLOK_MINUTEN })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.wens.minuten).toBe(MIN_BLOK_MINUTEN)
  })

  it('accepteert de duur exact op de bovengrens', () => {
    const uitkomst = leesFocusVerzoek({ minuten: MAX_FOCUS_MINUTEN })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.wens.minuten).toBe(MAX_FOCUS_MINUTEN)
  })

  it('weigert een titel langer dan het maximum, met de exacte melding uit de code', () => {
    const uitkomst = leesFocusVerzoek({ titel: 'x'.repeat(MAX_TITEL_LENGTE + 1) })
    expect(uitkomst).toEqual({
      ok: false,
      fout: `Titel mag maximaal ${MAX_TITEL_LENGTE} tekens zijn.`,
    })
  })

  it('accepteert een titel die exact op de maximale lengte zit', () => {
    const titel = 'x'.repeat(MAX_TITEL_LENGTE)
    const uitkomst = leesFocusVerzoek({ titel })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.wens.titel).toBe(titel)
  })

  it('weigert een niet-tekstuele titel met de melding uit de code', () => {
    expect(leesFocusVerzoek({ titel: 123 })).toEqual({ ok: false, fout: 'Titel moet tekst zijn.' })
  })

  it('weigert niet-hele minuten', () => {
    expect(leesFocusVerzoek({ minuten: 62.5 }).ok).toBe(false)
    expect(leesFocusVerzoek({ minuten: '60' }).ok).toBe(false)
  })

  it('weigert een onbekend energieniveau', () => {
    expect(leesFocusVerzoek({ energie: 'extreem' }).ok).toBe(false)
  })

  it('weigert een onleesbaar vanaf-moment', () => {
    expect(leesFocusVerzoek({ vanafOp: 'morgenvroeg' }).ok).toBe(false)
    expect(leesFocusVerzoek({ vanafOp: 12345 }).ok).toBe(false)
  })

  it('weigert een body die geen object is', () => {
    expect(leesFocusVerzoek('focusblok').ok).toBe(false)
    expect(leesFocusVerzoek([]).ok).toBe(false)
  })
})
