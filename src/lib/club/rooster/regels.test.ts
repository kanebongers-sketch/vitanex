import { describe, expect, it } from 'vitest'
import {
  STANDAARD_REGELS,
  beoordeelAfvinken,
  beoordeelAnnulering,
  beoordeelReservering,
  gewijzigdePosities,
  noShowBlokkadeTot,
  planDoorschuiven,
  regelsNaarJson,
  regelsUitJson,
  type ReserveerFeiten,
  type WachtRij,
} from './regels'

const NU = new Date('2026-10-14T10:00:00Z')
const UUR = 3_600_000
const DAG = 86_400_000

function feiten(over: Partial<ReserveerFeiten> = {}): ReserveerFeiten {
  return {
    nu: NU,
    regels: STANDAARD_REGELS,
    les: { start: new Date(NU.getTime() + DAG), geannuleerd: false, capaciteit: 10 },
    lidStatus: 'actief',
    bestaand: null,
    openElders: 0,
    bezet: 3,
    laatsteWachtpositie: 0,
    noShows: [],
    ...over,
  }
}

describe('regelsUitJson', () => {
  it('vult ontbrekende regels aan met de standaard', () => {
    expect(regelsUitJson({ annuleer_uren: 4 })).toEqual({ ...STANDAARD_REGELS, annuleerUren: 4 })
    expect(regelsUitJson(null)).toEqual(STANDAARD_REGELS)
  })

  it('houdt waarden binnen de grenzen en negeert onzin', () => {
    const r = regelsUitJson({ annuleer_uren: 999, no_show_drempel: 'abc', max_open_reserveringen: '3' })
    expect(r.annuleerUren).toBe(72)
    expect(r.noShowDrempel).toBe(STANDAARD_REGELS.noShowDrempel)
    expect(r.maxOpenReserveringen).toBe(3)
  })

  it('schrijft terug in snake_case', () => {
    expect(regelsNaarJson(STANDAARD_REGELS)).toMatchObject({ annuleer_uren: 2, checkin_venster_min: 15 })
  })
})

describe('beoordeelReservering', () => {
  it('boekt als er plek is', () => {
    expect(beoordeelReservering(feiten())).toEqual({ ok: true, status: 'geboekt', wachtpositie: null })
  })

  it('zet op de wachtlijst als de les vol is, achteraan', () => {
    expect(beoordeelReservering(feiten({ bezet: 10, laatsteWachtpositie: 2 }))).toEqual({ ok: true, status: 'wachtlijst', wachtpositie: 3 })
  })

  it('weigert een geannuleerde les en een les in het verleden', () => {
    expect(beoordeelReservering(feiten({ les: { start: new Date(NU.getTime() + DAG), geannuleerd: true, capaciteit: 10 } }))).toMatchObject({ ok: false, code: 'les_geannuleerd' })
    expect(beoordeelReservering(feiten({ les: { start: new Date(NU.getTime() - UUR), geannuleerd: false, capaciteit: 10 } }))).toMatchObject({ ok: false, code: 'les_voorbij' })
  })

  it('weigert te ver vooruit', () => {
    const uit = beoordeelReservering(feiten({ les: { start: new Date(NU.getTime() + 8 * DAG), geannuleerd: false, capaciteit: 10 } }))
    expect(uit).toMatchObject({ ok: false, code: 'te_ver_vooruit' })
  })

  it('weigert een lid dat niet mag trainen', () => {
    expect(beoordeelReservering(feiten({ lidStatus: 'gepauzeerd' }))).toMatchObject({ ok: false, code: 'lid_mag_niet' })
    expect(beoordeelReservering(feiten({ lidStatus: 'proef' }))).toMatchObject({ ok: true })
  })

  it('weigert een dubbele boeking, maar laat opnieuw boeken na annuleren toe', () => {
    expect(beoordeelReservering(feiten({ bestaand: 'geboekt' }))).toMatchObject({ ok: false, code: 'al_ingeschreven' })
    expect(beoordeelReservering(feiten({ bestaand: 'wachtlijst' }))).toMatchObject({ ok: false, code: 'al_ingeschreven' })
    expect(beoordeelReservering(feiten({ bestaand: 'geannuleerd' }))).toMatchObject({ ok: true })
  })

  it('weigert boven het maximum aan open boekingen', () => {
    expect(beoordeelReservering(feiten({ openElders: 5 }))).toMatchObject({ ok: false, code: 'te_veel_open' })
    expect(beoordeelReservering(feiten({ openElders: 4 }))).toMatchObject({ ok: true })
  })

  it('weigert tijdens een no-show blokkade', () => {
    const noShows = [NU.getTime() - 10 * DAG, NU.getTime() - 5 * DAG, NU.getTime() - 2 * DAG].map((t) => new Date(t))
    const uit = beoordeelReservering(feiten({ noShows }))
    expect(uit).toMatchObject({ ok: false, code: 'geblokkeerd' })
    if (!uit.ok) expect(uit.fout).toContain('19 oktober')
  })
})

describe('noShowBlokkadeTot', () => {
  it('geeft geen blokkade onder de drempel', () => {
    expect(noShowBlokkadeTot([new Date(NU.getTime() - DAG)], STANDAARD_REGELS)).toBeNull()
  })

  it('telt alleen no-shows binnen 30 dagen van elkaar', () => {
    const verspreid = [0, 20, 40].map((d) => new Date(NU.getTime() - d * DAG))
    expect(noShowBlokkadeTot(verspreid, STANDAARD_REGELS)).toBeNull()
  })

  it('blokkeert vanaf de laatste no-show', () => {
    const laatste = NU.getTime() - DAG
    const tot = noShowBlokkadeTot([new Date(laatste - 3 * DAG), new Date(laatste), new Date(laatste - 9 * DAG)], STANDAARD_REGELS)
    expect(tot?.getTime()).toBe(laatste + 7 * DAG)
  })

  it('blokkeert niet als de blokkade op 0 dagen staat', () => {
    const r = { ...STANDAARD_REGELS, noShowBlokkadeDagen: 0 }
    expect(noShowBlokkadeTot([NU, NU, NU], r)).toBeNull()
  })
})

describe('beoordeelAnnulering', () => {
  it('is op tijd ruim voor de start', () => {
    expect(beoordeelAnnulering('geboekt', new Date(NU.getTime() + 3 * UUR), NU, STANDAARD_REGELS)).toEqual({ ok: true, teLaat: false })
  })

  it('is te laat binnen het annuleervenster', () => {
    expect(beoordeelAnnulering('geboekt', new Date(NU.getTime() + UUR), NU, STANDAARD_REGELS)).toEqual({ ok: true, teLaat: true })
  })

  it('van de wachtlijst af is nooit te laat', () => {
    expect(beoordeelAnnulering('wachtlijst', new Date(NU.getTime() + UUR), NU, STANDAARD_REGELS)).toEqual({ ok: true, teLaat: false })
  })

  it('weigert na de start of na afvinken', () => {
    expect(beoordeelAnnulering('geboekt', new Date(NU.getTime() - 1), NU, STANDAARD_REGELS).ok).toBe(false)
    expect(beoordeelAnnulering('aanwezig', new Date(NU.getTime() + UUR), NU, STANDAARD_REGELS).ok).toBe(false)
    expect(beoordeelAnnulering('geannuleerd', new Date(NU.getTime() + UUR), NU, STANDAARD_REGELS).ok).toBe(false)
  })
})

describe('beoordeelAfvinken', () => {
  const start = new Date(NU.getTime() + 10 * 60_000)
  it('mag binnen het check-in venster', () => {
    expect(beoordeelAfvinken('geboekt', 'aanwezig', start, NU, STANDAARD_REGELS)).toBeNull()
  })

  it('mag niet ruim voor de les', () => {
    expect(beoordeelAfvinken('geboekt', 'no_show', new Date(NU.getTime() + UUR), NU, STANDAARD_REGELS)).toContain('15 minuten')
  })

  it('mag terugzetten naar geboekt, maar niet voor de wachtlijst', () => {
    expect(beoordeelAfvinken('no_show', 'geboekt', start, NU, STANDAARD_REGELS)).toBeNull()
    expect(beoordeelAfvinken('wachtlijst', 'aanwezig', start, NU, STANDAARD_REGELS)).not.toBeNull()
  })
})

describe('planDoorschuiven', () => {
  const wachtlijst: WachtRij[] = [
    { id: 'c', lidId: 'lc', wachtpositie: 3, geboektOp: '2026-10-10T10:00:00Z' },
    { id: 'a', lidId: 'la', wachtpositie: 1, geboektOp: '2026-10-10T08:00:00Z' },
    { id: 'b', lidId: 'lb', wachtpositie: 2, geboektOp: '2026-10-10T09:00:00Z' },
  ]

  it('schuift de eerste door en nummert de rest opnieuw', () => {
    const plan = planDoorschuiven(wachtlijst, 1)
    expect(plan.naarGeboekt.map((r) => r.id)).toEqual(['a'])
    expect(plan.hernummerd).toEqual([
      { id: 'b', wachtpositie: 1 },
      { id: 'c', wachtpositie: 2 },
    ])
  })

  it('schuift niemand door zonder vrije plek, maar dicht gaten', () => {
    const metGat = wachtlijst.filter((r) => r.id !== 'b')
    const plan = planDoorschuiven(metGat, 0)
    expect(plan.naarGeboekt).toEqual([])
    expect(gewijzigdePosities(metGat, plan)).toEqual([{ id: 'c', wachtpositie: 2 }])
  })

  it('schuift er meer door bij meer plekken en nooit meer dan er wachten', () => {
    expect(planDoorschuiven(wachtlijst, 5).naarGeboekt).toHaveLength(3)
    expect(planDoorschuiven(wachtlijst, -1).naarGeboekt).toHaveLength(0)
  })
})
