import { describe, expect, it } from 'vitest'
import { leesCsv, raadScheidingsteken } from './csv'
import { isVerplicht, ontbrekendeVelden, pasKoppelingToe, raadKoppeling } from './kolommen'
import { controleerRij, leesDatum, leesGeslacht, leesStatus, ruweRijUit, splitsNaam } from './rij'
import { maakPlan, type ImportRegel } from './plan'
import type { Lid } from '@/lib/club/kern/lid'

const VANDAAG = '2026-10-17'

describe('leesCsv', () => {
  it('leest een puntkomma-bestand met BOM, aanhalingstekens en Windows-regeleinden', () => {
    const tabel = leesCsv('﻿Voornaam;Achternaam;Notitie\r\nSanne;"de Vries";"zegt ""hoi""; ok"\r\n\r\nTom;Jansen;\r\n')
    expect(tabel.koppen).toEqual(['Voornaam', 'Achternaam', 'Notitie'])
    expect(tabel.rijen).toEqual([
      ['Sanne', 'de Vries', 'zegt "hoi"; ok'],
      ['Tom', 'Jansen', ''],
    ])
  })

  it('kiest komma of tab als die in de kopregel het meest voorkomen', () => {
    expect(raadScheidingsteken('a,b,c\n1;2,3')).toBe(',')
    expect(raadScheidingsteken('a\tb\tc')).toBe('\t')
    expect(raadScheidingsteken('"a;b",c,d')).toBe(',')
  })

  it('houdt een regeleinde binnen aanhalingstekens in het veld', () => {
    expect(leesCsv('a;b\n"regel1\nregel2";x').rijen).toEqual([['regel1\nregel2', 'x']])
  })

  it('vult korte rijen aan tot het aantal koppen en geeft leeg bij een leeg bestand', () => {
    expect(leesCsv('a;b;c\n1').rijen).toEqual([['1', '', '']])
    expect(leesCsv('')).toEqual({ koppen: [], rijen: [], regels: [], onafgesloten: false })
  })

  it('geeft per rij de echte regel in het bestand en meldt een open aanhalingsteken', () => {
    const tabel = leesCsv('a;b\n\n"x\ny";1\nz;2')
    expect(tabel.regels).toEqual([3, 5])
    expect(leesCsv('a;b\n"open;1\nz;2').onafgesloten).toBe(true)
  })

  it('leest een oud Excel-bestand (Windows-1252) met accenten goed', async () => {
    const { decodeerBestand } = await import('./csv')
    const bytes = new Uint8Array([0x52, 0x65, 0x6e, 0xe9, 0x65]).buffer
    expect(decodeerBestand(bytes)).toBe('Renée')
    expect(decodeerBestand(new TextEncoder().encode('Renée').buffer as ArrayBuffer)).toBe('Renée')
  })
})

describe('raadKoppeling', () => {
  it('herkent Nederlandse en Engelse kolomnamen', () => {
    const k = raadKoppeling(['Lidnr.', 'Roepnaam', 'Tussenvoegsel', 'Last name', 'E-mailadres', 'Mobiel', 'Geboortedatum', 'Startdatum', 'Abonnement'])
    expect(k.lidnummer).toBe(0)
    expect(k.voornaam).toBe(1)
    expect(k.tussenvoegsel).toBe(2)
    expect(k.achternaam).toBe(3)
    expect(k.email).toBe(4)
    expect(k.telefoon).toBe(5)
    expect(k.geboortedatum).toBe(6)
    expect(k.lidSinds).toBe(7)
    expect(k.abonnement).toBe(8)
    expect(k.status).toBeNull()
    expect(ontbrekendeVelden(k)).toEqual([])
  })

  it('meldt verplichte velden zonder kolom', () => {
    expect(ontbrekendeVelden(raadKoppeling(['Voornaam', 'Email']))).toEqual(['achternaam'])
  })

  it('zet een rij om naar velden en laat lege cellen weg', () => {
    const k = raadKoppeling(['Voornaam', 'Achternaam', 'Email'])
    expect(pasKoppelingToe([' Sanne ', 'Bakker', ''], k)).toEqual({ voornaam: 'Sanne', achternaam: 'Bakker' })
  })
})

describe('rij controleren', () => {
  it('leest datums in Nederlandse en ISO-vorm en weigert onzin', () => {
    expect(leesDatum('03-02-1990')).toBe('1990-02-03')
    expect(leesDatum('3/2/1990')).toBe('1990-02-03')
    expect(leesDatum('1990-02-03 00:00:00')).toBe('1990-02-03')
    expect(leesDatum('31-02-2020')).toBeNull()
    expect(leesDatum('morgen')).toBeNull()
    expect(leesDatum('01-01-1850')).toBeNull()
  })

  it('leest geslacht en status in gangbare vormen', () => {
    expect(leesGeslacht('M')).toBe('man')
    expect(leesGeslacht('Mevr.')).toBe('vrouw')
    expect(leesGeslacht('?')).toBeUndefined()
    expect(leesStatus('Beëindigd')).toBe('gestopt')
    expect(leesStatus('Bevroren')).toBe('gepauzeerd')
    expect(leesStatus('Active')).toBe('actief')
    expect(leesStatus('iets')).toBeUndefined()
  })

  it('maakt een lid met tussenvoegsel en waarschuwt bij foute velden', () => {
    const u = controleerRij({ voornaam: 'Sanne', tussenvoegsel: 'de', achternaam: 'Vries', email: 'geen-mail', geboortedatum: '99-99-1990', geslacht: 'V' }, VANDAAG)
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(u.lid.achternaam).toBe('de Vries')
    expect(u.lid.email).toBeNull()
    expect(u.lid.geboortedatum).toBeNull()
    expect(u.lid.geslacht).toBe('vrouw')
    expect(u.lid.status).toBe('actief')
    expect(u.lid.statusGegeven).toBe(false)
    expect(u.waarschuwingen).toHaveLength(2)
  })

  it('leidt de status af uit de einddatum als er geen status is', () => {
    const verleden = controleerRij({ voornaam: 'A', achternaam: 'B', einddatum: '01-01-2026' }, VANDAAG)
    const toekomst = controleerRij({ voornaam: 'A', achternaam: 'B', einddatum: '01-01-2027' }, VANDAAG)
    expect(verleden.ok && verleden.lid.status).toBe('gestopt')
    expect(toekomst.ok && toekomst.lid.status).toBe('opgezegd')
    expect(toekomst.ok && toekomst.lid.statusGegeven).toBe(true)
  })

  it('weigert een rij zonder naam', () => {
    expect(controleerRij({ voornaam: 'Sanne' }, VANDAAG).ok).toBe(false)
  })

  it('neemt van onbekende invoer alleen bekende tekstvelden over', () => {
    expect(ruweRijUit({ voornaam: 'A', achternaam: 5, coach_id: 'x', demo: true })).toEqual({ voornaam: 'A' })
    expect(ruweRijUit(['A'])).toBeNull()
    expect(ruweRijUit({ voornaam: 'x'.repeat(501) })).toEqual({})
  })
})

function bestaand(over: Partial<Lid>): Lid {
  return {
    id: 'id-1', vestiging: 'budel', lidnummer: null, sportivityId: null, voornaam: 'Sanne', achternaam: 'Bakker',
    email: null, telefoon: null, geboortedatum: null, geslacht: null, abonnement: null, status: 'actief',
    lidSinds: null, einddatum: null, tags: [], coachId: null, demo: false, ...over,
  }
}

function regel(n: number, rij: Parameters<typeof controleerRij>[0]): ImportRegel {
  const u = controleerRij(rij, VANDAAG)
  if (!u.ok) throw new Error(u.fout)
  return { regel: n, lid: u.lid }
}

describe('maakPlan', () => {
  it('herkent nieuw, bijwerken, gelijk en dubbel', () => {
    const leden = [
      bestaand({ id: 'a', email: 'sanne@x.nl', telefoon: '0612345678' }),
      bestaand({ id: 'b', voornaam: 'Tom', achternaam: 'Jansen', lidnummer: 'L7' }),
      bestaand({ id: 'c', voornaam: 'Oud', achternaam: 'Lid' }),
    ]
    const plan = maakPlan(
      [
        regel(2, { voornaam: 'Sanne', achternaam: 'Bakker', email: 'SANNE@x.nl', telefoon: '0687654321' }),
        regel(3, { voornaam: 'Tom', achternaam: 'Jansen', lidnummer: 'l7' }),
        regel(4, { voornaam: 'Nieuw', achternaam: 'Lid', email: 'nieuw@x.nl' }),
        regel(5, { voornaam: 'Nieuw', achternaam: 'Lid', email: 'nieuw@x.nl' }),
      ],
      leden,
      'budel',
    )
    expect(plan.rijen.map((r) => r.actie)).toEqual(['bijwerken', 'gelijk', 'nieuw', 'dubbel'])
    expect(plan.rijen[0].wijziging).toEqual({ telefoon: '0687654321' })
    expect(plan.telling).toEqual({ nieuw: 1, bijwerken: 1, gelijk: 1, dubbel: 1 })
    expect(plan.nietInBestand).toBe(1)
  })

  it('vindt een lid op Sportivity-ID in een andere vestiging en verhuist het', () => {
    const plan = maakPlan([regel(2, { voornaam: 'Sanne', achternaam: 'Bakker', sportivityId: 'S1' })], [bestaand({ id: 'a', vestiging: 'eersel', sportivityId: 'S1' })], 'budel')
    expect(plan.rijen[0]).toMatchObject({ actie: 'bijwerken', lidId: 'a', wijziging: { vestiging: 'budel' } })
  })

  it('laat demoleden en een bestaande status zonder statuskolom met rust', () => {
    const plan = maakPlan(
      [regel(2, { voornaam: 'Sanne', achternaam: 'Bakker', email: 's@x.nl' })],
      [bestaand({ id: 'demo', email: 's@x.nl', demo: true }), bestaand({ id: 'p', voornaam: 'Piet', achternaam: 'Pauze', status: 'gepauzeerd', lidnummer: 'P1' })],
      'budel',
    )
    expect(plan.rijen[0].actie).toBe('nieuw')
    const pauze = maakPlan([regel(2, { voornaam: 'Piet', achternaam: 'Pauze', lidnummer: 'P1' })], [bestaand({ id: 'p', voornaam: 'Piet', achternaam: 'Pauze', status: 'gepauzeerd', lidnummer: 'P1' })], 'budel')
    expect(pauze.rijen[0].actie).toBe('gelijk')
  })

  it('koppelt nooit aan iemand met een ander lidnummer, ook niet bij hetzelfde e-mailadres', () => {
    const leden = [bestaand({ id: 'ouder', email: 'gezin@x.nl', lidnummer: 'L1' })]
    const plan = maakPlan([regel(2, { voornaam: 'Kind', achternaam: 'Bakker', email: 'gezin@x.nl', lidnummer: 'L2' })], leden, 'budel')
    expect(plan.rijen[0].actie).toBe('nieuw')
  })

  it('koppelt niet op een e-mailadres dat meerdere leden delen', () => {
    const leden = [bestaand({ id: 'a', email: 'gezin@x.nl' }), bestaand({ id: 'b', voornaam: 'Tim', email: 'gezin@x.nl' })]
    expect(maakPlan([regel(2, { voornaam: 'Tim', achternaam: 'Bakker', email: 'gezin@x.nl' })], leden, 'budel').rijen[0].actie).toBe('nieuw')
  })

  it('voegt een nieuw lid toe zonder het Sportivity-ID van een demolid', () => {
    const plan = maakPlan([regel(2, { voornaam: 'Sanne', achternaam: 'Bakker', sportivityId: 'S9' })], [bestaand({ id: 'demo', sportivityId: 'S9', demo: true })], 'budel')
    expect(plan.rijen[0]).toMatchObject({ actie: 'nieuw', zonderSportivityId: true })
  })

  it('koppelt op naam alleen met geboortedatum', () => {
    const leden = [bestaand({ id: 'a', geboortedatum: '1990-02-03' })]
    expect(maakPlan([regel(2, { voornaam: 'sanne', achternaam: 'bakker', geboortedatum: '03-02-1990' })], leden, 'budel').rijen[0].lidId).toBe('a')
    expect(maakPlan([regel(2, { voornaam: 'Sanne', achternaam: 'Bakker', email: 'ander@x.nl' })], leden, 'budel').rijen[0].actie).toBe('nieuw')
    expect(maakPlan([regel(2, { voornaam: 'Sanne', achternaam: 'Bakker' })], leden, 'budel').rijen[0].lidId).toBe('a')
  })
})

describe('leesImportVerzoek', () => {
  it('controleert vestiging, regelnummers en elke rij', async () => {
    const { leesImportVerzoek } = await import('./verzoek')
    const goed = leesImportVerzoek(
      { vestiging: 'budel', opslaan: true, rijen: [{ regel: 2, voornaam: 'A', achternaam: 'B', demo: 'x' }, { regel: 3, voornaam: 'C' }] },
      VANDAAG,
    )
    expect(goed.ok).toBe(true)
    if (!goed.ok) return
    expect(goed.waarde.regels).toHaveLength(1)
    expect(goed.waarde.fouten).toEqual([{ regel: 3, fout: 'Voornaam of achternaam ontbreekt.' }])
    expect(leesImportVerzoek({ vestiging: 'Parijs!', rijen: [{ regel: 2 }] }, VANDAAG).ok).toBe(false)
    expect(leesImportVerzoek({ vestiging: 'budel', rijen: [] }, VANDAAG).ok).toBe(false)
    expect(leesImportVerzoek({ vestiging: 'budel', rijen: [{ regel: 2 }, { regel: 2 }] }, VANDAAG).ok).toBe(false)
    expect(leesImportVerzoek({ vestiging: 'budel', rijen: [{ regel: 1.5 }] }, VANDAAG).ok).toBe(false)
  })
})

describe('een kolom met de volledige naam (bijvoorbeeld een export met alleen Naam)', () => {
  it('herkent Naam en Full name, en maakt voornaam en achternaam dan niet verplicht', () => {
    const k = raadKoppeling(['Naam', 'E-mail', 'Member ID', 'Membership name'])
    expect(k.volledigeNaam).toBe(0)
    expect(k.lidnummer).toBe(2)
    expect(k.abonnement).toBe(3)
    expect(ontbrekendeVelden(k)).toEqual([])
    expect(isVerplicht('voornaam', k)).toBe(false)
    expect(raadKoppeling(['Full name']).volledigeNaam).toBe(0)
    expect(isVerplicht('voornaam', raadKoppeling(['Email']))).toBe(true)
  })

  it('laat aparte kolommen voor voornaam en achternaam voorgaan', () => {
    const k = raadKoppeling(['Voornaam', 'Achternaam', 'Naam'])
    expect([k.voornaam, k.achternaam, k.volledigeNaam]).toEqual([0, 1, 2])
  })

  it('splitst een naam, ook met tussenvoegsel of achternaam eerst', () => {
    expect(splitsNaam('Jan de Vries')).toEqual({ voornaam: 'Jan', achternaam: 'de Vries' })
    expect(splitsNaam('  Sanne   Bakker ')).toEqual({ voornaam: 'Sanne', achternaam: 'Bakker' })
    expect(splitsNaam('Vries, Jan de')).toEqual({ voornaam: 'Jan', achternaam: 'de Vries' })
    expect(splitsNaam('Cher')).toBeNull()
    expect(splitsNaam(', Jan')).toBeNull()
    expect(splitsNaam('')).toBeNull()
  })

  it('maakt van een rij met alleen de hele naam een lid, en weigert een naam van een woord', () => {
    const goed = controleerRij({ volledigeNaam: 'Lotte van Dijk', email: 'lotte@example.com' }, VANDAAG)
    expect(goed.ok && goed.lid).toMatchObject({ voornaam: 'Lotte', achternaam: 'van Dijk', email: 'lotte@example.com' })
    expect(controleerRij({ volledigeNaam: 'Lotte' }, VANDAAG)).toEqual({ ok: false, fout: 'Voornaam of achternaam ontbreekt.' })
  })

  it('vult alleen aan wat ontbreekt: met een voornaam is de rest de achternaam', () => {
    const rest = controleerRij({ voornaam: 'Jan', volledigeNaam: 'Jan de Vries' }, VANDAAG)
    expect(rest.ok && rest.lid).toMatchObject({ voornaam: 'Jan', achternaam: 'de Vries' })
    // Sommige systemen noemen de achternaam zelf "Naam".
    const alleenAchternaam = controleerRij({ voornaam: 'Jan', volledigeNaam: 'de Vries' }, VANDAAG)
    expect(alleenAchternaam.ok && alleenAchternaam.lid).toMatchObject({ voornaam: 'Jan', achternaam: 'de Vries' })
    const eigen = controleerRij({ voornaam: 'Jan', tussenvoegsel: 'de', achternaam: 'Vries', volledigeNaam: 'Iets Anders' }, VANDAAG)
    expect(eigen.ok && eigen.lid).toMatchObject({ voornaam: 'Jan', achternaam: 'de Vries' })
  })

  it('stuurt de hele naam ook mee van de pagina naar de server', () => {
    expect(ruweRijUit({ volledigeNaam: 'Jan de Vries', onbekend: 'x' })).toEqual({ volledigeNaam: 'Jan de Vries' })
  })
})
