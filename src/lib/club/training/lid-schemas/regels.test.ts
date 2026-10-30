import { describe, expect, it } from 'vitest'
import { BIB, PER_ID } from '../voorstel-test-bib'
import { isBlenderOefening } from '../blender-bibliotheek'
import {
  kiesActief, leesLidSchema, leesSnelleStart, lidSchemaInstellingNaarJson, lidSchemaInstellingUitJson, magBewerken, magVerwijderen,
  MATERIAAL_BIJ, oefeningenToegestaan, STANDAARD_LID_SCHEMAS,
} from './regels'
import { kiesbaarVoorLid, lidVoorstel } from './voorstel'

const LID = '11111111-1111-4111-8111-111111111111'
const ANDER = '22222222-2222-4222-8222-222222222222'
const OEF = '33333333-3333-4333-8333-333333333333'

describe('kiesActief', () => {
  const trainer = { id: 't', maker: 'trainer' as const, aangemaaktOp: '2026-10-01T10:00:00Z', actiefGekozenOp: null }
  const eigen = { id: 'e', maker: 'lid' as const, aangemaaktOp: '2026-10-10T10:00:00Z', actiefGekozenOp: '2026-10-10T10:00:00Z' }

  it('geeft null zonder actieve schema s', () => {
    expect(kiesActief([])).toBeNull()
  })

  it('kiest het laatst gekozen schema', () => {
    expect(kiesActief([trainer, eigen])?.id).toBe('e')
  })

  it('een nieuw schema van de trainer gaat voor een eerdere keuze van het lid', () => {
    const nieuw = { ...trainer, id: 't2', aangemaaktOp: '2026-10-20T10:00:00Z' }
    expect(kiesActief([eigen, nieuw])?.id).toBe('t2')
  })

  it('het lid kiest het trainerschema weer terug', () => {
    expect(kiesActief([{ ...trainer, actiefGekozenOp: '2026-10-11T10:00:00Z' }, eigen])?.id).toBe('t')
  })

  it('bij gelijke stand gaat het schema van de trainer voor', () => {
    expect(kiesActief([eigen, { ...trainer, aangemaaktOp: eigen.aangemaaktOp }])?.id).toBe('t')
  })
})

describe('rechten van het lid', () => {
  it('eigen schema: aanpassen en verwijderen mag', () => {
    const s = { maker: 'lid' as const, lidId: LID }
    expect(magBewerken(s, LID, false)).toBe(true)
    expect(magVerwijderen(s, LID)).toBe(true)
  })

  it('schema van de trainer: alleen aanpassen als de sportschool het toestaat, nooit verwijderen', () => {
    const s = { maker: 'trainer' as const, lidId: LID }
    expect(magBewerken(s, LID, false)).toBe(false)
    expect(magBewerken(s, LID, true)).toBe(true)
    expect(magVerwijderen(s, LID)).toBe(false)
  })

  it('nooit het schema van een ander lid of een sjabloon', () => {
    expect(magBewerken({ maker: 'lid', lidId: ANDER }, LID, true)).toBe(false)
    expect(magBewerken({ maker: 'trainer', lidId: null }, LID, true)).toBe(false)
    expect(magVerwijderen({ maker: 'lid', lidId: ANDER }, LID)).toBe(false)
  })
})

describe('leesSnelleStart', () => {
  it('leest een geldige keuze', () => {
    expect(leesSnelleStart({ doel: 'kracht', dagen: '3', materiaal: 'gym', niveau: 2 })).toEqual({ doel: 'kracht', dagen: 3, materiaal: 'gym', niveau: 2 })
  })

  it('weigert onbekende of te grote waarden', () => {
    expect(leesSnelleStart({ doel: 'revalidatie', dagen: 3, materiaal: 'gym', niveau: 1 })).toBeNull()
    expect(leesSnelleStart({ doel: 'kracht', dagen: 7, materiaal: 'gym', niveau: 1 })).toBeNull()
    expect(leesSnelleStart({ doel: 'kracht', dagen: 2.5, materiaal: 'gym', niveau: 1 })).toBeNull()
    expect(leesSnelleStart({ doel: 'kracht', dagen: 2, materiaal: 'zwembad', niveau: 1 })).toBeNull()
    expect(leesSnelleStart(null)).toBeNull()
  })
})

describe('leesLidSchema', () => {
  it('status, trainer en notitie bepaalt het lid niet', () => {
    const r = leesLidSchema({ naam: 'Mijn schema', niveau: 1, status: 'concept', medewerkerId: OEF, notitie: 'x', dagTitels: ['Dag A'], regels: [{ dag: 1, oefeningId: OEF, sets: 3, herhalingen: '10' }] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.waarde.status).toBe('actief')
      expect(r.waarde.medewerkerId).toBeNull()
      expect(r.waarde.notitie).toBeNull()
      expect(r.waarde.regels).toHaveLength(1)
    }
  })

  it('weigert een schema zonder naam of met een kapotte regel', () => {
    expect(leesLidSchema({ naam: '', niveau: 1, regels: [] }).ok).toBe(false)
    expect(leesLidSchema({ naam: 'x', niveau: 1, regels: [{ dag: 1, oefeningId: OEF, sets: 99 }] }).ok).toBe(false)
  })
})

describe('oefeningenToegestaan', () => {
  it('alleen kiesbare oefeningen of oefeningen die er al in stonden', () => {
    expect(oefeningenToegestaan(['a', 'b'], new Set(['a', 'b']))).toBe(true)
    expect(oefeningenToegestaan(['a', 'c'], new Set(['a']))).toBe(false)
    expect(oefeningenToegestaan(['a', 'c'], new Set(['a']), new Set(['c']))).toBe(true)
  })
})

describe('instelling van de sportschool', () => {
  it('standaard mag een lid het schema van de trainer niet aanpassen', () => {
    expect(lidSchemaInstellingUitJson(undefined)).toEqual(STANDAARD_LID_SCHEMAS)
    expect(lidSchemaInstellingUitJson({ trainer_aanpassen: 'ja' }).trainerAanpassen).toBe(false)
    expect(lidSchemaInstellingUitJson(lidSchemaInstellingNaarJson({ trainerAanpassen: true })).trainerAanpassen).toBe(true)
  })
})

describe('lidVoorstel', () => {
  it('kiest alleen Blender-oefeningen met het gekozen materiaal', () => {
    for (const materiaal of ['thuis', 'dumbbells', 'gym'] as const) {
      const v = lidVoorstel({ doel: 'gezondheid', dagen: 2, materiaal, niveau: 1 }, BIB)
      if (!v) continue
      for (const r of v.regels) {
        const o = PER_ID.get(r.oefeningId)
        expect(o && kiesbaarVoorLid(o)).toBe(true)
        expect(o && MATERIAAL_BIJ[materiaal].includes(o.materiaal)).toBe(true)
      }
      expect(Math.max(...v.regels.map((r) => r.dag))).toBe(v.dagTitels.length)
    }
  })

  it('geeft null als er niets past', () => {
    expect(lidVoorstel({ doel: 'kracht', dagen: 3, materiaal: 'thuis', niveau: 1 }, BIB.filter((o) => !isBlenderOefening(o.naam)))).toBeNull()
  })

  it('een volledige gym geeft een voorstel met dagen en oefeningen', () => {
    const v = lidVoorstel({ doel: 'spiermassa', dagen: 3, materiaal: 'gym', niveau: 3 }, BIB)
    expect(v).not.toBeNull()
    expect(v?.regels.length).toBeGreaterThan(0)
  })
})
