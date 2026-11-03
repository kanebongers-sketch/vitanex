import { describe, expect, it } from 'vitest'
import { bevestigdeVersie, isVervangen, magBevestigen, nieuweVersie, openVoor, stappenUitTekst, telBevestigd, telOpen, werkwijzenVoor } from './model'
import { prikbordWeergave } from './weergave'
import type { Gelezen, Kijker, Mededeling, TeamPersoon, Werkwijze } from './typen'

const NU = new Date('2026-11-03T10:00:00Z')
const ANNA = '00000000-0000-4000-8000-00000000000a'
const BOB = '00000000-0000-4000-8000-00000000000b'
const EIGENAAR = '00000000-0000-4000-8000-00000000000e'
const WW = '00000000-0000-4000-8000-0000000000f1'

function mededeling(deel: Partial<Mededeling> = {}): Mededeling {
  return {
    id: 'm1', titel: 'Nieuwe kluisjes', inhoud: '', vestigingen: [], rollen: [], verplicht: false, soort: 'mededeling',
    werkwijzeId: null, werkwijzeVersie: null, doorProfiel: EIGENAAR, geplaatstOp: '2026-11-02T08:00:00Z', verlooptOp: null, gearchiveerd: false, ...deel,
  }
}

function werkwijze(deel: Partial<Werkwijze> = {}): Werkwijze {
  return {
    id: WW, titel: 'Sluiten', soort: 'sluiten', vestigingen: [], rollen: ['trainer'], versie: 3, takenlijstId: null, bronNotitieId: null,
    gearchiveerd: false, bijgewerktOp: '2026-11-01T08:00:00Z', stappen: [{ tekst: 'Licht uit', uitleg: null }], watAnders: null, ...deel,
  }
}

const anna: Kijker = { profielId: ANNA, rollen: ['trainer'], vestigingen: ['budel'] }
const team: TeamPersoon[] = [
  { id: ANNA, naam: 'Anna', rollen: ['trainer'], vestigingen: ['budel'], alleVestigingen: false },
  { id: BOB, naam: 'Bob', rollen: ['instructeur'], vestigingen: ['eersel'], alleVestigingen: false },
  { id: EIGENAAR, naam: 'Eva', rollen: ['eigenaar'], vestigingen: [], alleVestigingen: true },
]
const gelezen = (deel: Partial<Gelezen> & { profielId: string }): Gelezen => ({ mededelingId: 'm1', gelezenOp: '2026-11-02T09:00:00Z', bevestigdOp: null, ...deel })

describe('prikbord: voor wie', () => {
  it('leeg is iedereen; vestiging en rol beperken', () => {
    // Arrange
    const lijst = [
      mededeling({ id: 'a' }),
      mededeling({ id: 'b', vestigingen: ['eersel'] }),
      mededeling({ id: 'c', rollen: ['instructeur'] }),
      mededeling({ id: 'd', vestigingen: ['budel'], rollen: ['trainer'] }),
    ]
    // Act
    const open = openVoor({ kijker: anna, mededelingen: lijst, gelezen: [], werkwijzen: [], nu: NU })
    // Assert
    expect(open.map((m) => m.id).sort()).toEqual(['a', 'd'])
  })

  it('wie op alle vestigingen werkt, valt onder elke vestiging', () => {
    const m = mededeling({ vestigingen: ['eersel'], doorProfiel: ANNA })
    expect(telBevestigd(m, team, []).totaal).toBe(2)
  })
})

describe('prikbord: wat staat open', () => {
  it('gelezen is af; verplicht pas na bevestigen', () => {
    // Arrange
    const gewoon = mededeling({ id: 'm1' })
    const verplicht = mededeling({ id: 'm2', verplicht: true })
    const regels = [gelezen({ profielId: ANNA }), gelezen({ profielId: ANNA, mededelingId: 'm2' })]
    // Act
    const open = openVoor({ kijker: anna, mededelingen: [gewoon, verplicht], gelezen: regels, werkwijzen: [], nu: NU })
    // Assert
    expect(open.map((m) => m.id)).toEqual(['m2'])
  })

  it('eigen, gearchiveerde en verlopen mededelingen staan niet open', () => {
    const lijst = [
      mededeling({ id: 'eigen', doorProfiel: ANNA }),
      mededeling({ id: 'archief', gearchiveerd: true }),
      mededeling({ id: 'verlopen', verlooptOp: '2026-11-03T09:00:00Z' }),
    ]
    expect(openVoor({ kijker: anna, mededelingen: lijst, gelezen: [], werkwijzen: [], nu: NU })).toEqual([])
  })

  it('zonder profiel staat er niets open (het master account)', () => {
    expect(openVoor({ kijker: { ...anna, profielId: null }, mededelingen: [mededeling()], gelezen: [], werkwijzen: [], nu: NU })).toEqual([])
  })

  it('telt nieuwe mededelingen en te bevestigen werkwijzen apart, verplicht eerst', () => {
    // Arrange
    const lijst = [
      mededeling({ id: 'oud', geplaatstOp: '2026-11-01T08:00:00Z' }),
      mededeling({ id: 'wijz', soort: 'wijziging', verplicht: true, werkwijzeId: WW, werkwijzeVersie: 3 }),
    ]
    // Act
    const open = openVoor({ kijker: anna, mededelingen: lijst, gelezen: [], werkwijzen: [werkwijze()], nu: NU })
    // Assert
    expect(open.map((m) => m.id)).toEqual(['wijz', 'oud'])
    expect(telOpen(open)).toEqual({ mededelingen: 1, werkwijzen: 1 })
  })
})

describe('prikbord: x van y bevestigd', () => {
  it('telt de doelgroep zonder de schrijver en noemt wie nog niet', () => {
    // Arrange
    const m = mededeling({ verplicht: true })
    const regels = [gelezen({ profielId: ANNA, bevestigdOp: '2026-11-02T10:00:00Z' }), gelezen({ profielId: BOB })]
    // Act
    const t = telBevestigd(m, team, regels)
    // Assert
    expect(t).toEqual({ totaal: 2, gedaan: 1, nogNiet: ['Bob'] })
  })
})

describe('prikbord: een nieuwe versie maakt een verplichte wijziging', () => {
  const titel = (naam: string, versie: number) => `Werkwijze ${naam} is gewijzigd (versie ${versie})`

  it('belangrijk: verplichte mededeling voor de doelgroep van de werkwijze, met de nieuwe versie', () => {
    // Arrange
    const w = werkwijze({ vestigingen: ['budel'] })
    // Act
    const v = nieuweVersie(w, { stappen: [{ tekst: 'Alarm aan', uitleg: null }], watAnders: 'Alarm gaat als laatste aan.', belangrijk: true }, titel)
    // Assert
    expect(v?.versie).toBe(4)
    expect(v?.mededeling).toEqual({
      titel: 'Werkwijze Sluiten is gewijzigd (versie 4)', inhoud: 'Alarm gaat als laatste aan.', verplicht: true, soort: 'wijziging',
      werkwijzeId: WW, werkwijzeVersie: 4, vestigingen: ['budel'], rollen: ['trainer'],
    })
  })

  it('niet belangrijk: wel een versie, geen mededeling; belangrijk zonder uitleg mag niet', () => {
    const stappen = [{ tekst: 'Alarm aan', uitleg: null }]
    expect(nieuweVersie(werkwijze(), { stappen, watAnders: null, belangrijk: false }, titel)?.mededeling).toBeNull()
    expect(nieuweVersie(werkwijze(), { stappen, watAnders: null, belangrijk: true }, titel)).toBeNull()
  })
})

describe('prikbord: bevestigen telt alleen de juiste versie', () => {
  const v3 = mededeling({ id: 'v3', soort: 'wijziging', verplicht: true, werkwijzeId: WW, werkwijzeVersie: 3 })
  const v4 = mededeling({ id: 'v4', soort: 'wijziging', verplicht: true, werkwijzeId: WW, werkwijzeVersie: 4 })

  it('een oudere wijziging is vervangen en staat niet meer open', () => {
    const w = werkwijze({ versie: 4 })
    expect(isVervangen(v3, [w])).toBe(true)
    expect(isVervangen(v4, [w])).toBe(false)
    expect(openVoor({ kijker: anna, mededelingen: [v3, v4], gelezen: [], werkwijzen: [w], nu: NU }).map((m) => m.id)).toEqual(['v4'])
    expect(magBevestigen(v3, anna, [w], NU)).toBe(false)
  })

  it('wie versie 3 bevestigde, heeft versie 4 nog niet bevestigd', () => {
    // Arrange
    const regels = [gelezen({ profielId: ANNA, mededelingId: 'v3', bevestigdOp: '2026-11-02T10:00:00Z' }), gelezen({ profielId: ANNA, mededelingId: 'v4' })]
    // Act
    const versie = bevestigdeVersie(WW, ANNA, [v3, v4], regels)
    // Assert
    expect(versie).toBe(3)
    expect(openVoor({ kijker: anna, mededelingen: [v3, v4], gelezen: regels, werkwijzen: [werkwijze({ versie: 4 })], nu: NU }).map((m) => m.id)).toEqual(['v4'])
  })

  it('een gearchiveerde werkwijze vraagt geen bevestiging meer', () => {
    expect(isVervangen(v4, [werkwijze({ versie: 4, gearchiveerd: true })])).toBe(true)
  })
})

describe('prikbord: werkwijzen en weergave', () => {
  it('de leiding ziet alle werkwijzen, het team die voor hem zijn', () => {
    const lijst = [werkwijze({ id: 'a', rollen: ['instructeur'] }), werkwijze({ id: 'b' }), werkwijze({ id: 'c', gearchiveerd: true })]
    expect(werkwijzenVoor(lijst, anna, false).map((w) => w.id)).toEqual(['b'])
    expect(werkwijzenVoor(lijst, anna, true).map((w) => w.id).sort()).toEqual(['a', 'b'])
  })

  it('stappen uit een notitie: elke regel een stap, zonder vinkjes of opsomming', () => {
    expect(stappenUitTekst('# Sluiten\n- [ ] Licht uit\n\n2. Alarm aan\n* Deur dicht').map((s) => s.tekst)).toEqual(['Sluiten', 'Licht uit', 'Alarm aan', 'Deur dicht'])
  })

  it('de weergave: open eerst, telling alleen voor de leiding', () => {
    // Arrange
    const lijst = [mededeling({ id: 'm1', geplaatstOp: '2026-11-02T08:00:00Z' }), mededeling({ id: 'm2', geplaatstOp: '2026-11-01T08:00:00Z' })]
    const regels = [gelezen({ profielId: ANNA, mededelingId: 'm1' })]
    const basis = { kijker: anna, mededelingen: lijst, gelezen: regels, werkwijzen: [], team, uitvoeringen: [], nu: NU }
    // Act
    const team1 = prikbordWeergave({ ...basis, leiding: false })
    const leiding = prikbordWeergave({ ...basis, leiding: true })
    // Assert
    expect(team1.lopend.map((m) => [m.mededeling.id, m.open])).toEqual([['m2', true], ['m1', false]])
    expect(team1.lopend[0].telling).toBeNull()
    expect(leiding.lopend[0].telling?.totaal).toBe(2)
  })
})
