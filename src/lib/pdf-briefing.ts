// pdfkit is loaded via webpackIgnore dynamic import — prevents Turbopack from bundling
// it (which replaces __dirname with /ROOT/ and breaks AFM font file loading)
type PDFDocumentConstructor = new (options?: PDFKit.PDFDocumentOptions) => PDFKit.PDFDocument

interface Video {
  nummer: number
  titel: string
  pijler: string
  locatie: string
  format?: string
  duur_sec: number
  duur_doel?: string
  dm_share_trigger?: string
  platform: string[]
  prioriteit: string
  hook: string
  script: string
  camera_opstelling?: string
  kleding?: string
  opname_volgorde?: string[]
  licht?: string
  productie_tip?: string
  broll: string[]
  cta: string
  caption_idee: string
}

interface StoryFrame {
  frame: number
  type: string
  achtergrond: string
  tekst: string
  interactie: string
  optie_a: string
  optie_b: string
  doel: string
}

export interface KalenderItem {
  type: string
  pijler: string
  titel: string
  hook?: string
  caption: string
  hashtags?: string[]
  beste_tijd: string
}

export interface KalenderDag {
  platform: string
  items: KalenderItem[]
}

interface BriefingData {
  datum: string
  post_datum?: string
  videos: Video[]
  stories?: StoryFrame[]
  totale_opnametijd_sec?: number
  meta?: {
    groet?: string
    thema?: string
    tip?: string
  }
  kalender_vandaag?: KalenderDag[]
  kalender_morgen?: KalenderDag[]
}

// PDFKit kent geen CSS-variabelen; deze waarden spiegelen theme.ts
// (--mf-green-dark #16B6CC — cyaan met voldoende contrast op wit).
const GROEN = '#16B6CC'
const GROEN_DARK = '#0E8FA3'
const DONKER = '#0D1117'
const GRIJS = '#6b7280'
const LICHTGRIJS = '#f3f4f6'
const ORANJE = '#E8A020'

export async function generateBriefingPDF(briefing: BriefingData): Promise<Buffer> {
  // webpackIgnore prevents Turbopack from bundling pdfkit statically.
  // When bundled, __dirname becomes /ROOT/ and AFM font files can't be found.
  // With this dynamic import, pdfkit is resolved at runtime from node_modules.
  const { default: PDFDocument } = await import(/* webpackIgnore: true */ 'pdfkit') as { default: PDFDocumentConstructor }

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
    doc.rect(0, 0, pageW, 110).fill(DONKER)

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20)
       .text('CONTENT BRIEFING', margin, 18)

    const filmDatumNL = new Date(briefing.datum).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(10)
       .text(`Filmdag: ${filmDatumNL.charAt(0).toUpperCase() + filmDatumNL.slice(1)}`, margin, 44)

    const minuten = Math.round((briefing.totale_opnametijd_sec ?? 0) / 60)
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(10)
       .text(`${briefing.videos?.length ?? 0} videos  ·  ~${minuten} min opnemen`, margin, 60)

    // "POST MORGEN" badge
    const postDatumRaw = briefing.post_datum ?? (() => {
      const d = new Date(briefing.datum); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
    })()
    const postDatumNL = new Date(postDatumRaw).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const postLabel = `POST MORGEN — ${postDatumNL.charAt(0).toUpperCase() + postDatumNL.slice(1)}`
    doc.rect(margin, 78, contentW, 22).fill(GROEN)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
       .text(postLabel, margin + 10, 84, { width: contentW - 20 })

    const datumNL = filmDatumNL

    doc.y = 126

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

      // Meta chips: locatie · duur · pijler · platform
      const metaY = doc.y + 3
      const duurLabel = v.duur_doel ? `${v.duur_doel}` : `${v.duur_sec}s`
      doc.fillColor(GRIJS).font('Helvetica').fontSize(9.5)
         .text(
           `${v.locatie}  ·  ${duurLabel}  ·  ${v.pijler}  ·  ${(v.platform ?? []).join(', ')}`,
           margin + 36, metaY, { width: contentW - 36 }
         )

      doc.moveDown(0.8)

      // Hook
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(9)
         .text('HOOK', margin, doc.y)
      doc.fillColor(DONKER).font('Helvetica-Bold').fontSize(11)
         .text(`"${v.hook}"`, margin, doc.y + 2, { width: contentW })
      doc.moveDown(0.5)

      // DM-share trigger
      if (v.dm_share_trigger) {
        doc.fillColor(GRIJS).font('Helvetica-Oblique').fontSize(8.5)
           .text(`📤 ${v.dm_share_trigger}`, margin, doc.y, { width: contentW })
        doc.moveDown(0.5)
      }

      // Script
      doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(9)
         .text('SCRIPT', margin, doc.y)
      doc.fillColor('#374151').font('Helvetica').fontSize(10)
         .text(v.script, margin, doc.y + 2, { width: contentW })
      doc.moveDown(0.8)

      // Productie sectie: camera + kleding + licht
      if (v.camera_opstelling || v.kleding || v.licht) {
        const colW3 = (contentW - 24) / 3
        const prodY = doc.y

        if (v.camera_opstelling) {
          doc.fillColor(ORANJE).font('Helvetica-Bold').fontSize(9).text('CAMERA', margin, prodY)
          doc.fillColor('#374151').font('Helvetica').fontSize(9)
             .text(v.camera_opstelling, margin, prodY + 12, { width: colW3 })
        }
        if (v.kleding) {
          const kledingX = margin + colW3 + 12
          doc.fillColor(ORANJE).font('Helvetica-Bold').fontSize(9).text('KLEDING', kledingX, prodY)
          doc.fillColor('#374151').font('Helvetica').fontSize(9)
             .text(v.kleding, kledingX, prodY + 12, { width: colW3 })
        }
        if (v.licht) {
          const lichtX = margin + (colW3 + 12) * 2
          doc.fillColor(ORANJE).font('Helvetica-Bold').fontSize(9).text('LICHT', lichtX, prodY)
          doc.fillColor('#374151').font('Helvetica').fontSize(9)
             .text(v.licht, lichtX, prodY + 12, { width: colW3 })
        }
        doc.moveDown(1.8)
      }

      // Opname volgorde
      if (v.opname_volgorde?.length) {
        doc.fillColor(ORANJE).font('Helvetica-Bold').fontSize(9).text('OPNAME VOLGORDE', margin, doc.y)
        const shots = v.opname_volgorde.map((s, i) => `${i + 1}. ${s}`).join('\n')
        doc.fillColor('#374151').font('Helvetica').fontSize(9)
           .text(shots, margin, doc.y + 2, { width: contentW })
        doc.moveDown(0.8)
      }

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

      // Productie tip
      if (v.productie_tip) {
        doc.rect(margin, doc.y, contentW, 24).fill('#fff7ed')
        doc.fillColor(ORANJE).font('Helvetica-Bold').fontSize(8.5)
           .text('💡 PRO TIP', margin + 8, doc.y + 6)
        doc.fillColor('#92400e').font('Helvetica').fontSize(9)
           .text(v.productie_tip, margin + 8, doc.y + 2, { width: contentW - 16 })
        doc.moveDown(1.2)
      }

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

    // ── Stories ─────────────────────────────────────────────────
    if (briefing.stories?.length) {
      if (doc.y > doc.page.height - 160) doc.addPage()

      const PAARS = '#7C3AED'

      // Sectie header
      doc.rect(margin, doc.y, contentW, 26).fill(PAARS)
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
         .text('📱  INSTAGRAM STORIES — vandaag posten', margin + 10, doc.y + 7)
      doc.moveDown(1.4)

      const storyColW = (contentW - 16) / 3

      for (const s of briefing.stories) {
        if (doc.y > doc.page.height - 140) doc.addPage()

        const frameX = margin + (s.frame - 1) * (storyColW + 8)
        const frameY = doc.y

        // Kader per story frame
        doc.rect(frameX, frameY, storyColW, 110).stroke(PAARS)

        // Frame nummer + type
        doc.fillColor(PAARS).font('Helvetica-Bold').fontSize(8)
           .text(`FRAME ${s.frame} — ${s.type.toUpperCase()}`, frameX + 6, frameY + 6, { width: storyColW - 12 })

        // Tekst op scherm
        doc.fillColor(DONKER).font('Helvetica-Bold').fontSize(9.5)
           .text(s.tekst, frameX + 6, frameY + 20, { width: storyColW - 12 })

        // Poll opties indien aanwezig
        if (s.interactie && s.interactie !== 'geen') {
          doc.fillColor(PAARS).font('Helvetica-Bold').fontSize(8)
             .text(s.interactie, frameX + 6, frameY + 50, { width: storyColW - 12 })
          if (s.optie_a) {
            doc.fillColor(GRIJS).font('Helvetica').fontSize(8)
               .text(`A: ${s.optie_a}  |  B: ${s.optie_b}`, frameX + 6, frameY + 63, { width: storyColW - 12 })
          }
        }

        // Achtergrond hint
        doc.fillColor(GRIJS).font('Helvetica-Oblique').fontSize(7.5)
           .text(`Achtergrond: ${s.achtergrond}`, frameX + 6, frameY + 78, { width: storyColW - 12 })

        // Doel
        doc.fillColor(GRIJS).font('Helvetica').fontSize(7.5)
           .text(s.doel, frameX + 6, frameY + 91, { width: storyColW - 12 })
      }

      doc.y = doc.y + 120
      doc.moveDown(0.5)
    }

    // ── Kalender: vandaag + morgen posten ───────────────────────
    const kalenderSections: { label: string; kleur: string; dagen: KalenderDag[] }[] = []
    if (briefing.kalender_vandaag?.length) {
      const vandaagNL = new Date(briefing.datum).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
      kalenderSections.push({ label: `Vandaag posten — ${vandaagNL.charAt(0).toUpperCase() + vandaagNL.slice(1)}`, kleur: GROEN, dagen: briefing.kalender_vandaag })
    }
    if (briefing.kalender_morgen?.length) {
      const morgenRaw = postDatumRaw
      const morgenNL = new Date(morgenRaw).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
      kalenderSections.push({ label: `Morgen posten — ${morgenNL.charAt(0).toUpperCase() + morgenNL.slice(1)}`, kleur: '#185FA5', dagen: briefing.kalender_morgen })
    }

    for (const sectie of kalenderSections) {
      doc.addPage()

      // Sectie header
      doc.rect(0, 0, pageW, 52).fill(sectie.kleur)
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16)
         .text(sectie.label, margin, 18)
      doc.y = 68

      for (const dag of sectie.dagen) {
        if (!dag.items?.length) continue
        if (doc.y > doc.page.height - 150) doc.addPage()

        // Platform naam
        const platformIcons: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' }
        doc.fillColor(sectie.kleur).font('Helvetica-Bold').fontSize(10)
           .text((platformIcons[dag.platform] ?? dag.platform).toUpperCase(), margin, doc.y)
        doc.rect(margin, doc.y + 2, 32, 1.5).fill(sectie.kleur)
        doc.moveDown(0.6)

        for (const item of dag.items) {
          if (doc.y > doc.page.height - 120) doc.addPage()

          // Item header: type + tijd
          doc.fillColor(DONKER).font('Helvetica-Bold').fontSize(11)
             .text(`${item.type.toUpperCase()}  ·  ${item.titel}`, margin, doc.y, { width: contentW - 80 })
          doc.fillColor(GRIJS).font('Helvetica').fontSize(9)
             .text(item.beste_tijd, margin + contentW - 60, doc.y - 12, { width: 60, align: 'right' })
          doc.moveDown(0.3)

          if (item.hook) {
            doc.fillColor(sectie.kleur).font('Helvetica-Bold').fontSize(8.5)
               .text('HOOK', margin, doc.y)
            doc.fillColor('#374151').font('Helvetica-Oblique').fontSize(10)
               .text(`"${item.hook}"`, margin, doc.y + 2, { width: contentW })
            doc.moveDown(0.5)
          }

          doc.fillColor(sectie.kleur).font('Helvetica-Bold').fontSize(8.5)
             .text('CAPTION', margin, doc.y)
          doc.fillColor('#374151').font('Helvetica').fontSize(9.5)
             .text(item.caption, margin, doc.y + 2, { width: contentW })
          doc.moveDown(0.3)

          if (item.hashtags?.length) {
            doc.fillColor(sectie.kleur).font('Helvetica').fontSize(8.5)
               .text(item.hashtags.map(h => `#${h.replace(/^#/, '')}`).join('  '), margin, doc.y, { width: contentW })
            doc.moveDown(0.3)
          }

          doc.rect(margin, doc.y, contentW, 0.5).fill('#e5e7eb')
          doc.moveDown(0.8)
        }
        doc.moveDown(0.5)
      }
    }

    // ── Footer (op elke pagina via addPage hook is complex — zet op laatste pagina) ──
    const footerY = doc.page.height - 32
    doc.rect(0, footerY - 4, pageW, 36).fill(DONKER)
    doc.fillColor('#6b7280').font('Helvetica').fontSize(8)
       .text('MentaForce · AI Content OS · Film vandaag · Post morgen', margin, footerY + 4)
    doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(8)
       .text(`Post: ${postDatumNL.charAt(0).toUpperCase() + postDatumNL.slice(1)}`, margin, footerY + 4, { width: contentW, align: 'right' })

    doc.end()
  })
}
