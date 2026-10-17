import { describe, expect, it } from 'vitest'
import { berekenBmi, bmiDuiding, leesBloeddruk, leesIntake } from './intake'
import { intakeUitRij } from './intake-rij'

const LID = '11111111-1111-4111-8111-111111111111'
const VANDAAG = '2026-10-14'

function verzoek(extra: Record<string, unknown> = {}) {
  return {
    lidId: LID,
    datum: '2026-10-14',
    toestemmingGezondheid: false,
    antwoorden: {
      doelen: ['kracht', 'afvallen', 'kracht', 'onzin'],
      niveau: 2,
      dagenPerWeek: 3,
      minutenPerSessie: 60,
      voorkeuren: ['groepslessen', 'sportschool'],
      gezondheid: { blessures: ['knie'], medicatie: 'bloeddrukverlagers', parqJa: ['hart'] },
    },
    metingen: { gewicht_kg: '82,5', lengte_cm: 180, rusthartslag: 62, bloeddruk: '125/80' },
    ...extra,
  }
}

describe('leesIntake', () => {
  it('valideert en ordent de antwoorden', () => {
    const u = leesIntake(verzoek(), VANDAAG)
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(u.waarde.antwoorden.doelen).toEqual(['afvallen', 'kracht'])
    expect(u.waarde.antwoorden.voorkeuren).toEqual(['sportschool', 'groepslessen'])
    expect(u.waarde.metingen.gewicht_kg).toBe(82.5)
  })

  it('bewaart zonder toestemming GEEN gezondheidsgegevens', () => {
    const u = leesIntake(verzoek(), VANDAAG)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde.antwoorden.gezondheid).toBeNull()
    expect(u.waarde.metingen.rusthartslag).toBeUndefined()
    expect(u.waarde.metingen.bloeddruk).toBeUndefined()
    expect(JSON.stringify(u.waarde)).not.toContain('bloeddrukverlagers')
  })

  it('bewaart met toestemming wel de gezondheidsgegevens', () => {
    const u = leesIntake(verzoek({ toestemmingGezondheid: true }), VANDAAG)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde.antwoorden.gezondheid?.blessures).toEqual(['knie'])
    expect(u.waarde.antwoorden.gezondheid?.parqJa).toEqual(['hart'])
    expect(u.waarde.metingen.rusthartslag).toBe(62)
    expect(u.waarde.metingen.bloeddruk).toBe('125/80')
  })

  it('accepteert alleen een echte true als toestemming', () => {
    const u = leesIntake(verzoek({ toestemmingGezondheid: 'true' }), VANDAAG)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde.toestemmingGezondheid).toBe(false)
  })

  it('weigert foute invoer met een duidelijke melding', () => {
    expect(leesIntake(verzoek({ lidId: 'x' }), VANDAAG)).toEqual({ ok: false, fout: 'Kies eerst een lid.' })
    expect(leesIntake(verzoek({ datum: '2030-01-01' }), VANDAAG).ok).toBe(false)
    expect(leesIntake({ ...verzoek(), antwoorden: { ...verzoek().antwoorden, doelen: [] } }, VANDAAG)).toEqual({ ok: false, fout: 'Kies minstens een doel.' })
    expect(leesIntake({ ...verzoek(), antwoorden: { ...verzoek().antwoorden, dagenPerWeek: 9 } }, VANDAAG).ok).toBe(false)
    const zwaar = leesIntake(verzoek({ metingen: { gewicht_kg: 900 } }), VANDAAG)
    expect(zwaar.ok === false && zwaar.fout).toContain('Gewicht')
    const bd = leesIntake(verzoek({ toestemmingGezondheid: true, metingen: { bloeddruk: '80/120' } }), VANDAAG)
    expect(bd.ok).toBe(false)
    expect(leesIntake(null, VANDAAG).ok).toBe(false)
  })
})

describe('BMI en bloeddruk', () => {
  it('rekent de BMI op een decimaal', () => {
    expect(berekenBmi(80, 180)).toBe(24.7)
    expect(berekenBmi(undefined, 180)).toBeNull()
    expect(bmiDuiding(24.7)).toBe('gezond gewicht')
    expect(bmiDuiding(31)).toBe('obesitas')
  })
  it('leest een bloeddruk', () => {
    expect(leesBloeddruk(' 130 / 85 ')).toBe('130/85')
    expect(leesBloeddruk('130')).toBeNull()
  })
})

describe('intakeUitRij', () => {
  it('laat gezondheidsdata weg als er geen toestemming in de rij staat', () => {
    const i = intakeUitRij({
      id: 'a', lid_id: LID, datum: '2026-10-01', toestemming_gezondheid: false,
      antwoorden: { doelen: ['kracht'], niveau: 1, dagenPerWeek: 2, minutenPerSessie: 45, gezondheid: { blessures: ['rug'] } },
      metingen: { gewicht_kg: 70, rusthartslag: 60, bloeddruk: '120/80' },
      club_leden: { voornaam: 'Sanne', achternaam: 'Bos' },
    })
    expect(i?.antwoorden?.gezondheid).toBeNull()
    expect(i?.metingen).toEqual({ gewicht_kg: 70 })
    expect(i?.lidNaam).toBe('Sanne Bos')
  })
  it('geeft null bij een onbruikbare rij', () => {
    expect(intakeUitRij({ id: 'a' })).toBeNull()
  })
})

describe('leesIntake met eigen vragen van de sportschool', () => {
  const GEVONDEN = { id: '22222222-2222-4222-8222-222222222222', sleutel: null, vraag: 'Hoe heb je ons gevonden?', uitleg: null, soort: 'keuze' as const, opties: ['Google', 'Anders'], verplicht: true, gezondheid: false, sectie: 'Kennismaking', volgorde: 1, actief: true }
  const OPERATIE = { ...GEVONDEN, id: '33333333-3333-4333-8333-333333333333', vraag: 'Geopereerd?', soort: 'ja_nee' as const, opties: [], verplicht: false, gezondheid: true, sectie: 'Gezondheid', volgorde: 2 }
  const vragen = [GEVONDEN, OPERATIE]
  function met(eigen: Record<string, unknown>, toestemming = false) {
    const v = verzoek({ toestemmingGezondheid: toestemming })
    return { ...v, antwoorden: { ...v.antwoorden, eigen } }
  }

  it('bewaart de antwoorden met een kopie van de vraag', () => {
    const u = leesIntake(met({ [GEVONDEN.id]: 'Google' }), VANDAAG, vragen)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde.antwoorden.eigen).toEqual([
      { vraagId: GEVONDEN.id, vraag: 'Hoe heb je ons gevonden?', sectie: 'Kennismaking', soort: 'keuze', gezondheid: false, waarde: 'Google' },
    ])
  })

  it('weigert een open verplichte vraag en gezondheid zonder toestemming', () => {
    expect(leesIntake(met({}), VANDAAG, vragen).ok).toBe(false)
    expect(leesIntake(met({ [GEVONDEN.id]: 'Google', [OPERATIE.id]: true }), VANDAAG, vragen).ok).toBe(false)
    expect(leesIntake(met({ [GEVONDEN.id]: 'Google', [OPERATIE.id]: true }, true), VANDAAG, vragen).ok).toBe(true)
  })

  it('leest een oude intake zonder eigen antwoorden gewoon', () => {
    const i = intakeUitRij({ id: 'x', lid_id: LID, datum: '2026-10-01', antwoorden: { doelen: ['kracht'], niveau: 1, dagenPerWeek: 2, minutenPerSessie: 45 }, toestemming_gezondheid: false })
    expect(i?.antwoorden?.eigen).toEqual([])
    expect(i?.antwoorden?.doelen).toEqual(['kracht'])
  })
})
