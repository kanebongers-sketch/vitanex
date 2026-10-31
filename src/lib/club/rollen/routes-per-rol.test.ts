// Rollen v2: per rol en voor combinaties de uitkomst per route vastgelegd.
// De sloten komen uit de echte layouts en pagina's (routekaart.testhulp.ts) en
// worden uitgerekend met dezelfde functies als Club zelf (bouwProfiel, niveau,
// magOnderdeel, isEigenaar, het instellingencentrum, magApiV2).

import { describe, expect, it } from 'vitest'
import { clubPaginas, type Pagina, type Slot } from './routekaart.testhulp'
import { bouwProfiel } from './profiel'
import { magApiV2 } from './api'
import { startDoorverwijzing } from './model'
import { isEigenaar, type ProfielToegang } from './wie'
import { minstens, ROLLEN, type Niveau, type Rol } from './typen'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { heeftInstellingen } from '@/lib/club/kern/instel-paginas'
import { ALLE_PAKKETTEN, verborgenVoor } from '@/lib/club/kern/pakketten'
import { LIDGELD_ONDERDEEL } from '@/lib/club/betalen/plannen/toegang'

const UIT = verborgenVoor([], ALLE_PAKKETTEN)
const CONSTANTEN: Readonly<Record<string, string>> = { LIDGELD_ONDERDEEL }

interface Gesimuleerd {
  isPlatformEigenaar: false
  rol: 'medewerker'
  profiel: ProfielToegang
  onderdelen: string[]
}

function simuleer(rollen: Rol[]): Gesimuleerd {
  const { profiel, onderdelen } = bouwProfiel({ id: 'p', rollen, alleVestigingen: true }, { instellingen: { ledenapp: { welkom: null, tabsUit: [], qr: true }, rechten: { trainer: [], instructeur: [], manager: [], administratie: [] }, checkin: { methode: 'beide' } }, uit: UIT })
  return { isPlatformEigenaar: false, rol: 'medewerker', profiel, onderdelen }
}

function slotOpen(s: Slot, t: Gesimuleerd): boolean {
  switch (s.naam) {
    case 'eisClubToegang':
    case 'eisModule':
    case 'eisPakket':
      return true
    case 'eisOnderdeel':
      return magOnderdeel(t.onderdelen, CONSTANTEN[s.args[0]] ?? s.args[0])
    case 'eisBeheerdersBeheer':
    case 'eisBetalenBeheer':
      return isEigenaar(t)
    case 'eisPlatformEigenaar':
      return false
    case 'eisInstellingencentrum':
      return heeftInstellingen({ uit: UIT, toegestaan: t.onderdelen, medewerker: true, betalenAan: true, lidgeldAan: true, rollenV2: true, eigenaar: isEigenaar(t) })
    case 'eisNiveau':
      return minstens(t.profiel.niveaus[s.args[0]] ?? 'geen', s.args[1] as Niveau)
    default:
      throw new Error(`Onbekend slot ${s.naam}`)
  }
}

function open(p: Pagina, t: Gesimuleerd): boolean {
  return p.sloten.every((s) => slotOpen(s, t))
}

const PAGINAS = clubPaginas()

/** Per combinatie: de pagina's die open zijn (/club met de doorverwijzing erbij). */
function kaart(rollen: Rol[]): string[] {
  const t = simuleer(rollen)
  return PAGINAS.filter((p) => open(p, t)).map((p) => {
    if (p.pad !== '/club') return p.pad
    const naar = startDoorverwijzing(t.profiel, undefined)
    return naar ? `/club -> ${naar}` : '/club'
  })
}

function opent(rollen: Rol[], pad: string): boolean {
  const p = PAGINAS.find((x) => x.pad === pad)
  if (!p) throw new Error(`Geen pagina ${pad}`)
  return open(p, simuleer(rollen))
}

describe('routes per rol (rollen v2)', () => {
  it('eigenaar: alles binnen de eigen sportschool (besluit Kane 17-10-2026), ook werkvloer, rooster en coaching', () => {
    for (const pad of ['/club', '/club/cijfers', '/club/rapporten', '/club/beheer/team', '/club/beheer/rechten', '/club/beheer/abonnement', '/club/huisstijl', '/club/beheer/privacy', '/club/start', '/club/leden', '/club/leads']) expect(opent(['eigenaar'], pad), pad).toBe(true)
    for (const pad of ['/club/training', '/club/checkin', '/club/taken', '/club/notities', '/club/rooster', '/club/personeel', '/club/voeding']) expect(opent(['eigenaar'], pad), pad).toBe(true)
  })

  it('clubmanager: bijna alles, nooit wat van de eigenaar is', () => {
    for (const pad of ['/club/training', '/club/checkin', '/club/cijfers', '/club/beheer/team', '/club/personeel', '/club/instellingen/vestigingen']) expect(opent(['manager'], pad), pad).toBe(true)
    for (const pad of ['/club/beheer/abonnement', '/club/beheer/rechten', '/club/huisstijl', '/club/beheer/privacy', '/club/beheer/bedrijf', '/club/beheer/lidmaatschappen', '/club/beheer/sluiting', '/club/beheer/widget', '/club/start']) expect(opent(['manager'], pad), pad).toBe(false)
  })

  it('trainer: werkvloer, leden, coaching en afspraken', () => {
    for (const pad of ['/club', '/club/leden', '/club/training', '/club/voeding', '/club/afspraken', '/club/taken', '/club/notities']) expect(opent(['trainer'], pad), pad).toBe(true)
    for (const pad of ['/club/cijfers', '/club/beheer/team', '/club/personeel', '/club/rooster', '/club/huisstijl']) expect(opent(['trainer'], pad), pad).toBe(false)
  })

  it('instructeur, roosteraar en administratie', () => {
    expect(opent(['instructeur'], '/club/rooster')).toBe(true)
    expect(opent(['instructeur'], '/club/leden')).toBe(false)
    expect(opent(['roosteraar'], '/club/personeel')).toBe(true)
    expect(opent(['roosteraar'], '/club/rooster')).toBe(true)
    expect(opent(['roosteraar'], '/club/leden')).toBe(false)
    expect(opent(['administratie'], '/club/personeel')).toBe(true)
    expect(opent(['administratie'], '/club/rapporten')).toBe(true)
    expect(opent(['administratie'], '/club/cijfers')).toBe(false)
  })

  it('combinaties tellen op: eigenaar die zelf traint ziet ook de werkvloer', () => {
    expect(opent(['eigenaar', 'trainer'], '/club/training')).toBe(true)
    expect(opent(['eigenaar', 'trainer'], '/club/cijfers')).toBe(true)
    const los = new Set([...kaart(['instructeur']), ...kaart(['administratie'])].filter((p) => !p.startsWith('/club ->') && p !== '/club'))
    const samen = new Set(kaart(['instructeur', 'administratie']))
    for (const p of los) expect(samen.has(p), p).toBe(true)
  })

  it('de startpagina van elke rol is een pagina die open is', () => {
    for (const rol of ROLLEN) {
      const t = simuleer([rol])
      const kaal = t.profiel.start.split('?')[0]
      expect(opent([rol], kaal), `${rol}: ${t.profiel.start}`).toBe(true)
    }
  })

  it('zonder rol is alleen Hulp open (en /club stuurt daarheen)', () => {
    expect(kaart([])).toEqual(['/club -> /club/hulp', '/club/hulp', '/club/koppelingen', '/club/nieuw'])
  })

  it('per rol vastgelegd', () => {
    const uitkomst = Object.fromEntries([...ROLLEN.map((r) => [r, kaart([r])]), ['eigenaar+trainer', kaart(['eigenaar', 'trainer'])], ['instructeur+roosteraar', kaart(['instructeur', 'roosteraar'])]])
    expect(uitkomst).toMatchSnapshot()
  })
})

describe('API per rol (rollen v2)', () => {
  const VERZOEKEN: [string, string][] = [
    ['GET', '/api/club/leden'], ['POST', '/api/club/leden'], ['GET', '/api/club/leads'], ['POST', '/api/club/leads'],
    ['POST', '/api/club/training/schemas'], ['POST', '/api/club/rooster/lessen'], ['POST', '/api/club/personeel/diensten'],
    ['GET', '/api/club/personeel/uren'], ['POST', '/api/club/personeel/uren'], ['PATCH', '/api/club/team/x'],
    ['PATCH', '/api/club/medewerker-toegang/x'], ['POST', '/api/club/beheerders'], ['PATCH', '/api/club/organisatie'],
    ['PATCH', '/api/club/privacy'], ['POST', '/api/club/betalen/producten'], ['GET', '/api/club/organisatie/logo'],
    ['POST', '/api/club/organisatie/nieuw'], ['POST', '/api/club/hulp'],
  ]

  function mag(rollen: Rol[]): string[] {
    const t = simuleer(rollen)
    return VERZOEKEN.filter(([m, p]) => magApiV2(t.profiel.niveaus, p, m)).map(([m, p]) => `${m} ${p}`)
  }

  it('zien is lezen, bewerken is wijzigen', () => {
    // De eigenaar mag alles; de trainer bewerkt leden.
    expect(mag(['eigenaar'])).toEqual(expect.arrayContaining(['GET /api/club/leden', 'POST /api/club/leden', 'POST /api/club/training/schemas', 'POST /api/club/rooster/lessen']))
    expect(mag(['trainer'])).toContain('POST /api/club/leden')
    // De administratie ziet het rooster, keurt uren goed, maar plant geen diensten.
    expect(mag(['administratie'])).toEqual(expect.arrayContaining(['GET /api/club/personeel/uren', 'POST /api/club/personeel/uren']))
    expect(mag(['administratie'])).not.toContain('POST /api/club/personeel/diensten')
  })

  it('wat van de eigenaar is, is via de API dicht voor de rest', () => {
    for (const rol of ROLLEN.filter((r) => r !== 'eigenaar')) {
      const m = mag([rol])
      for (const v of ['POST /api/club/beheerders', 'PATCH /api/club/organisatie', 'PATCH /api/club/privacy', 'POST /api/club/betalen/producten']) expect(m, `${rol}: ${v}`).not.toContain(v)
    }
  })

  it('nooit een nieuwe sportschool, en het logo en hulp altijd', () => {
    for (const rol of ROLLEN) {
      expect(mag([rol]), rol).not.toContain('POST /api/club/organisatie/nieuw')
      expect(mag([rol]), rol).toEqual(expect.arrayContaining(['GET /api/club/organisatie/logo', 'POST /api/club/hulp']))
    }
  })

  it('per rol vastgelegd', () => {
    expect(Object.fromEntries(ROLLEN.map((r) => [r, mag([r])]))).toMatchSnapshot()
  })
})
