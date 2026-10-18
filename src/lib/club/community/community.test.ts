import { describe, expect, it } from 'vitest'
import { filterBericht, normaliseer, woorden } from './filter'
import { BERICHT_REM, MELD_REM, remVenster, remt } from './rem'
import { leesBerichtTekst, leesGroep, leesMelding, leesReactie, leesVoorkeur, schoneTekst } from './invoer'
import { bezoekdagenInMaand, groepRanglijst, maandVenster } from './ranglijst'
import { fragment, groepUitRij, groepZichtbaarVoor, ranglijstBron, telReacties, zietBericht } from './model'
import { communityBasis, groepHref } from './paden'
import { MAX_TEKST } from './model'

describe('woordfilter', () => {
  it('houdt scheldwoorden vast, ook verstopt', () => {
    for (const t of ['wat een kut dag', 'KANKER zooi', 'k4nker', 'kuuuut', 'k.u.t', 'teringweer vandaag', 'jij klootzakken', 'godverdomme zeg', 'hoerenjong']) {
      expect(filterBericht(t).vasthouden, t).toBe(true)
    }
  })
  it('laat gewone woorden met dezelfde letters door', () => {
    for (const t of ['De catering was top', 'Hoera, 12 keer gehaald!', 'Wat lullig dat de les uitviel', 'Lekker getraind, tot morgen', 'Computer stond uit', 'Eerst koffie, dan roeien.']) {
      expect(filterBericht(t).vasthouden, t).toBe(false)
    }
  })
  it('noemt het woord nooit in de reden', () => {
    expect(filterBericht('kut').reden).not.toContain('kut')
  })
  it('normaliseert accenten en nagebootste letters', () => {
    expect(normaliseer('Kéés 4 $')).toBe('kees a s')
    expect(woorden('k-u-t, prima')).toEqual(['kut', 'prima'])
  })
})

describe('rem', () => {
  const nu = new Date('2026-10-18T12:00:00Z')
  const terug = (ms: number) => new Date(nu.getTime() - ms).toISOString()
  it('laat het eerste bericht toe', () => {
    expect(remt(BERICHT_REM, [], nu)).toBeNull()
  })
  it('remt een tweede bericht binnen 15 seconden', () => {
    expect(remt(BERICHT_REM, [terug(5_000)], nu)).toMatch(/Wacht/)
  })
  it('remt bij vijf berichten in tien minuten', () => {
    expect(remt(BERICHT_REM, [1, 2, 3, 4, 5].map((m) => terug(m * 60_000)), nu)).toMatch(/tien minuten/)
    expect(remt(BERICHT_REM, [1, 2, 3, 4].map((m) => terug(m * 60_000)), nu)).toBeNull()
  })
  it('remt bij dertig per dag', () => {
    expect(remt(BERICHT_REM, Array.from({ length: 30 }, (_, i) => terug((i + 1) * 30 * 60_000 - 1)), nu)).toMatch(/vandaag/)
  })
  it('kent het venster en de meldrem', () => {
    expect(remVenster(BERICHT_REM)).toBe(24 * 3_600_000)
    expect(remt(MELD_REM, Array.from({ length: 10 }, () => terug(1_000)), nu)).not.toBeNull()
  })
})

describe('invoer', () => {
  it('schoont tekst op en begrenst', () => {
    expect(schoneTekst('  hoi​  daar\n\n\n\nok ')).toBe('hoi daar\n\nok')
    expect(leesBerichtTekst({ tekst: '   ' }).ok).toBe(false)
    expect(leesBerichtTekst({ tekst: 'x'.repeat(MAX_TEKST + 1) }).ok).toBe(false)
    expect(leesBerichtTekst({ tekst: 'Top training!' })).toEqual({ ok: true, waarde: 'Top training!' })
  })
  it('kent alleen duim en high five', () => {
    expect(leesReactie({ soort: 'duim' }).ok).toBe(true)
    expect(leesReactie({ soort: 'hartje' }).ok).toBe(false)
  })
  it('vraagt een reden bij melden', () => {
    expect(leesMelding({}).ok).toBe(false)
    expect(leesMelding({ reden: 'spam', toelichting: '  ' })).toEqual({ ok: true, waarde: { reden: 'spam', toelichting: null } })
  })
  it('wil een echte boolean voor de ranglijst', () => {
    expect(leesVoorkeur({ opRanglijst: 'ja' }).ok).toBe(false)
    expect(leesVoorkeur({ opRanglijst: false })).toEqual({ ok: true, waarde: { opRanglijst: false } })
  })
  it('controleert een groep', () => {
    const vestigingen = [{ sleutel: 'centrum', naam: 'Centrum', standaard: true }]
    expect(leesGroep({ naam: 'A', toegang: 'open' }, vestigingen).ok).toBe(false)
    expect(leesGroep({ naam: 'Ochtendploeg', toegang: 'geheim' }, vestigingen).ok).toBe(false)
    expect(leesGroep({ naam: 'Ochtendploeg', toegang: 'open', vestiging: 'noord' }, vestigingen).ok).toBe(false)
    expect(leesGroep({ naam: 'Ochtendploeg', toegang: 'open', challengeId: 'x' }, vestigingen).ok).toBe(false)
    const goed = leesGroep({ naam: ' Ochtendploeg ', toegang: 'besloten', vestiging: 'centrum', ranglijst: false }, vestigingen)
    expect(goed).toEqual({ ok: true, waarde: { naam: 'Ochtendploeg', uitleg: null, toegang: 'besloten', vestiging: 'centrum', challengeId: null, lestypeId: null, ranglijst: false } })
  })
})

describe('ranglijst', () => {
  const deelnemers = [
    { lidId: 'a', voornaam: 'Sanne', achternaam: 'van Vliet' },
    { lidId: 'b', voornaam: 'Tom', achternaam: 'Jansen' },
    { lidId: 'c', voornaam: 'Eva', achternaam: 'de Boer' },
    { lidId: 'd', voornaam: 'Bas', achternaam: 'Smit' },
  ]
  const scores = new Map([['a', 5], ['b', 8], ['c', 5], ['d', 9]])
  it('toont alleen wie koos, met privacynaam en gelijke plekken', () => {
    const r = groepRanglijst(deelnemers, scores, new Set(['a', 'b', 'c']), 'a')
    expect(r.rijen.map((x) => [x.positie, x.naam, x.score, x.ik])).toEqual([
      [1, 'Tom J.', 8, false],
      [2, 'Eva B.', 5, false],
      [2, 'Sanne V.', 5, true],
    ])
    expect(r.verborgen).toBe(1)
    expect(r.eigenLos).toBeNull()
  })
  it('laat een lid dat niet koos alleen de eigen score zien', () => {
    const r = groepRanglijst(deelnemers, scores, new Set(['a']), 'd')
    expect(r.rijen.map((x) => x.naam)).toEqual(['Sanne V.'])
    expect(r.eigenLos).toEqual({ score: 9 })
  })
  it('zet de eigen rij onder een volle top', () => {
    const r = groepRanglijst(deelnemers, scores, new Set(['a', 'b', 'c', 'd']), 'c', 2)
    expect(r.rijen.map((x) => x.naam)).toEqual(['Bas S.', 'Tom J.', 'Eva B.'])
  })
  it('telt bezoekdagen per kalendermaand in Nederlandse tijd', () => {
    const m = bezoekdagenInMaand(
      [
        { lidId: 'a', op: '2026-10-01T06:00:00Z' },
        { lidId: 'a', op: '2026-10-02T18:00:00Z' },
        { lidId: 'a', op: '2026-09-30T22:30:00Z' },
        { lidId: 'a', op: '2026-09-30T20:00:00Z' },
        { lidId: 'b', op: '2026-10-31T23:30:00Z' },
      ],
      '2026-10',
    )
    expect(m.get('a')).toBe(2)
    expect(m.get('b')).toBeUndefined()
  })
  it('geeft een ruim venster rond de maand', () => {
    expect(maandVenster('2026-12')).toEqual({ van: '2026-11-30T00:00:00.000Z', tot: '2027-01-02T00:00:00.000Z' })
  })
})

describe('model', () => {
  it('leest een groep veilig', () => {
    expect(groepUitRij(null)).toBeNull()
    const g = groepUitRij({ id: 'g', naam: 'Hyrox', toegang: 'raar', challenge_id: 'c', ranglijst: null })
    expect(g?.toegang).toBe('besloten')
    expect(g?.ranglijst).toBe(true)
    expect(g && ranglijstBron(g)).toBe('challenge')
  })
  it('toont groepen alleen aan wie ze mag zien', () => {
    const open = { toegang: 'open' as const, vestiging: 'noord', gearchiveerdOp: null }
    expect(groepZichtbaarVoor(open, 'noord', false)).toBe(true)
    expect(groepZichtbaarVoor(open, 'centrum', false)).toBe(false)
    expect(groepZichtbaarVoor({ ...open, toegang: 'besloten' }, 'noord', false)).toBe(false)
    expect(groepZichtbaarVoor({ ...open, toegang: 'besloten' }, 'noord', true)).toBe(true)
    expect(groepZichtbaarVoor({ ...open, gearchiveerdOp: '2026-10-01' }, 'noord', true)).toBe(false)
  })
  it('telt reacties met de eigen reacties', () => {
    const t = telReacties(
      [
        { berichtId: 'x', lidId: 'a', soort: 'duim' },
        { berichtId: 'x', lidId: 'b', soort: 'duim' },
        { berichtId: 'x', lidId: 'a', soort: 'highfive' },
      ],
      'a',
    )
    expect(t.get('x')).toEqual({ duim: 2, highfive: 1, eigen: ['duim', 'highfive'] })
  })
  it('laat vastgehouden berichten alleen aan de schrijver zien', () => {
    expect(zietBericht({ status: 'vastgehouden', lidId: 'a' }, 'a')).toBe(true)
    expect(zietBericht({ status: 'vastgehouden', lidId: 'a' }, 'b')).toBe(false)
    expect(zietBericht({ status: 'zichtbaar', lidId: 'a' }, 'b')).toBe(true)
  })
  it('kort een fragment netjes in', () => {
    expect(fragment('kort')).toBe('kort')
    expect(fragment('a'.repeat(80), 10)).toBe('aaaaaaa...')
  })
  it('houdt ?lid= alleen in de voorvertoning', () => {
    expect(groepHref(communityBasis(null), 'g1')).toBe('/mijn/community?groep=g1')
    expect(groepHref(communityBasis('l1'), 'g1')).toBe('/mijn/community?lid=l1&groep=g1')
  })
})
