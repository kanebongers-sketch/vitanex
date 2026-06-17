// pdfkit is loaded via webpackIgnore dynamic import — prevents Turbopack from bundling
// it (which replaces __dirname with /ROOT/ and breaks AFM font file loading)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentConstructor = new (options?: Record<string, unknown>) => any

import type {
  WeekPlanning,
  WeekStrategieItem,
  ReelContent,
  CarouselContent,
  CarouselSlide,
  StoryFrame,
  TrendData,
  DagPlanning,
} from '@/app/api/content/weekplanning/route'

// ── Kleurenpalet ──────────────────────────────────────────────────────────
const ZWART = '#0A0A0A'
const WIT = '#FFFFFF'
const GROEN = '#22C55E'
const PAARS = '#7C3AED'
const ORANJE = '#F97316'
const GRIJS_LICHT = '#F4F4F5'
const GRIJS_MID = '#A1A1AA'
const GRIJS_DARK = '#3F3F46'
const BLAUW = '#3B82F6'

const A4_W = 595.28
const A4_H = 841.89
const MARGIN = 40

function contentBreedte(): number {
  return A4_W - MARGIN * 2
}

function dagKleur(format: string): string {
  if (format === 'reel') return GROEN
  if (format === 'carousel') return BLAUW
  return GRIJS_MID
}

// ── Helpers ───────────────────────────────────────────────────────────────

function schrijfWikkelTekst(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  tekst: string,
  x: number,
  y: number,
  breedte: number,
  opties: Record<string, unknown> = {}
): void {
  doc.text(tekst, x, y, { width: breedte, ...opties })
}

function chip(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  label: string,
  x: number,
  y: number,
  kleur: string,
  tekstKleur = WIT
): number {
  const breedte = doc.widthOfString(label) + 16
  doc.roundedRect(x, y, breedte, 18, 4).fill(kleur)
  doc.fillColor(tekstKleur).font('Helvetica-Bold').fontSize(8).text(label, x + 8, y + 5)
  return breedte + 6
}

function horizontaleLijn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  y: number,
  kleur = GRIJS_LICHT
): void {
  doc.moveTo(MARGIN, y).lineTo(A4_W - MARGIN, y).strokeColor(kleur).lineWidth(1).stroke()
}

// ── Kaft pagina ───────────────────────────────────────────────────────────

function maakKaft(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  weekplanning: WeekPlanning
): void {
  // Achtergrond
  doc.rect(0, 0, A4_W, A4_H).fill(ZWART)

  // Accent blok links
  doc.rect(0, 0, 8, A4_H).fill(GROEN)

  // Header
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(11).text('MENTAFORCE', MARGIN, 60)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(38)
     .text('WEEK', MARGIN, 85, { lineGap: 0 })
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(38)
     .text('PLANNING', MARGIN, 124)

  const startDatum = new Date(weekplanning.week_start)
  const eindDatum = new Date(weekplanning.week_start)
  eindDatum.setDate(eindDatum.getDate() + 6)

  const datumStr = `${startDatum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} – ${eindDatum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(12).text(datumStr, MARGIN, 170)

  // Scheidingslijn
  doc.moveTo(MARGIN, 200).lineTo(A4_W - MARGIN, 200).strokeColor(GRIJS_DARK).lineWidth(1).stroke()

  // Trends sectie
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(14).text('TRENDING DEZE WEEK', MARGIN, 220)
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(9)
     .text('Live opgehaald via web search', MARGIN, 238)

  const trends: TrendData = weekplanning.trends
  let tY = 258

  if (trends.samenvatting) {
    doc.fillColor(WIT).font('Helvetica').fontSize(10)
       .text(trends.samenvatting, MARGIN, tY, { width: contentBreedte(), lineGap: 2 })
    tY = doc.y + 14
  }

  if (trends.trending_topics?.length) {
    doc.fillColor(GRIJS_MID).font('Helvetica-Bold').fontSize(9).text('TRENDING TOPICS', MARGIN, tY)
    tY += 14
    let chipX = MARGIN
    for (const topic of trends.trending_topics.slice(0, 6)) {
      const w = doc.widthOfString(topic) + 16
      if (chipX + w > A4_W - MARGIN) { chipX = MARGIN; tY += 24 }
      doc.roundedRect(chipX, tY, w, 18, 4).fill(GRIJS_DARK)
      doc.fillColor(WIT).font('Helvetica').fontSize(8).text(topic, chipX + 8, tY + 5)
      chipX += w + 6
    }
    tY += 28
  }

  if (trends.viral_formats?.length) {
    doc.fillColor(GRIJS_MID).font('Helvetica-Bold').fontSize(9).text('VIRAL FORMATS', MARGIN, tY)
    tY += 14
    for (const fmt of trends.viral_formats.slice(0, 3)) {
      doc.fillColor(GROEN).font('Helvetica').fontSize(9).text('▶', MARGIN, tY)
      doc.fillColor(WIT).font('Helvetica').fontSize(9).text(fmt, MARGIN + 14, tY, { width: contentBreedte() - 14 })
      tY += doc.heightOfString(fmt, { width: contentBreedte() - 14 }) + 4
    }
  }

  // Weekoverzicht tabel
  const tabelY = Math.max(tY + 20, 540)
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(14).text('WEEKOVERZICHT', MARGIN, tabelY)

  const kolBreedte = contentBreedte() / 7
  const rijH = 44

  const dagNamen = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']
  for (let i = 0; i < 7; i++) {
    const x = MARGIN + i * kolBreedte
    const y = tabelY + 22

    const dag = weekplanning.dagen[i]
    const kleur = dag ? dagKleur(dag.strategie.format) : GRIJS_DARK
    doc.rect(x, y, kolBreedte - 2, rijH).fill(kleur === GROEN ? '#166534' : kleur === BLAUW ? '#1e3a5f' : GRIJS_DARK)

    doc.fillColor(kleur).font('Helvetica-Bold').fontSize(8).text(dagNamen[i], x + 6, y + 6)
    if (dag && dag.strategie.format !== 'rustdag') {
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7)
         .text(dag.strategie.format.toUpperCase(), x + 6, y + 18, { width: kolBreedte - 10 })
      const topicKort = dag.strategie.topic.length > 22 ? dag.strategie.topic.slice(0, 20) + '…' : dag.strategie.topic
      doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(6)
         .text(topicKort, x + 6, y + 29, { width: kolBreedte - 10 })
    } else if (dag?.strategie.format === 'rustdag') {
      doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(7).text('Rust', x + 6, y + 20)
    }
  }

  // Footer
  doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(8)
     .text('Gegenereerd door MentaForce Content Engine', MARGIN, A4_H - 40)
  const gegOp = new Date(weekplanning.gegenereerd_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)
  doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(8)
     .text(gegOp, A4_W - MARGIN - 150, A4_H - 40, { width: 150, align: 'right' })
}

// ── Reel pagina ───────────────────────────────────────────────────────────

function maakReelPagina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  dag: WeekStrategieItem,
  reel: ReelContent,
  stories: StoryFrame[],
  paginaNummer: number,
  totaalPaginas: number,
): void {
  doc.addPage()

  // Pagina header
  doc.rect(0, 0, A4_W, 52).fill(GROEN)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(9)
     .text('MENTAFORCE WEEKPLANNING', MARGIN, 12)

  const dagLabel = `${dag.dag_naam.toUpperCase()} ${dag.datum} — REEL`
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(16).text(dagLabel, MARGIN, 26)

  doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(8)
     .text(`Pagina ${paginaNummer} / ${totaalPaginas}`, A4_W - MARGIN - 60, 38)

  let y = 70

  // Titel + chips
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(18)
     .text(reel.titel ?? dag.topic, MARGIN, y, { width: contentBreedte() - 180 })

  let chipX = A4_W - MARGIN - 170
  chipX -= chip(doc, dag.beste_posttijd, chipX, y + 2, GRIJS_DARK)
  chip(doc, dag.locatie, chipX, y + 2, GRIJS_DARK)

  y = doc.y + 10

  // Hook blok
  doc.rect(MARGIN, y, contentBreedte(), 36).fill('#F0FDF4')
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(8).text('HOOK', MARGIN + 10, y + 6)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(11)
     .text(`"${reel.hook}"`, MARGIN + 10, y + 17, { width: contentBreedte() - 20 })
  y += 44

  // DM share trigger
  if (dag.dm_share_reden) {
    doc.fillColor(GRIJS_MID).font('Helvetica-Oblique').fontSize(8)
       .text(`📤 ${dag.dm_share_reden}`, MARGIN, y, { width: contentBreedte() })
    y = doc.y + 8
  }

  horizontaleLijn(doc, y)
  y += 10

  // Twee kolommen: Script + Productie
  const colW = (contentBreedte() - 14) / 2

  // Kolom 1: Script
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('SCRIPT', MARGIN, y)
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(7)
     .text(reel.duur_doel ?? '15–30s', MARGIN + 46, y + 2)
  y += 16

  doc.fillColor(ZWART).font('Helvetica').fontSize(9)
     .text(reel.script ?? '', MARGIN, y, { width: colW, lineGap: 3 })
  const scriptH = doc.heightOfString(reel.script ?? '', { width: colW, lineGap: 3 })

  // Kolom 2: Camera + kleding + licht
  const col2X = MARGIN + colW + 14
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('PRODUCTIE', col2X, y)

  let c2Y = y + 16
  if (reel.camera_opstelling) {
    doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(7).text('CAMERA', col2X, c2Y)
    c2Y += 10
    doc.fillColor(ZWART).font('Helvetica').fontSize(8)
       .text(reel.camera_opstelling, col2X, c2Y, { width: colW, lineGap: 2 })
    c2Y = doc.y + 8
  }
  if (reel.kleding) {
    doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(7).text('KLEDING', col2X, c2Y)
    c2Y += 10
    doc.fillColor(ZWART).font('Helvetica').fontSize(8).text(reel.kleding, col2X, c2Y, { width: colW })
    c2Y = doc.y + 8
  }
  if (reel.licht) {
    doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(7).text('LICHT', col2X, c2Y)
    c2Y += 10
    doc.fillColor(ZWART).font('Helvetica').fontSize(8).text(reel.licht, col2X, c2Y, { width: colW })
    c2Y = doc.y + 8
  }

  y = Math.max(y + scriptH, c2Y) + 10

  horizontaleLijn(doc, y)
  y += 10

  // Opname volgorde
  if (reel.opname_volgorde?.length) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('OPNAME VOLGORDE', MARGIN, y)
    y += 14
    reel.opname_volgorde.forEach((shot, i) => {
      doc.roundedRect(MARGIN, y, 18, 14, 3).fill(GROEN)
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7).text(String(i + 1), MARGIN + 6, y + 4)
      doc.fillColor(ZWART).font('Helvetica').fontSize(8).text(shot, MARGIN + 24, y + 3, { width: contentBreedte() - 24 })
      y += doc.heightOfString(shot, { width: contentBreedte() - 24 }) + 8
    })
    y += 4
  }

  // B-Roll
  if (reel.broll?.length) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('B-ROLL', MARGIN, y)
    y += 14
    const brollKolW = (contentBreedte() - 8) / 3
    reel.broll.forEach((br, i) => {
      const bx = MARGIN + (i % 3) * (brollKolW + 4)
      if (i % 3 === 0 && i > 0) y += 20
      const bY = i < 3 ? y : y
      doc.roundedRect(bx, bY, brollKolW, 16, 3).fill(GRIJS_LICHT)
      doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(7)
         .text(br, bx + 6, bY + 5, { width: brollKolW - 12 })
    })
    y += Math.ceil(reel.broll.length / 3) * 20 + 8
  }

  horizontaleLijn(doc, y)
  y += 10

  // CTA + caption + hashtags
  if (reel.cta) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('CTA', MARGIN, y)
    y += 12
    doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(10).text(reel.cta, MARGIN, y)
    y = doc.y + 10
  }

  if (reel.caption) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('INSTAGRAM CAPTION', MARGIN, y)
    y += 12
    doc.fillColor(ZWART).font('Helvetica').fontSize(9)
       .text(reel.caption, MARGIN, y, { width: contentBreedte(), lineGap: 2 })
    y = doc.y + 8
  }

  if (reel.hashtags?.length) {
    const hashStr = reel.hashtags.join(' ')
    doc.fillColor(BLAUW).font('Helvetica').fontSize(8)
       .text(hashStr, MARGIN, y, { width: contentBreedte() })
    y = doc.y + 10
  }

  if (reel.productie_tip) {
    doc.rect(MARGIN, y, contentBreedte(), 1).fill(ORANJE)
    y += 6
    doc.fillColor(ORANJE).font('Helvetica-Bold').fontSize(8).text('💡 PRODUCTIE TIP: ', MARGIN, y, { continued: true })
    doc.fillColor(ZWART).font('Helvetica').fontSize(8).text(reel.productie_tip, { width: contentBreedte() - 120 })
    y = doc.y + 10
  }

  // Stories sectie
  maakStoriesSectie(doc, stories, y)
}

// ── Carousel pagina ───────────────────────────────────────────────────────

function maakCarouselPagina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  dag: WeekStrategieItem,
  carousel: CarouselContent,
  stories: StoryFrame[],
  paginaNummer: number,
  totaalPaginas: number,
): void {
  doc.addPage()

  // Pagina header
  doc.rect(0, 0, A4_W, 52).fill(BLAUW)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(9).text('MENTAFORCE WEEKPLANNING', MARGIN, 12)

  const dagLabel = `${dag.dag_naam.toUpperCase()} ${dag.datum} — CAROUSEL`
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(16).text(dagLabel, MARGIN, 26)
  doc.fillColor('#93C5FD').font('Helvetica').fontSize(8)
     .text(`Pagina ${paginaNummer} / ${totaalPaginas}`, A4_W - MARGIN - 60, 38)

  let y = 70

  // Titel
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(18)
     .text(carousel.titel ?? dag.topic, MARGIN, y, { width: contentBreedte() - 120 })

  chip(doc, dag.beste_posttijd, A4_W - MARGIN - 70, y + 2, GRIJS_DARK)
  y = doc.y + 8

  if (carousel.concept) {
    doc.fillColor(GRIJS_DARK).font('Helvetica-Oblique').fontSize(9)
       .text(carousel.concept, MARGIN, y, { width: contentBreedte() })
    y = doc.y + 10
  }

  horizontaleLijn(doc, y)
  y += 10

  // DM-share reden
  if (dag.dm_share_reden) {
    doc.fillColor(GRIJS_MID).font('Helvetica-Oblique').fontSize(8)
       .text(`📤 ${dag.dm_share_reden}`, MARGIN, y, { width: contentBreedte() })
    y = doc.y + 10
  }

  // Slides
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(12).text('SLIDES', MARGIN, y)
  y += 16

  const slides: CarouselSlide[] = carousel.slides ?? []
  const slideKolB = (contentBreedte() - (Math.min(slides.length, 3) - 1) * 6) / Math.min(slides.length, 3)
  const MAX_PER_RIJ = 3

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i]
    const kolIndex = i % MAX_PER_RIJ
    if (i > 0 && kolIndex === 0) y += 4

    const sx = MARGIN + kolIndex * (slideKolB + 6)
    const slideH = 100

    const bgKleur = s.achtergrond_kleur === 'donker' ? GRIJS_DARK
      : s.achtergrond_kleur === 'groen' ? '#166534'
      : s.achtergrond_kleur === 'wit' ? GRIJS_LICHT
      : GRIJS_LICHT

    doc.roundedRect(sx, y, slideKolB, slideH, 5).fill(bgKleur)

    // Slide nummer chip
    const numKleur = s.type === 'hook' ? GROEN : BLAUW
    doc.roundedRect(sx + 6, y + 6, 20, 14, 3).fill(numKleur)
    doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7)
       .text(String(s.nummer), sx + 10, y + 10)

    const isLicht = bgKleur === GRIJS_LICHT
    const tekstKleur = isLicht ? ZWART : WIT

    doc.fillColor(tekstKleur).font('Helvetica-Bold').fontSize(8)
       .text(s.hoofd_tekst ?? '', sx + 6, y + 24, { width: slideKolB - 12, lineGap: 1 })

    if (s.sub_tekst) {
      const subY = Math.min(doc.y + 2, y + 60)
      doc.fillColor(isLicht ? GRIJS_DARK : '#D4D4D8').font('Helvetica').fontSize(6)
         .text(s.sub_tekst, sx + 6, subY, { width: slideKolB - 12 })
    }

    doc.fillColor(isLicht ? GRIJS_DARK : GRIJS_MID).font('Helvetica').fontSize(6)
       .text(s.visual ?? '', sx + 6, y + slideH - 20, { width: slideKolB - 12 })

    if (kolIndex === MAX_PER_RIJ - 1 || i === slides.length - 1) {
      y += slideH + 8
    }
  }

  y += 6

  horizontaleLijn(doc, y)
  y += 10

  // Caption + hashtags
  if (carousel.caption) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('INSTAGRAM CAPTION', MARGIN, y)
    y += 12
    doc.fillColor(ZWART).font('Helvetica').fontSize(9)
       .text(carousel.caption, MARGIN, y, { width: contentBreedte(), lineGap: 2 })
    y = doc.y + 8
  }

  if (carousel.hashtags?.length) {
    doc.fillColor(BLAUW).font('Helvetica').fontSize(8)
       .text(carousel.hashtags.join(' '), MARGIN, y, { width: contentBreedte() })
    y = doc.y + 8
  }

  if (carousel.design_tip) {
    doc.rect(MARGIN, y, contentBreedte(), 1).fill(BLAUW)
    y += 6
    doc.fillColor(BLAUW).font('Helvetica-Bold').fontSize(8).text('🎨 DESIGN TIP: ', MARGIN, y, { continued: true })
    doc.fillColor(ZWART).font('Helvetica').fontSize(8).text(carousel.design_tip, { width: contentBreedte() - 100 })
    y = doc.y + 10
  }

  maakStoriesSectie(doc, stories, y)
}

// ── Stories sectie (gedeeld) ──────────────────────────────────────────────

function maakStoriesSectie(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  stories: StoryFrame[],
  y: number,
): void {
  if (!stories?.length) return

  // Zorg dat we genoeg ruimte hebben
  if (y > A4_H - 160) {
    doc.addPage()
    y = MARGIN
  }

  doc.rect(MARGIN, y, contentBreedte(), 24).fill(PAARS)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(10)
     .text('📱  INSTAGRAM STORIES', MARGIN + 10, y + 8)
  y += 30

  const storyKolW = (contentBreedte() - 10) / Math.min(stories.length, 3)

  for (const s of stories.slice(0, 3)) {
    const sx = MARGIN + (s.frame - 1) * (storyKolW + 5)
    const frameH = 110

    doc.roundedRect(sx, y, storyKolW, frameH, 5).stroke(PAARS)

    // Frame nr
    doc.roundedRect(sx + 6, y + 6, 20, 14, 3).fill(PAARS)
    doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7).text(String(s.frame), sx + 11, y + 10)

    // Type badge
    const typKleur = s.type === 'poll' ? ORANJE : s.type === 'cta' ? GROEN : BLAUW
    chip(doc, s.type.toUpperCase(), sx + 30, y + 8, typKleur)

    let sY = y + 26
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(8)
       .text(s.tekst ?? '', sx + 6, sY, { width: storyKolW - 12, lineGap: 1 })
    sY = doc.y + 4

    if (s.interactie) {
      doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(7)
         .text(s.interactie, sx + 6, sY, { width: storyKolW - 12 })
      sY = doc.y + 2
    }

    if (s.optie_a || s.optie_b) {
      const opBreedte = (storyKolW - 18) / 2
      doc.roundedRect(sx + 6, sY, opBreedte, 12, 2).fill(ORANJE)
      doc.fillColor(WIT).font('Helvetica').fontSize(6)
         .text(s.optie_a ?? 'Ja', sx + 8, sY + 4, { width: opBreedte - 4 })
      doc.roundedRect(sx + 8 + opBreedte, sY, opBreedte, 12, 2).fill(GRIJS_DARK)
      doc.fillColor(WIT).font('Helvetica').fontSize(6)
         .text(s.optie_b ?? 'Nee', sx + 10 + opBreedte, sY + 4, { width: opBreedte - 4 })
      sY += 16
    }

    if (s.doel) {
      doc.fillColor(GRIJS_MID).font('Helvetica-Oblique').fontSize(6)
         .text(s.doel, sx + 6, Math.max(sY, y + frameH - 18), { width: storyKolW - 12 })
    }

    if (s.achtergrond) {
      doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(6)
         .text(`achtergrond: ${s.achtergrond}`, sx + 6, y + frameH - 10, { width: storyKolW - 12 })
    }
  }
}

// ── Rustdag pagina (compact) ──────────────────────────────────────────────

function maakRustdagPagina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  dag: WeekStrategieItem,
  paginaNummer: number,
  totaalPaginas: number,
): void {
  doc.addPage()

  doc.rect(0, 0, A4_W, 52).fill(GRIJS_DARK)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(9).text('MENTAFORCE WEEKPLANNING', MARGIN, 12)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(16)
     .text(`${dag.dag_naam.toUpperCase()} ${dag.datum} — RUSTDAG`, MARGIN, 26)
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(8)
     .text(`Pagina ${paginaNummer} / ${totaalPaginas}`, A4_W - MARGIN - 60, 38)

  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(14)
     .text('Geen content gepland voor vandaag. Herstel, laden, herladen.', MARGIN, 100, { width: contentBreedte(), align: 'center' })
}

// ── Hoofd export ──────────────────────────────────────────────────────────

export async function generateWeekplanningPDF(weekplanning: WeekPlanning): Promise<Buffer> {
  const { default: PDFDocumentClass } = await import(
    /* webpackIgnore: true */
    'pdfkit'
  ) as { default: PDFDocumentConstructor }

  const doc = new PDFDocumentClass({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    autoFirstPage: false,
    info: {
      Title: `MentaForce Weekplanning ${weekplanning.week_start}`,
      Author: 'MentaForce Content Engine',
      Subject: 'Instagram & Fitness Content Weekplanning',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  // Bereken totaal pagina's: 1 kaft + 7 dag-pagina's
  const totaalPaginas = 1 + weekplanning.dagen.filter(d => d.strategie.format !== 'rustdag').length
    + weekplanning.dagen.filter(d => d.strategie.format === 'rustdag').length

  maakKaft(doc, weekplanning)

  let paginaNummer = 2
  for (const dagPlanning of weekplanning.dagen as DagPlanning[]) {
    const { strategie, content, stories } = dagPlanning

    if (strategie.format === 'reel') {
      maakReelPagina(doc, strategie, content as ReelContent, stories, paginaNummer, totaalPaginas)
    } else if (strategie.format === 'carousel') {
      maakCarouselPagina(doc, strategie, content as CarouselContent, stories, paginaNummer, totaalPaginas)
    } else {
      maakRustdagPagina(doc, strategie, paginaNummer, totaalPaginas)
    }

    paginaNummer++
  }

  doc.end()

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

// Suppress unused variable warning — schrijfWikkelTekst is a shared helper
void schrijfWikkelTekst
