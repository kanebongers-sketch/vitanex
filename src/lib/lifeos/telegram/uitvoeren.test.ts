import { describe, it, expect } from 'vitest'
import { voerUit, type AgendaInvoer, type UitvoerDeps } from './uitvoeren'
import type { NieuweTaak } from '@/lib/lifeos/taken/taken'
import type { NieuweNotitie } from '@/lib/lifeos/notities/notities'
import type { Intentie } from '@/lib/lifeos/intentie/intentie'

// ─── Opzet ──────────────────────────────────────────────────────────────────
// Een nep-opslag die onthoudt wat erin ging en een instelbare uitkomst geeft.
// Zo test `voerUit` volledig zonder database of netwerk — precies wat de zuivere,
// injecteerbare opzet mogelijk maakt.

interface NepOpslag extends UitvoerDeps {
  taken: { userId: string; nieuw: NieuweTaak }[]
  notities: { userId: string; nieuw: NieuweNotitie }[]
  agenda: { userId: string; invoer: AgendaInvoer }[]
}

function nepOpslag(lukt = true): NepOpslag {
  const taken: NepOpslag['taken'] = []
  const notities: NepOpslag['notities'] = []
  const agenda: NepOpslag['agenda'] = []
  return {
    taken,
    notities,
    agenda,
    async maakTaak(userId, nieuw) {
      taken.push({ userId, nieuw })
      return { ok: lukt }
    },
    async maakNotitie(userId, nieuw) {
      notities.push({ userId, nieuw })
      return { ok: lukt }
    },
    async maakAgenda(userId, invoer) {
      agenda.push({ userId, invoer })
      return { ok: lukt }
    },
  }
}

function intentie(over: Partial<Intentie>): Intentie {
  return {
    soort: 'taak', titel: 'Iets doen', wanneer: null, duurMinuten: null, persoon: null,
    project: null, categorie: 'onbekend', vertrouwen: 0.9, toelichting: '', rauweTekst: '',
    ...over,
  }
}

const USER = 'user-1'
// Een vast "nu" zodat de dag-standaard van een notitie deterministisch is.
const NU = new Date('2026-07-16T10:00:00+02:00')

describe('voerUit — maak_taak', () => {
  it('maakt een taak aan en meldt gelukt', async () => {
    const opslag = nepOpslag()
    const res = await voerUit(USER, intentie({ soort: 'taak', titel: 'Ruben bellen' }), 'maak_taak', opslag, NU)

    expect(res.gelukt).toBe(true)
    expect(opslag.taken).toHaveLength(1)
    expect(opslag.taken[0]?.userId).toBe(USER)
    expect(opslag.taken[0]?.nieuw.titel).toBe('Ruben bellen')
    // Vanuit Telegram nooit automatisch in de top-3, en zonder genoemde dag: 'ooit'.
    expect(opslag.taken[0]?.nieuw.top3Positie).toBeNull()
    expect(opslag.taken[0]?.nieuw.datum).toBeNull()
  })

  it('zet de genoemde dag op de taak', async () => {
    const opslag = nepOpslag()
    await voerUit(
      USER,
      intentie({ soort: 'herinnering', titel: 'Ruben bellen', wanneer: '2026-07-17T09:00:00+02:00' }),
      'maak_taak',
      opslag,
      NU,
    )
    expect(opslag.taken[0]?.nieuw.datum).toBe('2026-07-17')
  })

  it('meldt gelukt=false als de insert mislukt — bevestigt niets wat niet gebeurde', async () => {
    const opslag = nepOpslag(false)
    const res = await voerUit(USER, intentie({ soort: 'taak' }), 'maak_taak', opslag, NU)
    expect(res.gelukt).toBe(false)
  })
})

describe('voerUit — maak_notitie', () => {
  it('bewaart een brain dump met de volledige gesproken tekst', async () => {
    const opslag = nepOpslag()
    const res = await voerUit(
      USER,
      intentie({ soort: 'idee', titel: 'Gamification-idee', rauweTekst: 'idee voor MentaForce: streaks belonen' }),
      'maak_notitie',
      opslag,
      NU,
    )

    expect(res.gelukt).toBe(true)
    expect(opslag.notities).toHaveLength(1)
    expect(opslag.notities[0]?.nieuw.soort).toBe('brain_dump')
    // De hele gedachte, niet alleen de korte titel.
    expect(opslag.notities[0]?.nieuw.tekst).toBe('idee voor MentaForce: streaks belonen')
    // Geen genoemde dag → vandaag (uit NU).
    expect(opslag.notities[0]?.nieuw.datum).toBe('2026-07-16')
  })

  it('valt terug op de titel als er geen ruwe tekst is', async () => {
    const opslag = nepOpslag()
    await voerUit(USER, intentie({ soort: 'notitie', titel: 'Kort idee', rauweTekst: '' }), 'maak_notitie', opslag, NU)
    expect(opslag.notities[0]?.nieuw.tekst).toBe('Kort idee')
  })
})

describe('voerUit — maak_agenda', () => {
  it('maakt een afspraak met start, eind (standaard 60 min) en beschrijving', async () => {
    const opslag = nepOpslag()
    const res = await voerUit(
      USER,
      intentie({ soort: 'agenda', titel: 'Overleg', wanneer: '2026-07-20T09:00:00+02:00', persoon: 'Jan' }),
      'maak_agenda',
      opslag,
      NU,
    )

    expect(res.gelukt).toBe(true)
    expect(opslag.agenda).toHaveLength(1)
    const invoer = opslag.agenda[0]?.invoer
    expect(invoer?.startOp).toBe(new Date('2026-07-20T09:00:00+02:00').toISOString())
    expect(invoer?.eindOp).toBe(new Date('2026-07-20T10:00:00+02:00').toISOString())
    expect(invoer?.beschrijving).toBe('Met Jan.')
  })

  it('gebruikt de genoemde duur voor het einde', async () => {
    const opslag = nepOpslag()
    await voerUit(
      USER,
      intentie({ soort: 'agenda', titel: 'Sportles', wanneer: '2026-07-20T18:00:00+02:00', duurMinuten: 90 }),
      'maak_agenda',
      opslag,
      NU,
    )
    expect(opslag.agenda[0]?.invoer.eindOp).toBe(new Date('2026-07-20T19:30:00+02:00').toISOString())
  })

  it('maakt NIETS aan zonder geldige tijd — geen datum, geen afspraak', async () => {
    const opslag = nepOpslag()
    const res = await voerUit(USER, intentie({ soort: 'agenda', titel: 'Ooit iets', wanneer: null }), 'maak_agenda', opslag, NU)
    expect(res.gelukt).toBe(false)
    expect(opslag.agenda).toHaveLength(0)
  })
})

