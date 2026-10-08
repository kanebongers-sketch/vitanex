// ─── LifeOS — coachgesprek-verslag als nette pdf (SERVER-ONLY) ──────────────
// Eén A4 per verslag: navy kop met naam en datum, de drie scores als balkjes,
// dan wat besproken is, het aandachtspunt en (als die er is) het volgende gesprek.
// PDFKit kent geen CSS-variabelen: de hexwaarden spiegelen theme.ts (navy + cyaan;
// cyaan alleen op navy, want op wit haalt het geen AA-contrast).
//
// pdfkit laden we met een webpackIgnore-import (zie lib/pdf/pdf-briefing.ts):
// gebundeld vindt het zijn fontbestanden niet meer.

import type { EvaluatieScores } from './pt-coaching'
import { BRON_LABEL, STATUS_LABEL, leadRegel, type LeadSamenvatting } from '@/lib/lifeos/leads/leads'

type PDFDocumentConstructor = new (options?: PDFKit.PDFDocumentOptions) => PDFKit.PDFDocument

const NAVY = '#0B1B3A'
const CYAAN = '#00E5FF'
const GRIJS = '#5B6B86'
const LIJN = '#E3E8F0'
const VLAK = '#F4F7FB'

export interface VerslagPdfInvoer {
  naam: string
  /** Moment waarop het verslag is opgeslagen. */
  op: Date
  scores: EvaluatieScores
  notitie: string | null
  aandachtspunt: string | null
  /** Het volgende gesprek, als dat is ingepland. */
  volgende?: Date | null
  /** Wat er met de open aandachtspunten van vorige keer gebeurde. */
  opvolging?: readonly { tekst: string; oordeel: 'opgelost' | 'loopt' | 'erger' | null }[]
  /** Wat de PT'er sinds het vorige gesprek in de lead tracker invulde. */
  leads?: LeadSamenvatting | null
  /** De lopende PT-abonnementen van deze PT'er, als één regel. */
  klanten?: string | null
}

const OPVOLG_LABEL = { opgelost: 'Opgelost', loopt: 'Loopt nog', erger: 'Erger geworden' } as const

const DATUM = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' })
const MOMENT = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

const SCORES: { key: keyof EvaluatieScores; label: string }[] = [
  { key: 'algemeen', label: 'Algemeen gevoel' },
  { key: 'energie', label: 'Energie / motivatie' },
  { key: 'voortgang', label: 'Voortgang richting doel' },
]

/** Het lead-blok: de telling, dan per nieuwe lead één regel. */
function leadTekst(s: LeadSamenvatting): string {
  const regels = s.lijst.map((l) => `• ${l.naam} — ${STATUS_LABEL[l.status]} (${BRON_LABEL[l.bron]})`)
  const meer = s.nieuw > s.lijst.length ? [`… en nog ${s.nieuw - s.lijst.length}`] : []
  return [leadRegel(s), ...regels, ...meer].join('\n')
}

/** Bestandsnaam: "Coachgesprek-Michael-2026-09-30.pdf". */
export function verslagBestandsnaam(naam: string, op: Date): string {
  const dag = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(op)
  const schoon = naam.normalize('NFD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return `Coachgesprek-${schoon || 'PT'}-${dag}.pdf`
}

export async function maakVerslagPdf(v: VerslagPdfInvoer): Promise<Buffer> {
  const { default: PDFDocument } = (await import(/* webpackIgnore: true */ 'pdfkit')) as { default: PDFDocumentConstructor }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Coachgesprek ${v.naam}`, Author: 'LifeOS' } })
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const B = doc.page.width
    const M = 56
    const breed = B - 2 * M

    // ── Kop ──
    doc.rect(0, 0, B, 150).fill(NAVY)
    doc.fillColor(CYAAN).font('Helvetica-Bold').fontSize(10).text('COACHGESPREK · VERSLAG', M, 52, { characterSpacing: 1.5 })
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(28).text(v.naam, M, 70, { width: breed })
    doc.fillColor('#C9D3E6').font('Helvetica').fontSize(12).text(DATUM.format(v.op), M, 108, { width: breed })

    let y = 186

    // ── Scores ──
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text('SCORES', M, y, { characterSpacing: 1.2 })
    y += 22
    for (const s of SCORES) {
      const waarde = v.scores[s.key]
      doc.fillColor(NAVY).font('Helvetica').fontSize(12).text(s.label, M, y)
      doc.font('Helvetica-Bold').text(`${waarde}/5`, M, y, { width: breed, align: 'right' })
      const balkY = y + 20
      doc.roundedRect(M, balkY, breed, 8, 4).fill(LIJN)
      doc.roundedRect(M, balkY, (breed * waarde) / 5, 8, 4).fill(NAVY)
      y += 46
    }

    // ── Blokken ──
    function blok(kop: string, tekst: string) {
      doc.font('Helvetica').fontSize(12)
      const hoogte = doc.heightOfString(tekst, { width: breed - 32, lineGap: 3 })
      // Past het blok niet meer boven de voet? Dan op een nieuwe pagina verder.
      if (y + 34 + hoogte + 28 > doc.page.height - 72) {
        doc.addPage({ size: 'A4', margin: 0 })
        y = M - 14
      }
      y += 14
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(kop.toUpperCase(), M, y, { characterSpacing: 1.2 })
      y += 20
      doc.font('Helvetica').fontSize(12)
      doc.roundedRect(M, y, breed, hoogte + 28, 8).fill(VLAK)
      doc.fillColor(NAVY).text(tekst, M + 16, y + 14, { width: breed - 32, lineGap: 3 })
      y += hoogte + 28 + 6
    }

    if (v.opvolging && v.opvolging.length > 0) {
      blok('Opvolging vorige aandachtspunten', v.opvolging.map((o) => `• ${o.tekst} — ${o.oordeel ? OPVOLG_LABEL[o.oordeel] : 'nog open'}`).join('\n'))
    }
    if (v.leads) blok('Lead tracker', leadTekst(v.leads))
    if (v.klanten) blok('PT-klanten', v.klanten)
    blok('Wat besproken', v.notitie ?? 'Geen verslag ingevuld.')
    blok('Aandachtspunt', v.aandachtspunt ?? 'Geen aandachtspunt.')
    if (v.volgende) blok('Volgend gesprek', MOMENT.format(v.volgende))

    // ── Voet ──
    const voetY = doc.page.height - 48
    doc.moveTo(M, voetY - 12).lineTo(B - M, voetY - 12).lineWidth(0.5).strokeColor(LIJN).stroke()
    doc.fillColor(GRIJS).font('Helvetica').fontSize(9).text('Gemaakt met LifeOS · vertrouwelijk', M, voetY, { width: breed })

    doc.end()
  })
}
