import { describe, it, expect } from 'vitest'
import { leesTelegramBericht, spraakTeLang, MAX_SPRAAK_SECONDEN } from './update'
import { bepaalActie, antwoordTekst, leesMoment } from './antwoord'
import type { Intentie } from '@/lib/lifeos/intentie/intentie'

function intentie(over: Partial<Intentie>): Intentie {
  return {
    soort: 'taak', titel: 'Iets doen', wanneer: null, duurMinuten: null, persoon: null,
    project: null, categorie: 'onbekend', vertrouwen: 0.9, toelichting: '', rauweTekst: '',
    ...over,
  }
}

describe('leesTelegramBericht', () => {
  it('leest een tekstbericht met chat-id', () => {
    const b = leesTelegramBericht({ message: { chat: { id: 42 }, text: 'plan iets' } })
    expect(b?.soort).toBe('tekst')
    expect(b?.chatId).toBe(42)
    expect(b?.tekst).toBe('plan iets')
  })

  it('geeft een spraakmemo voorrang en pakt het file_id', () => {
    const b = leesTelegramBericht({
      message: { chat: { id: 7 }, voice: { file_id: 'AbC', duration: 12 }, text: 'onderschrift' },
    })
    expect(b?.soort).toBe('spraak')
    expect(b?.voiceFileId).toBe('AbC')
    expect(b?.voiceSeconden).toBe(12)
  })

  it('markeert onbekende types als genegeerd (we willen wél kunnen antwoorden)', () => {
    const b = leesTelegramBericht({ message: { chat: { id: 1 }, sticker: {} } })
    expect(b?.soort).toBe('genegeerd')
    expect(b?.chatId).toBe(1)
  })

  it('geeft null als er geen bruikbaar bericht in de update zit', () => {
    expect(leesTelegramBericht({ edited_message: {} })).toBeNull()
    expect(leesTelegramBericht(null)).toBeNull()
    expect(leesTelegramBericht({ message: { text: 'geen chat' } })).toBeNull()
  })

  it('herkent een te lange spraakmemo', () => {
    const kort = leesTelegramBericht({ message: { chat: { id: 1 }, voice: { file_id: 'x', duration: 30 } } })!
    const lang = leesTelegramBericht({ message: { chat: { id: 1 }, voice: { file_id: 'x', duration: MAX_SPRAAK_SECONDEN + 1 } } })!
    expect(spraakTeLang(kort)).toBe(false)
    expect(spraakTeLang(lang)).toBe(true)
  })
})

describe('bepaalActie', () => {
  it('agenda mét tijd → afspraak, zónder tijd → taak', () => {
    expect(bepaalActie(intentie({ soort: 'agenda', wanneer: '2026-07-20T09:00:00+02:00' }))).toBe('maak_agenda')
    expect(bepaalActie(intentie({ soort: 'agenda', wanneer: null }))).toBe('maak_taak')
  })

  it('taak/herinnering/follow_up → taak', () => {
    expect(bepaalActie(intentie({ soort: 'taak' }))).toBe('maak_taak')
    expect(bepaalActie(intentie({ soort: 'herinnering' }))).toBe('maak_taak')
    expect(bepaalActie(intentie({ soort: 'follow_up' }))).toBe('maak_taak')
  })

  it('notitie/idee → notitie', () => {
    expect(bepaalActie(intentie({ soort: 'notitie' }))).toBe('maak_notitie')
    expect(bepaalActie(intentie({ soort: 'idee', categorie: 'Ideeën' }))).toBe('maak_notitie')
  })

  it('vraagt terug bij onduidelijk of laag vertrouwen — geen automatische actie', () => {
    expect(bepaalActie(intentie({ soort: 'onduidelijk' }))).toBe('vraag_bevestiging')
    expect(bepaalActie(intentie({ soort: 'agenda', wanneer: '2026-07-20T09:00:00+02:00', vertrouwen: 0.2 }))).toBe('vraag_bevestiging')
  })
})

describe('antwoordTekst', () => {
  it('bevestigt een afspraak met het moment erin', () => {
    const i = intentie({ soort: 'agenda', titel: 'Overleg marketing', wanneer: '2026-07-20T09:00:00+02:00' })
    const t = antwoordTekst(i, 'maak_agenda')
    expect(t).toContain('Overleg marketing')
    expect(t).toMatch(/09:00/)
  })

  it('zegt eerlijk als het opslaan mislukte — bevestigt niet wat niet gebeurde', () => {
    const t = antwoordTekst(intentie({ titel: 'Ruben bellen' }), 'maak_taak', false)
    expect(t).toContain('lukte niet')
  })

  it('vraagt terug zonder iets te beweren te hebben gedaan', () => {
    const t = antwoordTekst(intentie({ soort: 'onduidelijk', titel: 'eh' }), 'vraag_bevestiging')
    expect(t).toContain('niet zeker')
  })

  it('zet de categorie bij een notitie', () => {
    const t = antwoordTekst(intentie({ soort: 'idee', titel: 'Gamification', categorie: 'Ideeën' }), 'maak_notitie')
    expect(t).toContain('[Ideeën]')
  })
})

describe('leesMoment', () => {
  it('maakt een leesbaar NL-moment van een ISO-string', () => {
    expect(leesMoment('2026-07-20T09:00:00+02:00')).toMatch(/09:00/)
  })
  it('geeft null bij geen of onzin-tijd', () => {
    expect(leesMoment(null)).toBeNull()
    expect(leesMoment('geen datum')).toBeNull()
  })
})
