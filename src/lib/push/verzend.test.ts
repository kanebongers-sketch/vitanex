import { describe, it, expect, afterEach } from 'vitest'
import { leesServiceAccount, pushGeconfigureerd, verzendPush } from './verzend'

const oud = process.env.FCM_SERVICE_ACCOUNT

afterEach(() => {
  if (oud === undefined) delete process.env.FCM_SERVICE_ACCOUNT
  else process.env.FCM_SERVICE_ACCOUNT = oud
})

describe('leesServiceAccount', () => {
  it('is null zonder env', () => {
    delete process.env.FCM_SERVICE_ACCOUNT
    expect(leesServiceAccount()).toBeNull()
    expect(pushGeconfigureerd()).toBe(false)
  })
  it('is null bij kapotte JSON', () => {
    process.env.FCM_SERVICE_ACCOUNT = '{ niet: geldig'
    expect(leesServiceAccount()).toBeNull()
  })
  it('is null als verplichte velden ontbreken', () => {
    process.env.FCM_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'x' })
    expect(leesServiceAccount()).toBeNull()
  })
  it('leest een geldige service-account', () => {
    process.env.FCM_SERVICE_ACCOUNT = JSON.stringify({ client_email: 'a@b.iam', private_key: 'KEY', project_id: 'proj' })
    expect(leesServiceAccount()).toEqual({ client_email: 'a@b.iam', private_key: 'KEY', project_id: 'proj' })
    expect(pushGeconfigureerd()).toBe(true)
  })
})

describe('verzendPush — niet geconfigureerd', () => {
  it('is een eerlijke no-op (geen nep-succes)', async () => {
    delete process.env.FCM_SERVICE_ACCOUNT
    const r = await verzendPush([{ token: 't', platform: 'android' }], { titel: 'hoi', tekst: 'test' })
    expect(r).toEqual({ geconfigureerd: false, verstuurd: 0, mislukt: 0, ongeldigeTokens: [] })
  })
})
