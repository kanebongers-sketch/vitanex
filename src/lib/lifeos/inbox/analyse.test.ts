import { describe, it, expect } from 'vitest'
import {
  analyseerMail,
  analyseerMails,
  suggestieVanIntentie,
  leesAnalyseVerzoek,
  naarSuggestieJson,
  leesSuggesties,
  MAX_ANALYSE,
  type MailKenmerk,
  type Suggestie,
} from './analyse'
import type { Intentie, IntentieModel } from '@/lib/lifeos/intentie/intentie'

const NU = new Date('2026-07-15T10:00:00+02:00')

/**
 * Een nep-model: het krijgt het (samengestelde) bericht en geeft terug wat de
 * test wil — géén netwerk. Zo test je onderwerp → verwachte suggestie.
 */
function nepModel(antwoord: unknown): IntentieModel {
  return { classificeer: async () => antwoord }
}

/** Kleine builder zodat elke test alleen de velden zet die ertoe doen. */
function intentie(over: Partial<Intentie>): Intentie {
  return {
    soort: 'taak',
    titel: 'Iets doen',
    wanneer: null,
    duurMinuten: null,
    persoon: null,
    project: null,
    categorie: 'onbekend',
    vertrouwen: 0.9,
    toelichting: '',
    rauweTekst: '',
    ...over,
  }
}

describe('suggestieVanIntentie — pure mapping, geen model', () => {
  it('een taak-intentie wordt een taak-suggestie', () => {
    const s = suggestieVanIntentie(intentie({ soort: 'taak', titel: 'Offerte sturen' }), 'm1')
    expect(s).toEqual<Suggestie>({
      externId: 'm1',
      soort: 'taak',
      titel: 'Offerte sturen',
      wanneer: null,
      vertrouwen: 0.9,
    })
  })

  it('herinnering en follow_up worden ook een taak', () => {
    expect(suggestieVanIntentie(intentie({ soort: 'herinnering' }), 'm').soort).toBe('taak')
    expect(suggestieVanIntentie(intentie({ soort: 'follow_up' }), 'm').soort).toBe('taak')
  })

  it('een agenda-intentie MET tijd wordt een agenda-suggestie', () => {
    const s = suggestieVanIntentie(
      intentie({ soort: 'agenda', titel: 'Overleg', wanneer: '2026-07-18T09:00:00+02:00' }),
      'm2',
    )
    expect(s.soort).toBe('agenda')
    expect(s.wanneer).toBe('2026-07-18T09:00:00+02:00')
  })

  it('een agenda-intentie ZONDER tijd valt veilig terug op een taak', () => {
    const s = suggestieVanIntentie(intentie({ soort: 'agenda', wanneer: null }), 'm3')
    expect(s.soort).toBe('taak')
    expect(s.wanneer).toBeNull()
  })

  it('notitie en idee leveren geen actie op — dat is geen post om te bewaren', () => {
    expect(suggestieVanIntentie(intentie({ soort: 'notitie' }), 'm').soort).toBe('geen')
    expect(suggestieVanIntentie(intentie({ soort: 'idee' }), 'm').soort).toBe('geen')
  })

  it('twijfel (laag vertrouwen) wordt geen, ongeacht de soort', () => {
    const s = suggestieVanIntentie(intentie({ soort: 'taak', vertrouwen: 0.3 }), 'm')
    expect(s.soort).toBe('geen')
    expect(s.titel).toBeNull()
  })

  it('onduidelijk wordt geen, ook bij hoog vertrouwen', () => {
    expect(suggestieVanIntentie(intentie({ soort: 'onduidelijk', vertrouwen: 0.99 }), 'm').soort).toBe(
      'geen',
    )
  })
})

describe('analyseerMail — onderwerp → suggestie met een nep-model', () => {
  it('haalt een taak uit een verzoek in het onderwerp', async () => {
    const model = nepModel(
      intentie({ soort: 'taak', titel: 'Offerte sturen', wanneer: '2026-07-17T09:00:00+02:00', vertrouwen: 0.9 }),
    )
    const s = await analyseerMail(
      { externId: 'g1', afzender: 'Jan de Vries', onderwerp: 'Kun je vrijdag de offerte sturen?' },
      model,
      NU,
    )
    expect(s.soort).toBe('taak')
    expect(s.titel).toBe('Offerte sturen')
    expect(s.wanneer).toBe('2026-07-17T09:00:00+02:00')
  })

  it('een nieuwsbrief-onderwerp levert GEEN actie op', async () => {
    // Het model classificeert een nieuwsbrief-onderwerp als notitie/onduidelijk;
    // de mapping maakt daar 'geen' van, dus er verschijnt geen knop.
    const model = nepModel(
      intentie({ soort: 'notitie', titel: 'Nieuwsbrief juli', categorie: 'onbekend', vertrouwen: 0.8 }),
    )
    const s = await analyseerMail(
      { externId: 'g2', afzender: 'Acme Weekly', onderwerp: '🚀 10 tips voor je productiviteit deze week' },
      model,
      NU,
    )
    expect(s.soort).toBe('geen')
    expect(s.titel).toBeNull()
  })

  it('geen onderwerp = geen suggestie, en het model wordt niet eens gebeld', async () => {
    let geroepen = false
    const model: IntentieModel = {
      classificeer: async () => {
        geroepen = true
        return intentie({})
      },
    }
    const s = await analyseerMail({ externId: 'g3', afzender: 'Iemand', onderwerp: null }, model, NU)
    expect(s.soort).toBe('geen')
    expect(geroepen).toBe(false)
  })

  it('een modelstoring wordt geen verkeerde actie, maar geen', async () => {
    const kapot: IntentieModel = {
      classificeer: async () => {
        throw new Error('timeout')
      },
    }
    const s = await analyseerMail({ externId: 'g4', afzender: 'X', onderwerp: 'Doe iets' }, kapot, NU)
    expect(s.soort).toBe('geen')
  })

  it('koppelt de suggestie aan het juiste externId', async () => {
    const model = nepModel(intentie({ soort: 'taak', titel: 'Bellen' }))
    const s = await analyseerMail({ externId: 'gmail-abc', afzender: null, onderwerp: 'Bel me even' }, model, NU)
    expect(s.externId).toBe('gmail-abc')
  })
})

describe('analyseerMails — een batch', () => {
  it('geeft een suggestie per mail terug, op volgorde', async () => {
    const model = nepModel(intentie({ soort: 'taak', titel: 'Doen' }))
    const mails: MailKenmerk[] = [
      { externId: 'a', afzender: null, onderwerp: 'Doe A' },
      { externId: 'b', afzender: null, onderwerp: 'Doe B' },
    ]
    const suggesties = await analyseerMails(mails, model, NU)
    expect(suggesties.map((s) => s.externId)).toEqual(['a', 'b'])
    expect(suggesties.every((s) => s.soort === 'taak')).toBe(true)
  })
})

describe('leesAnalyseVerzoek — systeemgrens van het verzoek', () => {
  it('leest een geldig verzoek', () => {
    const r = leesAnalyseVerzoek({
      berichten: [{ extern_id: 'x', afzender: 'Jan', onderwerp: 'Hoi' }],
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.berichten[0]).toEqual({ externId: 'x', afzender: 'Jan', onderwerp: 'Hoi' })
    }
  })

  it('accepteert null afzender en onderwerp', () => {
    const r = leesAnalyseVerzoek({ berichten: [{ extern_id: 'x', afzender: null, onderwerp: null }] })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.berichten[0]).toEqual({ externId: 'x', afzender: null, onderwerp: null })
  })

  it('weigert een verzoek zonder berichten-array', () => {
    expect(leesAnalyseVerzoek({}).ok).toBe(false)
    expect(leesAnalyseVerzoek(null).ok).toBe(false)
    expect(leesAnalyseVerzoek({ berichten: 'nee' }).ok).toBe(false)
  })

  it('weigert een bericht zonder extern_id', () => {
    const r = leesAnalyseVerzoek({ berichten: [{ afzender: 'Jan', onderwerp: 'Hoi' }] })
    expect(r.ok).toBe(false)
  })

  it('weigert meer dan het maximum', () => {
    const teveel = Array.from({ length: MAX_ANALYSE + 1 }, (_, i) => ({ extern_id: String(i) }))
    expect(leesAnalyseVerzoek({ berichten: teveel }).ok).toBe(false)
  })

  it('een leeg lijstje is geldig (niets te analyseren)', () => {
    const r = leesAnalyseVerzoek({ berichten: [] })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.berichten).toEqual([])
  })
})

describe('naarSuggestieJson / leesSuggesties — heen en weer over de draad', () => {
  it('serialiseert naar snake_case extern_id', () => {
    const json = naarSuggestieJson({
      externId: 'x',
      soort: 'taak',
      titel: 'Doen',
      wanneer: null,
      vertrouwen: 0.8,
    })
    expect(json).toEqual({ extern_id: 'x', soort: 'taak', titel: 'Doen', wanneer: null, vertrouwen: 0.8 })
  })

  it('leest een geldig antwoord terug', () => {
    const gelezen = leesSuggesties({
      suggesties: [{ extern_id: 'x', soort: 'agenda', titel: 'Overleg', wanneer: '2026-07-18T09:00:00+02:00', vertrouwen: 0.9 }],
    })
    expect(gelezen).toEqual<Suggestie[]>([
      { externId: 'x', soort: 'agenda', titel: 'Overleg', wanneer: '2026-07-18T09:00:00+02:00', vertrouwen: 0.9 },
    ])
  })

  it('geeft null als de vorm niet klopt', () => {
    expect(leesSuggesties(null)).toBeNull()
    expect(leesSuggesties({ suggesties: 'nee' })).toBeNull()
  })

  it('laat een kapot item vallen zonder de hele batch te verwerpen', () => {
    const gelezen = leesSuggesties({
      suggesties: [
        { extern_id: 'ok', soort: 'taak', titel: 'Doen', wanneer: null, vertrouwen: 0.7 },
        { soort: 'taak', titel: 'Geen id' }, // kapot: mist extern_id
        { extern_id: 'geen-titel', soort: 'taak', titel: null, wanneer: null, vertrouwen: 0.9 }, // actie zonder titel
      ],
    })
    expect(gelezen?.map((s) => s.externId)).toEqual(['ok'])
  })

  it('klemt vertrouwen buiten bereik naar 0-1', () => {
    const gelezen = leesSuggesties({
      suggesties: [{ extern_id: 'x', soort: 'geen', titel: null, wanneer: null, vertrouwen: 5 }],
    })
    expect(gelezen?.[0]?.vertrouwen).toBe(1)
  })
})
