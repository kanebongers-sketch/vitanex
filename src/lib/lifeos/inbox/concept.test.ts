import { describe, it, expect } from 'vitest'
import {
  conceptSysteem,
  berichtVanMail,
  leesConceptVoorstel,
  leesConceptVerzoek,
  schrijfConcept,
  type ConceptModel,
} from './concept'

/** Nep-model: geeft terug wat je erin stopt. Geen netwerk, geen API-sleutel. */
function nepModel(antwoord: unknown): ConceptModel {
  return { schrijf: async () => antwoord }
}

function kapotModel(): ConceptModel {
  return {
    schrijf: async () => {
      throw new Error('model onbereikbaar')
    },
  }
}

describe('conceptSysteem', () => {
  it('zegt expliciet dat het model de mail niet gelezen heeft', () => {
    // Dit is de regel die het model ervan weerhoudt te doen alsof. Verdwijnt hij,
    // dan gaat het toezeggingen verzinnen op basis van een onderwerpregel.
    const systeem = conceptSysteem({ afzender: 'Jan', onderwerp: 'Offerte' })
    expect(systeem).toContain('NIET gezien')
    expect(systeem).toContain('Verzin niets')
  })

  it('ondertekent met de naam als die er is', () => {
    expect(conceptSysteem({ afzender: 'Jan', onderwerp: 'Offerte', mijnNaam: 'Kane' })).toContain(
      'Onderteken met: Kane',
    )
  })

  it('ondertekent niet zonder naam', () => {
    const systeem = conceptSysteem({ afzender: 'Jan', onderwerp: 'Offerte', mijnNaam: null })
    expect(systeem).toContain('zonder ondertekening')
  })
})

describe('berichtVanMail', () => {
  it('geeft afzender en onderwerp mee', () => {
    expect(berichtVanMail({ afzender: 'Jan de Vries', onderwerp: 'Offerte' })).toBe(
      'Afzender: Jan de Vries. Onderwerp: Offerte',
    )
  })

  it('laat de afzender weg als die er niet is', () => {
    expect(berichtVanMail({ afzender: null, onderwerp: 'Offerte' })).toBe('Onderwerp: Offerte')
  })
})

describe('leesConceptVoorstel', () => {
  it('leest een geldig antwoord', () => {
    expect(leesConceptVoorstel({ onderwerp: 'Re: Offerte', tekst: 'Hoi Jan,' })).toEqual({
      onderwerp: 'Re: Offerte',
      tekst: 'Hoi Jan,',
    })
  })

  it('weigert een antwoord zonder tekst — dat is geen concept', () => {
    expect(leesConceptVoorstel({ onderwerp: 'Re: Offerte', tekst: '   ' })).toBeNull()
    expect(leesConceptVoorstel({ onderwerp: 'Re: Offerte' })).toBeNull()
  })

  it('weigert een antwoord zonder onderwerp', () => {
    expect(leesConceptVoorstel({ tekst: 'Hoi Jan' })).toBeNull()
  })

  it('weigert een antwoord dat geen object is', () => {
    expect(leesConceptVoorstel(null)).toBeNull()
    expect(leesConceptVoorstel('Hoi Jan')).toBeNull()
    expect(leesConceptVoorstel([])).toBeNull()
  })
})

describe('schrijfConcept', () => {
  it('geeft het voorstel van het model terug', async () => {
    const model = nepModel({ onderwerp: 'Re: Offerte', tekst: 'Hoi Jan, ik kijk ernaar.' })
    await expect(schrijfConcept({ afzender: 'Jan', onderwerp: 'Offerte' }, model)).resolves.toEqual({
      onderwerp: 'Re: Offerte',
      tekst: 'Hoi Jan, ik kijk ernaar.',
    })
  })

  it('geeft null bij een modelstoring — geen leeg concept', async () => {
    // Een leeg concept in je Concepten is ruis die eruitziet als werk.
    await expect(schrijfConcept({ afzender: 'Jan', onderwerp: 'Offerte' }, kapotModel())).resolves.toBeNull()
  })

  it('geeft null bij een onbruikbaar antwoord', async () => {
    await expect(
      schrijfConcept({ afzender: 'Jan', onderwerp: 'Offerte' }, nepModel({ rommel: true })),
    ).resolves.toBeNull()
  })

  it('belt het model niet zonder onderwerp', async () => {
    let geroepen = false
    const model: ConceptModel = {
      schrijf: async () => {
        geroepen = true
        return { onderwerp: 'x', tekst: 'y' }
      },
    }
    await expect(schrijfConcept({ afzender: 'Jan', onderwerp: '   ' }, model)).resolves.toBeNull()
    expect(geroepen).toBe(false)
  })
})

describe('leesConceptVerzoek', () => {
  it('leest een geldig verzoek', () => {
    const uitkomst = leesConceptVerzoek({
      extern_id: 'msg-1',
      afzender: 'Jan',
      onderwerp: 'Offerte',
      thread_id: 'thread-1',
    })
    expect(uitkomst).toEqual({
      ok: true,
      externId: 'msg-1',
      mail: { afzender: 'Jan', onderwerp: 'Offerte' },
      threadId: 'thread-1',
    })
  })

  it('accepteert een mail zonder afzendernaam en zonder thread', () => {
    const uitkomst = leesConceptVerzoek({ extern_id: 'msg-1', onderwerp: 'Offerte' })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.mail.afzender).toBeNull()
    expect(uitkomst.threadId).toBeNull()
  })

  it('weigert een verzoek zonder extern_id', () => {
    expect(leesConceptVerzoek({ onderwerp: 'Offerte' }).ok).toBe(false)
  })

  it('weigert een mail zonder onderwerp', () => {
    // Zonder onderwerp is er niets om een antwoord op te baseren; dan is eerlijk
    // weigeren beter dan het model iets laten verzinnen.
    expect(leesConceptVerzoek({ extern_id: 'msg-1' })).toEqual({
      ok: false,
      fout: 'Deze mail heeft geen onderwerp om op te antwoorden.',
    })
  })

  it('weigert een body die geen object is', () => {
    expect(leesConceptVerzoek(null).ok).toBe(false)
    expect(leesConceptVerzoek('msg-1').ok).toBe(false)
  })
})
