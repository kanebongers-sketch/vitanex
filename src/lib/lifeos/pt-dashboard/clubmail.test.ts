import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { bouwClubmail, clubWeek } from './clubmail'

const lead = (id: string, over: Partial<Lead> = {}): Lead => ({
  id, naam: `Lead ${id}`, contact: '0612345678', club: 'bladel', bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null, opvolgdatum: null,
  opvolgtijd: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null, geenKlantReden: null, gesprokenOp: '2026-10-08', aangemaaktOp: '2026-10-08T10:00:00Z', ...over,
})
const klant = (id: string, over: Partial<PtKlant> = {}): PtKlant => ({
  id, naam: `Klant ${id}`, contact: null, duoPartner: null, club: 'bladel', abonnement: '1x', startdatum: '2026-10-07', status: 'actief',
  opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, referralGevraagdOp: null, ...over,
})

const VANDAAG = '2026-10-12' // maandag; de week is 5 t/m 11 oktober

describe('clubWeek', () => {
  const g = {
    team: [{ id: 'amey', naam: 'Amey' }, { id: 'joey', naam: 'Joey' }],
    leads: new Map([
      ['amey', [lead('1'), lead('2', { gesprokenOp: '2026-10-01' }), lead('3', { status: 'opvolgen', opvolgdatum: '2026-10-10' })]],
      ['joey', [lead('4', { gesprokenOp: '2026-10-12' })]],
    ]),
    klanten: new Map([
      ['amey', [klant('a'), klant('b', { status: 'gestopt', startdatum: '2026-05-01', opgezegdOp: '2026-10-09' })]],
      ['joey', [klant('c', { startdatum: '2026-09-01' })]],
    ]),
  }

  test('alleen de afgelopen 7 dagen (vandaag telt niet); wie niets had valt weg', () => {
    const w = clubWeek(g, VANDAAG)
    expect(w.rijen).toEqual([{ naam: 'Amey', nieuweLeads: 2, teLaat: 1, nieuweKlanten: 1, gestopt: 1 }])
    expect(w.totaal).toEqual({ nieuweLeads: 2, teLaat: 1, nieuweKlanten: 1, gestopt: 1 })
  })
})

describe('bouwClubmail', () => {
  test('aantallen en PT-namen, maar nooit namen of nummers van leads/klanten', () => {
    const w = { rijen: [{ naam: 'Amey', nieuweLeads: 2, teLaat: 1, nieuweKlanten: 1, gestopt: 0 }], totaal: { nieuweLeads: 2, teLaat: 1, nieuweKlanten: 1, gestopt: 0 } }
    const m = bouwClubmail('Linda', 'Bladel', w, 'https://fitfactorypt.nl/linda')
    expect(m.onderwerp).toBe('PT Bladel: 2 nieuwe leads, 1 nieuwe klant')
    expect(m.tekst).toContain('Amey: 2 leads, 1 te laat')
    expect(m.html).toContain('https://fitfactorypt.nl/linda')
    for (const geheim of ['Lead 1', 'Klant a', '0612345678']) {
      expect(m.tekst).not.toContain(geheim)
      expect(m.html).not.toContain(geheim)
    }
  })
  test('lege week: eerlijk melden', () => {
    const m = bouwClubmail('Linda', 'Bladel', { rijen: [], totaal: { nieuweLeads: 0, teLaat: 0, nieuweKlanten: 0, gestopt: 0 } }, 'https://x')
    expect(m.tekst).toContain('niets ingevuld')
  })
  test('html is ge-escaped', () => {
    const m = bouwClubmail('<b>x</b>', 'Bladel', { rijen: [], totaal: { nieuweLeads: 0, teLaat: 0, nieuweKlanten: 0, gestopt: 0 } }, 'https://x')
    expect(m.html).not.toContain('<b>x</b>')
  })
})
