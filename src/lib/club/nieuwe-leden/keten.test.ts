// De hele keten "nieuw lid van A tot Z" met een database in het geheugen:
// de sportschool maakt een aanmeldlink, iemand meldt zich aan (code per mail,
// wachtwoord), is meteen ingelogd, vult de intake in, en het team ziet de
// meldingen en de intake op de ledenkaart. Plus: snel toevoegen met
// uitnodiging, intrekken, eenmalige links, de rem en geen verraad van adressen.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDER = 'be000000-0000-4000-8000-0000000000b2'
const VORM = '55555555-5555-4555-8555-555555555555'

vi.mock('@/lib/club/ledenlogin/schakelaar', () => ({ CLUB_LEDEN_LOGIN: true }))
vi.mock('@/lib/club/toegang', () => ({
  haalEigenOrganisatie: async (_admin: unknown, id: string) => ({
    organisatie: id === GYM ? { id: GYM, naam: 'Kernhal', slug: 'kernhal', uit: [], logo: null, kleurAccent: '#3366ff', thema: 'donker', demo: false, instellingen: {} } : null,
    eigenaarId: null,
  }),
}))
vi.mock('@/lib/club/lidmaatschappen/lezen', () => ({
  haalVormen: async () => [
    { id: VORM, naam: 'Onbeperkt', omschrijving: '', vestigingen: null, groepslessen: true, maxLessenPerWeek: null, dalVan: null, dalTot: null, dalWeekendVrij: false, kleur: 'blauw', actief: true, demo: false },
  ],
}))

import { geheugenDb, type GeheugenDb } from './geheugen-db.testhulp'
import { gebruikLink, maakLink, trekLinkIn } from './links-opslag'
import { rondAanmeldingAf, startAanmelding } from './aanmelden-opslag'
import { maakSnelLid, nodigUit } from './toevoegen-opslag'
import { bewaarLidIntake } from './intake-opslag'
import { haalNieuwVanLeden, markeerGezien } from './meldingen'
import { leesLidIntake } from './intake'
import { bouwIntake } from './intake-keuze'
import { lidVanSessie } from '@/lib/club/ledenlogin/opslag'
import { intakeUitRij } from '@/lib/club/training/intake-rij'
import type { AanmeldGegevens, LinkInvoer } from './regels'

const NU = new Date('2026-10-30T10:00:00Z')
const IP = 'a'.repeat(64)
const WACHTWOORD = 'Ochtendtraining op dinsdag 7'

function nieuweDb(): GeheugenDb {
  return geheugenDb(
    {
      club_vestigingen: [{ user_id: GYM, vestiging: 'centrum', naam: 'Centrum', volgorde: 1, standaard: true }],
      club_leden: [{ id: '11111111-1111-4111-8111-111111111111', user_id: GYM, vestiging: 'centrum', voornaam: 'Bestaand', achternaam: 'Lid', email: 'al.lid@voorbeeld.nl', status: 'actief' }],
    },
    { club_lid_toegang: [['user_id', 'email']], club_aanmeldlinks: [['code']] },
  )
}

const LINK: LinkInvoer = { vestiging: 'centrum', vormId: null, soort: 'herbruikbaar', geldig: 90, naam: 'Balie' }

function gegevens(code: string, email = 'noor.de.vries@voorbeeld.nl'): AanmeldGegevens {
  return { code, voornaam: 'Noor', achternaam: 'de Vries', email, telefoon: '06 12345678', geboortedatum: '1994-03-12' }
}

function codeUit(tekst: string): string {
  const m = /\n(\d{6})\n/.exec(tekst)
  if (!m) throw new Error('geen code in de mail')
  return m[1]
}

describe('nieuw lid via een aanmeldlink, van A tot Z', () => {
  let db: GeheugenDb
  beforeEach(() => {
    db = nieuweDb()
  })

  it('aanmelden, code, wachtwoord, ingelogd, intake en meldingen voor het team', async () => {
    // Arrange: de sportschool maakt een herbruikbare link (balie).
    const link = await maakLink(db.admin, GYM, LINK, 'Sanne', NU)
    expect(link?.code).toMatch(/^[A-Za-z0-9_-]{24}$/)

    // Act 1: stap 1, gegevens plus akkoord. De code gaat per mail.
    const start = await startAanmelding(db.admin, gegevens(link!.code), IP, 'nl', NU)
    expect(start.staat).toBe('ok')
    if (start.staat !== 'ok' || !start.mail) throw new Error('geen mail')
    expect(start.mail.naar).toBe('noor.de.vries@voorbeeld.nl')
    const code = codeUit(start.mail.tekst)

    // Een foute code telt als poging en geeft "code".
    const fout = await rondAanmeldingAf(db.admin, { token: start.token, mailCode: code === '000000' ? '111111' : '000000', wachtwoord: WACHTWOORD, vormId: null }, NU)
    expect(fout.staat).toBe('code')

    // Act 2: de goede code, een lidmaatschap en een wachtwoord.
    const af = await rondAanmeldingAf(db.admin, { token: start.token, mailCode: code, wachtwoord: WACHTWOORD, vormId: VORM }, NU)
    expect(af.staat).toBe('ok')
    if (af.staat !== 'ok') return

    // Assert: een proeflid met de gekozen vorm, toestemming vastgelegd, link een keer gebruikt.
    const lid = db.tabellen.club_leden.find((l) => l.id === af.lidId)!
    expect(lid).toMatchObject({ user_id: GYM, vestiging: 'centrum', status: 'proef', abonnement: 'Onbeperkt', aangemeld_via: link!.id, aanmelding_toestemming_versie: '2026-10-30', email: 'noor.de.vries@voorbeeld.nl' })
    expect(db.tabellen.club_aanmeldlinks[0].gebruikt).toBe(1)
    const toegang = db.tabellen.club_lid_toegang.find((t) => t.lid_id === af.lidId)!
    expect(toegang.email).toBe('noor.de.vries@voorbeeld.nl')
    expect(String(toegang.wachtwoord_hash)).not.toContain(WACHTWOORD)

    // Meteen ingelogd: de sessie hoort bij dit lid en deze sportschool.
    const sessie = await lidVanSessie(db.admin, af.sessie.token, NU)
    expect(sessie?.toegang.lidId).toBe(af.lidId)
    expect(sessie?.toegang.userId).toBe(GYM)

    // De intake die het lid zelf invult (met toestemming).
    const intake = leesLidIntake(bouwIntake({
      doelen: ['afvallen'], gewicht: '82,5', lengte: '178', toestemming: true,
      gezondheid: { hart: false, borstpijn: false, duizelig: false, gewricht: true, bloeddruk: false, zwanger: false, anders: false },
      toelichting: { gewricht: 'Rechterknie na voetbal' }, zones: ['knie'], niveau: 1, dagen: 3, minuten: 45, voorkeuren: ['sportschool'],
    }))
    expect(intake.ok).toBe(true)
    if (!intake.ok) return
    const bewaard = await bewaarLidIntake(db.admin, GYM, af.lidId, intake.waarde, NU)
    expect(bewaard.staat).toBe('ok')

    // Het team ziet beide meldingen op Vandaag.
    const nieuw = await haalNieuwVanLeden(db.admin, GYM, 'centrum')
    expect(nieuw?.aanmeldingen.map((a) => a.naam)).toEqual(['Noor de Vries'])
    expect(nieuw?.intakes.map((i) => i.lidId)).toEqual([af.lidId])

    // Op de ledenkaart: een gewone intake, "ingevuld door lid", met gewicht en knie.
    const rij = db.tabellen.club_intakes[0]
    const opKaart = intakeUitRij({ ...rij, club_leden: { voornaam: 'Noor', achternaam: 'de Vries' } })
    expect(opKaart?.bron).toBe('lid')
    expect(opKaart?.metingen).toEqual({ gewicht_kg: 82.5, lengte_cm: 178 })
    expect(opKaart?.antwoorden?.gezondheid?.blessures).toEqual(['knie'])
    expect(opKaart?.antwoorden?.gezondheid?.parqJa).toEqual(['gewricht'])
    expect(rij.toestemming_op).toBe(NU.toISOString())

    // Gezien: de meldingen verdwijnen.
    await markeerGezien(db.admin, GYM, af.lidId, 'aanmelding', NU)
    await markeerGezien(db.admin, GYM, af.lidId, 'intake', NU)
    expect(await haalNieuwVanLeden(db.admin, GYM, 'centrum')).toEqual({ aanmeldingen: [], intakes: [] })
  })

  it('een adres dat al bij een lid hoort: hetzelfde antwoord, maar een "al lid"-mail en afronden lukt nooit', async () => {
    const link = await maakLink(db.admin, GYM, LINK, 'Sanne', NU)
    const nieuw = await startAanmelding(db.admin, gegevens(link!.code), IP, 'nl', NU)
    const bekend = await startAanmelding(db.admin, gegevens(link!.code, 'al.lid@voorbeeld.nl'), 'b'.repeat(64), 'nl', NU)
    expect(nieuw.staat).toBe('ok')
    expect(bekend.staat).toBe('ok')
    if (nieuw.staat !== 'ok' || bekend.staat !== 'ok') return
    // Dezelfde vorm van antwoord (alleen een token).
    expect(Object.keys(nieuw).sort()).toEqual(Object.keys(bekend).sort())
    expect(bekend.mail?.onderwerp).toContain('al lid')
    expect(bekend.mail?.tekst).not.toMatch(/\n\d{6}\n/)
    // Elke code is fout: er is geen code.
    const af = await rondAanmeldingAf(db.admin, { token: bekend.token, mailCode: '123456', wachtwoord: WACHTWOORD, vormId: null }, NU)
    expect(af.staat).toBe('code')
    expect(db.tabellen.club_leden).toHaveLength(1)
  })

  it('een eenmalige link werkt een keer; een ingetrokken link werkt niet meer', async () => {
    const link = await maakLink(db.admin, GYM, { ...LINK, soort: 'eenmalig', geldig: 7 }, 'Sanne', NU)
    const a = await startAanmelding(db.admin, gegevens(link!.code, 'een@voorbeeld.nl'), IP, 'nl', NU)
    const b = await startAanmelding(db.admin, gegevens(link!.code, 'twee@voorbeeld.nl'), 'c'.repeat(64), 'nl', NU)
    if (a.staat !== 'ok' || b.staat !== 'ok' || !a.mail || !b.mail) throw new Error('start mislukt')
    expect((await rondAanmeldingAf(db.admin, { token: a.token, mailCode: codeUit(a.mail.tekst), wachtwoord: WACHTWOORD, vormId: null }, NU)).staat).toBe('ok')
    expect((await rondAanmeldingAf(db.admin, { token: b.token, mailCode: codeUit(b.mail.tekst), wachtwoord: WACHTWOORD, vormId: null }, NU)).staat).toBe('link')

    const balie = await maakLink(db.admin, GYM, LINK, 'Sanne', NU)
    expect(await trekLinkIn(db.admin, GYM, balie!.id, NU)).toBe(true)
    expect((await startAanmelding(db.admin, gegevens(balie!.code, 'drie@voorbeeld.nl'), IP, 'nl', NU)).staat).toBe('link')
  })

  it('een link van een andere sportschool intrekken kan niet; gebruiken van een volle link ook niet', async () => {
    const link = await maakLink(db.admin, GYM, { ...LINK, soort: 'eenmalig', geldig: 7 }, 'Sanne', NU)
    expect(await trekLinkIn(db.admin, ANDER, link!.id, NU)).toBe(false)
    expect(await gebruikLink(db.admin, link!)).toBe(true)
    // De oude stand (gebruikt 0) klopt niet meer: compare-and-set weigert.
    expect(await gebruikLink(db.admin, link!)).toBe(false)
  })

  it('de rem: hetzelfde adres vaker dan 3 keer per uur krijgt stil geen mail meer, met hetzelfde antwoord', async () => {
    const link = await maakLink(db.admin, GYM, LINK, 'Sanne', NU)
    const uitslagen = []
    for (let i = 0; i < 4; i++) uitslagen.push(await startAanmelding(db.admin, gegevens(link!.code), String(i).repeat(64), 'nl', NU))
    expect(uitslagen.map((u) => u.staat)).toEqual(['ok', 'ok', 'ok', 'ok'])
    expect(uitslagen.map((u) => (u.staat === 'ok' ? u.mail !== null : null))).toEqual([true, true, true, false])
  })

  it('de rem per netwerk: vanaf 10 aanmeldingen per uur van hetzelfde IP een 429', async () => {
    const link = await maakLink(db.admin, GYM, LINK, 'Sanne', NU)
    for (let i = 0; i < 10; i++) await startAanmelding(db.admin, gegevens(link!.code, `persoon${i}@voorbeeld.nl`), IP, 'nl', NU)
    expect((await startAanmelding(db.admin, gegevens(link!.code, 'elf@voorbeeld.nl'), IP, 'nl', NU)).staat).toBe('netwerk')
  })

  it('de sportschool voegt een lid toe: meteen een werkende uitnodiging voor de QR', async () => {
    const id = await maakSnelLid(db.admin, GYM, { voornaam: 'Sem', achternaam: 'Bakker', email: 'sem@voorbeeld.nl', telefoon: null, vestiging: 'centrum', vormId: VORM, uitnodigen: true }, 'Onbeperkt', NU)
    expect(id).toBeTruthy()
    expect(db.tabellen.club_leden.find((l) => l.id === id)).toMatchObject({ status: 'actief', abonnement: 'Onbeperkt', user_id: GYM })
    const uit = await nodigUit(db.admin, { id: GYM, naam: 'Kernhal', slug: 'kernhal' }, { id: id!, voornaam: 'Sem' }, NU)
    expect(uit.staat).toBe('ok')
    if (uit.staat !== 'ok') return
    expect(uit.url).toMatch(/\/kernhal\/mijn\/start\/[A-Za-z0-9_-]{24}$/)
    expect(db.tabellen.club_lid_toegang.find((t) => t.lid_id === id)?.actief).toBe(true)
  })

  it('zonder toestemming bewaart de intake geen gewicht, lengte of gezondheid', async () => {
    const intake = leesLidIntake(bouwIntake({
      doelen: ['kracht'], gewicht: '90', lengte: '185', toestemming: false, gezondheid: { hart: true }, toelichting: {}, zones: [], niveau: 2, dagen: 4, minuten: 60, voorkeuren: ['sportschool'],
    }))
    expect(intake.ok && intake.waarde.metingen).toEqual({})
    expect(intake.ok && intake.waarde.antwoorden.gezondheid).toBeNull()
  })
})
