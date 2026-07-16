import { describe, it, expect } from 'vitest'
import {
  actieVan,
  berichtenVoorAnalyse,
  verzoekVoorActie,
  STANDAARD_AFSPRAAK_MINUTEN,
  type ActieSuggestie,
} from './suggestie-actie'
import type { Suggestie } from '@/lib/lifeos/inbox/analyse'
import type { TriageMailJson } from '@/lib/lifeos/inbox/inbox'

/** Kleine builder zodat elke test alleen de velden zet die ertoe doen. */
function suggestie(over: Partial<Suggestie>): Suggestie {
  return {
    externId: 'm1',
    soort: 'taak',
    titel: 'Iets doen',
    wanneer: null,
    vertrouwen: 0.9,
    ...over,
  }
}

describe('actieVan — welke suggestie wordt een knop', () => {
  it('een taak met titel wordt een taak-actie', () => {
    const actie = actieVan(suggestie({ soort: 'taak', titel: 'Offerte sturen' }))
    expect(actie).toEqual<ActieSuggestie>({ externId: 'm1', soort: 'taak', titel: 'Offerte sturen' })
  })

  it('een agenda met tijd wordt een agenda-actie, met dat startmoment', () => {
    const actie = actieVan(
      suggestie({ soort: 'agenda', titel: 'Overleg', wanneer: '2026-07-18T09:00:00+02:00' }),
    )
    expect(actie).toEqual<ActieSuggestie>({
      externId: 'm1',
      soort: 'agenda',
      titel: 'Overleg',
      wanneer: '2026-07-18T09:00:00+02:00',
    })
  })

  it('een agenda ZONDER tijd geeft geen knop — die kan niet in de kalender', () => {
    expect(actieVan(suggestie({ soort: 'agenda', titel: 'Overleg', wanneer: null }))).toBeNull()
  })

  it("soort 'geen' geeft nooit een knop", () => {
    expect(actieVan(suggestie({ soort: 'geen', titel: null }))).toBeNull()
  })

  it('een actie zonder titel geeft geen knop — de UI kan niets aanmaken', () => {
    expect(actieVan(suggestie({ soort: 'taak', titel: null }))).toBeNull()
  })

  it('null (nog geen suggestie) geeft geen knop', () => {
    expect(actieVan(null)).toBeNull()
  })
})

describe('berichtenVoorAnalyse — GEEN nieuwe Gmail-call, alleen wat de client al had', () => {
  const mail = (over: Partial<TriageMailJson>): TriageMailJson => ({
    id: 'g1',
    afzender: 'Jan',
    onderwerp: 'Hoi',
    ontvangenOp: '2026-07-15T10:00:00+02:00',
    reden: 'Je stond in de aan.',
    ...over,
  })

  it('neemt uitsluitend id, afzender en onderwerp mee', () => {
    const berichten = berichtenVoorAnalyse([mail({})])
    expect(berichten).toEqual([{ extern_id: 'g1', afzender: 'Jan', onderwerp: 'Hoi' }])
    // Nadrukkelijk NIET: reden, ontvangenOp, body of ontvangers.
    expect(Object.keys(berichten[0] ?? {})).toEqual(['extern_id', 'afzender', 'onderwerp'])
  })

  it('behoudt null-afzender en null-onderwerp zoals ze zijn', () => {
    const berichten = berichtenVoorAnalyse([mail({ id: 'g2', afzender: null, onderwerp: null })])
    expect(berichten).toEqual([{ extern_id: 'g2', afzender: null, onderwerp: null }])
  })

  it('houdt volgorde en aantal aan', () => {
    const berichten = berichtenVoorAnalyse([mail({ id: 'a' }), mail({ id: 'b' })])
    expect(berichten.map((b) => b.extern_id)).toEqual(['a', 'b'])
  })
})

describe('verzoekVoorActie — waarheen POST de klik', () => {
  it('een taak gaat naar /api/lifeos/taken met alleen een titel (geen datum → "ooit")', () => {
    const verzoek = verzoekVoorActie({ externId: 'm1', soort: 'taak', titel: 'Offerte sturen' })
    expect(verzoek).toEqual({ pad: '/api/lifeos/taken', body: { titel: 'Offerte sturen' } })
  })

  it('een afspraak gaat naar /api/lifeos/agenda/events met titel, startOp en een standaard eindOp', () => {
    const startOp = '2026-07-18T09:00:00+02:00'
    const verzoek = verzoekVoorActie({ externId: 'm2', soort: 'agenda', titel: 'Overleg', wanneer: startOp })

    expect(verzoek.pad).toBe('/api/lifeos/agenda/events')
    expect(verzoek.body.titel).toBe('Overleg')
    expect(verzoek.body.startOp).toBe(startOp)
    // eindOp = start + de standaardduur (die route eist een eindtijd).
    const verwachtEind = new Date(
      new Date(startOp).getTime() + STANDAARD_AFSPRAAK_MINUTEN * 60_000,
    ).toISOString()
    expect(verzoek.body.eindOp).toBe(verwachtEind)
  })

  it('laat eindOp weg als het startmoment geen geldige datum is (route weigert het dan eerlijk)', () => {
    const verzoek = verzoekVoorActie({
      externId: 'm3',
      soort: 'agenda',
      titel: 'Kapot',
      wanneer: 'geen-datum',
    })
    expect(verzoek.body).toEqual({ titel: 'Kapot', startOp: 'geen-datum' })
    expect('eindOp' in verzoek.body).toBe(false)
  })
})
