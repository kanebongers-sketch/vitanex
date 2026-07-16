import { describe, it, expect } from 'vitest'
import {
  leesIntentie,
  vraagtOmBevestiging,
  bouwSysteemPrompt,
  bepaalIntentie,
  type IntentieModel,
  type Intentie,
} from './intentie'

const NU = new Date('2026-07-15T10:00:00+02:00')

/** Een nep-model dat teruggeeft wat de test wil — geen netwerk. */
function nepModel(antwoord: unknown): IntentieModel {
  return { classificeer: async () => antwoord }
}

describe('leesIntentie — narrowing op de modelgrens', () => {
  it('leest een volledige agenda-intentie', () => {
    const raw = {
      soort: 'agenda', titel: 'Overleg marketing', wanneer: '2026-07-20T09:00:00+02:00',
      duurMinuten: 60, persoon: 'Jan', project: null, categorie: 'Werk',
      vertrouwen: 0.9, toelichting: 'Bericht noemt maandag 9:00 een overleg.',
    }
    const i = leesIntentie(raw, 'plan maandag 9u overleg met Jan over marketing')
    expect(i?.soort).toBe('agenda')
    expect(i?.wanneer).toBe('2026-07-20T09:00:00+02:00')
    expect(i?.persoon).toBe('Jan')
    expect(i?.vertrouwen).toBe(0.9)
  })

  it('valt een onbekende soort terug op onduidelijk, geen crash', () => {
    const i = leesIntentie({ soort: 'raket', titel: 'iets', categorie: 'x', vertrouwen: 1 }, 'x')
    expect(i?.soort).toBe('onduidelijk')
    expect(i?.categorie).toBe('onbekend')
  })

  it('verzint geen datum: een lege wanneer blijft null', () => {
    const i = leesIntentie({ soort: 'taak', titel: 'Ruben bellen', wanneer: null, vertrouwen: 0.8, categorie: 'onbekend' }, 'bel ruben')
    expect(i?.wanneer).toBeNull()
  })

  it('geeft null als er niet eens een titel is — dan moet de app terugvragen', () => {
    expect(leesIntentie({ soort: 'taak', titel: '   ' }, 'x')).toBeNull()
    expect(leesIntentie(null, 'x')).toBeNull()
  })

  it('klemt vertrouwen op 0-1 en maakt onzin 0', () => {
    expect(leesIntentie({ titel: 'a', vertrouwen: 5 }, 'x')?.vertrouwen).toBe(1)
    expect(leesIntentie({ titel: 'a', vertrouwen: -2 }, 'x')?.vertrouwen).toBe(0)
    expect(leesIntentie({ titel: 'a', vertrouwen: 'hoog' }, 'x')?.vertrouwen).toBe(0)
  })
})

describe('vraagtOmBevestiging', () => {
  const basis: Intentie = {
    soort: 'taak', titel: 'x', wanneer: null, duurMinuten: null, persoon: null,
    project: null, categorie: 'onbekend', vertrouwen: 0.9, toelichting: '', rauweTekst: 'x',
  }

  it('handelt vanzelf bij hoog vertrouwen en een duidelijke soort', () => {
    expect(vraagtOmBevestiging(basis)).toBe(false)
  })

  it('vraagt terug bij onduidelijk, ongeacht vertrouwen', () => {
    expect(vraagtOmBevestiging({ ...basis, soort: 'onduidelijk', vertrouwen: 0.99 })).toBe(true)
  })

  it('vraagt terug bij laag vertrouwen', () => {
    expect(vraagtOmBevestiging({ ...basis, vertrouwen: 0.3 })).toBe(true)
  })
})

describe('bouwSysteemPrompt', () => {
  it('zet de huidige tijd erin zodat "vrijdag" een echte datum kan worden', () => {
    const prompt = bouwSysteemPrompt(NU)
    expect(prompt).toContain('2026')
    expect(prompt).toContain('Verzin NOOIT een datum')
  })
})

describe('bepaalIntentie — end-to-end met een nep-model', () => {
  it('routeert een spraakmemo naar een taak', async () => {
    const model = nepModel({
      soort: 'herinnering', titel: 'Ruben bellen', wanneer: '2026-07-17T09:00:00+02:00',
      vertrouwen: 0.85, categorie: 'onbekend', toelichting: 'vrijdag ruben bellen',
    })
    const i = await bepaalIntentie('herinner me vrijdag ruben te bellen', model, NU)
    expect(i.soort).toBe('herinnering')
    expect(i.titel).toBe('Ruben bellen')
  })

  it('maakt van een modelstoring geen verkeerde actie, maar onduidelijk', async () => {
    const kapot: IntentieModel = {
      classificeer: async () => {
        throw new Error('timeout')
      },
    }
    const i = await bepaalIntentie('plan iets', kapot, NU)
    expect(i.soort).toBe('onduidelijk')
    expect(i.vertrouwen).toBe(0)
  })

  it('behandelt een leeg bericht als onduidelijk zonder het model te bellen', async () => {
    let geroepen = false
    const model: IntentieModel = {
      classificeer: async () => {
        geroepen = true
        return {}
      },
    }
    const i = await bepaalIntentie('   ', model, NU)
    expect(i.soort).toBe('onduidelijk')
    expect(geroepen).toBe(false)
  })
})
