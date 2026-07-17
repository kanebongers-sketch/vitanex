import { describe, it, expect } from 'vitest'
import {
  bouwGrafiek,
  leesGrafiekAntwoord,
  maakLabel,
  MAX_KNOPEN,
  type KnoopBron,
  type LinkRij,
} from './grafiek'

function link(bron: string, doelTitel: string, doelId: string | null = null): LinkRij {
  return { bron_id: bron, doel_id: doelId, doel_titel: doelTitel, doel_sleutel: doelTitel.toLowerCase() }
}

function notities(...paren: readonly (readonly [string, KnoopBron])[]): Map<string, KnoopBron> {
  return new Map(paren)
}

describe('maakLabel', () => {
  it('gebruikt de titel als die er is', () => {
    expect(maakLabel('Marge-model', 'lange tekst hier')).toBe('Marge-model')
  })

  it('valt terug op de eerste regel van de tekst bij een titelloze notitie', () => {
    expect(maakLabel(null, 'Eerste regel\nTweede regel')).toBe('Eerste regel')
  })

  it('kapt een lange eerste regel af met een ellips', () => {
    // Arrange
    const lang = 'a'.repeat(60)

    // Act
    const label = maakLabel(null, lang)

    // Assert — afgekapt én zichtbaar afgekapt.
    expect(label).toHaveLength(41)
    expect(label.endsWith('…')).toBe(true)
  })

  it('zegt eerlijk dat een notitie leeg is i.p.v. een leeg label te tonen', () => {
    expect(maakLabel(null, '   ')).toBe('(lege notitie)')
  })

  it('negeert een titel die alleen uit witruimte bestaat', () => {
    expect(maakLabel('   ', 'De tekst')).toBe('De tekst')
  })

  it('laat een eerste regel van exact MAX_LABEL heel — geen ellips op de grens', () => {
    // Arrange — MAX_LABEL is intern 40; de afkap-check is `> MAX_LABEL`, dus 40 mag.
    const opDeGrens = 'a'.repeat(40)

    // Act
    const label = maakLabel(null, opDeGrens)

    // Assert
    expect(label).toBe(opDeGrens)
    expect(label).toHaveLength(40)
    expect(label.endsWith('…')).toBe(false)
  })

  it('kapt één teken over MAX_LABEL wél af met een ellips', () => {
    // Arrange — 41 tekens: één over de grens.
    const eenTeVeel = 'a'.repeat(41)

    // Act
    const label = maakLabel(null, eenTeVeel)

    // Assert — 40 tekens + ellips = 41.
    expect(label).toBe(`${'a'.repeat(40)}…`)
    expect(label).toHaveLength(41)
  })
})

describe('bouwGrafiek', () => {
  it('is leeg zonder kanten — geen verzonnen knopen', () => {
    expect(bouwGrafiek([], notities(), false)).toEqual({ knopen: [], kanten: [], afgekapt: false })
  })

  it('maakt van één opgeloste verwijzing twee knopen en één kant', () => {
    // Arrange
    const rijen = [link('a', 'Doel', 'b')]
    const bronnen = notities(
      ['a', { titel: 'Bron', tekst: 'x' }],
      ['b', { titel: 'Doel', tekst: 'y' }],
    )

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert
    expect(grafiek.knopen.map((k) => k.label).sort()).toEqual(['Bron', 'Doel'])
    expect(grafiek.kanten).toEqual([{ bron: 'n:a', doel: 'n:b' }])
    expect(grafiek.knopen.every((k) => k.bestaat)).toBe(true)
  })

  it('maakt van een onopgeloste verwijzing een WENS-knoop die niet bestaat', () => {
    // Arrange — doel_id null: de notitie "Nog niet" bestaat nog niet.
    const rijen = [link('a', 'Nog niet', null)]
    const bronnen = notities(['a', { titel: 'Bron', tekst: 'x' }])

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert
    const wens = grafiek.knopen.find((k) => !k.bestaat)
    expect(wens).toMatchObject({ sleutel: 'w:nog niet', id: null, label: 'Nog niet', bestaat: false })
  })

  it('voegt twee wensen met dezelfde titel samen tot één knoop', () => {
    // Arrange — twee notities verwijzen naar dezelfde nog-niet-bestaande titel.
    const rijen = [link('a', 'Marge-model'), link('b', 'marge-MODEL')]
    const bronnen = notities(
      ['a', { titel: 'A', tekst: 'x' }],
      ['b', { titel: 'B', tekst: 'y' }],
    )

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert — één wens, met graad 2. Twee losse stippen zou liegen over verband.
    const wensen = grafiek.knopen.filter((k) => !k.bestaat)
    expect(wensen).toHaveLength(1)
    expect(wensen[0].graad).toBe(2)
  })

  it('telt de graad van elke knoop', () => {
    // Arrange — a → b, a → c, b → c. c wordt twee keer geraakt, a twee keer.
    const rijen = [link('a', 'B', 'b'), link('a', 'C', 'c'), link('b', 'C', 'c')]
    const bronnen = notities(
      ['a', { titel: 'A', tekst: '' }],
      ['b', { titel: 'B', tekst: '' }],
      ['c', { titel: 'C', tekst: '' }],
    )

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert
    const graad = (sleutel: string) => grafiek.knopen.find((k) => k.sleutel === sleutel)?.graad
    expect(graad('n:a')).toBe(2)
    expect(graad('n:b')).toBe(2)
    expect(graad('n:c')).toBe(2)
  })

  it('slaat een kant over waarvan de bron niet opgehaald kon worden', () => {
    // Arrange — 'weg' zit niet in de notitie-kaart.
    const rijen = [link('weg', 'Doel', 'b')]

    // Act
    const grafiek = bouwGrafiek(rijen, notities(['b', { titel: 'Doel', tekst: '' }]), false)

    // Assert — liever geen knoop dan een knoop met een gegokt label.
    expect(grafiek.knopen).toEqual([])
    expect(grafiek.kanten).toEqual([])
  })

  it('tekent een doel dat buiten de selectie viel als notitie, niet als wens', () => {
    // Arrange — doel_id staat, maar de notitie zit niet in de opgehaalde kaart.
    const rijen = [link('a', 'Bestaat wel', 'b')]
    const bronnen = notities(['a', { titel: 'A', tekst: '' }])

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert — "bestaat nog niet" zou hier een leugen zijn: hij bestaat wél.
    const doel = grafiek.knopen.find((k) => k.sleutel === 'n:b')
    expect(doel).toMatchObject({ bestaat: true, label: 'Bestaat wel' })
  })

  it('geeft afgekapt door als de caller tegen de kant-limiet aanliep', () => {
    // Arrange / Act
    const grafiek = bouwGrafiek([link('a', 'B', 'b')], notities(['a', { titel: 'A', tekst: '' }]), true)

    // Assert
    expect(grafiek.afgekapt).toBe(true)
  })

  it('gebruikt een titelloze bron met een snippet als label', () => {
    // Arrange
    const bronnen = notities(['a', { titel: null, tekst: 'Zomaar een gedachte\nen meer' }])

    // Act
    const grafiek = bouwGrafiek([link('a', 'Doel')], bronnen, false)

    // Assert
    expect(grafiek.knopen.find((k) => k.sleutel === 'n:a')?.label).toBe('Zomaar een gedachte')
  })
})

describe('bouwGrafiek — afkappen op knopen', () => {
  /** Bouwt n losse paren a{i} → wens{i}, plus één knoop met een hoge graad. */
  function veelKnopen(n: number): { rijen: LinkRij[]; bronnen: Map<string, KnoopBron> } {
    const rijen: LinkRij[] = []
    const bronnen = new Map<string, KnoopBron>()
    for (let i = 0; i < n; i++) {
      const id = `bron-${String(i).padStart(4, '0')}`
      bronnen.set(id, { titel: `Bron ${i}`, tekst: '' })
      rijen.push(link(id, `Wens ${i}`))
    }
    return { rijen, bronnen }
  }

  it('houdt niet meer dan MAX_KNOPEN over en zegt dat het afgekapt is', () => {
    // Arrange — 400 kanten → 800 knopen, ruim boven de grens van 500.
    const { rijen, bronnen } = veelKnopen(400)

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert
    expect(grafiek.knopen).toHaveLength(MAX_KNOPEN)
    expect(grafiek.afgekapt).toBe(true)
  })

  it('laat geen kant achter die naar een weggevallen knoop wijst', () => {
    // Arrange
    const { rijen, bronnen } = veelKnopen(400)

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert — elke kant moet aan twee bestaande knopen hangen.
    const sleutels = new Set(grafiek.knopen.map((k) => k.sleutel))
    for (const kant of grafiek.kanten) {
      expect(sleutels.has(kant.bron)).toBe(true)
      expect(sleutels.has(kant.doel)).toBe(true)
    }
  })

  it('houdt de best verbonden knopen over', () => {
    // Arrange — één spil waar 300 notities naar verwijzen, plus 400 losse paren.
    const { rijen, bronnen } = veelKnopen(400)
    for (let i = 0; i < 300; i++) {
      const id = `spil-bron-${i}`
      bronnen.set(id, { titel: `Spil bron ${i}`, tekst: '' })
      rijen.push(link(id, 'De spil'))
    }

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert — de spil (graad 300) mag nooit wegvallen.
    const spil = grafiek.knopen.find((k) => k.sleutel === 'w:de spil')
    expect(spil?.graad).toBe(300)
  })

  it('kapt deterministisch af — dezelfde data geeft dezelfde grafiek', () => {
    // Arrange
    const { rijen, bronnen } = veelKnopen(400)

    // Act
    const eerste = bouwGrafiek(rijen, bronnen, false)
    const tweede = bouwGrafiek(rijen, bronnen, false)

    // Assert — een grafiek die bij elke lading herschikt, is niet te lezen.
    expect(eerste.knopen.map((k) => k.sleutel)).toEqual(tweede.knopen.map((k) => k.sleutel))
  })

  it('is NIET afgekapt als alles past — geen valse waarschuwing', () => {
    // Arrange
    const { rijen, bronnen } = veelKnopen(10)

    // Act
    const grafiek = bouwGrafiek(rijen, bronnen, false)

    // Assert
    expect(grafiek.afgekapt).toBe(false)
    expect(grafiek.knopen).toHaveLength(20)
  })
})

// ─── Systeemgrens: het API-antwoord narrowen ────────────────────────────────
// `leesGrafiekAntwoord` narrowt een ruw antwoord (uit fetch/JSON) tot een Grafiek
// of `null`. Geen cast: een half object crasht de tekening drie lagen verderop.
// `leesKnoop`/`leesKant` zijn niet geëxporteerd; ze worden hier via de publieke
// functie meegetest.

describe('leesGrafiekAntwoord — vorm van het antwoord', () => {
  const geldigeKnoop = { sleutel: 'n:a', id: 'a', label: 'A', bestaat: true, graad: 1 }

  it('geeft null bij een niet-object', () => {
    expect(leesGrafiekAntwoord(null)).toBeNull()
    expect(leesGrafiekAntwoord(undefined)).toBeNull()
    expect(leesGrafiekAntwoord(42)).toBeNull()
    expect(leesGrafiekAntwoord('grafiek')).toBeNull()
  })

  it('geeft null bij een array — dat is geen antwoord-object', () => {
    expect(leesGrafiekAntwoord([])).toBeNull()
  })

  it('geeft null als knopen geen array is', () => {
    expect(leesGrafiekAntwoord({ kanten: [] })).toBeNull()
    expect(leesGrafiekAntwoord({ knopen: 'x', kanten: [] })).toBeNull()
  })

  it('geeft null als kanten geen array is', () => {
    expect(leesGrafiekAntwoord({ knopen: [] })).toBeNull()
    expect(leesGrafiekAntwoord({ knopen: [], kanten: 'x' })).toBeNull()
  })

  it('narrowt een gezond antwoord tot een Grafiek', () => {
    // Arrange
    const ruw = {
      knopen: [geldigeKnoop, { sleutel: 'w:b', id: null, label: 'B', bestaat: false, graad: 1 }],
      kanten: [{ bron: 'n:a', doel: 'w:b' }],
      afgekapt: false,
    }

    // Act
    const grafiek = leesGrafiekAntwoord(ruw)

    // Assert
    expect(grafiek).not.toBeNull()
    expect(grafiek?.knopen.map((k) => k.sleutel).sort()).toEqual(['n:a', 'w:b'])
    expect(grafiek?.kanten).toEqual([{ bron: 'n:a', doel: 'w:b' }])
    expect(grafiek?.afgekapt).toBe(false)
  })
})

describe('leesGrafiekAntwoord — kapotte knopen en hun kanten', () => {
  it('laat een kapotte knoop vallen en houdt de gezonde over', () => {
    // Arrange — tweede knoop mist een label.
    const ruw = {
      knopen: [
        { sleutel: 'n:a', id: 'a', label: 'A', bestaat: true, graad: 1 },
        { sleutel: 'n:b', id: 'b', label: '', bestaat: true, graad: 1 },
      ],
      kanten: [],
    }

    // Act
    const grafiek = leesGrafiekAntwoord(ruw)

    // Assert
    expect(grafiek?.knopen.map((k) => k.sleutel)).toEqual(['n:a'])
  })

  it('laat een kant vallen die naar een weggevallen knoop wijst', () => {
    // Arrange — n:b is kapot (bestaat is geen boolean) en valt weg; de kant
    // n:a → n:b wijst dan nergens heen.
    const ruw = {
      knopen: [
        { sleutel: 'n:a', id: 'a', label: 'A', bestaat: true, graad: 1 },
        { sleutel: 'n:b', id: 'b', label: 'B', bestaat: 'ja', graad: 1 },
      ],
      kanten: [{ bron: 'n:a', doel: 'n:b' }],
    }

    // Act
    const grafiek = leesGrafiekAntwoord(ruw)

    // Assert — de knoop weg, dus de kant ook.
    expect(grafiek?.knopen.map((k) => k.sleutel)).toEqual(['n:a'])
    expect(grafiek?.kanten).toEqual([])
  })

  it('laat een kant vallen waarvan een uiteinde nooit als knoop bestond', () => {
    // Arrange
    const ruw = {
      knopen: [{ sleutel: 'n:a', id: 'a', label: 'A', bestaat: true, graad: 1 }],
      kanten: [{ bron: 'n:a', doel: 'n:onbekend' }],
    }

    // Act / Assert
    expect(leesGrafiekAntwoord(ruw)?.kanten).toEqual([])
  })

  it('laat een kapotte kant vallen (niet-string uiteinde)', () => {
    // Arrange
    const ruw = {
      knopen: [{ sleutel: 'n:a', id: 'a', label: 'A', bestaat: true, graad: 1 }],
      kanten: [{ bron: 'n:a', doel: 42 }],
    }

    // Act / Assert
    expect(leesGrafiekAntwoord(ruw)?.kanten).toEqual([])
  })
})

describe('leesGrafiekAntwoord — losse velden', () => {
  const knoopA = { sleutel: 'n:a', id: 'a', label: 'A', bestaat: true, graad: 1 }

  it('een knoop met een niet-string id krijgt id null i.p.v. te weigeren', () => {
    // Arrange — id is een getal; de rest is geldig.
    const ruw = {
      knopen: [{ sleutel: 'w:b', id: 42, label: 'B', bestaat: false, graad: 0 }],
      kanten: [],
    }

    // Act
    const grafiek = leesGrafiekAntwoord(ruw)

    // Assert — de knoop overleeft, maar zijn id valt terug op null.
    expect(grafiek?.knopen).toHaveLength(1)
    expect(grafiek?.knopen[0]?.id).toBeNull()
  })

  it('weigert een knoop met een niet-eindige graad', () => {
    // Arrange
    const ruw = {
      knopen: [{ sleutel: 'n:a', id: 'a', label: 'A', bestaat: true, graad: Infinity }],
      kanten: [],
    }

    // Act / Assert
    expect(leesGrafiekAntwoord(ruw)?.knopen).toEqual([])
  })

  it('geeft afgekapt door — alleen exact `true` telt als afgekapt', () => {
    // Arrange
    const basis = { knopen: [knoopA], kanten: [] }

    // Act / Assert
    expect(leesGrafiekAntwoord({ ...basis, afgekapt: true })?.afgekapt).toBe(true)
    expect(leesGrafiekAntwoord({ ...basis, afgekapt: false })?.afgekapt).toBe(false)
    expect(leesGrafiekAntwoord(basis)?.afgekapt).toBe(false)
    // Niet-boolean waarden zijn geen afkapping: `'true'` en `1` blijven false.
    expect(leesGrafiekAntwoord({ ...basis, afgekapt: 'true' })?.afgekapt).toBe(false)
    expect(leesGrafiekAntwoord({ ...basis, afgekapt: 1 })?.afgekapt).toBe(false)
  })
})
