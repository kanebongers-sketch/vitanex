import { describe, it, expect } from 'vitest'
import {
  isBericht,
  laatsteBerichten,
  leesFout,
  metDelta,
  foutBijStatus,
  MAX_VRAAG_TEKENS,
  type Bericht,
} from './gesprek'

const VRAAG: Bericht = { rol: 'gebruiker', tekst: 'Wat doe ik als eerste?' }

describe('metDelta — de stroom opbouwen', () => {
  it('begint een nieuw Vita-bericht na een vraag', () => {
    // Arrange & Act
    const uit = metDelta([VRAAG], 'Begin ')

    // Assert
    expect(uit).toEqual([VRAAG, { rol: 'vita', tekst: 'Begin ' }])
  })

  it('plakt volgende stukjes aan hetzelfde antwoord', () => {
    // Arrange
    const na1 = metDelta([VRAAG], 'Begin ')

    // Act
    const na2 = metDelta(na1, 'met de offerte.')

    // Assert — geen tweede bericht per chunk.
    expect(na2).toHaveLength(2)
    expect(na2[1]?.tekst).toBe('Begin met de offerte.')
  })

  it('muteert de bestaande lijst niet', () => {
    // Arrange
    const start: Bericht[] = [VRAAG]

    // Act
    metDelta(start, 'iets')

    // Assert — immutable: React ziet een nieuwe lijst, de oude blijft heel.
    expect(start).toEqual([VRAAG])
  })

  it('begint een nieuw antwoord in een tweede beurt', () => {
    // Arrange — vorige beurt eindigde met Vita, nu staat er weer een vraag.
    const verloop: Bericht[] = [VRAAG, { rol: 'vita', tekst: 'Eerste antwoord.' }, VRAAG]

    // Act
    const uit = metDelta(verloop, 'Tweede')

    // Assert — niet aan het eerste antwoord vastplakken.
    expect(uit).toHaveLength(4)
    expect(uit[3]).toEqual({ rol: 'vita', tekst: 'Tweede' })
  })

  it('begint bij een leeg gesprek gewoon een Vita-bericht', () => {
    expect(metDelta([], 'Hoi')).toEqual([{ rol: 'vita', tekst: 'Hoi' }])
  })
})

describe('laatsteBerichten — niet je hele gesprek meesturen', () => {
  it('houdt de nieuwste berichten en snijdt de oudste weg', () => {
    // Arrange — het antwoord hangt aan wat er net gezegd is.
    const berichten: Bericht[] = Array.from({ length: 5 }, (_, i) => ({
      rol: 'gebruiker',
      tekst: `bericht ${i}`,
    }))

    // Act
    const uit = laatsteBerichten(berichten, 2)

    // Assert
    expect(uit.map((b) => b.tekst)).toEqual(['bericht 3', 'bericht 4'])
  })

  it('laat een korte geschiedenis met rust', () => {
    expect(laatsteBerichten([VRAAG], 20)).toEqual([VRAAG])
  })

  it('kan met een leeg gesprek om', () => {
    expect(laatsteBerichten([], 20)).toEqual([])
  })
})

describe('isBericht — de systeemgrens', () => {
  it('accepteert een geldig bericht', () => {
    expect(isBericht(VRAAG)).toBe(true)
  })

  it.each([
    [{ rol: 'assistant', tekst: 'x' }],
    [{ rol: 'vita', tekst: '' }],
    [{ rol: 'vita' }],
    [{ tekst: 'x' }],
    [null],
    ['bericht'],
  ])('weigert %s', (v) => {
    expect(isBericht(v)).toBe(false)
  })

  it('weigert een bericht boven het tekenplafond', () => {
    // Arrange — de client begrenst het veld, maar de server is het slot.
    const teLang = { rol: 'gebruiker', tekst: 'a'.repeat(MAX_VRAAG_TEKENS + 1) }

    // Act & Assert
    expect(isBericht(teLang)).toBe(false)
  })
})

describe('fouten — nooit een leeg scherm', () => {
  it.each([
    [401, 'Je sessie is verlopen. Log opnieuw in.'],
    [429, 'Even te snel achter elkaar. Wacht een momentje.'],
    [503, 'Vita kan er even niet bij.'],
    [500, 'Vita kon niet antwoorden.'],
  ])('vertaalt %i naar een Nederlandse zin', (status, verwacht) => {
    expect(foutBijStatus(status)).toBe(verwacht)
  })

  it('neemt de melding van de server over als die er is', async () => {
    // Arrange — de route is specifieker dan wij kunnen raden.
    const respons = new Response(JSON.stringify({ fout: 'Je vraag is te lang (max 4000 tekens).' }), {
      status: 400,
    })

    // Act & Assert
    expect(await leesFout(respons)).toBe('Je vraag is te lang (max 4000 tekens).')
  })

  it('valt terug op de status als de body geen JSON is', async () => {
    // Arrange — een proxy die een HTML-foutpagina teruggeeft.
    const respons = new Response('<html>502</html>', { status: 503 })

    // Act & Assert — nooit stil een lege string: dan mag de gebruiker zelf raden.
    expect(await leesFout(respons)).toBe('Vita kan er even niet bij.')
  })

  it('valt terug op de status bij een JSON-body zonder fout-veld', async () => {
    // Arrange
    const respons = new Response(JSON.stringify({ iets: 'anders' }), { status: 500 })

    // Act & Assert
    expect(await leesFout(respons)).toBe('Vita kon niet antwoorden.')
  })
})
