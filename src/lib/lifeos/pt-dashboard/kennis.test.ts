import { describe, expect, test } from 'vitest'
import {
  kort,
  leesBlok,
  leesKennisRij,
  leesSecties,
  maakSnippet,
  markeer,
  normaliseer,
  perCategorie,
  taalVan,
  trefferHref,
  vindTerm,
  zoek,
  zoekDocument,
  zoekTermen,
  type KennisItem,
} from './kennis'

// Alle voorbeelden hieronder zijn VERZONNEN (een denkbeeldige bakkerij), zodat er
// nooit documenttekst van een klant in deze openbare repo belandt.

const item = (over: Partial<KennisItem> = {}): KennisItem => ({
  slug: 'deeg-handboek',
  titel: 'Deeg handboek',
  ondertitel: 'Alles over rijzen',
  categorie: 'handleiding',
  bron: 'Bakkerij Voorbeeld 2026',
  documentId: null,
  secties: [
    { id: 'kneden', kop: 'Kneden', blokken: [{ soort: 'tekst', tekst: 'Kneed het deeg tien minuten tot het soepel is.' }] },
    { id: 'rijzen', kop: 'Rijzen', blokken: [{ soort: 'lijst', items: ['Laat het deeg rijzen op een warme plek.', 'Dek af met een doek.'] }] },
    { id: 'creme', kop: 'Crème', blokken: [{ soort: 'tip', titel: 'Let op', tekst: 'Crème brûlée gaat niet in de oven op 250 graden.' }] },
  ],
  ...over,
})

describe('leesBlok — de systeemgrens', () => {
  test('geldige blokken komen ongeschonden door, met optionele titel', () => {
    expect(leesBlok({ soort: 'tekst', tekst: '  Brood  ' })).toEqual({ soort: 'tekst', tekst: 'Brood' })
    expect(leesBlok({ soort: 'stappen', titel: 'Zo doe je het', items: ['Meel', 'Water'] })).toEqual({
      soort: 'stappen',
      titel: 'Zo doe je het',
      items: ['Meel', 'Water'],
    })
    expect(leesBlok({ soort: 'tip', tekst: 'Proef eerst.' })).toEqual({ soort: 'tip', tekst: 'Proef eerst.' })
  })
  test('onbekende soort, lege tekst of geen object → null', () => {
    expect(leesBlok({ soort: 'video', url: 'x' })).toBeNull()
    expect(leesBlok({ soort: 'tekst', tekst: '   ' })).toBeNull()
    expect(leesBlok({ soort: 'lijst', items: [] })).toBeNull()
    expect(leesBlok('tekst')).toBeNull()
    expect(leesBlok(null)).toBeNull()
  })
  test('lijst: lege en niet-tekst items vallen weg', () => {
    expect(leesBlok({ soort: 'lijst', items: ['Rogge', '', 3, 'Spelt'] })).toEqual({ soort: 'lijst', items: ['Rogge', 'Spelt'] })
  })
  test('tabel: korte rij wordt aangevuld, te lange of kapotte rij overgeslagen', () => {
    const t = leesBlok({ soort: 'tabel', kolommen: ['Brood', 'Prijs'], rijen: [['Wit'], ['Bruin', '€3', 'extra'], ['Mais', 4], ['Rogge', '€4']] })
    expect(t).toEqual({ soort: 'tabel', kolommen: ['Brood', 'Prijs'], rijen: [['Wit', ''], ['Rogge', '€4']] })
    expect(leesBlok({ soort: 'tabel', kolommen: [], rijen: [['a']] })).toBeNull()
    expect(leesBlok({ soort: 'tabel', kolommen: ['a'], rijen: [] })).toBeNull()
  })
})

describe('leesSecties', () => {
  test('geen array → leeg; secties zonder id/kop/blokken vallen weg; dubbele id telt één keer', () => {
    expect(leesSecties({ id: 'x' })).toEqual([])
    const uit = leesSecties([
      { id: 'a', kop: 'A', blokken: [{ soort: 'tekst', tekst: 'een' }] },
      { id: 'Fout Id', kop: 'B', blokken: [{ soort: 'tekst', tekst: 'twee' }] },
      { id: 'c', kop: '', blokken: [{ soort: 'tekst', tekst: 'drie' }] },
      { id: 'd', kop: 'D', blokken: [{ soort: 'onbekend' }] },
      { id: 'a', kop: 'A2', blokken: [{ soort: 'tekst', tekst: 'vier' }] },
      { id: 'e', kop: 'E', blokken: [{ soort: 'onbekend' }, { soort: 'tekst', tekst: 'vijf' }] },
    ])
    expect(uit.map((s) => s.id)).toEqual(['a', 'e'])
    expect(uit[1].blokken).toEqual([{ soort: 'tekst', tekst: 'vijf' }])
  })
})

describe('leesKennisRij', () => {
  const rij = { slug: 'deeg', titel: 'Deeg', ondertitel: null, categorie: 'academy', bron: '', document_id: 'geen-uuid', secties: [] }
  test('kern geldig → item; ongeldige document_id en lege bron → null', () => {
    expect(leesKennisRij(rij)).toEqual({ slug: 'deeg', titel: 'Deeg', ondertitel: null, categorie: 'academy', bron: null, documentId: null, secties: [] })
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e'
    expect(leesKennisRij({ ...rij, document_id: id })?.documentId).toBe(id)
  })
  test('ongeldige slug of categorie → null', () => {
    expect(leesKennisRij({ ...rij, slug: 'Deeg Boek' })).toBeNull()
    expect(leesKennisRij({ ...rij, categorie: 'recepten' })).toBeNull()
  })
  test('taal: slug op -en is Engels, de rest Nederlands', () => {
    expect(taalVan('deeg-handboek-en')).toBe('en')
    expect(taalVan('deeg-handboek')).toBe('nl')
    expect(taalVan('engels')).toBe('nl')
  })
  test('kort telt de secties en laat ze weg', () => {
    expect(kort(item())).toMatchObject({ slug: 'deeg-handboek', aantalSecties: 3 })
    expect(kort(item())).not.toHaveProperty('secties')
  })
})

describe('perCategorie', () => {
  test('vaste volgorde, lege categorieën weg, volgorde binnen blijft', () => {
    const g = perCategorie([item({ slug: 'b', categorie: 'klant' }), item({ slug: 'a' }), item({ slug: 'c', categorie: 'klant' })])
    expect(g.map((x) => [x.categorie, x.items.map((i) => i.slug)])).toEqual([
      ['klant', ['b', 'c']],
      ['handleiding', ['a']],
    ])
    expect(g[0].label).toBe('Voor de klant')
  })
})

describe('zoeken', () => {
  const docs = [zoekDocument(item()), zoekDocument(item({ slug: 'oven', titel: 'Oven gids', ondertitel: null, secties: [] }))]

  test('termen: genormaliseerd, zonder accenten, korte woorden weg', () => {
    expect(zoekTermen('  Crème  a BRÛLÉE crème ')).toEqual(['creme', 'brulee'])
    expect(normaliseer('Ëi').norm).toBe('ei')
  })
  test('treft koppen en teksten, met link naar de sectie', () => {
    const t = zoek(docs, 'deeg')
    // Eerst het item zelf (titel "Deeg handboek"), dan de secties in volgorde.
    expect(t.map((x) => x.sectieId)).toEqual([null, 'kneden', 'rijzen'])
    expect(trefferHref('joey', t[1])).toBe('/joey/bibliotheek/deeg-handboek#kneden')
  })
  test('alle termen moeten in dezelfde sectie staan', () => {
    expect(zoek(docs, 'deeg doek').map((x) => x.sectieId)).toEqual(['rijzen'])
    expect(zoek(docs, 'kneed doek')).toEqual([])
  })
  test('accentongevoelig; kop-treffer weegt zwaarder', () => {
    const [eerste] = zoek(docs, 'creme')
    expect(eerste).toMatchObject({ sectieId: 'creme', kop: 'Crème' })
  })
  test('titel-treffer geeft het item zelf, zonder sectie', () => {
    expect(zoek(docs, 'oven gids')).toEqual([{ slug: 'oven', titel: 'Oven gids', sectieId: null, kop: null, snippet: '', score: 20 }])
    expect(trefferHref('joey', { slug: 'oven', sectieId: null })).toBe('/joey/bibliotheek/oven')
  })
  test('korte term alleen aan woordbegin, lange term ook midden in een woord', () => {
    expect(vindTerm('het duurt een uur', 'uur')).toBe(14)
    expect(vindTerm('duurt', 'uur')).toBe(-1)
    expect(vindTerm('roggebrood', 'brood')).toBe(5)
    expect(zoek(docs, 'rijs').map((x) => x.sectieId)).toEqual([])
    expect(zoek(docs, 'rijzen').map((x) => x.sectieId)).toEqual([null, 'rijzen'])
  })
  test('lege of te korte query → niets', () => {
    expect(zoek(docs, '')).toEqual([])
    expect(zoek(docs, 'a')).toEqual([])
  })
})

describe('snippet en markeren', () => {
  const lang = `${'woord '.repeat(40)}het deeg rijst ${'nog '.repeat(40)}`
  test('snippet rond de treffer, afgekapt op woordgrens met beletselteken', () => {
    const s = maakSnippet(lang, ['deeg'], 20)
    expect(s.startsWith('…')).toBe(true)
    expect(s.endsWith('…')).toBe(true)
    expect(s).toContain('het deeg rijst')
    expect(s).toMatch(/^…woord /)
  })
  test('korte tekst blijft heel', () => {
    expect(maakSnippet('Het deeg rijst.', ['deeg'])).toBe('Het deeg rijst.')
  })
  test('markeert accentongevoelig op de oorspronkelijke tekens', () => {
    expect(markeer('Crème en creme', ['creme'])).toEqual([
      { tekst: 'Crème', treffer: true },
      { tekst: ' en ', treffer: false },
      { tekst: 'creme', treffer: true },
    ])
    expect(markeer('Brood', [])).toEqual([{ tekst: 'Brood', treffer: false }])
  })
})
