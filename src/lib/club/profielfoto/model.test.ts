import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MAX_BYTES,
  clubFotoUrl,
  fotoBestand,
  fotoPad,
  initialenVanNaam,
  isFotoPad,
  keurFoto,
  leesBalieToestemming,
  lidFotoUrl,
  maatUitTekst,
  maatVoor,
  nieuweVersie,
  padHoortBij,
  uitsnede,
  webpMaat,
} from './model'

const ORG = 'de000000-0000-4000-8000-0000000000c1'
const LID = '11111111-1111-4111-8111-111111111111'
const ANDER = '22222222-2222-4222-8222-222222222222'

/** Een minimale VP8L-kop (lossless) van b x h pixels. */
function vp8l(b: number, h: number, extra = 0): Uint8Array {
  const bytes = new Uint8Array(30 + extra)
  bytes.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0)
  bytes.set([...'WEBP'].map((c) => c.charCodeAt(0)), 8)
  bytes.set([...'VP8L'].map((c) => c.charCodeAt(0)), 12)
  bytes[20] = 0x2f
  const v = ((b - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14)
  bytes[21] = v & 0xff
  bytes[22] = (v >>> 8) & 0xff
  bytes[23] = (v >>> 16) & 0xff
  bytes[24] = (v >>> 24) & 0xff
  return bytes
}

/** Een minimale VP8-kop (lossy). */
function vp8(b: number, h: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0)
  bytes.set([...'WEBP'].map((c) => c.charCodeAt(0)), 8)
  bytes.set([...'VP8 '].map((c) => c.charCodeAt(0)), 12)
  bytes.set([0x9d, 0x01, 0x2a, b & 0xff, b >> 8, h & 0xff, h >> 8], 23)
  return bytes
}

/** Een minimale VP8X-kop (uitgebreid). */
function vp8x(b: number, h: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0)
  bytes.set([...'WEBP'].map((c) => c.charCodeAt(0)), 8)
  bytes.set([...'VP8X'].map((c) => c.charCodeAt(0)), 12)
  bytes.set([(b - 1) & 0xff, ((b - 1) >> 8) & 0xff, 0, (h - 1) & 0xff, ((h - 1) >> 8) & 0xff, 0], 24)
  return bytes
}

describe('profielfoto: paden', () => {
  it('maakt een pad per sportschool en per persoon', () => {
    // Arrange
    const versie = nieuweVersie(1_790_000_000_000, 0.5)
    // Act
    const pad = fotoPad(ORG, 'lid', LID, versie)
    // Assert
    expect(pad).toBe(`${ORG}/lid-${LID}/${versie}`)
    expect(isFotoPad(pad)).toBe(true)
    expect(fotoBestand(pad as string, 256)).toBe(`${pad}-256.webp`)
  })

  it('weigert ongeldige delen (geen pad buiten de map van de persoon)', () => {
    expect(fotoPad(ORG, 'lid', '../x', 'abcd1234')).toBeNull()
    expect(fotoPad('niet-een-id', 'lid', LID, 'abcd1234')).toBeNull()
    expect(fotoPad(ORG, 'lid', LID, 'A/B')).toBeNull()
    expect(isFotoPad(`${ORG}/lid-${LID}/../x`)).toBe(false)
  })

  it('een pad hoort alleen bij de eigen sportschool en persoon', () => {
    const pad = `${ORG}/lid-${LID}/abcd1234`
    expect(padHoortBij(pad, ORG, 'lid', LID)).toBe(true)
    expect(padHoortBij(pad, ORG, 'lid', ANDER)).toBe(false)
    expect(padHoortBij(pad, ORG, 'mw', LID)).toBe(false)
    expect(padHoortBij(pad, ANDER, 'lid', LID)).toBe(false)
  })

  it('elke nieuwe versie is een geldige, andere naam', () => {
    const a = nieuweVersie(1_790_000_000_000, 0.1)
    const b = nieuweVersie(1_790_000_000_001, 0.1)
    expect(a).toMatch(/^[a-z0-9]{4,20}$/)
    expect(a).not.toBe(b)
  })
})

describe('profielfoto: adressen', () => {
  it('Club en ledenapp hebben elk hun eigen route met de versie', () => {
    expect(clubFotoUrl('lid', LID, 'abcd1234', 256)).toBe(`/api/club/profielfoto/lid/${LID}/256?v=abcd1234`)
    expect(lidFotoUrl('mw', LID, 'abcd1234', 512)).toBe(`/api/club/lid/profielfoto/mw/${LID}/512?v=abcd1234`)
    expect(lidFotoUrl('lid', LID, 'abcd1234', 256, LID)).toBe(`/api/club/lid/profielfoto/lid/${LID}/256?v=abcd1234&voor=${LID}`)
  })

  it('kiest de maat voor retina', () => {
    expect(maatVoor(36)).toBe(256)
    expect(maatVoor(128)).toBe(256)
    expect(maatVoor(200)).toBe(512)
    expect(maatUitTekst('256')).toBe(256)
    expect(maatUitTekst('1024')).toBeNull()
    expect(maatUitTekst(null)).toBeNull()
  })

  it('initialen als terugval', () => {
    expect(initialenVanNaam('Sanne de Vries')).toBe('SV')
    expect(initialenVanNaam('Kane')).toBe('K')
    expect(initialenVanNaam('  ')).toBe('?')
  })
})

describe('profielfoto: toestemming aan de balie', () => {
  it('alleen een uitdrukkelijk vinkje telt', () => {
    expect(leesBalieToestemming(true).ok).toBe(true)
    expect(leesBalieToestemming('true').ok).toBe(true)
    for (const nee of [false, 'false', 'ja', 1, null, undefined, 'on']) expect(leesBalieToestemming(nee).ok).toBe(false)
  })
})

describe('profielfoto: bijsnijden', () => {
  it('zoom 1 in het midden: het grootste vierkant', () => {
    expect(uitsnede(4000, 3000)).toEqual({ x: 500, y: 0, zijde: 3000 })
    expect(uitsnede(3000, 4000)).toEqual({ x: 0, y: 500, zijde: 3000 })
  })

  it('verschuiven tot de rand, nooit erbuiten', () => {
    expect(uitsnede(4000, 3000, 1, -1, 0)).toEqual({ x: 0, y: 0, zijde: 3000 })
    expect(uitsnede(4000, 3000, 1, 1, 0)).toEqual({ x: 1000, y: 0, zijde: 3000 })
    expect(uitsnede(4000, 3000, 1, 9, 9)).toEqual({ x: 1000, y: 0, zijde: 3000 })
  })

  it('inzoomen maakt het vierkant kleiner, hoogstens 4 keer', () => {
    expect(uitsnede(1000, 1000, 2)).toEqual({ x: 250, y: 250, zijde: 500 })
    expect(uitsnede(1000, 1000, 99)?.zijde).toBe(250)
    expect(uitsnede(0, 100)).toBeNull()
  })
})

describe('profielfoto: WebP controleren op de server', () => {
  it('leest de maat van de drie soorten WebP', () => {
    expect(webpMaat(vp8l(256, 256))).toEqual({ breedte: 256, hoogte: 256 })
    expect(webpMaat(vp8(512, 512))).toEqual({ breedte: 512, hoogte: 512 })
    expect(webpMaat(vp8x(256, 256))).toEqual({ breedte: 256, hoogte: 256 })
  })

  it('weigert iets dat geen WebP is (bijvoorbeeld een JPEG of SVG)', () => {
    expect(webpMaat(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>   '))).toBeNull()
    expect(keurFoto(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(40).fill(0)]), 256)).toEqual({ ok: false, code: 'geenWebp' })
  })

  it('weigert de verkeerde maat of te grote bestanden', () => {
    expect(keurFoto(vp8l(256, 256), 256)).toEqual({ ok: true })
    expect(keurFoto(vp8l(300, 256), 256)).toEqual({ ok: false, code: 'maat' })
    expect(keurFoto(vp8l(256, 256), 512)).toEqual({ ok: false, code: 'maat' })
    expect(keurFoto(vp8l(256, 256, MAX_BYTES[256]), 256)).toEqual({ ok: false, code: 'teGroot' })
  })
})

describe('profielfoto: migratie 473', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase', 'lifeos-migrations', '473_club_profielfotos.sql'), 'utf8')

  it('de bucket is privaat en neemt alleen WebP aan', () => {
    expect(sql).toMatch(/'club-profielfoto', 'club-profielfoto', false, \d+, array\['image\/webp'\]/)
    expect(sql).toContain("update storage.buckets set public = false where id = 'club-profielfoto'")
  })

  it('een foto door de sportschool kan niet zonder toestemming (ook niet buiten de app om)', () => {
    expect(sql).toMatch(/check \(bron = 'zelf' or \(lid_id is not null and toestemming_op is not null/)
  })

  it('het pad in de database volgt dezelfde regel als de code', () => {
    expect(sql).toContain("pad ~ '^[0-9a-f-]{36}/(lid|mw)-[0-9a-f-]{36}/[a-z0-9]{4,20}$'")
  })

  it('het grootste bestand past in de bucket', () => {
    const limiet = Number(/'club-profielfoto', false, (\d+)/.exec(sql)?.[1])
    expect(Math.max(MAX_BYTES[256], MAX_BYTES[512])).toBeLessThanOrEqual(limiet)
  })
})
