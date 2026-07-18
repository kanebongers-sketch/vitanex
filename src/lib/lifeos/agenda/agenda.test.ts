// Tests voor de systeemgrens-narrowers van de agenda. Twee grenzen, twee regels:
//
//   - `afspraakVanRij` / `afsprakenVanRijen` lezen DB-rijen. Een kapotte rij wordt
//     OVERGESLAGEN (een kolomwijziging mag geen Invalid Date door de app lekken).
//   - `leesAgendaVandaag` leest ons eigen API-antwoord. Daar geldt het omgekeerde:
//     één kapot item = een kapot antwoord, want stil overslaan zou een afspraak
//     laten verdwijnen zonder dat iemand het merkt.
//
// Dat contrast is met opzet en wordt hier bewaakt. `leesAfspraakJson` en
// `leesVrijBlokJson` zijn module-privé; ze worden via `leesAgendaVandaag` getest.

import { describe, expect, it } from 'vitest'
import type { Afspraak, VrijBlok } from './vrije-blokken'
import {
  afspraakVanRij,
  afsprakenVanRijen,
  groepeerAfsprakenPerDag,
  leesAgendaDagen,
  leesAgendaVandaag,
  leesKalendersAntwoord,
  naarAfspraakJson,
  naarVrijBlokJson,
  vanAfspraakJson,
  type AfspraakJson,
} from './agenda'

// ─── Fabrieken ──────────────────────────────────────────────────────────────
// DB-rijen zijn snake_case (zoals Supabase ze levert); het API-antwoord is
// camelCase (zoals `naar*Json` het serialiseert). Een `undefined`-override
// simuleert een ontbrekend veld — precies wat de narrowers als "mist" behandelen.

function rij(overschrijf: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'evt-1',
    titel: 'Standup',
    start_op: '2026-07-20T09:00:00.000Z',
    eind_op: '2026-07-20T09:15:00.000Z',
    hele_dag: false,
    locatie: 'Kantoor',
    ...overschrijf,
  }
}

function afspraakJson(overschrijf: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'evt-1',
    titel: 'Standup',
    startOp: '2026-07-20T09:00:00.000Z',
    eindOp: '2026-07-20T09:15:00.000Z',
    heleDag: false,
    locatie: 'Kantoor',
    ...overschrijf,
  }
}

function vrijBlokJson(overschrijf: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    startOp: '2026-07-20T10:00:00.000Z',
    eindOp: '2026-07-20T11:00:00.000Z',
    minuten: 60,
    ...overschrijf,
  }
}

function agenda(overschrijf: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    gekoppeld: true,
    dag: '2026-07-20',
    laatsteSync: '2026-07-20T08:00:00.000Z',
    events: [afspraakJson()],
    volgende: afspraakJson(),
    vrijeBlokken: [vrijBlokJson()],
    ...overschrijf,
  }
}

describe('afspraakVanRij — systeemgrens: één DB-rij', () => {
  it('leest een geldige rij naar een afspraak met echte Date-objecten', () => {
    const a = afspraakVanRij(rij())

    expect(a).not.toBeNull()
    expect(a?.id).toBe('evt-1')
    expect(a?.titel).toBe('Standup')
    expect(a?.startOp).toEqual(new Date('2026-07-20T09:00:00.000Z'))
    expect(a?.eindOp).toEqual(new Date('2026-07-20T09:15:00.000Z'))
    expect(a?.heleDag).toBe(false)
    expect(a?.locatie).toBe('Kantoor')
  })

  it('weigert iets dat geen object is', () => {
    expect(afspraakVanRij(null)).toBeNull()
    expect(afspraakVanRij(undefined)).toBeNull()
    expect(afspraakVanRij('evt-1')).toBeNull()
    expect(afspraakVanRij(42)).toBeNull()
    // Een array is óók geen bruikbare rij — `isObject` sluit die expliciet uit.
    expect(afspraakVanRij([])).toBeNull()
  })

  it('weigert een rij zonder id', () => {
    expect(afspraakVanRij(rij({ id: undefined }))).toBeNull()
  })

  it('weigert een lege of enkel-witruimte id', () => {
    expect(afspraakVanRij(rij({ id: '' }))).toBeNull()
    expect(afspraakVanRij(rij({ id: '   ' }))).toBeNull()
  })

  it('weigert een rij zonder start_op', () => {
    expect(afspraakVanRij(rij({ start_op: undefined }))).toBeNull()
  })

  it('weigert een start_op die geen tekst is', () => {
    // `moment` eist een string; een getal is geen bruikbaar tijdstip.
    expect(afspraakVanRij(rij({ start_op: 1_753_000_000_000 }))).toBeNull()
  })

  it('weigert een onleesbare start_op-datum', () => {
    expect(afspraakVanRij(rij({ start_op: 'morgenvroeg' }))).toBeNull()
  })

  it('laat eindOp null bij een ontbrekende of kapotte eind_op — geen verzonnen duur', () => {
    expect(afspraakVanRij(rij({ eind_op: undefined }))?.eindOp).toBeNull()
    expect(afspraakVanRij(rij({ eind_op: 'kapot' }))?.eindOp).toBeNull()
  })

  it('leest titel en locatie als null wanneer ze leeg zijn', () => {
    const a = afspraakVanRij(rij({ titel: '   ', locatie: '' }))
    expect(a?.titel).toBeNull()
    expect(a?.locatie).toBeNull()
  })

  it('leest kleur uit de rij, en null wanneer die ontbreekt of leeg is', () => {
    expect(afspraakVanRij(rij({ kleur: '#f6bf26' }))?.kleur).toBe('#f6bf26')
    expect(afspraakVanRij(rij({ kleur: undefined }))?.kleur).toBeNull()
    expect(afspraakVanRij(rij({ kleur: '   ' }))?.kleur).toBeNull()
  })

  it('leest heleDag alleen bij een strikte true, niet bij een waarheids-achtige waarde', () => {
    expect(afspraakVanRij(rij({ hele_dag: true }))?.heleDag).toBe(true)
    expect(afspraakVanRij(rij({ hele_dag: 'true' }))?.heleDag).toBe(false)
    expect(afspraakVanRij(rij({ hele_dag: 1 }))?.heleDag).toBe(false)
    expect(afspraakVanRij(rij({ hele_dag: undefined }))?.heleDag).toBe(false)
  })
})

describe('afsprakenVanRijen — kapotte rijen worden overgeslagen', () => {
  it('houdt de goede rijen en laat de kapotte vallen', () => {
    const afspraken = afsprakenVanRijen([
      rij({ id: 'goed-1' }),
      rij({ id: undefined }), // kapot: geen id
      rij({ id: 'goed-2', start_op: 'onleesbaar' }), // kapot: geen geldige start
      rij({ id: 'goed-3' }),
    ])

    expect(afspraken.map((a) => a.id)).toEqual(['goed-1', 'goed-3'])
  })

  it('geeft een lege lijst bij een lege invoer', () => {
    expect(afsprakenVanRijen([])).toEqual([])
  })

  it('geeft een lege lijst als álles kapot is — geen fout, gewoon niets bruikbaars', () => {
    expect(afsprakenVanRijen([null, 'x', {}, rij({ id: '' })])).toEqual([])
  })
})

describe('leesAgendaVandaag — systeemgrens: ons eigen API-antwoord', () => {
  it('leest een geldig, volledig antwoord', () => {
    const gelezen = leesAgendaVandaag(agenda())

    expect(gelezen).not.toBeNull()
    if (gelezen === null || !gelezen.gekoppeld) throw new Error('verwacht gekoppeld')
    expect(gelezen.dag).toBe('2026-07-20')
    expect(gelezen.laatsteSync).toBe('2026-07-20T08:00:00.000Z')
    expect(gelezen.events).toHaveLength(1)
    expect(gelezen.events[0]?.id).toBe('evt-1')
    expect(gelezen.volgende?.id).toBe('evt-1')
    expect(gelezen.vrijeBlokken).toHaveLength(1)
    expect(gelezen.vrijeBlokken[0]?.minuten).toBe(60)
  })

  it('leest "niet gekoppeld" als eigen tak — ook zonder de overige velden', () => {
    expect(leesAgendaVandaag({ gekoppeld: false })).toEqual({ gekoppeld: false })
  })

  // Het scharnier uit de taak: alleen een strikte `false` is "niet gekoppeld".
  it('weigert een ontbrekende of niet-boolean gekoppeld — dat is géén "niet gekoppeld"', () => {
    // Ontbrekend: `=== false` is onwaar én `!== true` is waar → null.
    expect(leesAgendaVandaag({ dag: '2026-07-20' })).toBeNull()
    // Andere waarden dan de literal true/false vallen ook door de mand.
    expect(leesAgendaVandaag({ gekoppeld: 'false' })).toBeNull()
    expect(leesAgendaVandaag({ gekoppeld: 0 })).toBeNull()
    expect(leesAgendaVandaag({ gekoppeld: null })).toBeNull()
    expect(leesAgendaVandaag({ gekoppeld: 1 })).toBeNull()
  })

  it('weigert iets dat geen object is', () => {
    expect(leesAgendaVandaag(null)).toBeNull()
    expect(leesAgendaVandaag('gekoppeld')).toBeNull()
    expect(leesAgendaVandaag([])).toBeNull()
  })

  it('weigert een gekoppeld antwoord zonder geldige dagsleutel', () => {
    expect(leesAgendaVandaag(agenda({ dag: undefined }))).toBeNull()
    expect(leesAgendaVandaag(agenda({ dag: '   ' }))).toBeNull()
  })

  it('weigert een antwoord waarin events of vrijeBlokken geen array is', () => {
    expect(leesAgendaVandaag(agenda({ events: undefined }))).toBeNull()
    expect(leesAgendaVandaag(agenda({ events: 'geen-lijst' }))).toBeNull()
    expect(leesAgendaVandaag(agenda({ vrijeBlokken: undefined }))).toBeNull()
    expect(leesAgendaVandaag(agenda({ vrijeBlokken: {} }))).toBeNull()
  })

  it('verwerpt het hele antwoord bij één kapotte afspraak in events', () => {
    // Eén verdwenen afspraak zou niemand opvallen; daarom faalt het geheel.
    const gelezen = leesAgendaVandaag(
      agenda({ events: [afspraakJson(), afspraakJson({ id: undefined })] }),
    )
    expect(gelezen).toBeNull()
  })

  it('verwerpt het hele antwoord bij één kapot vrij blok', () => {
    // minuten moet een eindig getal zijn; NaN is dat niet.
    expect(leesAgendaVandaag(agenda({ vrijeBlokken: [vrijBlokJson({ minuten: Number.NaN })] }))).toBeNull()
    // Een blok zonder eindOp is onbruikbaar.
    expect(leesAgendaVandaag(agenda({ vrijeBlokken: [vrijBlokJson({ eindOp: undefined })] }))).toBeNull()
    // Ontbrekende minuten telt óók als kapot.
    expect(leesAgendaVandaag(agenda({ vrijeBlokken: [vrijBlokJson({ minuten: undefined })] }))).toBeNull()
  })

  it('leest volgende: null en een ontbrekende volgende allebei als null', () => {
    const metNull = leesAgendaVandaag(agenda({ volgende: null }))
    const zonder = leesAgendaVandaag(agenda({ volgende: undefined }))

    expect(metNull).not.toBeNull()
    expect(zonder).not.toBeNull()
    if (metNull?.gekoppeld) expect(metNull.volgende).toBeNull()
    if (zonder?.gekoppeld) expect(zonder.volgende).toBeNull()
  })

  it('leest een geldige volgende naar een afspraak', () => {
    const gelezen = leesAgendaVandaag(agenda({ volgende: afspraakJson({ id: 'nu-bezig' }) }))
    expect(gelezen).not.toBeNull()
    if (gelezen?.gekoppeld) expect(gelezen.volgende?.id).toBe('nu-bezig')
  })

  // Een AANWEZIGE maar kapotte `volgende` verwerpt nu het hele antwoord — zelfde
  // regel als events/vrijeBlokken. Een echt lopende afspraak die één veld mist,
  // hoort niet stil uit "volgende" te verdwijnen. (Dit was eerst afwijkend gedrag;
  // gecorrigeerd nadat de coverage-test het blootlegde.)
  it('verwerpt het antwoord als een aanwezige volgende kapot is', () => {
    const gelezen = leesAgendaVandaag(agenda({ volgende: { id: 'x' } })) // geen startOp
    expect(gelezen).toBeNull()
  })

  it('accepteert een ontbrekende volgende (geen eerstvolgende afspraak) als null', () => {
    const gelezen = leesAgendaVandaag(agenda({ volgende: null }))
    expect(gelezen).not.toBeNull()
    if (gelezen?.gekoppeld) expect(gelezen.volgende).toBeNull()
  })

  it('leest laatsteSync als null wanneer die ontbreekt of leeg is', () => {
    const gelezen = leesAgendaVandaag(agenda({ laatsteSync: undefined }))
    expect(gelezen).not.toBeNull()
    if (gelezen?.gekoppeld) expect(gelezen.laatsteSync).toBeNull()
  })

  it('accepteert een lege agenda: gekoppeld, maar niets in de lijsten', () => {
    const gelezen = leesAgendaVandaag(agenda({ events: [], vrijeBlokken: [], volgende: null }))
    expect(gelezen).not.toBeNull()
    if (gelezen?.gekoppeld) {
      expect(gelezen.events).toEqual([])
      expect(gelezen.vrijeBlokken).toEqual([])
      expect(gelezen.volgende).toBeNull()
    }
  })
})

describe('leesKalendersAntwoord — systeemgrens: de kalenderlijst', () => {
  function kalender(overschrijf: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: 'eigen@x.nl',
      naam: 'Mijn agenda',
      kleur: '#00E5FF',
      toegang: 'owner',
      primair: true,
      zichtbaar: true,
      ...overschrijf,
    }
  }

  it('leest een geldig antwoord met het schrijf-doel', () => {
    const gelezen = leesKalendersAntwoord({
      kalenders: [kalender(), kalender({ id: 'team@x.nl', naam: 'Team', primair: false, kleur: '#33b679' })],
      schrijfDoel: 'team@x.nl',
    })

    expect(gelezen).not.toBeNull()
    expect(gelezen?.kalenders).toHaveLength(2)
    expect(gelezen?.kalenders[0]).toEqual({
      id: 'eigen@x.nl',
      naam: 'Mijn agenda',
      kleur: '#00E5FF',
      toegang: 'owner',
      primair: true,
      zichtbaar: true,
    })
    expect(gelezen?.schrijfDoel).toBe('team@x.nl')
  })

  it('leest kleur en toegang als null/leeg wanneer ze ontbreken', () => {
    const gelezen = leesKalendersAntwoord({
      kalenders: [kalender({ kleur: undefined, toegang: undefined })],
    })
    expect(gelezen?.kalenders[0]?.kleur).toBeNull()
    expect(gelezen?.kalenders[0]?.toegang).toBe('')
  })

  it('leest zichtbaar als true tenzij expliciet false', () => {
    const aan = leesKalendersAntwoord({ kalenders: [kalender({ zichtbaar: undefined })] })
    const uit = leesKalendersAntwoord({ kalenders: [kalender({ zichtbaar: false })] })
    expect(aan?.kalenders[0]?.zichtbaar).toBe(true)
    expect(uit?.kalenders[0]?.zichtbaar).toBe(false)
  })

  it('leest een ontbrekende of leeg schrijfDoel als null (= primary)', () => {
    expect(leesKalendersAntwoord({ kalenders: [kalender()] })?.schrijfDoel).toBeNull()
    expect(leesKalendersAntwoord({ kalenders: [kalender()], schrijfDoel: '   ' })?.schrijfDoel).toBeNull()
  })

  it('leest primair alleen bij een strikte true', () => {
    const gelezen = leesKalendersAntwoord({ kalenders: [kalender({ primair: 'true' })] })
    expect(gelezen?.kalenders[0]?.primair).toBe(false)
  })

  it('weigert iets dat geen object is of geen kalenders-array heeft', () => {
    expect(leesKalendersAntwoord(null)).toBeNull()
    expect(leesKalendersAntwoord([])).toBeNull()
    expect(leesKalendersAntwoord({ kalenders: 'geen-lijst' })).toBeNull()
  })

  it('verwerpt het hele antwoord bij één kapotte agenda — geen stille verdwijning', () => {
    // Zelfde regel als leesAgendaVandaag: één kapot item = een kapot antwoord.
    expect(leesKalendersAntwoord({ kalenders: [kalender(), kalender({ id: undefined })] })).toBeNull()
    expect(leesKalendersAntwoord({ kalenders: [kalender({ naam: '   ' })] })).toBeNull()
  })

  it('accepteert een lege kalenderlijst', () => {
    expect(leesKalendersAntwoord({ kalenders: [] })).toEqual({ kalenders: [], schrijfDoel: null })
  })
})

describe('round-trips — serialiseren en terug', () => {
  it('naarAfspraakJson → vanAfspraakJson geeft dezelfde afspraak terug, inclusief kleur', () => {
    const a: Afspraak = {
      id: 'evt-1',
      titel: 'Standup',
      startOp: new Date('2026-07-20T09:00:00.000Z'),
      eindOp: new Date('2026-07-20T09:15:00.000Z'),
      heleDag: false,
      locatie: 'Kantoor',
      kleur: '#33b679',
    }

    const json = naarAfspraakJson(a)
    expect(json.kleur).toBe('#33b679')
    expect(vanAfspraakJson(json)).toEqual(a)
  })

  it('behoudt een null-eindOp en een null-kleur door de heen-en-terug-vertaling', () => {
    const a: Afspraak = {
      id: 'evt-2',
      titel: null,
      startOp: new Date('2026-07-20T12:00:00.000Z'),
      eindOp: null,
      heleDag: true,
      locatie: null,
      kleur: null,
    }

    const json = naarAfspraakJson(a)
    expect(json.eindOp).toBeNull()
    expect(json.kleur).toBeNull()
    expect(vanAfspraakJson(json)).toEqual(a)
  })

  it('naarVrijBlokJson zet Date-grenzen om naar ISO en houdt de minuten', () => {
    const blok: VrijBlok = {
      startOp: new Date('2026-07-20T10:00:00.000Z'),
      eindOp: new Date('2026-07-20T11:00:00.000Z'),
      minuten: 60,
    }

    expect(naarVrijBlokJson(blok)).toEqual({
      startOp: '2026-07-20T10:00:00.000Z',
      eindOp: '2026-07-20T11:00:00.000Z',
      minuten: 60,
    })
  })

  it('een DB-rij door afspraakVanRij en dan naarAfspraakJson normaliseert de tijden', () => {
    const a = afspraakVanRij(rij({ kleur: '#7986cb' }))
    expect(a).not.toBeNull()
    if (a === null) return
    expect(naarAfspraakJson(a)).toEqual({
      id: 'evt-1',
      titel: 'Standup',
      startOp: '2026-07-20T09:00:00.000Z',
      eindOp: '2026-07-20T09:15:00.000Z',
      heleDag: false,
      locatie: 'Kantoor',
      kleur: '#7986cb',
    })
  })
})

describe('groepeerAfsprakenPerDag — verdelen over dagkolommen', () => {
  // LOKALE constructor zoals rooster.test.ts: `groepeerAfsprakenPerDag` groepeert
  // op de lokale startdag, dus dit rondt tijdzone-neutraal naar dezelfde dag.
  function jsonAfspraak(id: string, jaar: number, maand: number, dag: number, uur: number): AfspraakJson {
    return {
      id,
      titel: id,
      startOp: new Date(jaar, maand - 1, dag, uur, 0, 0, 0).toISOString(),
      eindOp: new Date(jaar, maand - 1, dag, uur + 1, 0, 0, 0).toISOString(),
      heleDag: false,
      locatie: null,
    }
  }

  const sleutels = ['2026-07-20', '2026-07-21', '2026-07-22']

  it('geeft elke opgegeven dag een bucket — óók een dag zonder afspraken (lege lijst)', () => {
    const dagen = groepeerAfsprakenPerDag([], sleutels)
    expect(dagen.map((d) => d.dag)).toEqual(sleutels)
    for (const d of dagen) expect(d.afspraken).toEqual([])
  })

  it('plaatst elke afspraak op zijn lokale startdag', () => {
    const dagen = groepeerAfsprakenPerDag(
      [
        jsonAfspraak('maandag', 2026, 7, 20, 9),
        jsonAfspraak('dinsdag', 2026, 7, 21, 14),
        jsonAfspraak('woensdag', 2026, 7, 22, 8),
      ],
      sleutels,
    )
    expect(dagen[0]?.afspraken.map((a) => a.id)).toEqual(['maandag'])
    expect(dagen[1]?.afspraken.map((a) => a.id)).toEqual(['dinsdag'])
    expect(dagen[2]?.afspraken.map((a) => a.id)).toEqual(['woensdag'])
  })

  it('laat afspraken buiten het bereik vallen (bv. een event dat vóór het venster begon)', () => {
    const dagen = groepeerAfsprakenPerDag(
      [
        jsonAfspraak('gisteren', 2026, 7, 19, 23),
        jsonAfspraak('vandaag', 2026, 7, 20, 10),
        jsonAfspraak('overmorgen-plus', 2026, 7, 25, 10),
      ],
      sleutels,
    )
    expect(dagen.flatMap((d) => d.afspraken.map((a) => a.id))).toEqual(['vandaag'])
  })

  it('bewaart de invoervolgorde binnen één dag', () => {
    const dagen = groepeerAfsprakenPerDag(
      [
        jsonAfspraak('eerst', 2026, 7, 20, 9),
        jsonAfspraak('later', 2026, 7, 20, 15),
        jsonAfspraak('tussen', 2026, 7, 20, 12),
      ],
      sleutels,
    )
    expect(dagen[0]?.afspraken.map((a) => a.id)).toEqual(['eerst', 'later', 'tussen'])
  })

  it('slaat een afspraak met een onleesbare starttijd over, zonder te crashen', () => {
    const kapot: AfspraakJson = {
      id: 'kapot',
      titel: 'Kapot',
      startOp: 'geen-datum',
      eindOp: null,
      heleDag: false,
      locatie: null,
    }
    const dagen = groepeerAfsprakenPerDag([kapot, jsonAfspraak('goed', 2026, 7, 20, 9)], sleutels)
    expect(dagen.flatMap((d) => d.afspraken.map((a) => a.id))).toEqual(['goed'])
  })

  it('muteert de invoer niet', () => {
    const invoer = [jsonAfspraak('a', 2026, 7, 20, 9)]
    const kopie = invoer.map((a) => ({ ...a }))
    groepeerAfsprakenPerDag(invoer, sleutels)
    expect(invoer).toEqual(kopie)
  })
})

describe('leesAgendaDagen — systeemgrens: het /dagen-antwoord', () => {
  const geldigeDag = {
    dag: '2026-07-20',
    afspraken: [afspraakJson()],
  }

  it('leest een geldig, gekoppeld antwoord met meerdere dagen', () => {
    const gelezen = leesAgendaDagen({
      gekoppeld: true,
      laatsteSync: '2026-07-20T08:00:00.000Z',
      dagen: [geldigeDag, { dag: '2026-07-21', afspraken: [] }],
    })

    expect(gelezen).not.toBeNull()
    if (gelezen === null || !gelezen.gekoppeld) throw new Error('verwacht gekoppeld')
    expect(gelezen.laatsteSync).toBe('2026-07-20T08:00:00.000Z')
    expect(gelezen.dagen).toHaveLength(2)
    expect(gelezen.dagen[0]?.dag).toBe('2026-07-20')
    expect(gelezen.dagen[0]?.afspraken[0]?.id).toBe('evt-1')
    expect(gelezen.dagen[1]?.afspraken).toEqual([])
  })

  it('leest "niet gekoppeld" als eigen tak', () => {
    expect(leesAgendaDagen({ gekoppeld: false })).toEqual({ gekoppeld: false })
  })

  it('leest laatsteSync als null wanneer die ontbreekt', () => {
    const gelezen = leesAgendaDagen({ gekoppeld: true, dagen: [] })
    expect(gelezen).not.toBeNull()
    if (gelezen?.gekoppeld) expect(gelezen.laatsteSync).toBeNull()
  })

  it('weigert een ontbrekende of niet-boolean gekoppeld', () => {
    expect(leesAgendaDagen({ dagen: [] })).toBeNull()
    expect(leesAgendaDagen({ gekoppeld: 'true', dagen: [] })).toBeNull()
  })

  it('weigert een antwoord waarin dagen geen array is', () => {
    expect(leesAgendaDagen({ gekoppeld: true, dagen: undefined })).toBeNull()
    expect(leesAgendaDagen({ gekoppeld: true, dagen: 'geen-lijst' })).toBeNull()
  })

  it('weigert een dag zonder geldige sleutel of zonder afspraken-array', () => {
    expect(leesAgendaDagen({ gekoppeld: true, dagen: [{ dag: '   ', afspraken: [] }] })).toBeNull()
    expect(leesAgendaDagen({ gekoppeld: true, dagen: [{ dag: '2026-07-20' }] })).toBeNull()
  })

  it('verwerpt het hele antwoord bij één kapotte afspraak in een dag — geen stille verdwijning', () => {
    const gelezen = leesAgendaDagen({
      gekoppeld: true,
      dagen: [{ dag: '2026-07-20', afspraken: [afspraakJson(), afspraakJson({ id: undefined })] }],
    })
    expect(gelezen).toBeNull()
  })

  it('weigert iets dat geen object is', () => {
    expect(leesAgendaDagen(null)).toBeNull()
    expect(leesAgendaDagen([])).toBeNull()
    expect(leesAgendaDagen('gekoppeld')).toBeNull()
  })

  it('accepteert een lege dagen-lijst', () => {
    const gelezen = leesAgendaDagen({ gekoppeld: true, laatsteSync: null, dagen: [] })
    expect(gelezen).not.toBeNull()
    if (gelezen?.gekoppeld) expect(gelezen.dagen).toEqual([])
  })
})
