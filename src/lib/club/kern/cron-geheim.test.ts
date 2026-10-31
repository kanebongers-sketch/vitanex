import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { clubCronGeheim, clubCronToegestaan, cronGeheimUitKop } from './cron-geheim'

const OUD = 'oud-gedeeld-geheim-1234567890'
const NIEUW = 'nieuw-club-geheim-0987654321'

function verzoek(koppen: Record<string, string>) {
  const h = new Headers(koppen)
  return { headers: { get: (n: string) => h.get(n) } }
}

describe('cron-geheim van AI Your Gym', () => {
  it('zonder CLUB_CRON_SECRET werkt het oude CRON_SECRET zoals voorheen', () => {
    const env = { CRON_SECRET: OUD }
    expect(clubCronGeheim(env)).toBe(OUD)
    expect(clubCronToegestaan(verzoek({ 'x-cron-secret': OUD }), env)).toBe(true)
    expect(clubCronToegestaan(verzoek({ authorization: `Bearer ${OUD}` }), env)).toBe(true)
  })

  it('met CLUB_CRON_SECRET opent het oude geheim de club-crons niet meer', () => {
    const env = { CRON_SECRET: OUD, CLUB_CRON_SECRET: NIEUW }
    expect(clubCronToegestaan(verzoek({ 'x-cron-secret': OUD }), env)).toBe(false)
    expect(clubCronToegestaan(verzoek({ authorization: `Bearer ${OUD}` }), env)).toBe(false)
    expect(clubCronToegestaan(verzoek({ 'x-cron-secret': NIEUW }), env)).toBe(true)
    expect(clubCronToegestaan(verzoek({ authorization: `Bearer ${NIEUW}` }), env)).toBe(true)
  })

  it('is dicht zonder geheim, met een leeg of fout geheim en zonder kop', () => {
    expect(clubCronToegestaan(verzoek({ 'x-cron-secret': '' }), {})).toBe(false)
    expect(clubCronToegestaan(verzoek({}), { CRON_SECRET: OUD })).toBe(false)
    expect(clubCronToegestaan(verzoek({ 'x-cron-secret': 'fout' }), { CRON_SECRET: OUD })).toBe(false)
    expect(clubCronToegestaan(verzoek({ 'x-cron-secret': NIEUW }), { CLUB_CRON_SECRET: '   ', CRON_SECRET: OUD })).toBe(false)
  })

  it('leest alleen een kop, nooit de URL', () => {
    expect(cronGeheimUitKop(verzoek({}))).toBeNull()
    expect(cronGeheimUitKop(verzoek({ authorization: 'Basic abc' }))).toBeNull()
    expect(cronGeheimUitKop(verzoek({ authorization: 'bearer abc' }))).toBe('abc')
  })

  it('elke cron-route van AI Your Gym gebruikt de helper en niet zelf CRON_SECRET', () => {
    const map = path.resolve(__dirname, '../../../app/(aiyourgym)/api/aiyourgym/cron')
    const routes = fs.readdirSync(map).map((d) => path.join(map, d, 'route.ts')).filter((p) => fs.existsSync(p))
    expect(routes.length).toBeGreaterThanOrEqual(5)
    for (const p of routes) {
      const code = fs.readFileSync(p, 'utf8')
      expect(code, p).toContain('clubCronToegestaan(req)')
      expect(code, p).not.toMatch(/process\.env\.CRON_SECRET|searchParams/)
    }
  })
})
