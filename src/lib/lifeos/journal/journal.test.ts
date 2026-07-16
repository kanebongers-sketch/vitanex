import { describe, it, expect } from 'vitest'
import {
  vorigeDagSleutel,
  leesJournalOpslaan,
  leesJournalDagAntwoord,
  leesJournalAntwoord,
  opslagLabel,
  moetOpslaan,
  gisterenTekst,
  RUSTIG,
  MAX_TEKST_LENGTE,
} from './journal'

const JOURNAL_JSON = {
  id: 'j-1',
  tekst: 'Goede dag. Training zwaar, hoofd rustig.',
  soort: 'journal',
  datum: '2026-07-16',
  aangemaaktOp: '2026-07-16T21:00:00.000Z',
  bijgewerktOp: '2026-07-16T21:04:00.000Z',
}

describe('vorigeDagSleutel', () => {
  it('gaat één dag terug', () => {
    // Arrange/Act/Assert
    expect(vorigeDagSleutel('2026-07-16')).toBe('2026-07-15')
  })

  it('gaat over een maandgrens heen', () => {
    expect(vorigeDagSleutel('2026-07-01')).toBe('2026-06-30')
    expect(vorigeDagSleutel('2026-03-01')).toBe('2026-02-28')
  })

  it('gaat over een jaargrens heen', () => {
    expect(vorigeDagSleutel('2026-01-01')).toBe('2025-12-31')
  })

  it('gaat over een schrikkeldag heen', () => {
    expect(vorigeDagSleutel('2028-03-01')).toBe('2028-02-29')
  })

  it('overleeft de zomertijd-sprong', () => {
    // Arrange — 29 maart 2026 gaat de zomertijd in (NL): die dag duurt 23 uur.
    // "min 86.400.000 ms" zou je dan 23:00 van 28 maart geven, of zelfs dezelfde
    // dag terug. setDate is kalender-bewust.
    const uitkomst = vorigeDagSleutel('2026-03-29')

    // Assert
    expect(uitkomst).toBe('2026-03-28')
  })

  it('geeft null op onzin i.p.v. een Invalid Date door te geven', () => {
    expect(vorigeDagSleutel('gisteren')).toBeNull()
    expect(vorigeDagSleutel('2026-02-31')).toBeNull()
    expect(vorigeDagSleutel('')).toBeNull()
  })
})

describe('leesJournalOpslaan', () => {
  it('leest een reflectie', () => {
    // Arrange
    const body = { tekst: '  Wat schuurde: te veel meetings.  ', datum: '2026-07-16' }

    // Act
    const uitkomst = leesJournalOpslaan(body)

    // Assert
    expect(uitkomst).toEqual({
      ok: true,
      waarde: { tekst: 'Wat schuurde: te veel meetings.', datum: '2026-07-16' },
    })
  })

  it('accepteert lege tekst: dat is "wissen", geen fout', () => {
    // Arrange — auto-save vuurt ook als je je hele reflectie weghaalt. Een 400
    // zou de indicator op "mislukt" zetten terwijl er niets mis is.
    const uitkomst = leesJournalOpslaan({ tekst: '', datum: '2026-07-16' })

    // Assert
    expect(uitkomst).toEqual({ ok: true, waarde: { tekst: '', datum: '2026-07-16' } })
  })

  it('behandelt tekst met alleen spaties óók als wissen', () => {
    const uitkomst = leesJournalOpslaan({ tekst: '   \n  ', datum: '2026-07-16' })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.tekst).toBe('')
  })

  it('weigert tekst boven de limiet', () => {
    const uitkomst = leesJournalOpslaan({
      tekst: 'a'.repeat(MAX_TEKST_LENGTE + 1),
      datum: '2026-07-16',
    })

    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een ontbrekende of ongeldige datum', () => {
    expect(leesJournalOpslaan({ tekst: 'Iets' }).ok).toBe(false)
    expect(leesJournalOpslaan({ tekst: 'Iets', datum: '16-07-2026' }).ok).toBe(false)
  })

  it('weigert een ontbrekende tekst — dat is iets anders dan lege tekst', () => {
    // Assert — `{ datum }` zonder tekst is een kapot request; `{ tekst: '' }` is
    // een bewuste actie. Die twee mogen niet op één hoop.
    expect(leesJournalOpslaan({ datum: '2026-07-16' }).ok).toBe(false)
    expect(leesJournalOpslaan({ tekst: null, datum: '2026-07-16' }).ok).toBe(false)
  })

  it('weigert onzin als body', () => {
    expect(leesJournalOpslaan(null).ok).toBe(false)
    expect(leesJournalOpslaan([]).ok).toBe(false)
    expect(leesJournalOpslaan('tekst').ok).toBe(false)
  })
})

describe('leesJournalDagAntwoord', () => {
  it('leest een dag mét journal', () => {
    // Act
    const dag = leesJournalDagAntwoord({ journal: JOURNAL_JSON, gisterenGeschreven: true })

    // Assert
    expect(dag?.journal?.tekst).toBe('Goede dag. Training zwaar, hoofd rustig.')
    expect(dag?.gisterenGeschreven).toBe(true)
  })

  it('leest een dag zónder journal — dat is geldig, niet fout', () => {
    // Act
    const dag = leesJournalDagAntwoord({ journal: null, gisterenGeschreven: false })

    // Assert — "je schreef nog niets vandaag" is een dag, geen storing.
    expect(dag).toEqual({ journal: null, gisterenGeschreven: false })
  })

  it('faalt op een journal-object dat er wél is maar niet klopt', () => {
    // Arrange — null is geldig; half is fout. Die twee mogen niet op één hoop.
    const ruw = { journal: { id: 'j-1' }, gisterenGeschreven: false }

    // Act + Assert
    expect(leesJournalDagAntwoord(ruw)).toBeNull()
  })

  it('faalt als een notitie van de verkeerde soort als journal binnenkomt', () => {
    const ruw = {
      journal: { ...JOURNAL_JSON, soort: 'brain_dump' },
      gisterenGeschreven: false,
    }

    expect(leesJournalDagAntwoord(ruw)).toBeNull()
  })

  it('faalt als gisterenGeschreven ontbreekt of geen boolean is', () => {
    expect(leesJournalDagAntwoord({ journal: null })).toBeNull()
    expect(leesJournalDagAntwoord({ journal: null, gisterenGeschreven: 'nee' })).toBeNull()
    expect(leesJournalDagAntwoord(null)).toBeNull()
  })
})

describe('leesJournalAntwoord', () => {
  it('leest een opgeslagen journal', () => {
    expect(leesJournalAntwoord({ journal: JOURNAL_JSON })?.journal?.id).toBe('j-1')
  })

  it('leest een gewiste journal', () => {
    expect(leesJournalAntwoord({ journal: null })).toEqual({ journal: null })
  })

  it('faalt als het veld ontbreekt — dat is iets anders dan null', () => {
    expect(leesJournalAntwoord({})).toBeNull()
    expect(leesJournalAntwoord({ journal: { id: 'j-1' } })).toBeNull()
  })
})

describe('opslagLabel', () => {
  it('zwijgt als er niets te melden valt', () => {
    // Assert — geen indicator bij rust: een permanent bordje "opgeslagen" is
    // ruis die je na een dag niet meer leest.
    expect(opslagLabel(RUSTIG)).toBeNull()
  })

  it('meldt dat er iets openstaat terwijl de debounce loopt', () => {
    expect(opslagLabel({ fase: 'wacht' })).toBe('Nog niet opgeslagen')
  })

  it('meldt dat hij bezig is', () => {
    expect(opslagLabel({ fase: 'bezig' })).toBe('Opslaan…')
  })

  it('zet het tijdstip erbij — de klok komt erín, niet uit een Date.now()', () => {
    // Arrange — 16 juli 2026, 21:04 lokale tijd.
    const op = new Date(2026, 6, 16, 21, 4).getTime()

    // Act
    const label = opslagLabel({ fase: 'opgeslagen', op })

    // Assert
    expect(label).toBe('Opgeslagen om 21:04')
  })

  it('geeft null bij mislukt — dat rendert als echte foutmelding, niet als grijs regeltje', () => {
    // Assert — een journal die stil niet opslaat is erger dan geen journal. De
    // component toont hier `Foutmelding` met een weg terug.
    expect(opslagLabel({ fase: 'mislukt', bericht: 'Geen verbinding.' })).toBeNull()
  })
})

describe('moetOpslaan', () => {
  it('slaat op als de tekst echt anders is', () => {
    expect(moetOpslaan('Nieuwe tekst', 'Oude tekst')).toBe(true)
    expect(moetOpslaan('Iets', '')).toBe(true)
  })

  it('slaat niet op als er niets veranderde', () => {
    expect(moetOpslaan('Zelfde tekst', 'Zelfde tekst')).toBe(false)
    expect(moetOpslaan('', '')).toBe(false)
  })

  it('negeert spaties aan de randen — de server trimt die toch weg', () => {
    // Assert — zonder dit slaat elke spatiebalk-aanslag opnieuw op.
    expect(moetOpslaan('Zelfde tekst   ', 'Zelfde tekst')).toBe(false)
    expect(moetOpslaan('  ', '')).toBe(false)
  })
})

describe('gisterenTekst', () => {
  it('zegt het als je gisteren schreef', () => {
    expect(gisterenTekst(true)).toBe('Gisteren schreef je ook.')
  })

  it('maakt van een gemiste dag geen verwijt — en dus ook geen streak', () => {
    // Assert — zonder "geeft niet" leest dit als een verwijt, en dan heb je
    // alsnog een streak gebouwd, alleen zonder het cijfer erbij.
    expect(gisterenTekst(false)).toBe('Gisteren schreef je niet. Geeft niet.')
  })

  it('noemt nooit een aantal dagen — er is geen teller', () => {
    // Assert — een structurele check, geen smaak: zodra hier een getal in staat,
    // is de verliesangst terug.
    expect(gisterenTekst(true)).not.toMatch(/\d/)
    expect(gisterenTekst(false)).not.toMatch(/\d/)
  })
})
