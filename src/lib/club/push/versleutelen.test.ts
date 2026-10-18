import { createDecipheriv, createECDH } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { kop, leidSleutelsAf, versleutel } from './versleutelen'

// RFC 8291, bijlage A (Intermediate Values for Encryption).
const b = (s: string) => Buffer.from(s, 'base64url')
const RFC = {
  tekst: 'When I grow up, I want to be a watermelon',
  asPrive: b('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'),
  asPubliek: b('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'),
  uaPubliek: b('BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'),
  uaPrive: b('q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94'),
  salt: b('DGv6ra1nlYgDCS1FRnbzlw'),
  auth: b('BTBZMqHH6r4Tts7J_aSIgg'),
  ecdh: b('kyrL1jIIOHEzg3sM2ZWRHDRB62YACZhhSlknJ672kSs'),
  ikm: b('S4lYMb_L0FxCeq0WhDx813KgSYqU26kOyzWUdsXYyrg'),
  cek: b('oIhVW04MRdy2XN9CiKLxTg'),
  nonce: b('4h_95klXJ5E_qnoN'),
  kop: b('DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'),
  versleuteld: b('8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ'),
  bericht: b(
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
  ),
}
const ontvanger = { p256dh: RFC.uaPubliek, auth: RFC.auth }

describe('versleutelen volgens RFC 8291', () => {
  it('leidt dezelfde tussenwaarden af als bijlage A', () => {
    const ecdh = createECDH('prime256v1')
    ecdh.setPrivateKey(RFC.asPrive)
    expect(ecdh.getPublicKey().equals(RFC.asPubliek)).toBe(true)
    const geheim = ecdh.computeSecret(RFC.uaPubliek)
    expect(geheim.equals(RFC.ecdh)).toBe(true)
    const { ikm, cek, nonce } = leidSleutelsAf(geheim, ontvanger, RFC.asPubliek, RFC.salt)
    expect(ikm.equals(RFC.ikm)).toBe(true)
    expect(cek.equals(RFC.cek)).toBe(true)
    expect(nonce.equals(RFC.nonce)).toBe(true)
  })

  it('maakt byte voor byte het bericht uit bijlage A', () => {
    const uit = versleutel(Buffer.from(RFC.tekst), ontvanger, { privesleutel: RFC.asPrive, salt: RFC.salt })
    expect(kop(RFC.salt, RFC.asPubliek).equals(RFC.kop)).toBe(true)
    expect(uit.subarray(0, 86).equals(RFC.kop)).toBe(true)
    expect(uit.subarray(86).equals(RFC.versleuteld)).toBe(true)
    expect(uit.equals(RFC.bericht)).toBe(true)
  })

  it('is te ontsleutelen door het toestel, met elke keer een nieuwe sleutel en salt', () => {
    const tekst = Buffer.from('{"t":"Spinning","b":"Je plek is gereserveerd."}')
    const een = versleutel(tekst, ontvanger)
    const twee = versleutel(tekst, ontvanger)
    expect(een.equals(twee)).toBe(false)
    // Ontsleutelen zoals de browser: met de privesleutel van het toestel.
    const salt = een.subarray(0, 16)
    expect(een.readUInt32BE(16)).toBe(4096)
    expect(een[20]).toBe(65)
    const asPubliek = een.subarray(21, 86)
    const ua = createECDH('prime256v1')
    ua.setPrivateKey(RFC.uaPrive)
    const { cek, nonce } = leidSleutelsAf(ua.computeSecret(asPubliek), ontvanger, asPubliek, salt)
    const data = een.subarray(86)
    const d = createDecipheriv('aes-128-gcm', cek, nonce)
    d.setAuthTag(data.subarray(data.length - 16))
    const open = Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()])
    expect(open.subarray(0, -1).equals(tekst)).toBe(true)
    expect(open[open.length - 1]).toBe(0x02)
  })

  it('weigert een ongeldige sleutel of een te lange tekst', () => {
    expect(() => versleutel(Buffer.from('x'), { p256dh: Buffer.alloc(65), auth: RFC.auth })).toThrow()
    expect(() => versleutel(Buffer.from('x'), { p256dh: RFC.uaPubliek, auth: Buffer.alloc(8) })).toThrow()
    expect(() => versleutel(Buffer.alloc(3001), ontvanger)).toThrow()
  })
})
