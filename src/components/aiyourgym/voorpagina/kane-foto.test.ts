import { describe, expect, it } from 'vitest'
import { KANE_FOTO_PAD, jpegMaat } from './kane-foto'

/** Een minimale JPEG: SOI, een APP0-blok en een SOF0 met hoogte en breedte. */
function jpeg(breedte: number, hoogte: number, sof = 0xc0): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x06, 0x4a, 0x46, 0x49, 0x46,
    0xff, sof, 0x00, 0x11, 0x08, hoogte >> 8, hoogte & 0xff, breedte >> 8, breedte & 0xff, 0x03,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ])
}

describe('foto van Kane', () => {
  it('staat op een vaste plek', () => {
    expect(KANE_FOTO_PAD).toBe('/aiyourgym/kane.jpg')
  })

  it('leest de maten uit een JPEG (ook progressief)', () => {
    expect(jpegMaat(jpeg(1200, 1600))).toEqual({ breedte: 1200, hoogte: 1600 })
    expect(jpegMaat(jpeg(900, 1350, 0xc2))).toEqual({ breedte: 900, hoogte: 1350 })
  })

  it('geen JPEG: geen foto', () => {
    expect(jpegMaat(new TextEncoder().encode('geen foto hier'))).toBeNull()
    expect(jpegMaat(new Uint8Array([0xff, 0xd8]))).toBeNull()
  })
})
