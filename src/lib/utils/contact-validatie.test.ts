import { describe, expect, test } from 'vitest'
import { valideerContactPayload } from './contact-validatie'

const geldigePayload = {
  onderwerp: 'demo',
  naam: '  Kane Bongers  ',
  email: ' kane@voorbeeld.nl ',
  organisatie: 'Vitaal',
  teamgrootte: '10-50',
  bericht: 'Ik wil graag een demo.',
}

describe('valideerContactPayload', () => {
  test('accepteert een geldige payload en trimt de velden', () => {
    // Arrange & Act
    const resultaat = valideerContactPayload(geldigePayload)

    // Assert
    expect(resultaat).toEqual({
      data: {
        onderwerp: 'demo',
        naam: 'Kane Bongers',
        email: 'kane@voorbeeld.nl',
        organisatie: 'Vitaal',
        teamgrootte: '10-50',
        bericht: 'Ik wil graag een demo.',
      },
    })
  })

  test('wijst een niet-object body af', () => {
    expect(valideerContactPayload(null)).toEqual({ fout: 'Ongeldige aanvraag.' })
    expect(valideerContactPayload('tekst')).toEqual({ fout: 'Ongeldige aanvraag.' })
    expect(valideerContactPayload(42)).toEqual({ fout: 'Ongeldige aanvraag.' })
  })

  test('vereist een naam (ook na trimmen)', () => {
    expect(valideerContactPayload({ ...geldigePayload, naam: '' })).toEqual({ fout: 'Vul je naam in.' })
    expect(valideerContactPayload({ ...geldigePayload, naam: '   ' })).toEqual({ fout: 'Vul je naam in.' })
    expect(valideerContactPayload({ ...geldigePayload, naam: 123 })).toEqual({ fout: 'Vul je naam in.' })
  })

  test('begrenst de naam op 120 tekens', () => {
    const resultaat = valideerContactPayload({ ...geldigePayload, naam: 'a'.repeat(121) })
    expect(resultaat).toEqual({ fout: 'De naam mag maximaal 120 tekens zijn.' })
  })

  test('wijst ongeldige e-mailadressen af', () => {
    const ongeldig = ['geen-apenstaart', 'a@b', 'a b@c.nl', '@zonder-naam.nl', `a@b.${'c'.repeat(260)}`]
    for (const email of ongeldig) {
      expect(valideerContactPayload({ ...geldigePayload, email })).toEqual({
        fout: 'Vul een geldig e-mailadres in.',
      })
    }
  })

  test('vereist een bericht en begrenst het op 5000 tekens', () => {
    expect(valideerContactPayload({ ...geldigePayload, bericht: '' })).toEqual({ fout: 'Vul een bericht in.' })
    expect(valideerContactPayload({ ...geldigePayload, bericht: 'a'.repeat(5001) })).toEqual({
      fout: 'Het bericht mag maximaal 5000 tekens zijn.',
    })
  })

  test('wijst te lange metadata-velden af als ongeldige aanvraag', () => {
    expect(valideerContactPayload({ ...geldigePayload, onderwerp: 'a'.repeat(41) })).toEqual({ fout: 'Ongeldige aanvraag.' })
    expect(valideerContactPayload({ ...geldigePayload, organisatie: 'a'.repeat(201) })).toEqual({ fout: 'Ongeldige aanvraag.' })
    expect(valideerContactPayload({ ...geldigePayload, teamgrootte: 'a'.repeat(41) })).toEqual({ fout: 'Ongeldige aanvraag.' })
  })

  test('behandelt ontbrekende optionele velden als lege strings', () => {
    const resultaat = valideerContactPayload({
      naam: 'Kane',
      email: 'kane@voorbeeld.nl',
      bericht: 'Hallo',
    })
    expect(resultaat).toEqual({
      data: { onderwerp: '', naam: 'Kane', email: 'kane@voorbeeld.nl', organisatie: '', teamgrootte: '', bericht: 'Hallo' },
    })
  })
})
