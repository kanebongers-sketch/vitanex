import { describe, it, expect } from 'vitest'
import {
  normaliseerTag,
  leesTags,
  voegTagToe,
  verwijderTag,
  tagLimietBereikt,
  MAX_TAG_LENGTE,
  MAX_TAGS,
} from './tags'
import { normaliseerTitel, MAX_TITEL_LENGTE } from './links'

describe('normaliseerTag', () => {
  it('trimt, klapt witruimte in en lowercased — één label voor "Werk" en "werk"', () => {
    // Arrange
    const ruw = '  Diepe   Focus  '

    // Act
    const tag = normaliseerTag(ruw)

    // Assert — dedup en filter worden voorspelbaar doordat de vorm vast is.
    expect(tag).toBe('diepe focus')
  })

  it('lowercased — anders dan een titel is een tag een retrieval-label', () => {
    expect(normaliseerTag('MARGE-Model')).toBe('marge-model')
  })

  it('weigert leeg en witruimte-only met null i.p.v. een lege string', () => {
    expect(normaliseerTag('')).toBeNull()
    expect(normaliseerTag('   ')).toBeNull()
    expect(normaliseerTag('\n\t')).toBeNull()
  })

  it('weigert niet-tekst i.p.v. het door te laten glippen', () => {
    expect(normaliseerTag(null)).toBeNull()
    expect(normaliseerTag(undefined)).toBeNull()
    expect(normaliseerTag(42)).toBeNull()
    expect(normaliseerTag(['werk'])).toBeNull()
  })

  it('KAPT AF op MAX_TAG_LENGTE — precies op de grens heel, één erover afgekapt (niet null)', () => {
    // Arrange
    const opDeGrens = 'a'.repeat(MAX_TAG_LENGTE)
    const eenTeVeel = 'a'.repeat(MAX_TAG_LENGTE + 1)

    // Act / Assert — een afgekapte tag is nog steeds een bruikbaar label.
    expect(normaliseerTag(opDeGrens)).toBe(opDeGrens)
    expect(normaliseerTag(eenTeVeel)).toBe('a'.repeat(MAX_TAG_LENGTE))
    expect(normaliseerTag(eenTeVeel)).toHaveLength(MAX_TAG_LENGTE)
  })

  it('meet de lengte ná normalisatie — spaties eromheen tellen niet mee', () => {
    // Arrange — 32 tekens + spaties: na trim past hij precies, geen afkapping.
    const metSpaties = `   ${'b'.repeat(MAX_TAG_LENGTE)}   `

    // Act / Assert
    expect(normaliseerTag(metSpaties)).toBe('b'.repeat(MAX_TAG_LENGTE))
  })
})

// ─── De bewuste asymmetrie: tag KAPT AF, titel WEIGERT ──────────────────────
// Een afgekapt label blijft bruikbaar voor retrieval; een afgekapte titel wijst
// stil naar een ándere notitie dan je typte. Daarom kapt `normaliseerTag` af en
// weigert `normaliseerTitel`. Zie de commentaren in tags.ts en links.ts.

describe('normaliseerTag vs normaliseerTitel — afkappen tegenover weigeren', () => {
  it('tag over de grens wordt afgekapt, titel over de grens wordt null', () => {
    // Arrange
    const langeTag = 'x'.repeat(MAX_TAG_LENGTE + 1)
    const langeTitel = 'x'.repeat(MAX_TITEL_LENGTE + 1)

    // Act / Assert — verschillend gedrag, met opzet.
    expect(normaliseerTag(langeTag)).toHaveLength(MAX_TAG_LENGTE)
    expect(normaliseerTitel(langeTitel)).toBeNull()
  })
})

describe('leesTags', () => {
  it('geeft [] bij niet-array — rommel lekt niet door als tags', () => {
    expect(leesTags(null)).toEqual([])
    expect(leesTags(undefined)).toEqual([])
    expect(leesTags('werk')).toEqual([])
    expect(leesTags({ 0: 'werk' })).toEqual([])
  })

  it('normaliseert, laat rommel vallen en ontdubbelt hoofdletterloos', () => {
    // Arrange — 'Werk'/'werk' zijn één label; null en 42 zijn geen tags.
    const ruw = ['Werk', 'werk', '  sport ', null, 42, 'Sport']

    // Act
    const tags = leesTags(ruw)

    // Assert
    expect(tags).toEqual(['werk', 'sport'])
  })

  it('kapt af op MAX_TAGS — 30 labels leveren er MAX_TAGS op', () => {
    // Arrange — 30 unieke labels, gelijk aan de DB-check uit migratie 090.
    const ruw = Array.from({ length: 30 }, (_, i) => `tag-${i}`)

    // Act
    const tags = leesTags(ruw)

    // Assert
    expect(tags).toHaveLength(MAX_TAGS)
    expect(tags[0]).toBe('tag-0')
  })
})

describe('voegTagToe', () => {
  it('voegt een geldige, nieuwe tag genormaliseerd achteraan toe', () => {
    expect(voegTagToe(['werk'], 'Sport')).toEqual(['werk', 'sport'])
  })

  it('laat de inhoud ongemoeid bij een dubbele tag (hoofdletterloos) — maar geeft een kopie', () => {
    // Arrange
    const tags = ['werk', 'sport']

    // Act — 'Werk' normaliseert naar de al aanwezige 'werk'.
    const uit = voegTagToe(tags, 'Werk')

    // Assert — zelfde inhoud, andere array-referentie (immutable).
    expect(uit).toEqual(['werk', 'sport'])
    expect(uit).not.toBe(tags)
  })

  it('laat de inhoud ongemoeid bij een ongeldige tag', () => {
    const tags = ['werk']
    expect(voegTagToe(tags, '   ')).toEqual(['werk'])
    expect(voegTagToe(tags, 42)).toEqual(['werk'])
    expect(voegTagToe(tags, null)).toEqual(['werk'])
  })

  it('voegt niets toe boven MAX_TAGS — vol is vol', () => {
    // Arrange — een volle lijst op precies MAX_TAGS.
    const vol = Array.from({ length: MAX_TAGS }, (_, i) => `tag-${i}`)

    // Act
    const uit = voegTagToe(vol, 'nieuw')

    // Assert — onveranderde inhoud, en een kopie.
    expect(uit).toEqual(vol)
    expect(uit).not.toBe(vol)
    expect(uit).toHaveLength(MAX_TAGS)
  })

  it('muteert de bron-array nooit', () => {
    // Arrange
    const tags = ['werk']

    // Act
    voegTagToe(tags, 'sport')

    // Assert — de originele array is niet gegroeid.
    expect(tags).toEqual(['werk'])
  })
})

// De bug die dit bewaakt: boven MAX_TAGS gaf `voegTagToe` de lijst ongewijzigd
// terug en de UI slikte dat stil in — de 25e tag verdween zonder melding. Deze
// predikaat laat de UI de limiet-reden onderscheiden van dedup/ongeldig, zodat
// alléén de limiet een eerlijke melding krijgt.
describe('tagLimietBereikt', () => {
  it('is waar wanneer een geldige, nieuwe tag niet meer past — de UI moet dat kunnen zeggen', () => {
    // Arrange — een volle lijst op precies MAX_TAGS.
    const vol = Array.from({ length: MAX_TAGS }, (_, i) => `tag-${i}`)

    // Act / Assert
    expect(tagLimietBereikt(vol, 'nieuw')).toBe(true)
  })

  it('is onwaar zolang er nog ruimte is (één onder de limiet)', () => {
    const bijna = Array.from({ length: MAX_TAGS - 1 }, (_, i) => `tag-${i}`)
    expect(tagLimietBereikt(bijna, 'nieuw')).toBe(false)
  })

  it('is onwaar bij een dubbele tag — die faalt op dedup, niet op de limiet', () => {
    // Arrange — vol, maar de toevoeging bestaat al (hoofdletter-ongevoelig).
    const vol = Array.from({ length: MAX_TAGS - 1 }, (_, i) => `tag-${i}`).concat('werk')
    expect(vol).toHaveLength(MAX_TAGS)

    // Act / Assert — 'Werk' normaliseert naar de al aanwezige 'werk'.
    expect(tagLimietBereikt(vol, 'Werk')).toBe(false)
  })

  it('is onwaar bij een ongeldige tag — leeg of niet-tekst raakt de limiet niet', () => {
    const vol = Array.from({ length: MAX_TAGS }, (_, i) => `tag-${i}`)
    expect(tagLimietBereikt(vol, '   ')).toBe(false)
    expect(tagLimietBereikt(vol, 42)).toBe(false)
  })
})

describe('verwijderTag', () => {
  it('normaliseert het argument — "Werk" raakt de opgeslagen kleine-letter-tag', () => {
    // Arrange — opgeslagen als 'werk', verwijderd via 'Werk'.
    const tags = ['werk', 'sport']

    // Act
    const uit = verwijderTag(tags, 'Werk')

    // Assert
    expect(uit).toEqual(['sport'])
  })

  it('laat de lijst ongemoeid als de tag er niet in zit', () => {
    expect(verwijderTag(['werk'], 'sport')).toEqual(['werk'])
  })

  it('laat de lijst ongemoeid (kopie) bij een ongeldig argument', () => {
    // Arrange
    const tags = ['werk']

    // Act
    const uit = verwijderTag(tags, 42)

    // Assert
    expect(uit).toEqual(['werk'])
    expect(uit).not.toBe(tags)
  })

  it('muteert de bron-array nooit', () => {
    // Arrange
    const tags = ['werk', 'sport']

    // Act
    verwijderTag(tags, 'werk')

    // Assert
    expect(tags).toEqual(['werk', 'sport'])
  })
})
