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
 *
 * `eq` wordt wél onthouden: `notities` wordt twee keer bevraagd (journal en
 * brain_dump) en dat zijn twee bronnen met elk een eigen foutstaat. Sleutel ze
 * daarom als `notities:journal` / `notities:brain_dump`; zonder dat onderscheid
 * zou een test niet kunnen bewijzen dat een gevallen journal-query de brain dumps
 * niet meesleept.
 */
function nepAdmin(perTabel: Record<string, TabelData>): SupabaseClient {
  const fabriek = (tabel: string) => {
    const chain: Record<string, unknown> = {}
    const filters: Record<string, unknown> = {}
    for (const m of ['select', 'gte', 'lte', 'order', 'limit', 'or', 'not']) {
      chain[m] = () => chain
    }
    chain.eq = (kolom: string, waarde: unknown) => {
      filters[kolom] = waarde
      return chain
    }
    chain.then = (resolve: (v: { data: unknown; error: { message: string } | null }) => unknown) => {
      const soort = filters.soort
      const sleutel = typeof soort === 'string' ? `${tabel}:${soort}` : tabel
      const res = perTabel[sleutel] ?? perTabel[tabel] ?? { data: [], error: null }
      return resolve({ data: res.data ?? null, error: res.error ?? null })
    }
    return chain
  }
  return { from: (t: string) => fabriek(t) } as unknown as SupabaseClient
}

/** Een complete taakrij zoals de database hem geeft. Overschrijf per test wat telt. */
function taakRij(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    titel: 'Offerte afmaken',
    notitie: null,
    klaar: false,
    klaar_op: null,
    datum: VANDAAG,
    top3_positie: null,
    aangemaakt_op: '2026-07-10T09:00:00.000Z',
    impact: null,
    deadline: null,
    inspanning_minuten: null,
    energie: null,
    ...over,
  }
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

describe('taken — open en afgerond zijn twee dingen', () => {
  it('scheidt open taken van wat vandaag is afgevinkt', async () => {
    // Arrange — één open taak, één taak die vanochtend is afgerond. Hiervóór stond
    // er `.eq('klaar', false)` op de query en zag Vita die tweede simpelweg niet.
    const admin = nepAdmin({
      taken: {
        data: [
          taakRij({ titel: 'Offerte afmaken' }),
          taakRij({
            id: '22222222-2222-4222-8222-222222222222',
            titel: 'Aangifte doen',
            klaar: true,
            klaar_op: '2026-07-15T07:30:00.000Z',
          }),
        ],
      },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert
    if (!context.taken.ok || !context.afgerondVandaag.ok) throw new Error('taken horen ok te zijn')
    expect(context.taken.waarde.map((t) => t.titel)).toEqual(['Offerte afmaken'])
    expect(context.afgerondVandaag.waarde.map((t) => t.titel)).toEqual(['Aangifte doen'])

    // En Vita kan voortgang benoemen in plaats van alleen te zeuren over wat er staat.
    expect(schrijfContextBlok(context)).toMatch(/## Vandaag afgerond\n- Aangifte doen/)
  })

  it('telt een taak die gisteren is afgevinkt niet als vandaag afgerond', async () => {
    // Arrange — afgevinkt op 14 juli 23:00 lokaal; dat is gisteren, niet vandaag.
    const admin = nepAdmin({
      taken: {
        data: [taakRij({ klaar: true, klaar_op: '2026-07-14T21:00:00.000Z' })],
      },
    })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert
    if (!context.afgerondVandaag.ok) throw new Error('vak hoort ok te zijn')
    expect(context.afgerondVandaag.waarde).toHaveLength(0)
  })

  it('meldt één gevallen takenquery als één bron, niet als twee', async () => {
    // Arrange — de taken-query faalt. `taken` en `afgerondVandaag` komen uit
    // dezelfde ophaal; de gebruiker hoort "taken" één keer te horen.
    const admin = nepAdmin({ taken: { error: { message: 'timeout' } } })

    // Act
    const context = await haalContext('kane', admin, NU)

    // Assert
    expect(context.taken.ok).toBe(false)
    expect(context.afgerondVandaag.ok).toBe(false)
    expect(vakkenMetFout(context).filter((v) => v === 'taken')).toHaveLength(1)

    // En de tekst zegt storing, niet "geen taken".
    const blok = schrijfContextBlok(context)
    expect(blok).toMatch(/## Open taken\nNIET OP TE HALEN/)
    expect(blok).not.toMatch(/Geen open taken/)
  })

  it('schrijft alleen de feiten die er zijn — geen verzonnen middenwaarden', async () => {
    // Arrange — impact bekend, de rest niet.
    const admin = nepAdmin({
      taken: { data: [taakRij({ impact: 4, deadline: '2026-07-16' })] },
    })

    // Act
    const blok = schrijfContextBlok(await haalContext('kane', admin, NU))

    // Assert — wat bekend is staat er; wat ontbreekt wordt niet genoemd én niet ingevuld.
    expect(blok).toContain('impact 4/5')
    expect(blok).toContain('deadline 2026-07-16')
    expect(blok).not.toMatch(/energie|min\b/)
  })
})

describe('journal en brain dumps — eigen bron, eigen foutstaat', () => {
  it('neemt de journal van vandaag en gisteren mee', async () => {
    // Arrange
    const admin = nepAdmin({
      'notities:journal': {
        data: [{ datum: GISTEREN, tekst: 'Zware dag, slecht geslapen.' }],
      },
      'notities:brain_dump': { data: [{ datum: VANDAAG, tekst: 'Idee voor de landing.' }] },
    })

    // Act
    const blok = schrijfContextBlok(await haalContext('kane', admin, NU))

    // Assert
    expect(blok).toContain('Zware dag, slecht geslapen.')
    expect(blok).toContain('Idee voor de landing.')
  })

  it('laat een gevallen journal-query de brain dumps niet meeslepen', async () => {
    // Arrange — journal kapot, brain dumps ok.
    const admin = nepAdmin({
      'notities:journal': { error: { message: 'timeout' } },
      'notities:brain_dump': { data: [{ datum: VANDAAG, tekst: 'Idee voor de landing.' }] },
    })

    // Act
    const context = await haalContext('kane', admin, NU)
    const blok = schrijfContextBlok(context)

    // Assert — twee bronnen, twee staten. Niet één hoop.
    expect(vakkenMetFout(context)).toContain('journal')
    expect(vakkenMetFout(context)).not.toContain('notities')
    expect(blok).toMatch(/## Journal[\s\S]*NIET OP TE HALEN/)
    expect(blok).toContain('Idee voor de landing.')
  })

  it('kapt een lange notitie zichtbaar af', async () => {
    // Arrange — een brain dump die ver over het plafond gaat.
    const admin = nepAdmin({
      'notities:brain_dump': { data: [{ datum: VANDAAG, tekst: 'a'.repeat(500) }] },
    })

    // Act
    const blok = schrijfContextBlok(await haalContext('kane', admin, NU))

    // Assert — afkappen mag, stil afkappen niet: het model moet weten dat de zin
    // niet zo eindigde.
    expect(blok).toContain('… (ingekort)')
  })

  it('vouwt regeleindes op tot één promptregel', async () => {
    // Arrange — een journal met harde returns erin.
    const admin = nepAdmin({
      'notities:journal': { data: [{ datum: VANDAAG, tekst: 'Ging goed.\n\nStress laag.' }] },
    })

    // Act
    const blok = schrijfContextBlok(await haalContext('kane', admin, NU))

    // Assert — één regel; anders lijken losse zinnen op losse notities.
    expect(blok).toContain('- 2026-07-15 — Ging goed. Stress laag.')
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
