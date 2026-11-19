import { describe, expect, it } from 'vitest'
import { dbRemSleutel, nepRemTik, isGeremd } from '@/lib/club/kern/rem-db'
import { UITNODIGING_DAGEN } from '@/lib/club/medewerker-login/medewerker-login'
import { RESET_MS } from '@/lib/club/beheerders/beheerder'
import { NEUTRAAL, REM_EMAIL, REM_IP, kiesOntvanger, leesVergeten, vergetenMailTekst, type Kandidaat } from './regels'

const EMAIL = 'sanne@gyma.nl'
const GYM = 'de000000-0000-4000-8000-0000000000c1'

const kandidaat = (extra: Partial<Kandidaat> = {}): Kandidaat => ({ naam: 'Sanne Bakker', email: EMAIL, organisatieId: GYM, actief: true, heeftWachtwoord: true, ...extra })
const niets = { platform: false, beheerder: null, medewerker: null }

describe('de invoer', () => {
  it('leest het e-mailadres in kleine letters zonder spaties', () => {
    expect(leesVergeten({ email: '  Sanne@GymA.nl ' })).toBe(EMAIL)
  })
  it('geen adres, geen tekst of geen object: null', () => {
    for (const body of [null, 'sanne@gyma.nl', {}, { email: 'geen adres' }, { email: 12 }, { email: `${'a'.repeat(120)}@gyma.nl` }]) {
      expect(leesVergeten(body)).toBeNull()
    }
  })
})

describe('wie een link krijgt', () => {
  it('een actieve eigenaar of clubmanager met een wachtwoord', () => {
    const beheerder = kandidaat()
    expect(kiesOntvanger(EMAIL, { ...niets, beheerder })).toEqual({ soort: 'beheerder', account: beheerder })
  })
  it('een actieve medewerker met een wachtwoord', () => {
    const medewerker = kandidaat()
    expect(kiesOntvanger(EMAIL, { ...niets, medewerker })).toEqual({ soort: 'medewerker', account: medewerker })
  })
  it('een beheerder gaat voor een medewerker met hetzelfde adres', () => {
    expect(kiesOntvanger(EMAIL, { platform: false, beheerder: kandidaat(), medewerker: kandidaat() }).soort).toBe('beheerder')
  })
  it('het master account van het platform nooit, ook niet als het adres ook een beheerder is', () => {
    expect(kiesOntvanger(EMAIL, { platform: true, beheerder: kandidaat(), medewerker: null })).toEqual({ soort: 'geen' })
  })
  it('onbekend, gestopt, zonder wachtwoord of met een ander adres: niemand', () => {
    expect(kiesOntvanger(EMAIL, niets)).toEqual({ soort: 'geen' })
    for (const extra of [{ actief: false }, { heeftWachtwoord: false }, { email: null }, { email: 'iemand@anders.nl' }]) {
      expect(kiesOntvanger(EMAIL, { ...niets, beheerder: kandidaat(extra) }), JSON.stringify(extra)).toEqual({ soort: 'geen' })
      expect(kiesOntvanger(EMAIL, { ...niets, medewerker: kandidaat(extra) }), JSON.stringify(extra)).toEqual({ soort: 'geen' })
    }
  })
})

describe('het antwoord en de remmen', () => {
  it('het neutrale antwoord zegt niets over het adres', () => {
    expect(NEUTRAAL).toEqual({ staat: 'ok' })
  })
  it('de sleutel van een rem is een HMAC: nooit het IP of het e-mailadres zelf', () => {
    const opEmail = dbRemSleutel(REM_EMAIL.soort, EMAIL, 'geheim-voor-de-test')
    const opIp = dbRemSleutel(REM_IP.soort, '203.0.113.7', 'geheim-voor-de-test')
    expect(opEmail).toMatch(/^club-vergeten-email:[0-9a-f]{64}$/)
    expect(opIp).toMatch(/^club-vergeten-ip:[0-9a-f]{64}$/)
    expect(opEmail).not.toContain('sanne')
    expect(opIp).not.toContain('203')
  })
  it('elk adres telt apart, en hetzelfde adres met een ander geheim geeft een andere sleutel', () => {
    const sleutel = dbRemSleutel(REM_EMAIL.soort, EMAIL, 'geheim-voor-de-test')
    expect(dbRemSleutel(REM_EMAIL.soort, EMAIL, 'geheim-voor-de-test')).toBe(sleutel)
    expect(dbRemSleutel(REM_EMAIL.soort, 'tom@gyma.nl', 'geheim-voor-de-test')).not.toBe(sleutel)
    expect(dbRemSleutel(REM_EMAIL.soort, EMAIL, 'een-ander-geheim')).not.toBe(sleutel)
    // Een IP dat toevallig gelijk is aan een adres telt in een andere rem.
    expect(dbRemSleutel(REM_IP.soort, EMAIL, 'geheim-voor-de-test').split(':')[1]).not.toBe(sleutel.split(':')[1])
  })
  it('per e-mailadres hooguit 3 per uur, per netwerk hooguit 10 per kwartier', async () => {
    const tik = nepRemTik(() => 0)
    const perAdres: boolean[] = []
    for (let i = 0; i < REM_EMAIL.max + 1; i++) perAdres.push(await isGeremd(REM_EMAIL, EMAIL, { tik }))
    expect(perAdres).toEqual([false, false, false, true])
    expect(await isGeremd(REM_EMAIL, 'tom@gyma.nl', { tik })).toBe(false)
    expect(REM_EMAIL.vensterMs).toBe(60 * 60_000)
    expect(REM_IP).toMatchObject({ max: 10, vensterMs: 15 * 60_000, bijStoring: 'geheugen' })
  })
})

describe('de mail', () => {
  const mail = { naam: 'Sanne Bakker', sportschool: 'Gym A', link: 'https://aiyourgym.com/gyma/clubinloggen/abc' }

  it('noemt de voornaam, de sportschool, de link en hoe lang hij werkt, in het Nederlands', () => {
    const { onderwerp, tekst } = vergetenMailTekst(mail, 'nl')
    expect(onderwerp).toBe('Nieuw wachtwoord voor Gym A')
    expect(tekst).toContain('Hoi Sanne,')
    expect(tekst).toContain(mail.link)
    expect(tekst).toContain('een uur geldig')
    expect(tekst).not.toContain('dagen')
    expect(tekst).toContain('blijft je oude wachtwoord werken')
  })
  it('in het Engels voor een Engelse pagina', () => {
    const { onderwerp, tekst } = vergetenMailTekst(mail, 'en')
    expect(onderwerp).toBe('New password for Gym A')
    expect(tekst).toContain('Hi Sanne,')
    expect(tekst).toContain(mail.link)
    expect(tekst).toContain('valid for one hour')
    expect(tekst).not.toMatch(/\b(Hoi|wachtwoord|dagen)\b/)
  })
  it('zonder naam een neutrale aanhef', () => {
    expect(vergetenMailTekst({ ...mail, naam: '  ' }, 'nl').tekst).toContain('Hoi daar,')
    expect(vergetenMailTekst({ ...mail, naam: '' }, 'en').tekst).toContain('Hi there,')
  })
  it('heeft geen gedachtestreepjes en geen klemtoon-accenten', () => {
    for (const taal of ['nl', 'en'] as const) {
      const { onderwerp, tekst } = vergetenMailTekst({ ...mail, link: 'x' }, taal)
      expect(`${onderwerp}\n${tekst}`).not.toMatch(/[–—]| - |[éèóíá]/)
    }
  })
  it('de link werkt een uur; een echte uitnodiging houdt haar 7 dagen', () => {
    expect(RESET_MS).toBe(60 * 60_000)
    expect(UITNODIGING_DAGEN).toBe(7)
  })
})
