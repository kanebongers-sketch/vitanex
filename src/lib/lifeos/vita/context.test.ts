import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  haalContext,
  schrijfContextBlok,
  isErIetsGemeten,
  vakkenMetFout,
} from './context'

// nu: dinsdag 15 juli 2026, 10:00 Amsterdamse tijd. Vast, zodat de dagenreeks
// deterministisch is en de test niet anders uitvalt om 23:59.
const NU = new Date('2026-07-15T10:00:00+02:00')
const VANDAAG = '2026-07-15'
const GISTEREN = '2026-07-14'

interface TabelData {
  data?: unknown[]
  error?: { message: string } | null
}

/**
 * Minimale nep-Supabase. Elke query-methode geeft dezelfde chainable terug, en
 * de chainable is een thenable die de vooraf ingestelde `{data, error}` per
 * tabel teruggeeft. Zo draait de échte `haalContext` — inclusief de spine-bouw
 * en de foutcompositie — zonder database.
 */
function nepAdmin(perTabel: Record<string, TabelData>): SupabaseClient {
  const fabriek = (tabel: string) => {
    const res = perTabel[tabel] ?? { data: [], error: null }
    const chain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'gte', 'lte', 'order', 'limit']) {
      chain[m] = () => chain
    }
    chain.then = (resolve: (v: { data: unknown; error: { message: string } | null }) => unknown) =>
      resolve({ data: res.data ?? null, error: res.error ?? null })
    return chain
  }
  return { from: (t: string) => fabriek(t) } as unknown as SupabaseClient
}

describe('haalContext — de spine komt uit het datumbereik', () => {
  it('toont een training op een dag zónder wearable-rij (de kern-bug)', async () => {
    // Arrange — géén herstel_metingen (wearable synct niet), wél een training
    // vandaag. De oude code bouwde de dagenlijst uit herstel_metingen, dus deze
    // dag bestond niet en Vita zag de beweging nooit.
    const admin = nepAdmin({
      herstel_metingen: { data: [] },
      trainingen: { data: [{ datum: VANDAAG, gepland: false, actieve_minuten: 32 }] },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert — de spine bestaat, bevat vandaag, en draagt de beweging.
    expect(context.herstel.ok).toBe(true)
    if (!context.herstel.ok) throw new Error('spine hoort ok te zijn')
    const vandaag = context.herstel.waarde.find((d) => d.datum === VANDAAG)
    expect(vandaag?.actieveMinuten).toBe(32)
    expect(isErIetsGemeten(context)).toBe(true)
  })

  it('leidt geen beweging af uit een voornemen — gepland telt niet', async () => {
    // Arrange — alleen een GEPLANDE training. Een plan is geen meting.
    const admin = nepAdmin({
      trainingen: { data: [{ datum: VANDAAG, gepland: true, actieve_minuten: null }] },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert — geen enkele dag draagt beweging; niets gemeten.
    if (!context.herstel.ok) throw new Error('spine hoort ok te zijn')
    expect(context.herstel.waarde.every((d) => d.actieveMinuten === null)).toBe(true)
    expect(isErIetsGemeten(context)).toBe(false)
  })

  it('houdt 0 (gemeten nul) en null (niet gemeten) uit elkaar', async () => {
    // Arrange — een gedane training met een gemeten nul actieve minuten vandaag,
    // niets gisteren.
    const admin = nepAdmin({
      trainingen: { data: [{ datum: VANDAAG, gepland: false, actieve_minuten: 0 }] },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert — vandaag is een echte 0, gisteren is null (geen log). Die twee
    // mogen nooit hetzelfde worden.
    if (!context.herstel.ok) throw new Error('spine hoort ok te zijn')
    const vandaag = context.herstel.waarde.find((d) => d.datum === VANDAAG)
    const gisteren = context.herstel.waarde.find((d) => d.datum === GISTEREN)
    expect(vandaag?.actieveMinuten).toBe(0)
    expect(gisteren?.actieveMinuten).toBeNull()
  })

  it('neemt de meest complete slaap als twee bronnen dezelfde dag meten', async () => {
    // Arrange — Whoop en Oura op dezelfde dag; Oura mat de langere nacht.
    const admin = nepAdmin({
      herstel_metingen: {
        data: [
          { datum: VANDAAG, slaap_minuten: 400 },
          { datum: VANDAAG, slaap_minuten: 415 },
        ],
      },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert — één antwoord per dag, de hoogste (dubbele-dag-rijen worden één).
    if (!context.herstel.ok) throw new Error('spine hoort ok te zijn')
    const dagen = context.herstel.waarde.filter((d) => d.datum === VANDAAG)
    expect(dagen).toHaveLength(1)
    expect(dagen[0]?.slaapMinuten).toBe(415)
  })
})

describe('foutcompositie — fout ≠ leeg, per bron apart', () => {
  it('laat een gefaalde beweging-query de slaap-spine niet meeslepen', async () => {
    // Arrange — slaap ok, trainingen faalt.
    const admin = nepAdmin({
      herstel_metingen: { data: [{ datum: VANDAAG, slaap_minuten: 420 }] },
      trainingen: { error: { message: 'timeout' } },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert — de spine bestaat nog (slaap is er), maar beweging is een storing.
    expect(context.herstel.ok).toBe(true)
    expect(context.beweging.ok).toBe(false)
    expect(vakkenMetFout(context)).toContain('beweging')
    expect(vakkenMetFout(context)).not.toContain('slaap')

    // En de tekst zegt het eerlijk: beweging "niet op te halen", niet "je bewoog niet".
    const blok = schrijfContextBlok(context)
    expect(blok).toMatch(/## Beweging[\s\S]*NIET OP TE HALEN/)
    expect(blok).not.toMatch(/## Beweging[\s\S]*Geen beweging gelogd/)
  })

  it('markeert de spine als fout alleen als BEIDE herstelbronnen falen', async () => {
    // Arrange — allebei kapot.
    const admin = nepAdmin({
      herstel_metingen: { error: { message: 'down' } },
      trainingen: { error: { message: 'down' } },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert
    expect(context.herstel.ok).toBe(false)
    expect(vakkenMetFout(context)).toEqual(expect.arrayContaining(['slaap', 'beweging']))
  })

  it('toont een gefaalde slaap-query als storing, niet als "niet gemeten"', async () => {
    // Arrange — slaap faalt, beweging ok (dus de spine bestaat).
    const admin = nepAdmin({
      herstel_metingen: { error: { message: 'timeout' } },
      trainingen: { data: [{ datum: VANDAAG, gepland: false, actieve_minuten: 25 }] },
    })

    // Act
    const context = await haalContext('kane', admin, NU)
    const blok = schrijfContextBlok(context)

    // Assert — slaap = storing, ook al is de spine ok via de bewegingbron.
    expect(context.herstel.ok).toBe(true)
    expect(blok).toMatch(/## Slaap[\s\S]*NIET OP TE HALEN/)
  })
})

describe('lege toestand', () => {
  it('zegt eerlijk dat er niets gemeten is als alle bronnen leeg zijn', async () => {
    // Arrange — alles leeg, niets kapot.
    const admin = nepAdmin({})

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert — geen storing, maar ook niets gemeten.
    expect(vakkenMetFout(context)).toHaveLength(0)
    expect(isErIetsGemeten(context)).toBe(false)
    const blok = schrijfContextBlok(context)
    expect(blok).toContain('Geen slaap gemeten')
    expect(blok).toContain('Geen beweging gelogd')
  })
})
