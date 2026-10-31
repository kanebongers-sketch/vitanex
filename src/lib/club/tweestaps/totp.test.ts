import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  AANTAL_HERSTELCODES, base32Codeer, base32Decodeer, controleerTotp, geheimInGroepjes, herstelHash, hotp, leesHerstelcode, leesTotpCode,
  nieuweHerstelcodes, nieuwGeheim, otpauthUrl, totp, totpStap,
} from './totp'
import { ontsleutelGeheim, tweestapsHoofdsleutel, versleutelGeheim } from './versleutelen'
import { foutTekst } from './melding'
import { tweestapsUitRij } from './opslag'

// Het geheim uit RFC 4226 en RFC 6238 (SHA1): "12345678901234567890".
const RFC = Buffer.from('12345678901234567890', 'ascii')

describe('HOTP (RFC 4226, bijlage D)', () => {
  it('geeft de testwaarden voor teller 0 tot en met 9', () => {
    const verwacht = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489']
    expect(verwacht.map((_, i) => hotp(RFC, i))).toEqual(verwacht)
  })
})

describe('TOTP (RFC 6238, bijlage B, SHA1, 8 cijfers)', () => {
  const vectoren: [number, string][] = [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ]
  it.each(vectoren)('T = %i geeft %s', (seconden, code) => {
    expect(totp(RFC, seconden * 1000, 8)).toBe(code)
  })

  it('met 6 cijfers zijn het de laatste 6', () => {
    expect(totp(RFC, 59_000)).toBe('287082')
    expect(totp(RFC, 1111111109_000)).toBe('081804')
  })

  it('rekent stappen van 30 seconden', () => {
    expect(totpStap(0)).toBe(0)
    expect(totpStap(29_999)).toBe(0)
    expect(totpStap(30_000)).toBe(1)
    expect(totpStap(59_000)).toBe(1)
  })
})

describe('controleerTotp', () => {
  const nu = 1111111111_000
  const stap = totpStap(nu)

  it('accepteert de code van nu en een stap ervoor of erna', () => {
    expect(controleerTotp(RFC, hotp(RFC, stap), nu)).toBe(stap)
    expect(controleerTotp(RFC, hotp(RFC, stap - 1), nu)).toBe(stap - 1)
    expect(controleerTotp(RFC, hotp(RFC, stap + 1), nu)).toBe(stap + 1)
  })

  it('weigert een code van twee stappen eerder of later', () => {
    expect(controleerTotp(RFC, hotp(RFC, stap - 2), nu)).toBeNull()
    expect(controleerTotp(RFC, hotp(RFC, stap + 2), nu)).toBeNull()
  })

  it('een code werkt maar een keer (geen stap op of voor de laatst gebruikte)', () => {
    const code = hotp(RFC, stap)
    expect(controleerTotp(RFC, code, nu, stap)).toBeNull()
    expect(controleerTotp(RFC, code, nu, stap + 1)).toBeNull()
    expect(controleerTotp(RFC, code, nu, stap - 1)).toBe(stap)
  })

  it('weigert rommel en een andere lengte', () => {
    expect(controleerTotp(RFC, 'abcdef', nu)).toBeNull()
    expect(controleerTotp(RFC, '12345', nu)).toBeNull()
    expect(controleerTotp(RFC, totp(RFC, nu, 8), nu)).toBeNull()
  })
})

describe('base32', () => {
  it('codeert de RFC 4648-voorbeelden zonder opvulling', () => {
    expect(base32Codeer(Buffer.from('foobar'))).toBe('MZXW6YTBOI')
    expect(base32Codeer(Buffer.from('f'))).toBe('MY')
    expect(base32Codeer(RFC)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
  })

  it('decodeert terug, ook met kleine letters, spaties en opvulling', () => {
    expect(base32Decodeer('mzxw 6ytb oi==')?.toString()).toBe('foobar')
    const g = nieuwGeheim()
    expect(base32Decodeer(base32Codeer(g))?.equals(g)).toBe(true)
    expect(base32Decodeer('MZ1W')).toBeNull()
  })

  it('een nieuw geheim is 20 bytes (32 tekens base32)', () => {
    expect(base32Codeer(nieuwGeheim())).toMatch(/^[A-Z2-7]{32}$/)
    expect(geheimInGroepjes('ABCDEFGHIJ')).toBe('ABCD EFGH IJ')
  })
})

describe('otpauthUrl', () => {
  it('geeft een link die authenticator-apps lezen', () => {
    const url = new URL(otpauthUrl('GEZDGNBV', 'kane@voorbeeld.nl', 'AI Your Gym'))
    expect(url.protocol).toBe('otpauth:')
    expect(url.host).toBe('totp')
    expect(decodeURIComponent(url.pathname)).toBe('/AI Your Gym:kane@voorbeeld.nl')
    expect(url.searchParams.get('secret')).toBe('GEZDGNBV')
    expect(url.searchParams.get('issuer')).toBe('AI Your Gym')
    expect(url.searchParams.get('digits')).toBe('6')
    expect(url.searchParams.get('period')).toBe('30')
  })
})

describe('invoer lezen', () => {
  it('leest een code met spaties of streepje', () => {
    expect(leesTotpCode('123 456')).toBe('123456')
    expect(leesTotpCode('123-456')).toBe('123456')
    expect(leesTotpCode('12345')).toBeNull()
    expect(leesTotpCode(123456)).toBeNull()
  })

  it('maakt tien verschillende herstelcodes en leest ze terug', () => {
    const codes = nieuweHerstelcodes()
    expect(codes).toHaveLength(AANTAL_HERSTELCODES)
    expect(new Set(codes).size).toBe(AANTAL_HERSTELCODES)
    for (const c of codes) {
      expect(c).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/)
      expect(leesHerstelcode(c.toUpperCase())).toBe(c.replace('-', ''))
    }
    expect(leesHerstelcode('abcde-fghi0')).toBeNull()
    expect(leesHerstelcode('kort')).toBeNull()
  })

  it('de hash van een herstelcode hangt niet af van streepje of hoofdletters', () => {
    expect(herstelHash('abcde-fghjk')).toBe(herstelHash('ABCDEFGHJK'))
    expect(herstelHash('abcde-fghjk')).toMatch(/^[0-9a-f]{64}$/)
    expect(herstelHash('abcde-fghjk')).not.toBe(herstelHash('abcde-fghjm'))
  })
})

describe('geheim versleutelen', () => {
  const sleutel = Buffer.alloc(32, 7)
  const account = { soort: 'platform' as const, id: '00000000-0000-4000-8000-000000000001' }

  it('ontsleutelt terug met dezelfde sleutel en hetzelfde account', () => {
    const g = nieuwGeheim()
    const opgeslagen = versleutelGeheim(g, sleutel, account)
    expect(opgeslagen).toMatch(/^v1\./)
    expect(opgeslagen).not.toContain(base32Codeer(g))
    expect(ontsleutelGeheim(opgeslagen, sleutel, account)?.equals(g)).toBe(true)
  })

  it('faalt met een andere sleutel, een ander account of rommel', () => {
    const opgeslagen = versleutelGeheim(nieuwGeheim(), sleutel, account)
    expect(ontsleutelGeheim(opgeslagen, Buffer.alloc(32, 8), account)).toBeNull()
    expect(ontsleutelGeheim(opgeslagen, sleutel, { ...account, id: '00000000-0000-4000-8000-000000000002' })).toBeNull()
    expect(ontsleutelGeheim(opgeslagen, sleutel, { ...account, soort: 'beheerder' })).toBeNull()
    expect(ontsleutelGeheim('v1.x.y.z', sleutel, account)).toBeNull()
  })

  it('leest CLUB_2FA_SLEUTEL als hex of base64, anders null', () => {
    expect(tweestapsHoofdsleutel({ CLUB_2FA_SLEUTEL: 'ab'.repeat(32) })?.length).toBe(32)
    expect(tweestapsHoofdsleutel({ CLUB_2FA_SLEUTEL: Buffer.alloc(32, 1).toString('base64') })?.length).toBe(32)
    expect(tweestapsHoofdsleutel({ CLUB_2FA_SLEUTEL: 'te-kort' })).toBeNull()
    expect(tweestapsHoofdsleutel({})).toBeNull()
  })
})

describe('foutTekst en rij lezen', () => {
  it('kiest de tekst bij de code, in beide talen', () => {
    expect(foutTekst({ code: 'fout', over: 2 }, 'nl')).toBe('Deze code klopt niet. Nog 2 pogingen.')
    expect(foutTekst({ code: 'fout', over: 1 }, 'en')).toBe('This code is not right. 1 attempt left.')
    expect(foutTekst({ code: 'geblokkeerd', totOp: '2026-10-31T12:00:00Z' }, 'nl')).toContain('13:00')
    expect(foutTekst(null, 'en')).toBe('That did not work. Please try again.')
  })

  it('leest een databaserij en weigert rommel', () => {
    const rij = tweestapsUitRij({ id: 'x', aan: true, geheim: 'v1.a.b.c', bevestigd_op: '2026-10-31T00:00:00Z', herstel_hashes: ['a', 1], laatste_stap: '123', mislukt: 2 })
    expect(rij).toMatchObject({ aan: true, herstelHashes: ['a'], laatsteStap: 123, mislukt: 2, blokkades: 0 })
    expect(tweestapsUitRij(null)).toBeNull()
    expect(tweestapsUitRij({ id: 'x' })).toBeNull()
  })
})

describe('migratie 484', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', 'lifeos-migrations', '484_club_tweestaps.sql'), 'utf8')

  it('zet RLS aan en sluit anon en authenticated buiten, zonder policies', () => {
    for (const tabel of ['club_tweestaps', 'club_tweestaps_wacht']) {
      expect(sql).toContain(`alter table public.${tabel} enable row level security;`)
      expect(sql).toContain(`revoke all on public.${tabel} from anon, authenticated;`)
    }
    expect(sql).not.toMatch(/create policy/i)
    expect(sql).not.toMatch(/\bdrop\s+(table|column|index)\b/i)
  })

  it('heeft een kolom per soort account (platform nu, beheerder later)', () => {
    expect(sql).toMatch(/platform_account_id uuid unique references public\.club_platform_accounts/)
    expect(sql).toMatch(/beheerder_id uuid unique references public\.club_beheerders/)
  })
})
