import { describe, expect, test } from 'vitest'
import { bouwDagplanningMail, type DagItem } from './dagplanning'

const DAG = new Date(2026, 8, 7) // ma 7 sep 2026

function item(startUur: number, eindUur: number | null, titel: string, extra: Partial<DagItem> = {}): DagItem {
  return {
    startOp: new Date(2026, 8, 7, startUur, 0),
    eindOp: eindUur === null ? null : new Date(2026, 8, 7, eindUur, 0),
    titel,
    heleDag: false,
    ...extra,
  }
}

describe('bouwDagplanningMail', () => {
  test('lege dag: eerlijke "rustige dag", geen verzonnen blokken', () => {
    const mail = bouwDagplanningMail(DAG, [])
    expect(mail.onderwerp).toContain('rustige dag')
    expect(mail.tekst).toContain('leeg')
  })

  test('sorteert chronologisch, hele-dag eerst', () => {
    const mail = bouwDagplanningMail(DAG, [
      item(14, 15, 'Late call'),
      item(9, 10, 'Vroege afspraak'),
      { ...item(0, null, 'Verjaardag'), heleDag: true },
    ])
    const iVerjaardag = mail.tekst.indexOf('Verjaardag')
    const iVroeg = mail.tekst.indexOf('Vroege afspraak')
    const iLaat = mail.tekst.indexOf('Late call')
    expect(iVerjaardag).toBeLessThan(iVroeg)
    expect(iVroeg).toBeLessThan(iLaat)
  })

  test('markeert de ingeplande beweging', () => {
    const mail = bouwDagplanningMail(DAG, [item(8, 10, 'Sporten (incl. reistijd)', { beweging: true })])
    expect(mail.tekst).toContain('(ingepland)')
  })

  test('escapet titels — geen HTML-injectie in de mail', () => {
    const mail = bouwDagplanningMail(DAG, [item(9, 10, '<script>x</script>')])
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;script&gt;')
  })

  test('toont alleen de start als het eind onbekend is', () => {
    const mail = bouwDagplanningMail(DAG, [item(9, null, 'Open eind')])
    // Geen en-dash-tijdvak, wel een starttijd.
    expect(mail.tekst).toMatch(/\d{2}:\d{2}\s+Open eind/)
  })
})
