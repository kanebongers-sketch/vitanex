import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  ouraControle, polarGebeurtenis, polarHandtekeningKlopt, stravaControle, stravaGebeurtenis, tokenKlopt, webhookPad, webhookToken,
  whoopGebeurtenis, whoopHandtekeningKlopt, withingsGebeurtenis,
} from './webhook'
import { sampleNaarMeting, slaapPerNacht, stappenPerDag, trainingNaarMeting } from './native-mappers'

const SLEUTEL = Buffer.alloc(32, 3)
const NU = new Date('2026-10-23T12:00:00Z')

describe('webhooks', () => {
  it('heeft een eigen token per bron en controleert het in constante tijd', () => {
    expect(webhookToken('strava', SLEUTEL)).not.toBe(webhookToken('withings', SLEUTEL))
    expect(tokenKlopt('strava', webhookToken('strava', SLEUTEL), SLEUTEL)).toBe(true)
    expect(tokenKlopt('strava', webhookToken('withings', SLEUTEL), SLEUTEL)).toBe(false)
    expect(tokenKlopt('strava', null, SLEUTEL)).toBe(false)
    expect(webhookPad('polar', SLEUTEL)).toMatch(/^\/api\/aiyourgym\/health\/webhook\/polar\?t=[0-9a-f]{40}$/)
  })

  it('Strava: geeft de challenge alleen met het juiste verify_token', () => {
    const goed = new URLSearchParams({ 'hub.mode': 'subscribe', 'hub.verify_token': webhookToken('strava', SLEUTEL), 'hub.challenge': 'abc' })
    expect(stravaControle(goed, SLEUTEL)).toBe('abc')
    expect(stravaControle(new URLSearchParams({ 'hub.mode': 'subscribe', 'hub.verify_token': 'fout', 'hub.challenge': 'abc' }), SLEUTEL)).toBeNull()
  })

  it('Strava: een nieuwe training en een ingetrokken toegang', () => {
    expect(stravaGebeurtenis({ object_type: 'activity', aspect_type: 'create', owner_id: 134815, subscription_id: 1 }, '1')).toEqual({ externGebruikerId: '134815', actie: 'bijwerken' })
    expect(stravaGebeurtenis({ object_type: 'athlete', owner_id: 134815, updates: { authorized: 'false' }, subscription_id: 1 }, undefined)).toEqual({ externGebruikerId: '134815', actie: 'ingetrokken' })
    expect(stravaGebeurtenis({ object_type: 'activity', owner_id: 1, subscription_id: 2 }, '1')).toBeNull()
  })

  it('Withings: alleen meldingen over gewicht (appli 1)', () => {
    expect(withingsGebeurtenis(new URLSearchParams({ userid: '363', appli: '1' }))).toEqual({ externGebruikerId: '363', actie: 'bijwerken' })
    expect(withingsGebeurtenis(new URLSearchParams({ userid: '363', appli: '44' }))).toBeNull()
    expect(withingsGebeurtenis(new URLSearchParams({ userid: 'x', appli: '1' }))).toBeNull()
  })

  it('Polar: controleert de HMAC over de ruwe body', () => {
    const body = JSON.stringify({ event: 'EXERCISE', user_id: 475, entity_id: 'aQlC83', timestamp: '2026-10-23T12:00:00Z' })
    const sig = createHmac('sha256', 'geheim').update(body).digest('hex')
    expect(polarHandtekeningKlopt(body, sig, 'geheim')).toBe(true)
    expect(polarHandtekeningKlopt(`${body} `, sig, 'geheim')).toBe(false)
    expect(polarHandtekeningKlopt(body, sig, undefined)).toBe(false)
    expect(polarGebeurtenis(JSON.parse(body))).toEqual({ externGebruikerId: '475', actie: 'bijwerken' })
    expect(polarGebeurtenis({ event: 'PING' })).toBeNull()
  })

  it('WHOOP: handtekening over tijdstempel plus body, niet ouder dan 5 minuten', () => {
    const body = JSON.stringify({ user_id: 10129, id: 'x', type: 'workout.updated' })
    const ts = String(NU.getTime())
    const sig = createHmac('sha256', 'secret').update(ts + body).digest('base64')
    expect(whoopHandtekeningKlopt(body, sig, ts, 'secret', NU)).toBe(true)
    expect(whoopHandtekeningKlopt(body, sig, ts, 'secret', new Date(NU.getTime() + 10 * 60_000))).toBe(false)
    expect(whoopHandtekeningKlopt(body, sig, ts, 'ander', NU)).toBe(false)
    expect(whoopGebeurtenis(JSON.parse(body))).toEqual({ externGebruikerId: '10129', actie: 'bijwerken' })
    expect(whoopGebeurtenis({ user_id: 1, type: 'body.updated' })).toBeNull()
  })

  it('Oura: challenge alleen met het juiste verification_token', () => {
    expect(ouraControle(new URLSearchParams({ verification_token: webhookToken('oura', SLEUTEL), challenge: 'c1' }), SLEUTEL)).toBe('c1')
    expect(ouraControle(new URLSearchParams({ verification_token: 'x', challenge: 'c1' }), SLEUTEL)).toBeNull()
  })
})

describe('telefoon (capgo-plugin)', () => {
  it('zet een gewicht en een vetpercentage als fractie om', () => {
    expect(sampleNaarMeting({ value: 81.2, unit: 'kilogram', startDate: '2026-10-22T07:00:00Z', endDate: '2026-10-22T07:00:00Z', platformId: 'uuid-1' }, 'weight', 'apple_health'))
      .toEqual({ soort: 'gewicht_kg', waarde: 81.2, training: null, bron: 'apple_health', externId: 'uuid-1', gemetenOp: '2026-10-22T07:00:00Z' })
    expect(sampleNaarMeting({ value: 0.214, unit: 'percent', startDate: '2026-10-22T07:00:00Z' }, 'bodyFat', 'apple_health')?.waarde).toBeCloseTo(21.4, 5)
  })

  it('maakt een rij stappen per dag (Nederlandse tijd)', () => {
    const m = stappenPerDag([{ startDate: '2026-10-21T22:00:00Z', endDate: '2026-10-22T22:00:00Z', value: 8123 }], 'health_connect', NU)
    expect(m[0]).toMatchObject({ soort: 'stappen', waarde: 8123, externId: 'stappen:2026-10-22' })
  })

  it('telt alleen slaapfases, niet wakker', () => {
    const m = slaapPerNacht([{ startDate: '2026-10-21T21:00:00Z', endDate: '2026-10-22T05:00:00Z', value: 0, stages: [
      { startDate: '2026-10-21T21:00:00Z', endDate: '2026-10-22T01:00:00Z', stage: 'light' },
      { startDate: '2026-10-22T01:00:00Z', endDate: '2026-10-22T01:30:00Z', stage: 'awake' },
      { startDate: '2026-10-22T01:30:00Z', endDate: '2026-10-22T05:00:00Z', stage: 'deep' },
    ] }], 'apple_health')
    expect(m).toEqual([{ soort: 'slaap_minuten', waarde: 450, training: null, bron: 'apple_health', externId: 'slaap:2026-10-22', gemetenOp: '2026-10-22T05:00:00Z' }])
  })

  it('zet een training om', () => {
    expect(trainingNaarMeting({ workoutType: 'running', duration: 1800, totalEnergyBurned: 320, startDate: '2026-10-22T06:00:00Z', endDate: '2026-10-22T06:30:00Z', platformId: 'w1' }, 'apple_health'))
      .toMatchObject({ soort: 'training', waarde: 30, externId: 'w1', training: { soort: 'running', duurSec: 1800, kcal: 320, gemHartslag: null } })
  })
})
