import { describe, expect, it } from 'vitest'
import type { AppOefening, AppSchemaDag } from '@/lib/club/app/schema'
import {
  alternatievenVoor, materiaalVolgorde, naarAppAlternatief, overeenkomst, toegestaanMetAlternatieven, wisselOefening,
} from './alternatieven'
import { BIB, bibOef, oef } from './voorstel-test-bib'

const namen = (lijst: readonly { naam: string }[]) => lijst.map((o) => o.naam)

describe('overeenkomst', () => {
  it('zelfde patroon en zelfde hoofdspier is de beste match', () => {
    expect(overeenkomst(bibOef('Leg press'), bibOef('Goblet squat'))).toBe(2)
    expect(overeenkomst(bibOef('Biceps curl'), bibOef('Kabel curl'))).toBe(2)
  })
  it('zelfde patroon en de hoofdspier werkt mee is een mindere match', () => {
    expect(overeenkomst(bibOef('Seated row'), bibOef('Dumbbell row'))).toBe(1)
  })
  it('een ander patroon of een andere spier is geen alternatief', () => {
    expect(overeenkomst(bibOef('Leg press'), bibOef('Leg extension'))).toBe(0)
    expect(overeenkomst(bibOef('Lateral raise'), bibOef('Face pull'))).toBe(0)
    expect(overeenkomst(bibOef('Lat pulldown'), bibOef('Seated row'))).toBe(0)
    expect(overeenkomst(bibOef('Leg press'), bibOef('Leg press'))).toBe(0)
  })
  it('dragen is geen plank, ook al zijn beide romp', () => {
    const farmer = oef('Farmer walk', 'core', 'buik', 'dumbbell', 1, [], ['diepe_buikspier'])
    expect(overeenkomst(bibOef('Plank'), farmer)).toBe(0)
  })
  it('zonder patroon alleen bij dezelfde spiergroep en hoofdspier', () => {
    const a = { ...oef('Oude oefening A', 'isolatie', 'biceps', 'dumbbell', 1, [], ['biceps']), patroon: null }
    const b = { ...oef('Oude oefening B', 'isolatie', 'biceps', 'kabel', 1, [], ['biceps']), patroon: null }
    expect(overeenkomst(a, b)).toBe(2)
    expect(overeenkomst(a, bibOef('Biceps curl'))).toBe(0)
  })
})

describe('materiaalVolgorde', () => {
  it('eerst wat in het schema staat, dan wat de club het meest heeft', () => {
    const schema = [{ materiaal: 'kabel' as const }, { materiaal: 'kabel' as const }, { materiaal: 'dumbbell' as const }]
    const volgorde = materiaalVolgorde(schema, BIB)
    expect(volgorde.slice(0, 2)).toEqual(['kabel', 'dumbbell'])
    expect(volgorde.slice(2, 4)).toEqual(['geen', 'machine'])
    expect(volgorde).toHaveLength(10)
  })
  it('telt inactieve oefeningen niet mee', () => {
    const club = [{ materiaal: 'band' as const, actief: false }, { materiaal: 'band' as const, actief: false }, { materiaal: 'kettlebell' as const }]
    expect(materiaalVolgorde([], club)[0]).toBe('kettlebell')
  })
})

describe('alternatievenVoor', () => {
  it('geeft voor de leg press de andere squats, het gebruikte materiaal eerst', () => {
    const lijst = alternatievenVoor(bibOef('Leg press'), BIB, { volgorde: ['dumbbell', 'machine', 'geen', 'barbell'] })
    expect(namen(lijst)).toEqual(['Goblet squat', 'Box squat lichaamsgewicht', 'Back squat'])
  })
  it('zet de beste spiermatch boven het materiaal', () => {
    const lijst = alternatievenVoor(bibOef('Seated row'), BIB, { volgorde: ['dumbbell', 'band', 'kabel'] })
    expect(namen(lijst)).toEqual(['Band row', 'Dumbbell row'])
  })
  it('sluit oefeningen uit die al op de dag staan, inactief zijn of een klacht belasten', () => {
    const inactief = BIB.map((o) => (o.naam === 'Goblet squat' ? { ...o, actief: false } : o))
    expect(namen(alternatievenVoor(bibOef('Leg press'), inactief, { uitsluiten: new Set([bibOef('Back squat').id]) }))).toEqual(['Box squat lichaamsgewicht'])
    expect(alternatievenVoor(bibOef('Leg press'), BIB, { sparen: ['knie'] })).toEqual([])
  })
  it('voor het lid zelf nooit zwaarder: geen hoger niveau en geen extra belast gewricht', () => {
    const lijst = alternatievenVoor(bibOef('Leg press'), BIB, { voorLid: true })
    expect(namen(lijst)).toEqual(['Box squat lichaamsgewicht', 'Goblet squat'])
    const duwen = alternatievenVoor(bibOef('Band chest press'), BIB, { voorLid: true })
    expect(duwen).toEqual([])
  })
  it('houdt zich aan het maximum', () => {
    expect(alternatievenVoor(bibOef('Leg press'), BIB, { max: 1 })).toHaveLength(1)
  })
})

describe('toegestaanMetAlternatieven', () => {
  it('laat de oefeningen van de dag en hun veilige alternatieven toe, verder niets', () => {
    const dag = new Set([bibOef('Leg press').id, bibOef('Seated row').id])
    const mag = toegestaanMetAlternatieven(dag, BIB)
    expect(mag.has(bibOef('Goblet squat').id)).toBe(true)
    expect(mag.has(bibOef('Dumbbell row').id)).toBe(true)
    expect(mag.has(bibOef('Back squat').id)).toBe(false)
    expect(mag.has(bibOef('Bankdrukken').id)).toBe(false)
    expect(mag.has('onbekend')).toBe(false)
  })
})

describe('wisselOefening', () => {
  function appOef(id: string, naam: string, oefeningId: string): AppOefening {
    return {
      id, oefeningId, dag: 1, volgorde: 0, naam, spiergroep: 'benen', spierenPrimair: ['quadriceps'], spierenSecundair: [], sets: 3, herhalingen: '10',
      gewichtKg: 80, rustSec: 90, notitie: 'Knieen naar buiten', groep: 4, tijdSec: null, rpe: null, rir: 2, tempo: null, aandachtspunten: null, uitleg: null, beeld: null,
    }
  }
  const dag: AppSchemaDag = { dag: 1, letter: 'A', oefeningen: [appOef('r1', 'Leg press', bibOef('Leg press').id), appOef('r2', 'Lat pulldown', bibOef('Lat pulldown').id)] }

  it('wisselt alleen die regel, houdt sets en superset, wist het gewicht', () => {
    const alt = naarAppAlternatief(bibOef('Leg press'), bibOef('Goblet squat'))
    const na = wisselOefening(dag, 'r1', alt)
    expect(na.oefeningen[0]).toMatchObject({ id: 'r1', oefeningId: alt.oefeningId, naam: 'Goblet squat', sets: 3, herhalingen: '10', groep: 4, gewichtKg: null, notitie: 'Vandaag in plaats van Leg press.' })
    expect(na.oefeningen[1]).toBe(dag.oefeningen[1])
    expect(dag.oefeningen[0].naam).toBe('Leg press')
  })

  it('blijft bij twee keer wisselen naar de oefening uit het schema wijzen', () => {
    const een = wisselOefening(dag, 'r1', naarAppAlternatief(bibOef('Leg press'), bibOef('Goblet squat')))
    const twee = wisselOefening(een, 'r1', naarAppAlternatief(bibOef('Leg press'), bibOef('Box squat lichaamsgewicht')))
    expect(twee.oefeningen[0].notitie).toBe('Vandaag in plaats van Leg press.')
  })

  it('geeft de overeenkomst mee voor de app', () => {
    expect(naarAppAlternatief(bibOef('Seated row'), bibOef('Dumbbell row')).overeenkomst).toBe(1)
  })
})
