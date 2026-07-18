import { describe, it, expect } from 'vitest'
import {
  eventsEndpoint,
  leesKalenderKeuze,
  leesKalenderLijst,
  leesZichtbaarKeuze,
  MAX_KALENDER_ID_LENGTE,
} from './google'

// De pure delen van de agenda-keuze (functie 2): de events-URL-helper (encoding!),
// de kalenderlijst-narrowing (filter op accessRole + 401/403-sein) en de
// keuze-validatie op de systeemgrens. Geen netwerk — precies de stukken die stil
// kapot kunnen gaan, dus die testen we.

describe('eventsEndpoint', () => {
  const BASIS = 'https://www.googleapis.com/calendar/v3/calendars'

  it('valt terug op de primaire agenda bij null', () => {
    // Arrange + Act
    const url = eventsEndpoint(null)

    // Assert — null = de default, precies zoals de kolom die leeg laat.
    expect(url).toBe(`${BASIS}/primary/events`)
  })

  it('gebruikt de gekozen agenda-id in het pad', () => {
    expect(eventsEndpoint('werk')).toBe(`${BASIS}/werk/events`)
  })

  it('encodeert een e-mail-achtige id (@ wordt %40)', () => {
    // Een kalender-id is vaak een e-mailadres; ongeëncodeerd bouw je een kapotte URL.
    expect(eventsEndpoint('me@example.com')).toBe(`${BASIS}/me%40example.com/events`)
  })

  it('encodeert bijzondere tekens zoals spaties en plus', () => {
    expect(eventsEndpoint('a b+c')).toBe(`${BASIS}/a%20b%2Bc/events`)
  })
})

describe('leesKalenderLijst — status → uitkomst', () => {
  it('leest 401 als verlopen', () => {
    expect(leesKalenderLijst(401, null)).toEqual({ staat: 'verlopen' })
  })

  it('leest 403 als scope_ontbreekt — het opnieuw-koppelen-sein', () => {
    // Een koppeling van vóór de calendarlist-scope: alleen opnieuw koppelen helpt.
    expect(leesKalenderLijst(403, null)).toEqual({ staat: 'scope_ontbreekt' })
  })

  it('leest een andere niet-ok status als fout met de code', () => {
    expect(leesKalenderLijst(500, null)).toEqual({ staat: 'fout', reden: 'http_500' })
  })

  it('faalt op een niet-object body bij status 200', () => {
    expect(leesKalenderLijst(200, 'geen-object')).toEqual({
      staat: 'fout',
      reden: 'onbegrijpelijk_antwoord',
    })
  })

  it('geeft een lege lijst bij 200 zonder items', () => {
    expect(leesKalenderLijst(200, {})).toEqual({ staat: 'ok', kalenders: [] })
  })
})

describe('leesKalenderLijst — narrowing + alle agenda\'s + kleur', () => {
  it('houdt ALLE agenda\'s (ook reader/freeBusyReader), met hun toegang en kleur', () => {
    // Act
    const uitkomst = leesKalenderLijst(200, {
      items: [
        { id: 'eigen@x.nl', summary: 'Mijn agenda', primary: true, accessRole: 'owner', backgroundColor: '#00E5FF' },
        { id: 'team@x.nl', summary: 'Team', accessRole: 'writer', backgroundColor: '#33b679' },
        { id: 'feest@x.nl', summary: 'Feestdagen', accessRole: 'reader', backgroundColor: '#f6bf26' },
        { id: 'vrij@x.nl', summary: 'Vrij/bezet', accessRole: 'freeBusyReader' },
      ],
    })

    // Assert — de weergave toont ALLES; de toegang bepaalt later of je erin mag
    // schrijven. Ook alleen-lezen agenda's (Feestdagen) horen in de lijst.
    if (uitkomst.staat !== 'ok') throw new Error('verwacht ok')
    expect(uitkomst.kalenders.map((k) => k.id)).toEqual([
      'eigen@x.nl',
      'team@x.nl',
      'feest@x.nl',
      'vrij@x.nl',
    ])
    expect(uitkomst.kalenders[0]).toEqual({
      id: 'eigen@x.nl',
      naam: 'Mijn agenda',
      kleur: '#00E5FF',
      primair: true,
      toegang: 'owner',
    })
    // Een alleen-lezen agenda blijft, met zijn eigen kleur en rol.
    expect(uitkomst.kalenders[2]).toEqual({
      id: 'feest@x.nl',
      naam: 'Feestdagen',
      kleur: '#f6bf26',
      primair: false,
      toegang: 'reader',
    })
  })

  it('slaat alleen items zonder id over; een ontbrekende rol wordt lege toegang', () => {
    const uitkomst = leesKalenderLijst(200, {
      items: [
        { summary: 'Geen id', accessRole: 'owner' },
        { id: '   ', accessRole: 'owner' },
        { id: 'geen-rol@x.nl', summary: 'Zonder rol' },
        { id: 'goed@x.nl', summary: 'Goed', accessRole: 'writer' },
      ],
    })
    if (uitkomst.staat !== 'ok') throw new Error('verwacht ok')
    // 'geen-rol@x.nl' blijft nu wél staan (weergave toont alles), met toegang ''.
    expect(uitkomst.kalenders.map((k) => k.id)).toEqual(['geen-rol@x.nl', 'goed@x.nl'])
    expect(uitkomst.kalenders[0]?.toegang).toBe('')
  })

  it('leest kleur als null wanneer backgroundColor ontbreekt', () => {
    const uitkomst = leesKalenderLijst(200, {
      items: [{ id: 'a@x.nl', accessRole: 'owner' }],
    })
    if (uitkomst.staat !== 'ok') throw new Error('verwacht ok')
    expect(uitkomst.kalenders[0]?.kleur).toBeNull()
  })

  it('valt terug op de id als naam wanneer summary ontbreekt', () => {
    const uitkomst = leesKalenderLijst(200, {
      items: [{ id: 'naamloos@x.nl', accessRole: 'owner' }],
    })
    if (uitkomst.staat !== 'ok') throw new Error('verwacht ok')
    expect(uitkomst.kalenders[0]?.naam).toBe('naamloos@x.nl')
  })

  it('leest primair alleen bij een strikte true', () => {
    const uitkomst = leesKalenderLijst(200, {
      items: [
        { id: 'a@x.nl', accessRole: 'owner', primary: true },
        { id: 'b@x.nl', accessRole: 'owner', primary: 'true' },
        { id: 'c@x.nl', accessRole: 'owner' },
      ],
    })
    if (uitkomst.staat !== 'ok') throw new Error('verwacht ok')
    expect(uitkomst.kalenders.map((k) => k.primair)).toEqual([true, false, false])
  })

  it('behandelt een niet-array items als geen items', () => {
    expect(leesKalenderLijst(200, { items: 'kapot' })).toEqual({ staat: 'ok', kalenders: [] })
  })
})

describe('leesKalenderKeuze — de POST-body', () => {
  it('accepteert een geldige id en trimt witruimte', () => {
    const uitkomst = leesKalenderKeuze({ kalenderId: '  werk@x.nl  ' })
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde).toBe('werk@x.nl')
  })

  it('weigert een niet-object', () => {
    expect(leesKalenderKeuze(null).ok).toBe(false)
    expect(leesKalenderKeuze('werk').ok).toBe(false)
  })

  it('weigert een ontbrekende of niet-string kalenderId', () => {
    expect(leesKalenderKeuze({}).ok).toBe(false)
    expect(leesKalenderKeuze({ kalenderId: 42 }).ok).toBe(false)
  })

  it('weigert een lege of enkel-witruimte id', () => {
    expect(leesKalenderKeuze({ kalenderId: '' }).ok).toBe(false)
    expect(leesKalenderKeuze({ kalenderId: '   ' }).ok).toBe(false)
  })

  it('weigert een absurd lange id', () => {
    const teLang = 'x'.repeat(MAX_KALENDER_ID_LENGTE + 1)
    expect(leesKalenderKeuze({ kalenderId: teLang }).ok).toBe(false)
  })
})

describe('leesZichtbaarKeuze — de zichtbaarheids-POST-body', () => {
  it('accepteert een geldige id met een boolean zichtbaar', () => {
    const aan = leesZichtbaarKeuze({ kalenderId: 'werk@x.nl', zichtbaar: true })
    expect(aan).toEqual({ ok: true, kalenderId: 'werk@x.nl', zichtbaar: true })

    const uit = leesZichtbaarKeuze({ kalenderId: 'werk@x.nl', zichtbaar: false })
    expect(uit).toEqual({ ok: true, kalenderId: 'werk@x.nl', zichtbaar: false })
  })

  it('trimt de id (via leesKalenderKeuze)', () => {
    const uitkomst = leesZichtbaarKeuze({ kalenderId: '  team@x.nl  ', zichtbaar: true })
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.kalenderId).toBe('team@x.nl')
  })

  it('weigert een ontbrekende of niet-boolean zichtbaar', () => {
    expect(leesZichtbaarKeuze({ kalenderId: 'a@x.nl' }).ok).toBe(false)
    // Waarheids-achtige waarden tellen niet: een tikfout mag niet stil aan/uit zetten.
    expect(leesZichtbaarKeuze({ kalenderId: 'a@x.nl', zichtbaar: 'true' }).ok).toBe(false)
    expect(leesZichtbaarKeuze({ kalenderId: 'a@x.nl', zichtbaar: 1 }).ok).toBe(false)
    expect(leesZichtbaarKeuze({ kalenderId: 'a@x.nl', zichtbaar: null }).ok).toBe(false)
  })

  it('weigert een ongeldige id, ook met een geldige boolean', () => {
    expect(leesZichtbaarKeuze({ kalenderId: '', zichtbaar: true }).ok).toBe(false)
    expect(leesZichtbaarKeuze({ zichtbaar: true }).ok).toBe(false)
    expect(leesZichtbaarKeuze(null).ok).toBe(false)
  })
})
