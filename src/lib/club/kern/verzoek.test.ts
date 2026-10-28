import { describe, expect, it } from 'vitest'
import { ipVan, isZelfdeOorsprong } from './verzoek'

const verzoek = (h: Record<string, string>) => ({ headers: new Headers(h) })

describe('ipVan', () => {
  it('neemt het adres van de randdienst, niet het zelfgekozen eerste X-Forwarded-For-adres', () => {
    expect(ipVan(verzoek({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '10.1.1.1, 203.0.113.7' }))).toBe('203.0.113.7')
  })
  it('een vervalst X-Forwarded-For verandert het adres niet zolang de randdienst er een zet', () => {
    const a = ipVan(verzoek({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '10.0.0.1' }))
    const b = ipVan(verzoek({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '10.0.0.2' }))
    expect(a).toBe(b)
  })
  it('valt terug op X-Forwarded-For, X-Real-IP en onbekend', () => {
    expect(ipVan(verzoek({ 'x-forwarded-for': '198.51.100.2, 1.1.1.1' }))).toBe('198.51.100.2')
    expect(ipVan(verzoek({ 'x-real-ip': '198.51.100.3' }))).toBe('198.51.100.3')
    expect(ipVan(verzoek({}))).toBe('onbekend')
  })
})

describe('isZelfdeOorsprong', () => {
  it('weigert zonder Origin en Sec-Fetch-Site', () => {
    expect(isZelfdeOorsprong(new Headers({ host: 'aiyourgym.com' }))).toBe(false)
  })
  it('weigert een andere oorsprong en laat de eigen toe', () => {
    expect(isZelfdeOorsprong(new Headers({ host: 'aiyourgym.com', origin: 'https://evil.example' }))).toBe(false)
    expect(isZelfdeOorsprong(new Headers({ host: 'aiyourgym.com', origin: 'https://aiyourgym.com' }))).toBe(true)
    expect(isZelfdeOorsprong(new Headers({ 'sec-fetch-site': 'cross-site' }))).toBe(false)
  })
})
