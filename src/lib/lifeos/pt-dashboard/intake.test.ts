import { describe, expect, test } from 'vitest'
import {
  INTAKE, MAX_KORT, MAX_LANG, aantalMedischJa, intakeDatum, leesIntakeAntwoorden, stressScore, toelichtingId, vindVeld, voortgang,
} from './intake'

describe('INTAKE — het schema', () => {
  test('veld-ids zijn uniek en botsen niet met toelichting-sleutels', () => {
    const ids = INTAKE.flatMap((s) => s.velden.map((v) => v.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(ids).not.toContain(toelichtingId(id))
  })
  test('persoonsgegevens uit pt_klanten staan er niet dubbel in', () => {
    for (const id of ['naam', 'voornaam', 'achternaam', 'contact', 'club', 'vestiging', 'abonnement', 'startdatum']) {
      expect(vindVeld(id)).toBeUndefined()
    }
  })
  test('de medische screening heeft 13 ja/nee-vragen met toelichting', () => {
    const med = INTAKE.find((s) => s.id === 'medisch')!
    expect(med.velden.filter((v) => v.type === 'ja-nee' && v.toelichtingBijJa)).toHaveLength(13)
  })
  test('keuze- en meerkeuzevelden hebben opties, getallen een geldig bereik', () => {
    for (const v of INTAKE.flatMap((s) => s.velden)) {
      if (v.type === 'keuze' || v.type === 'meerkeuze') expect(v.opties.length).toBeGreaterThan(1)
      if (v.type === 'getal') expect(v.min).toBeLessThan(v.max)
    }
  })
})

describe('leesIntakeAntwoorden', () => {
  test('geen object → leeg', () => {
    expect(leesIntakeAntwoorden(null)).toEqual({})
    expect(leesIntakeAntwoorden([1, 2])).toEqual({})
    expect(leesIntakeAntwoorden('x')).toEqual({})
  })
  test('onbekende sleutels en ongeldige waarden vallen weg', () => {
    const a = leesIntakeAntwoorden({
      hack: 'x', datum_intake: '2026-02-30', geslacht: 'kat', jaren_actief: 200, med_hart: 'ja', trainingsdagen: 'ma',
    })
    expect(a).toEqual({})
  })
  test('tekst wordt opgeschoond en ingekort; lange tekst houdt regels', () => {
    const a = leesIntakeAntwoorden({ beroep: `  Zorg   ${'x'.repeat(400)}`, motivatie: 'Regel 1\n\n\n\nRegel   2', opmerkingen: 'y'.repeat(2000) })
    expect(a.beroep).toHaveLength(MAX_KORT)
    expect(String(a.beroep).startsWith('Zorg x')).toBe(true)
    expect(a.motivatie).toBe('Regel 1\n\nRegel 2')
    expect(a.opmerkingen).toHaveLength(MAX_LANG)
  })
  test('getallen: ook met komma, binnen bereik, op 0,1', () => {
    expect(leesIntakeAntwoorden({ jaren_actief: '3,25', tijd_per_week: 4 })).toEqual({ jaren_actief: 3.3, tijd_per_week: 4 })
    expect(leesIntakeAntwoorden({ tijd_per_week: -1 })).toEqual({})
  })
  test('meerkeuze: alleen bekende opties, in vaste volgorde, zonder dubbelen', () => {
    expect(leesIntakeAntwoorden({ trainingsdagen: ['do', 'ma', 'xx', 'ma'] }).trainingsdagen).toEqual(['ma', 'do'])
    expect(leesIntakeAntwoorden({ trainingsdagen: [] })).toEqual({})
  })
  test('toelichting blijft alleen bij ja', () => {
    const a = leesIntakeAntwoorden({
      med_hart: true, med_hart_toelichting: ' Hoge bloeddruk, onder controle ',
      med_allergie: false, med_allergie_toelichting: 'n.v.t.',
    })
    expect(a).toEqual({ med_hart: true, med_hart_toelichting: 'Hoge bloeddruk, onder controle', med_allergie: false })
  })
  test('intakeDatum', () => {
    expect(intakeDatum(leesIntakeAntwoorden({ datum_intake: '2026-10-08' }))).toBe('2026-10-08')
    expect(intakeDatum({})).toBeNull()
  })
})

describe('voortgang', () => {
  test('leeg: 0 van het totaal, verplichte velden open', () => {
    const v = voortgang({})
    const totaal = INTAKE.reduce((n, s) => n + s.velden.length, 0)
    expect(v).toMatchObject({ beantwoord: 0, totaal, procent: 0 })
    expect(v.openVerplicht).toContain('Datum intake')
    expect(v.perSectie).toHaveLength(INTAKE.length)
  })
  test('telt per sectie; nee telt als beantwoord; ja zonder toelichting wordt gemeld', () => {
    const v = voortgang({ datum_intake: '2026-10-08', med_arts: false, med_hart: true })
    expect(v.beantwoord).toBe(3)
    expect(v.perSectie.find((s) => s.id === 'medisch')).toMatchObject({ beantwoord: 2, totaal: 15 })
    expect(v.openVerplicht).not.toContain('Datum intake')
    expect(v.zonderToelichting).toEqual(['Hart- of vaataandoening, hoge bloeddruk of diabetes'])
  })
  test('eigen schema: 100% alleen als alles is ingevuld', () => {
    const schema = [{ id: 's', titel: 'S', velden: [{ id: 'a', label: 'A', type: 'tekst' as const }, { id: 'b', label: 'B', type: 'tekst' as const }] }]
    expect(voortgang({ a: 'x' }, schema).procent).toBe(50)
    expect(voortgang({ a: 'x', b: 'y' }, schema).procent).toBe(100)
  })
})

describe('medisch en stress', () => {
  test('aantal keer ja in de screening (trainer-vragen tellen niet mee)', () => {
    expect(aantalMedischJa({ med_arts: true, med_hart: false, med_familie: true, med_huisarts: true })).toBe(2)
  })
  const alle = (w: string) => Object.fromEntries(INTAKE.find((s) => s.id === 'stress')!.velden.filter((v) => v.type === 'keuze').map((v) => [v.id, w]))
  test('niveau pas als alle 8 stellingen zijn ingevuld', () => {
    expect(stressScore({ stress_moe: '4' })).toEqual({ score: 4, beantwoord: 1, totaal: 8, niveau: null })
  })
  test('indeling van het formulier: 0–8 laag, 9–16 matig, 17–32 hoog', () => {
    expect(stressScore(alle('1'))).toMatchObject({ score: 8, niveau: 'laag' })
    expect(stressScore(alle('2'))).toMatchObject({ score: 16, niveau: 'matig' })
    expect(stressScore({ ...alle('2'), stress_moe: '3' })).toMatchObject({ score: 17, niveau: 'hoog' })
    expect(stressScore(alle('4'))).toMatchObject({ score: 32, niveau: 'hoog' })
  })
})
