import { describe, it, expect } from 'vitest'
import {
  bepaalSignalen,
  lokaleTijd,
  datumMinDagen,
  MAX_SIGNALEN,
  type SignaalInvoer,
  type HerstelDag,
  type AgendaEvent,
  type Taak,
} from './signalen'

// De testen hieronder bewaken één ding boven alles: dat "ik weet het niet"
// nooit stilletjes een signaal wordt. Een chief of staff die je aantikt over
// data die hij niet heeft, is erger dan geen chief of staff — die vertrouw je
// één keer te veel.
//
// Alle tijden staan met een expliciete offset (+02:00 = CEST in juli), zodat
// deze testen niet afhangen van de tijdzone van de machine die ze draait.

const VANDAAG = '2026-07-15'

/** Een moment op de lokale wandklok van VANDAAG. */
function om(tijd: string): Date {
  return new Date(`${VANDAAG}T${tijd}:00+02:00`)
}

function herstelDag(over: Partial<HerstelDag> = {}): HerstelDag {
  return { datum: VANDAAG, slaapMinuten: null, actieveMinuten: null, ...over }
}

function event(over: Partial<AgendaEvent> = {}): AgendaEvent {
  return {
    titel: 'Afspraak',
    startOp: om('10:00'),
    eindOp: om('11:00'),
    heleDag: false,
    ...over,
  }
}

function taak(over: Partial<Taak> = {}): Taak {
  return { titel: 'Taak', klaar: false, datum: VANDAAG, top3Positie: 1, ...over }
}

/** Lege invoer: de app draait, maar weet nog niets van je. */
function invoer(over: Partial<SignaalInvoer> = {}): SignaalInvoer {
  return { herstel: [], agendaVandaag: [], taken: [], nu: om('10:00'), ...over }
}

// ─── De kernregel ───────────────────────────────────────────────────────────

describe('geen data → geen signaal', () => {
  it('zegt niets tegen een gebruiker van wie niets gemeten is', () => {
    // Arrange — verse installatie: geen wearable, geen agenda, geen taken.
    const leeg = invoer()

    // Act
    const signalen = bepaalSignalen(leeg)

    // Assert — geen enkel signaal. Geen "0 uur geslapen", geen "je hebt niets
    // gepland", geen aanmoediging. Stilte is hier het eerlijke antwoord.
    expect(signalen).toEqual([])
  })

  it('verzint geen slaapsignaal als de slaap niet gemeten is', () => {
    // Arrange — de wearable synct wel, maar leverde géén slaapduur. Er ligt een
    // training klaar: alle ingrediënten behalve het cijfer zelf.
    const zonderSlaap = invoer({
      herstel: [herstelDag({ slaapMinuten: null })],
      agendaVandaag: [event({ titel: 'Training benen', startOp: om('18:00') })],
    })

    // Act
    const signalen = bepaalSignalen(zonderSlaap)

    // Assert — null is geen 0. Een ontbrekende meting mag nooit als "slecht
    // geslapen" gelezen worden.
    expect(signalen).toEqual([])
  })

  it('verzint geen slaapsignaal als er voor vannacht geen meting bestaat', () => {
    // Arrange — wel data, maar alleen van gisteren. Vannacht is onbekend.
    const alleenGisteren = invoer({
      herstel: [herstelDag({ datum: datumMinDagen(VANDAAG, 1), slaapMinuten: 300 })],
      agendaVandaag: [event({ titel: 'Training', startOp: om('18:00') })],
    })

    // Act + Assert — gisteren zegt niets over vannacht; niet doorschuiven.
    expect(bepaalSignalen(alleenGisteren)).toEqual([])
  })
})

// ─── Regel 1: afspraak binnen 45 minuten ────────────────────────────────────

describe('afspraak-nabij', () => {
  it('waarschuwt met de resterende tijd', () => {
    // Arrange
    const dagMetAfspraak = invoer({
      nu: om('09:30'),
      agendaVandaag: [event({ titel: 'Intake Jansen', startOp: om('10:00') })],
    })

    // Act
    const signalen = bepaalSignalen(dagMetAfspraak)

    // Assert
    expect(signalen).toHaveLength(1)
    expect(signalen[0]?.soort).toBe('afspraak-nabij')
    expect(signalen[0]?.tekst).toBe('Intake Jansen begint over 30 minuten.')
  })

  it('vervoegt één minuut enkelvoud', () => {
    // Arrange
    const bijnaNu = invoer({
      nu: om('09:59'),
      agendaVandaag: [event({ titel: 'Standup', startOp: om('10:00') })],
    })

    // Act + Assert — "over 1 minuten" is het soort detail dat een product goedkoop maakt.
    expect(bepaalSignalen(bijnaNu)[0]?.tekst).toBe('Standup begint over 1 minuut.')
  })

  it('vuurt op de rand van 45 minuten, maar niet daarbuiten', () => {
    // Arrange
    const opDeRand = invoer({
      nu: om('09:15'),
      agendaVandaag: [event({ startOp: om('10:00') })],
    })
    const netTeVroeg = invoer({
      nu: om('09:14'),
      agendaVandaag: [event({ startOp: om('10:00') })],
    })

    // Act + Assert
    expect(bepaalSignalen(opDeRand)).toHaveLength(1)
    expect(bepaalSignalen(netTeVroeg)).toEqual([])
  })

  it('negeert een afspraak die al begonnen is', () => {
    // Arrange — je zit er al in; aantikken heeft geen zin meer.
    const bezig = invoer({
      nu: om('10:01'),
      agendaVandaag: [event({ startOp: om('10:00') })],
    })

    // Act + Assert
    expect(bepaalSignalen(bezig)).toEqual([])
  })

  it('negeert hele-dag-events — die hebben geen begintijd om op af te tellen', () => {
    // Arrange
    const verjaardag = invoer({
      nu: om('09:30'),
      agendaVandaag: [event({ titel: 'Verjaardag', startOp: om('10:00'), heleDag: true })],
    })

    // Act + Assert
    expect(bepaalSignalen(verjaardag)).toEqual([])
  })

  it('kiest de eerstvolgende afspraak, niet zomaar de eerste in de lijst', () => {
    // Arrange — bewust in de verkeerde volgorde aangeleverd.
    const twee = invoer({
      nu: om('09:30'),
      agendaVandaag: [
        event({ titel: 'Later', startOp: om('10:10') }),
        event({ titel: 'Eerder', startOp: om('09:40') }),
      ],
    })

    // Act + Assert
    expect(bepaalSignalen(twee)[0]?.tekst).toBe('Eerder begint over 10 minuten.')
  })
})

// ─── Regel 2: korte slaap + training gepland ────────────────────────────────

describe('korte-slaap-training', () => {
  it('adviseert lichter trainen na een korte nacht', () => {
    // Arrange — 5u12 geslapen, training gepland.
    const korteNacht = invoer({
      nu: om('08:00'),
      herstel: [herstelDag({ slaapMinuten: 312 })],
      agendaVandaag: [event({ titel: 'Training benen', startOp: om('18:00') })],
    })

    // Act
    const signalen = bepaalSignalen(korteNacht)

    // Assert — het cijfer in de tekst is de échte meting, niet afgerond naar iets moois.
    expect(signalen).toHaveLength(1)
    expect(signalen[0]?.soort).toBe('korte-slaap-training')
    expect(signalen[0]?.tekst).toContain('5u12')
    expect(signalen[0]?.tekst).toContain('Training benen')
  })

  it('zwijgt bij zes uur slaap of meer', () => {
    // Arrange — precies op de drempel: 6u00 is geen korte nacht.
    const genoeg = invoer({
      herstel: [herstelDag({ slaapMinuten: 360 })],
      agendaVandaag: [event({ titel: 'Training', startOp: om('18:00') })],
    })

    // Act + Assert
    expect(bepaalSignalen(genoeg)).toEqual([])
  })

  it('zwijgt zonder training in de agenda', () => {
    // Arrange — kort geslapen, maar er is niets te verzetten.
    const geenTraining = invoer({
      herstel: [herstelDag({ slaapMinuten: 300 })],
      agendaVandaag: [event({ titel: 'Tandarts', startOp: om('14:00') })],
    })

    // Act + Assert — ongevraagd commentaar op je nacht is geen advies.
    expect(bepaalSignalen(geenTraining)).toEqual([])
  })

  it('herkent training aan de titel, ongeacht hoofdletters', () => {
    // Arrange
    const titels = ['Workout', 'GYM sessie', 'Hardlopen met Bram', 'CrossFit']

    // Act + Assert
    for (const titel of titels) {
      const dag = invoer({
        herstel: [herstelDag({ slaapMinuten: 300 })],
        agendaVandaag: [event({ titel, startOp: om('18:00') })],
      })
      expect(bepaalSignalen(dag)[0]?.soort).toBe('korte-slaap-training')
    }
  })

  it('claimt geen oorzakelijk verband dat LifeOS niet meet', () => {
    // Arrange
    const korteNacht = invoer({
      herstel: [herstelDag({ slaapMinuten: 300 })],
      agendaVandaag: [event({ titel: 'Training', startOp: om('18:00') })],
    })

    // Act
    const tekst = bepaalSignalen(korteNacht)[0]?.tekst ?? ''

    // Assert — advies mag; een bewering over een mechanisme dat nooit gemeten is niet.
    expect(tekst).not.toMatch(/veroorzaakt|zorgt ervoor|leidt tot|waardoor/i)
  })
})

// ─── Regel 3: volle dag zonder vrij blok ────────────────────────────────────

describe('volle-dag-training', () => {
  it('adviseert vanavond trainen bij een dichtgetimmerde dag', () => {
    // Arrange — 09:00–18:00 aaneengesloten vol.
    const volleDag = invoer({
      nu: om('08:00'),
      agendaVandaag: [
        event({ titel: 'A', startOp: om('09:00'), eindOp: om('12:00') }),
        event({ titel: 'B', startOp: om('12:00'), eindOp: om('15:00') }),
        event({ titel: 'C', startOp: om('15:00'), eindOp: om('18:00') }),
      ],
    })

    // Act
    const signalen = bepaalSignalen(volleDag)

    // Assert
    expect(signalen).toHaveLength(1)
    expect(signalen[0]?.soort).toBe('volle-dag-training')
    expect(signalen[0]?.tekst).toBe(
      'drie afspraken vandaag en geen vrij blok overdag. Zet je training op vanavond.',
    )
  })

  it('zwijgt als er een vrij blok van een uur overblijft', () => {
    // Arrange — drie afspraken, maar met ruimte ertussen.
    const ruimteGenoeg = invoer({
      nu: om('08:00'),
      agendaVandaag: [
        event({ startOp: om('09:00'), eindOp: om('10:00') }),
        event({ startOp: om('12:00'), eindOp: om('13:00') }),
        event({ startOp: om('15:00'), eindOp: om('16:00') }),
      ],
    })

    // Act + Assert
    expect(bepaalSignalen(ruimteGenoeg)).toEqual([])
  })

  it('zwijgt bij twee afspraken, hoe vol ze ook staan', () => {
    // Arrange
    const tweeAfspraken = invoer({
      nu: om('08:00'),
      agendaVandaag: [
        event({ startOp: om('09:00'), eindOp: om('14:00') }),
        event({ startOp: om('14:00'), eindOp: om('18:00') }),
      ],
    })

    // Act + Assert
    expect(bepaalSignalen(tweeAfspraken)).toEqual([])
  })

  it('gokt de duur van een afspraak zonder eindtijd niet', () => {
    // Arrange — drie afspraken; van één weten we de eindtijd niet. Als we die
    // zouden invullen met een aanname, zou de dag "vol" lijken op een verzinsel.
    const onbekendeDuur = invoer({
      nu: om('08:00'),
      agendaVandaag: [
        event({ startOp: om('09:00'), eindOp: om('12:00') }),
        event({ startOp: om('12:00'), eindOp: null }),
        event({ startOp: om('15:00'), eindOp: om('18:00') }),
      ],
    })

    // Act + Assert — het gat van 12:00–15:00 telt als vrij: twijfel levert
    // stilte op, geen advies.
    expect(bepaalSignalen(onbekendeDuur)).toEqual([])
  })
})

// ─── Regel 4: top-3-taak nog open ───────────────────────────────────────────

describe('top3-open', () => {
  it('herinnert na 16:00 aan een openstaande top-3-taak', () => {
    // Arrange
    const laatOpDeMiddag = invoer({
      nu: om('16:30'),
      taken: [taak({ titel: 'Offerte afronden' })],
    })

    // Act
    const signalen = bepaalSignalen(laatOpDeMiddag)

    // Assert
    expect(signalen).toHaveLength(1)
    expect(signalen[0]?.soort).toBe('top3-open')
    expect(signalen[0]?.tekst).toBe('Je top-3 heeft nog één taak open: Offerte afronden.')
  })

  it('zwijgt vóór 16:00 — de dag is dan nog niet op', () => {
    // Arrange
    const vroeg = invoer({ nu: om('15:59'), taken: [taak()] })

    // Act + Assert
    expect(bepaalSignalen(vroeg)).toEqual([])
  })

  it('noemt meerdere open taken op volgorde van de top-3', () => {
    // Arrange — bewust in de verkeerde volgorde aangeleverd.
    const twee = invoer({
      nu: om('17:00'),
      taken: [
        taak({ titel: 'Tweede', top3Positie: 2 }),
        taak({ titel: 'Eerste', top3Positie: 1 }),
      ],
    })

    // Act + Assert
    expect(bepaalSignalen(twee)[0]?.tekst).toBe('Nog twee van je top-3 open: Eerste, Tweede.')
  })

  it('negeert afgevinkte taken, taken buiten de top-3 en taken van een andere dag', () => {
    // Arrange
    const nietRelevant = invoer({
      nu: om('17:00'),
      taken: [
        taak({ titel: 'Klaar', klaar: true }),
        taak({ titel: 'Geen top-3', top3Positie: null }),
        taak({ titel: 'Gisteren', datum: datumMinDagen(VANDAAG, 1) }),
        taak({ titel: 'Zonder dag', datum: null }),
      ],
    })

    // Act + Assert
    expect(bepaalSignalen(nietRelevant)).toEqual([])
  })
})

// ─── Regel 5: geen beweging gelogd ──────────────────────────────────────────

describe('geen-beweging', () => {
  /** `dagen` dagen terug, elk met dezelfde gemeten waarde. */
  function bewegingsDagen(waardes: readonly (number | null)[]): HerstelDag[] {
    return waardes.map((actieveMinuten, i) =>
      herstelDag({ datum: datumMinDagen(VANDAAG, i + 1), actieveMinuten }),
    )
  }

  it('signaleert vijf dagen op rij een gemeten nul', () => {
    // Arrange
    const stil = invoer({ herstel: bewegingsDagen([0, 0, 0, 0, 0]) })

    // Act
    const signalen = bepaalSignalen(stil)

    // Assert — de tekst beschrijft het logboek, niet het lichaam.
    expect(signalen).toHaveLength(1)
    expect(signalen[0]?.soort).toBe('geen-beweging')
    expect(signalen[0]?.tekst).toBe(
      'De afgelopen vijf dagen staat er geen beweging gelogd.',
    )
  })

  it('zwijgt als ook maar één dag niet gemeten is', () => {
    // Arrange — vier gemeten nullen en één gat. Dat gat is geen nul.
    const eenGat = invoer({ herstel: bewegingsDagen([0, 0, null, 0, 0]) })

    // Act + Assert — dit is de hele regel: een wearable die niet synct mag
    // nooit als "niet bewogen" gelezen worden.
    expect(bepaalSignalen(eenGat)).toEqual([])
  })

  it('zwijgt als er helemaal geen bewegingsdata is', () => {
    // Arrange — wél slaapdata, geen bewegingsdata. Klassieke Samsung-situatie.
    const alleenSlaap = invoer({ herstel: bewegingsDagen([null, null, null, null, null]) })

    // Act + Assert
    expect(bepaalSignalen(alleenSlaap)).toEqual([])
  })

  it('zwijgt als er ontbrekende dagen zijn', () => {
    // Arrange — maar drie van de vijf dagen bestaan.
    const gaten = invoer({ herstel: bewegingsDagen([0, 0, 0]) })

    // Act + Assert
    expect(bepaalSignalen(gaten)).toEqual([])
  })

  it('zwijgt zodra er op één dag wél bewogen is', () => {
    // Arrange
    const eenWandeling = invoer({ herstel: bewegingsDagen([0, 0, 22, 0, 0]) })

    // Act + Assert
    expect(bepaalSignalen(eenWandeling)).toEqual([])
  })

  it('rekent vandaag niet mee — die dag is nog niet voorbij', () => {
    // Arrange — vijf stille dagen achter ons, plus een lopende dag met een nul.
    // Als vandaag mee zou tellen, zou de reeks één dag opschuiven.
    const metVandaag = invoer({
      nu: om('08:00'),
      herstel: [
        herstelDag({ datum: VANDAAG, actieveMinuten: 0 }),
        ...bewegingsDagen([0, 0, 0, 0, 0]),
      ],
    })
    const zonderGisteren = invoer({
      nu: om('08:00'),
      herstel: [
        herstelDag({ datum: VANDAAG, actieveMinuten: 0 }),
        ...bewegingsDagen([null, 0, 0, 0, 0]),
      ],
    })

    // Act + Assert — de vijf dagen vóór vandaag zijn wat telt.
    expect(bepaalSignalen(metVandaag)).toHaveLength(1)
    expect(bepaalSignalen(zonderGisteren)).toEqual([])
  })
})

// ─── Rangschikking ──────────────────────────────────────────────────────────

describe('rangschikking', () => {
  /** Een dag waarop alle vijf de regels tegelijk kunnen vuren. */
  function alarmDag(): SignaalInvoer {
    return {
      nu: om('17:30'),
      herstel: [
        herstelDag({ datum: VANDAAG, slaapMinuten: 300 }),
        herstelDag({ datum: datumMinDagen(VANDAAG, 1), actieveMinuten: 0 }),
        herstelDag({ datum: datumMinDagen(VANDAAG, 2), actieveMinuten: 0 }),
        herstelDag({ datum: datumMinDagen(VANDAAG, 3), actieveMinuten: 0 }),
        herstelDag({ datum: datumMinDagen(VANDAAG, 4), actieveMinuten: 0 }),
        herstelDag({ datum: datumMinDagen(VANDAAG, 5), actieveMinuten: 0 }),
      ],
      agendaVandaag: [
        event({ titel: 'Standup', startOp: om('18:00'), eindOp: om('18:30') }),
        event({ titel: 'A', startOp: om('09:00'), eindOp: om('13:00') }),
        event({ titel: 'Training', startOp: om('13:00'), eindOp: om('18:00') }),
      ],
      taken: [taak({ titel: 'Offerte' })],
    }
  }

  it('geeft nooit meer dan drie signalen terug', () => {
    // Arrange — alle vijf de regels vuren.
    const alles = alarmDag()

    // Act
    const signalen = bepaalSignalen(alles)

    // Assert — twintig signalen is ruis, en ruis is precies wat we vermijden.
    expect(signalen).toHaveLength(MAX_SIGNALEN)
  })

  it('zet het urgentste signaal bovenaan', () => {
    // Arrange
    const alles = alarmDag()

    // Act
    const soorten = bepaalSignalen(alles).map((s) => s.soort)

    // Assert — de afspraak over 30 minuten wint van "je sliep kort".
    expect(soorten).toEqual(['afspraak-nabij', 'korte-slaap-training', 'volle-dag-training'])
  })

  it('levert aflopende urgentie op', () => {
    // Arrange
    const alles = alarmDag()

    // Act
    const urgenties = bepaalSignalen(alles).map((s) => s.urgentie)

    // Assert
    expect(urgenties).toEqual([...urgenties].sort((a, b) => b - a))
  })
})

// ─── Tijd ───────────────────────────────────────────────────────────────────

describe('lokaleTijd', () => {
  it('leest een moment in Europe/Amsterdam, niet in UTC', () => {
    // Arrange — 14:00 UTC is in juli 16:00 in Amsterdam.
    const middag = new Date('2026-07-15T14:00:00Z')

    // Act
    const lokaal = lokaleTijd(middag)

    // Assert — op UTC zou de top-3-herinnering twee uur te vroeg aantikken.
    expect(lokaal.datum).toBe('2026-07-15')
    expect(lokaal.minutenVanDag).toBe(16 * 60)
  })

  it('rolt de datum om als het lokaal al morgen is', () => {
    // Arrange — 22:30 UTC = 00:30 de volgende dag in Amsterdam.
    const nacht = new Date('2026-07-15T22:30:00Z')

    // Act + Assert
    expect(lokaleTijd(nacht)).toEqual({ datum: '2026-07-16', minutenVanDag: 30 })
  })

  it('houdt rekening met wintertijd', () => {
    // Arrange — in januari is Amsterdam UTC+1, niet UTC+2.
    const winter = new Date('2026-01-15T14:00:00Z')

    // Act + Assert
    expect(lokaleTijd(winter).minutenVanDag).toBe(15 * 60)
  })
})

describe('datumMinDagen', () => {
  it('telt dagen terug', () => {
    expect(datumMinDagen('2026-07-15', 1)).toBe('2026-07-14')
    expect(datumMinDagen('2026-07-15', 5)).toBe('2026-07-10')
  })

  it('gaat correct over een maand- en jaargrens heen', () => {
    expect(datumMinDagen('2026-03-01', 1)).toBe('2026-02-28')
    expect(datumMinDagen('2026-01-01', 1)).toBe('2025-12-31')
  })

  it('struikelt niet over de zomertijd-omschakeling', () => {
    // Arrange/Act/Assert — 29 maart 2026 duurt lokaal 23 uur. Wie hier met
    // millisecondes op een lokale Date rekent, slaat een dag over.
    expect(datumMinDagen('2026-03-30', 1)).toBe('2026-03-29')
    expect(datumMinDagen('2026-03-30', 2)).toBe('2026-03-28')
  })
})
