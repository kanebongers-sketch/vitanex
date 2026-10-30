// De routekaart van Club voor rollen v2: elke pagina onder /club heeft een
// bekend slot, en elke API-map onder /api/club hoort bij een sleutel van v2
// (of staat bewust buiten de poort, met een reden). Een nieuwe map zonder
// plek laat deze test falen, zodat hij nooit per ongeluk open of dicht staat.

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { API_MAP, apiRoutes, clubPaginas, voorbeeldPad } from './routekaart.testhulp'
import { apiSleutelV2 } from './api'
import { RECHT_SLEUTELS } from './typen'

/** Sloten die routes-per-rol.test.ts kan uitrekenen. */
export const BEKENDE_SLOTEN = [
  'eisClubToegang', 'eisOnderdeel', 'eisModule', 'eisPakket', 'eisBeheerdersBeheer', 'eisBetalenBeheer',
  'eisPlatformEigenaar', 'eisInstellingencentrum', 'eisNiveau',
] as const

/** API-mappen buiten de poort van Club (vereisClubToegang), met de reden. */
const BUITEN_DE_POORT: Readonly<Record<string, string>> = {
  inloggen: 'inloggen gaat voor de sessie bestaat',
  uitloggen: 'uitloggen werkt op de eigen cookie',
  platform: 'alleen het master account (vereisPlatformEigenaar)',
  lid: 'de leden-API met een eigen sessie (ledenlogin/toegang.ts)',
  ledenapp: 'manifest en iconen van de ledenapp, openbaar per sportschool',
  profielfoto: "eigen foto en foto's van collega's en leden tonen: iedereen die binnen is, eigen controle in de route (profielfoto/toegang.ts)",
}

/** Alleen voor het master account (vereisPlatformEigenaar): voor een profiel altijd dicht (sleutel null). */
const ALLEEN_MASTER = ['/api/club/organisatie/nieuw', '/api/club/organisatie/wissel']

describe('routekaart rollen v2', () => {
  it('elke pagina onder /club heeft minstens een bekend slot', () => {
    const paginas = clubPaginas()
    expect(paginas.length).toBeGreaterThan(40)
    for (const p of paginas) {
      expect(p.sloten.length, p.pad).toBeGreaterThan(0)
      for (const s of p.sloten) expect(BEKENDE_SLOTEN as readonly string[], `${p.pad}: ${s.naam}`).toContain(s.naam)
    }
  })

  it('eisNiveau noemt alleen bestaande sleutels en niveaus', () => {
    for (const p of clubPaginas()) {
      for (const s of p.sloten.filter((x) => x.naam === 'eisNiveau')) {
        expect(RECHT_SLEUTELS, p.pad).toContain(s.args[0])
        expect(['zien', 'bewerken', 'beheren'], p.pad).toContain(s.args[1])
      }
    }
  })

  it('elke API-map hoort bij een sleutel van v2, of staat bewust buiten de poort', () => {
    const routes = apiRoutes()
    expect(routes.length).toBeGreaterThan(50)
    for (const r of routes) {
      const map = r.split('/')[3]
      if (map in BUITEN_DE_POORT) continue
      if (ALLEEN_MASTER.includes(r)) {
        expect(apiSleutelV2(r), r).toBeNull()
        continue
      }
      expect(apiSleutelV2(voorbeeldPad(r)), r).not.toBeNull()
    }
  })

  it('wat buiten de poort staat, gebruikt de poort ook echt niet (behalve het master account)', () => {
    for (const map of Object.keys(BUITEN_DE_POORT)) {
      if (map === 'platform') continue
      const bestanden = fs.readdirSync(path.join(API_MAP, map), { recursive: true, withFileTypes: true }).filter((f) => f.isFile() && f.name === 'route.ts')
      for (const f of bestanden) {
        const bron = fs.readFileSync(path.join(f.parentPath, f.name), 'utf8')
        expect(bron.includes('vereisClubToegang('), `${map}/${f.name}`).toBe(false)
      }
    }
  })
})
