import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { MF_BASIS, basisVanPad, beslisMentaforce, isMfPad, metBasis, zonderBasis } from './basis'

const MF = new Set(['dashboard', 'login', 'auth', 'contact', 'bedankt', 'voorwaarden', 'home'])
const WEBSHOP = new Set(['product', 'kennis', 'contact', 'bedankt', 'api'])
const WEBSHOP_API = new Set(['checkout', 'contact', 'newsletter', 'stripe'])

const beslis = (pad: string, zoek = '') => beslisMentaforce(pad, zoek, MF, WEBSHOP, WEBSHOP_API)

describe('beslisMentaforce', () => {
  test('/mentaforce/… gaat intern naar de MentaForce-route', () => {
    expect(beslis('/mentaforce')).toEqual({ soort: 'herschrijven', pad: '/' })
    expect(beslis('/mentaforce/')).toEqual({ soort: 'herschrijven', pad: '/' })
    expect(beslis('/mentaforce/dashboard')).toEqual({ soort: 'herschrijven', pad: '/dashboard' })
    expect(beslis('/mentaforce/contact')).toEqual({ soort: 'herschrijven', pad: '/contact' })
    expect(beslis('/mentaforce/api/contact')).toEqual({ soort: 'herschrijven', pad: '/api/contact' })
  })

  test('Fit Factory- en onbekende paden worden onder /mentaforce niet zichtbaar', () => {
    expect(beslis('/mentaforce/joey')).toEqual({ soort: 'niet-van-mij' })
    expect(beslis('/mentaforce/FitFactoryPT')).toEqual({ soort: 'niet-van-mij' })
    expect(beslis('/mentaforce/lifeoskane')).toEqual({ soort: 'niet-van-mij' })
    expect(beslis('/mentaforce/releasev/product')).toEqual({ soort: 'niet-van-mij' })
  })

  test('een MentaForce-link zonder basis gaat naar /mentaforce/…, met query', () => {
    expect(beslis('/dashboard', '?x=1')).toEqual({ soort: 'omleiden', url: '/mentaforce/dashboard?x=1' })
    expect(beslis('/auth/callback', '?code=abc')).toEqual({ soort: 'omleiden', url: '/mentaforce/auth/callback?code=abc' })
  })

  test('de webshop blijft van de webshop', () => {
    for (const pad of ['/', '/product', '/kennis/iets', '/contact', '/bedankt', '/kantoor', '/onbekend', '/mentaforcex']) {
      expect(beslis(pad)).toEqual({ soort: 'niet-van-mij' })
    }
    for (const pad of ['/api/checkout', '/api/contact', '/api/stripe/webhook', '/api/newsletter', '/api']) {
      expect(beslis(pad)).toEqual({ soort: 'niet-van-mij' })
    }
  })

  test('MentaForce-API\'s zonder basis lopen door', () => {
    expect(beslis('/api/stemming')).toEqual({ soort: 'door' })
    expect(beslis('/api/koppelingen/google')).toEqual({ soort: 'door' })
  })
})

describe('paden', () => {
  test('isMfPad en zonderBasis', () => {
    expect(isMfPad('/mentaforce')).toBe(true)
    expect(isMfPad('/mentaforce/login')).toBe(true)
    expect(isMfPad('/mentaforces')).toBe(false)
    expect(zonderBasis('/mentaforce/login')).toBe('/login')
    expect(zonderBasis('/product')).toBe('/product')
  })

  test('metBasis zet de basis er alleen voor waar dat moet', () => {
    expect(metBasis('/dashboard', MF_BASIS)).toBe('/mentaforce/dashboard')
    expect(metBasis('/', MF_BASIS)).toBe('/mentaforce')
    expect(metBasis('/?tab=1', MF_BASIS)).toBe('/mentaforce?tab=1')
    expect(metBasis('/#faq', MF_BASIS)).toBe('/mentaforce#faq')
    expect(metBasis('/mentaforce/login', MF_BASIS)).toBe('/mentaforce/login')
    expect(metBasis('https://example.com', MF_BASIS)).toBe('https://example.com')
    expect(metBasis('//cdn.example.com/x', MF_BASIS)).toBe('//cdn.example.com/x')
    expect(metBasis('#top', MF_BASIS)).toBe('#top')
    expect(metBasis('/dashboard', '')).toBe('/dashboard')
  })

  test('basisVanPad', () => {
    expect(basisVanPad('/mentaforce/home')).toBe(MF_BASIS)
    expect(basisVanPad('/home')).toBe('')
  })
})

describe('geen botsing met de webshop', () => {
  test('geen landingspagina van RELEASE V heet als een MentaForce-route', async () => {
    const { LANDING_SLUGS } = await import('@/releasev/content/landing')
    const app = path.join(process.cwd(), 'src', 'app')
    const routes = new Set<string>()
    for (const d of fs.readdirSync(app, { withFileTypes: true })) {
      if (!d.isDirectory()) continue
      if (d.name.startsWith('(')) {
        for (const k of fs.readdirSync(path.join(app, d.name), { withFileTypes: true })) if (k.isDirectory()) routes.add(k.name)
      } else routes.add(d.name)
    }
    for (const slug of LANDING_SLUGS) expect(routes.has(slug)).toBe(false)
    expect(routes.has('mentaforce')).toBe(false)
  })
})
