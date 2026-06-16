import PDFDocument from 'pdfkit'

interface Video {
  nummer: number
  titel: string
  pijler: string
  locatie: string
  duur_sec: number
  platform: string[]
  prioriteit: string
  hook: string
  script: string
  broll: string[]
  cta: string
  caption_idee: string
}

interface BriefingData {
  datum: string
  videos: Video[]
  totale_opnametijd_sec?: number
  meta?: {
    groet?: string
    thema?: string
    tip?: string
  }
}

const GROEN = '#2d6a4f'
const DONKER = '#1a1a2e'
const GRIJS = '#6b7280'
const LICHTGRIJS = '#f3f4f6'

export function generateBriefingPDF(briefing: BriefingData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 48, size: 'A4' })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageW = doc.page.width
    const margin = 48
    const contentW = pageW - margin * 2

    // ── Header ──────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 90).fill(DONKER)

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
       .text('CONTENT BRIEFING', margin, 22)

    const datumNL = new Date(briefing.datum).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(11)
       .text(datumNL.charAt(0).toUpperCase() + datumNL.slice(1), margin, 48)

    const minuten = Math.round((briefing.totale_opnametijd_sec ?? 0) / 60)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
       .text(`${briefing.videos?.length ?? 0} videos  ·  ~${minuten} min opnemen`, margin, 65)

    doc.y = 106

    // ── Thema ───────────────────────────────────────────────────
    if (briefing.meta?.thema) {
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(11)
         .text('THEMA VAN DE DAG', margin, doc.y)
      doc.fillColor(DONKER).font('Helvetica').fontSize(13)
         .text(briefing.meta.thema, margin, doc.y + 4, { width: contentW })
      doc.moveDown(1)
    }

    if (briefing.meta?.groet) {
      doc.fillColor(GRIJS).font('Helvetica-Oblique').fontSize(11)
         .text(`"${briefing.meta.groet}"`, margin, doc.y, { width: contentW })
      doc.moveDown(1.2)
    }

    // ── Videos ──────────────────────────────────────────────────
    for (const v of briefing.videos ?? []) {
      // Nieuwe pagina als niet genoeg ruimte
      if (doc.y > doc.page.height - 220) doc.addPage()

      const topY = doc.y

      // Nummer badge
      doc.rect(margin, topY, 28, 28).fill(GROEN)
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14)
         .text(String(v.nummer), margin, topY + 7, { width: 28, align: 'center' })

      // Titel
      doc.fillColor(DONKER).font('Helvetica-Bold').fontSize(14)
         .text(v.titel, margin + 36, topY, { width: contentW - 36 })

      // Meta chips: locatie · duur · pijler · prioriteit
      const metaY = doc.y + 3
      doc.fillColor(GRIJS).font('Helvetica').fontSize(9.5)
         .text(
           `${v.locatie}  ·  ${v.duur_sec}s  ·  ${v.pijler}  ·  ${(v.platform ?? []).join(', ')}`,
           margin + 36, metaY, { width: contentW - 36 }
         )

      doc.moveDown(0.8)

      // Hook
      doc.rect(margin, doc.y, 3, 1).fill(GROEN) // lijn-indicator
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(9)
         .text('HOOK', margin, doc.y)
      doc.fillColor(DONKER).font('Helvetica-Bold').fontSize(11)
         .text(`"${v.hook}"`, margin, doc.y + 2, { width: contentW })
      doc.moveDown(0.8)

      // Script
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(9)
         .text('SCRIPT', margin, doc.y)
      doc.fillColor('#374151').font('Helvetica').fontSize(10)
         .text(v.script, margin, doc.y + 2, { width: contentW })
      doc.moveDown(0.8)

      // B-roll + CTA naast elkaar
      const colW = (contentW - 12) / 2

      const brollY = doc.y
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(9)
         .text('B-ROLL', margin, brollY)
      const brollItems = (v.broll ?? []).map((b) => `• ${b}`).join('\n')
      doc.fillColor('#374151').font('Helvetica').fontSize(9.5)
         .text(brollItems, margin, brollY + 12, { width: colW })

      const ctaX = margin + colW + 12
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(9)
         .text('CTA', ctaX, brollY)
      doc.fillColor('#374151').font('Helvetica').fontSize(9.5)
         .text(v.cta, ctaX, brollY + 12, { width: colW })

      doc.moveDown(1.5)

      // Caption
      doc.rect(margin, doc.y, contentW, 0.5).fill('#e5e7eb')
      doc.moveDown(0.3)
      doc.fillColor(GRIJS).font('Helvetica-Oblique').fontSize(8.5)
         .text(`Caption: ${v.caption_idee}`, margin, doc.y, { width: contentW })
      doc.moveDown(0.5)

      // Scheidingslijn
      doc.rect(margin, doc.y, contentW, 1).fill('#e5e7eb')
      doc.moveDown(1.2)
    }

    // ── Tip van de dag ──────────────────────────────────────────
    if (briefing.meta?.tip) {
      if (doc.y > doc.page.height - 80) doc.addPage()

      doc.rect(margin, doc.y, contentW, 38).fill(LICHTGRIJS)
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(9)
         .text('TIP VAN DE DAG', margin + 10, doc.y + 8)
      doc.fillColor(DONKER).font('Helvetica').fontSize(10.5)
         .text(briefing.meta.tip, margin + 10, doc.y + 4, { width: contentW - 20 })
      doc.moveDown(2)
    }

    // ── Footer ──────────────────────────────────────────────────
    const footerY = doc.page.height - 32
    doc.rect(0, footerY - 4, pageW, 36).fill(DONKER)
    doc.fillColor('#6b7280').font('Helvetica').fontSize(8)
       .text('Vitanex · AI Content OS · Maak vandaag · Post morgen', margin, footerY + 4)
    doc.text(datumNL, margin, footerY + 4, { width: contentW, align: 'right' })

    doc.end()
  })
}
