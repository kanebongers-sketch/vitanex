import { describe, expect, test } from 'vitest'
import {
  MAX_GROOTTE,
  bestandsFout,
  downloadNaam,
  extensieVan,
  isVeiligPad,
  leesbareGrootte,
  slug,
  soortVanBestand,
  soortVanMime,
  veiligPad,
} from './documenten'
import { lijktKopie, suggestieVoorBestand } from './documenten-suggestie'
import {
  groepeerPerCategorie,
  leesDocument,
  leesDocumenten,
  leesDocumentInvoer,
  leesDocumentWijziging,
  leesUploadTicket,
  leesUploadVerzoek,
  type PtDocument,
} from './documenten-lezers'
import { leesObjectInfo } from './documenten-opslag'
import { opslagFout } from './documenten-upload'

const PDF = 'application/pdf'
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

describe('suggestieVoorBestand — de bekende Fit Factory PT-namen', () => {
  test.each([
    ['Fit Factory Personal Training Protocol.pdf', 'PT Protocol 2026', 'protocollen'],
    ['Fit Factory Personal Training Intake.pdf', 'Intakeformulier', 'klant'],
    ['Fit Factory Personal Training Intake WORD.docx', 'Intakeformulier (Word)', 'klant'],
    ['Fit Factory Personal Training Abonnementen Klant.pdf', 'Abonnementen voor klanten', 'klant'],
    ['Fit Factory Personal Training Abonnementen Intern.pdf', 'Abonnementen (intern)', 'protocollen'],
    ['Fit_Factory_Guide_2.pdf', 'Fit Guide', 'klant'],
    ['Fit_Factory_Guide_-_English.pdf', 'Fit Guide (English)', 'klant'],
    ['Fit Factory PT Academy Dag 2.pptx', 'PT Academy — Dag 2', 'academy'],
    ['Kopie van Fit Factory Personal training handleiding.docx', 'Handleiding Personal Training', 'handleiding'],
    ['Kopie van Fit Factory Personal training handleiding (1).docx', 'Handleiding Personal Training', 'handleiding'],
  ])('%s → %s (%s)', (naam, titel, categorie) => {
    const s = suggestieVoorBestand(naam)
    expect(s.titel).toBe(titel)
    expect(s.categorie).toBe(categorie)
    expect(s.beschrijving).toBeTruthy()
  })

  test('PT Academy krijgt de dag als volgorde', () => {
    expect(suggestieVoorBestand('Fit Factory PT Academy Dag 3.pptx').volgorde).toBe(3)
  })

  test('onbekend → Overig, titel zonder extensie / "Kopie van" / "(1)", geen beschrijving', () => {
    expect(suggestieVoorBestand('Kopie van rooster_najaar (1).xlsx')).toEqual({ titel: 'rooster najaar', categorie: 'overig', beschrijving: null, volgorde: 0 })
    expect(suggestieVoorBestand('.pdf').titel).toBe('Document')
  })

  test('lijktKopie: alleen "(n)" vlak voor de extensie', () => {
    expect(lijktKopie('handleiding (1).docx')).toBe(true)
    expect(lijktKopie('Kopie van handleiding.docx')).toBe(false)
    expect(lijktKopie('Dag (1) intro.pptx')).toBe(false)
  })
})

describe('soorten en grenzen', () => {
  test('extensie en soort, jpeg → jpg, hoofdletters maken niet uit', () => {
    expect(extensieVan('Foto.JPEG')).toBe('jpg')
    expect(soortVanBestand('x.PDF')?.label).toBe('PDF')
    expect(soortVanBestand('x.docx')?.label).toBe('Word')
    expect(soortVanBestand('x.pptx')?.label).toBe('PowerPoint')
    expect(soortVanBestand('x.doc')).toBeNull()
    expect(soortVanBestand('geen-extensie')).toBeNull()
    expect(soortVanMime(PPTX)?.extensie).toBe('pptx')
  })

  test('bestandsFout: type, leeg en de 50 MB-grens', () => {
    expect(bestandsFout('a.pdf', 1000)).toBeNull()
    expect(bestandsFout('a.pdf', MAX_GROOTTE)).toBeNull()
    expect(bestandsFout('a.pdf', MAX_GROOTTE + 1)).toMatch(/Te groot/)
    expect(bestandsFout('a.pdf', 0)).toMatch(/leeg/)
    expect(bestandsFout('a.exe', 10)).toMatch(/bestandstype/)
  })

  test('leesbareGrootte in NL-notatie', () => {
    expect(leesbareGrootte(812)).toBe('812 B')
    expect(leesbareGrootte(34 * 1024)).toBe('34 kB')
    expect(leesbareGrootte(2.4 * 1024 * 1024)).toBe('2,4 MB')
    expect(leesbareGrootte(12.6 * 1024 * 1024)).toBe('13 MB')
    expect(leesbareGrootte(-1)).toBe('–')
  })
})

describe('paden en namen', () => {
  test('slug: geen accenten of rare tekens, nooit leeg', () => {
    expect(slug('Café — Dag 1 (intern)')).toBe('cafe-dag-1-intern')
    expect(slug('***')).toBe('document')
    expect(slug('a'.repeat(100))).toHaveLength(60)
  })

  test('veiligPad + isVeiligPad horen bij elkaar', () => {
    const pad = veiligPad('Fit Factory PT Academy Dag 1.pptx', 'abc12345')
    expect(pad).toBe('fit-factory-pt-academy-dag-1-abc12345.pptx')
    expect(isVeiligPad(pad ?? '')).toBe(true)
    expect(veiligPad('virus.exe', 'abc12345')).toBeNull()
    expect(veiligPad('a.pdf', 'KORT')).toBeNull()
  })

  test('isVeiligPad weigert mappen, traversal en vreemde extensies', () => {
    expect(isVeiligPad('../geheim-abc12345.pdf')).toBe(false)
    expect(isVeiligPad('map/doc-abc12345.pdf')).toBe(false)
    expect(isVeiligPad('doc-abc12345.html')).toBe(false)
    expect(isVeiligPad('doc.pdf')).toBe(false)
  })

  test('downloadNaam: leesbaar, veilig en met de juiste extensie', () => {
    expect(downloadNaam('PT Academy — Dag 1', PPTX)).toBe('PT Academy Dag 1.pptx')
    expect(downloadNaam('Intake & "test"', PDF)).toBe('Intake test.pdf')
    expect(downloadNaam('', 'onbekend/type')).toBe('document.bin')
  })
})

describe('lezers van de systeemgrens', () => {
  test('leesUploadVerzoek: naam + grootte, mime van de browser telt niet', () => {
    expect(leesUploadVerzoek({ bestandsnaam: ' a.pdf ', grootte: 10, mime: 'text/html' })).toEqual({ ok: true, waarde: { bestandsnaam: 'a.pdf', grootte: 10 } })
    expect(leesUploadVerzoek({ bestandsnaam: 'a.pdf' }).ok).toBe(false)
    expect(leesUploadVerzoek({ bestandsnaam: 'a.zip', grootte: 10 }).ok).toBe(false)
    expect(leesUploadVerzoek(null).ok).toBe(false)
  })

  const invoer = { pad: 'intake-abc12345.pdf', titel: '  Intake  ', beschrijving: '  ', categorie: 'klant', volgorde: '2', zichtbaar: false }

  test('leesDocumentInvoer: trimt, lege beschrijving = null, volgorde als getal', () => {
    expect(leesDocumentInvoer(invoer)).toEqual({
      ok: true,
      waarde: { pad: 'intake-abc12345.pdf', titel: 'Intake', beschrijving: null, categorie: 'klant', volgorde: 2, zichtbaar: false },
    })
  })

  test('leesDocumentInvoer: weigert onbekend pad, categorie, lege titel en rare volgorde', () => {
    expect(leesDocumentInvoer({ ...invoer, pad: '../x.pdf' }).ok).toBe(false)
    expect(leesDocumentInvoer({ ...invoer, categorie: 'geheim' }).ok).toBe(false)
    expect(leesDocumentInvoer({ ...invoer, titel: '   ' }).ok).toBe(false)
    expect(leesDocumentInvoer({ ...invoer, titel: 'x'.repeat(141) }).ok).toBe(false)
    expect(leesDocumentInvoer({ ...invoer, volgorde: -1 }).ok).toBe(false)
    expect(leesDocumentInvoer({ ...invoer, volgorde: 1.5 }).ok).toBe(false)
    expect(leesDocumentInvoer({ ...invoer, beschrijving: 'x'.repeat(401) }).ok).toBe(false)
  })

  test('leesDocumentWijziging: alleen meegestuurde velden, minstens één', () => {
    expect(leesDocumentWijziging({ zichtbaar: true })).toEqual({ ok: true, waarde: { zichtbaar: true } })
    expect(leesDocumentWijziging({ beschrijving: null, volgorde: 3 })).toEqual({ ok: true, waarde: { beschrijving: null, volgorde: 3 } })
    expect(leesDocumentWijziging({}).ok).toBe(false)
    expect(leesDocumentWijziging({ pad: 'x-abc12345.pdf' }).ok).toBe(false)
    expect(leesDocumentWijziging({ zichtbaar: 'ja' }).ok).toBe(false)
  })

  const doc: PtDocument = {
    id: 'd1', titel: 'Intake', beschrijving: null, categorie: 'klant', mime: PDF, grootte: 1000, volgorde: 1, zichtbaar: true,
    bijgewerktOp: '2026-10-08T10:00:00Z',
  }

  test('leesDocument(en): exact de vorm, één kapotte rij = alles onbetrouwbaar', () => {
    expect(leesDocument(doc)).toEqual(doc)
    expect(leesDocument({ ...doc, categorie: 'x' })).toBeNull()
    expect(leesDocumenten({ documenten: [doc] })).toEqual([doc])
    expect(leesDocumenten({ documenten: [doc, { id: 1 }] })).toBeNull()
    expect(leesDocumenten([doc])).toBeNull()
  })

  test('leesUploadTicket: alleen een veilig pad en een https-URL', () => {
    const t = { pad: 'a-abc12345.pdf', signedUrl: 'https://x.supabase.co/storage/v1/object/upload/sign/pt-documenten/a-abc12345.pdf?token=t', token: 't' }
    expect(leesUploadTicket(t)).toEqual(t)
    expect(leesUploadTicket({ ...t, signedUrl: 'http://x' })).toBeNull()
    expect(leesUploadTicket({ ...t, pad: '../a.pdf' })).toBeNull()
  })
})

describe('groepeerPerCategorie', () => {
  test('vaste categorievolgorde, binnen een groep op volgorde en dan titel; lege groepen weg', () => {
    const d = (id: string, categorie: PtDocument['categorie'], volgorde: number, titel: string) => ({ id, categorie, volgorde, titel })
    const groepen = groepeerPerCategorie([d('1', 'overig', 0, 'Z'), d('2', 'academy', 2, 'Dag 2'), d('3', 'academy', 1, 'Dag 1'), d('4', 'protocollen', 0, 'B'), d('5', 'protocollen', 0, 'A')])
    expect(groepen.map((g) => g.label)).toEqual(['Protocollen', 'PT Academy', 'Overig'])
    expect(groepen[0].documenten.map((x) => x.id)).toEqual(['5', '4'])
    expect(groepen[1].documenten.map((x) => x.id)).toEqual(['3', '2'])
  })
})

describe('leesObjectInfo — wat de opslag over een object zegt', () => {
  test('grootte + content-type, camelCase (runtime) én snake_case (typedefinitie); parameters en hoofdletters weg', () => {
    expect(leesObjectInfo({ size: 10, contentType: 'Application/PDF; charset=binary' })).toEqual({ grootte: 10, mime: 'application/pdf' })
    expect(leesObjectInfo({ size: 10, content_type: PDF })).toEqual({ grootte: 10, mime: PDF })
    expect(leesObjectInfo({ size: 10 })).toEqual({ grootte: 10, mime: null })
  })

  test('zonder bruikbare grootte is er geen info', () => {
    expect(leesObjectInfo({ contentType: PDF })).toBeNull()
    expect(leesObjectInfo({ size: '10' })).toBeNull()
    expect(leesObjectInfo({ size: -1 })).toBeNull()
    expect(leesObjectInfo(null)).toBeNull()
  })
})

describe('opslagFout — meldingen bij een mislukte PUT', () => {
  test('te groot, verlopen token en de generieke melding met status', () => {
    expect(opslagFout(413, '')).toMatch(/Te groot/)
    expect(opslagFout(400, JSON.stringify({ message: 'The object exceeded the maximum allowed size' }))).toMatch(/Te groot/)
    expect(opslagFout(400, JSON.stringify({ error: 'InvalidJWT', message: 'jwt expired' }))).toMatch(/verlopen/)
    expect(opslagFout(500, 'kapot')).toBe('Uploaden naar de opslag mislukt (500).')
    expect(opslagFout(0, '')).toBe('Uploaden naar de opslag mislukt (geen antwoord).')
  })
})
