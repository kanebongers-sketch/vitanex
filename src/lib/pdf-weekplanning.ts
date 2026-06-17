// pdfkit is loaded via webpackIgnore dynamic import — prevents Turbopack from bundling
// it (which replaces __dirname with /ROOT/ and breaks AFM font file loading)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentConstructor = new (options?: Record<string, unknown>) => any

import type {
  WeekPlanning,
  WeekStrategieItem,
  ReelContent,
  StoryFrame,
  TrendData,
  DagPlanning,
  ReelPlanning,
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

const A4_W = 595.28
const A4_H = 841.89
const MARGIN = 40

function contentBreedte(): number {
  return A4_W - MARGIN * 2
}

// ── Helpers ───────────────────────────────────────────────────────────────

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
  doc.addPage()

  doc.rect(0, 0, A4_W, A4_H).fill(ZWART)
  doc.rect(0, 0, 8, A4_H).fill(GROEN)

  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(11).text('MENTAFORCE', MARGIN, 60)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(38).text('WEEK', MARGIN, 85, { lineGap: 0 })
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(38).text('PLANNING', MARGIN, 124)

  const startDatum = new Date(weekplanning.week_start)
  const eindDatum = new Date(weekplanning.week_start)
  eindDatum.setDate(eindDatum.getDate() + 6)

  const datumStr = `${startDatum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} – ${eindDatum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(12).text(datumStr, MARGIN, 170)

  // Reels badge
  doc.roundedRect(MARGIN, 196, 130, 22, 4).fill(GROEN)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(11).text('🎬 18 REELS DEZE WEEK', MARGIN + 8, 202)

  doc.moveTo(MARGIN, 230).lineTo(A4_W - MARGIN, 230).strokeColor(GRIJS_DARK).lineWidth(1).stroke()

  // Trends sectie
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(14).text('TRENDING DEZE WEEK', MARGIN, 248)
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(9).text('Live opgehaald via web search', MARGIN, 266)

  const trends: TrendData = weekplanning.trends
  let tY = 286

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

  // Weekoverzicht tabel
  const tabelY = Math.max(tY + 20, 560)
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(14).text('WEEKOVERZICHT', MARGIN, tabelY)

  const dagNamen = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']
  const kolBreedte = contentBreedte() / 7
  const rijH = 52

  for (let i = 0; i < 7; i++) {
    const x = MARGIN + i * kolBreedte
    const y = tabelY + 22
    const dag = weekplanning.dagen[i]
    const isRust = i === 6 || !dag || dag.reels.length === 0

    doc.rect(x, y, kolBreedte - 2, rijH).fill(isRust ? GRIJS_DARK : '#166534')

    doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(8).text(dagNamen[i], x + 4, y + 5)

    if (!isRust && dag) {
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7).text('3 REELS', x + 4, y + 17)
      const eersteReel = dag.reels[0]?.strategie?.topic ?? ''
      const topicKort = eersteReel.length > 20 ? eersteReel.slice(0, 18) + '…' : eersteReel
      doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(5.5)
         .text(topicKort, x + 4, y + 28, { width: kolBreedte - 8 })
      const posttijden = dag.reels.map(r => r.strategie?.posttijd ?? '').filter(Boolean).join(' · ')
      doc.fillColor(GROEN).font('Helvetica').fontSize(5)
         .text(posttijden, x + 4, y + 40, { width: kolBreedte - 8 })
    } else {
      doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(7).text('Rust', x + 4, y + 22)
    }
  }

  // Footer
  doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(8)
     .text('Gegenereerd door MentaForce Content Engine', MARGIN, A4_H - 40)
  const gegOp = new Date(weekplanning.gegenereerd_op).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  } as Intl.DateTimeFormatOptions)
  doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(8)
     .text(gegOp, A4_W - MARGIN - 150, A4_H - 40, { width: 150, align: 'right' })
}

// ── Reel pagina ───────────────────────────────────────────────────────────

function maakReelPagina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  strategie: WeekStrategieItem,
  reel: ReelContent,
  reelNummer: number,
  stories: StoryFrame[],
  paginaNummer: number,
  totaalPaginas: number,
): void {
  doc.addPage()

  // Hoofd header balk
  doc.rect(0, 0, A4_W, 52).fill(GROEN)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(9).text('MENTAFORCE WEEKPLANNING', MARGIN, 12)

  const dagLabel = `${strategie.dag_naam.toUpperCase()} ${strategie.datum} — REEL ${reelNummer}/3`
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(15).text(dagLabel, MARGIN, 26)
  doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(8)
     .text(`${paginaNummer} / ${totaalPaginas}`, A4_W - MARGIN - 40, 38)

  let y = 66

  // Reel nummer indicator
  doc.roundedRect(MARGIN, y, 60, 24, 4).fill(GROEN)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(12).text(`REEL ${reelNummer}`, MARGIN + 8, y + 7)

  // Posttijd chip
  chip(doc, `🕐 ${strategie.posttijd ?? ''}`, MARGIN + 68, y + 4, GRIJS_DARK)
  chip(doc, strategie.locatie ?? '', A4_W - MARGIN - 80, y + 4, GRIJS_DARK)

  y += 32

  // Titel
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(17)
     .text(reel.titel ?? strategie.topic, MARGIN, y, { width: contentBreedte() })
  y = doc.y + 6

  // Hook blok
  doc.rect(MARGIN, y, contentBreedte(), 40).fill('#F0FDF4')
  doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(8).text('OPENING HOOK', MARGIN + 10, y + 6)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(11)
     .text(`"${reel.hook ?? ''}"`, MARGIN + 10, y + 17, { width: contentBreedte() - 20 })
  y += 48

  // DM share reden
  if (strategie.dm_share_reden) {
    doc.fillColor(GRIJS_MID).font('Helvetica-Oblique').fontSize(8)
       .text(`📤 Waarom doorsturen: ${strategie.dm_share_reden}`, MARGIN, y, { width: contentBreedte() })
    y = doc.y + 8
  }

  horizontaleLijn(doc, y)
  y += 10

  // Twee kolommen: Script + Productie
  const colW = (contentBreedte() - 14) / 2

  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('SCRIPT', MARGIN, y)
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(7).text(reel.duur_doel ?? '15–30s', MARGIN + 46, y + 2)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('PRODUCTIE', MARGIN + colW + 14, y)
  y += 16

  const scriptStartY = y
  doc.fillColor(ZWART).font('Helvetica').fontSize(9)
     .text(reel.script ?? '', MARGIN, y, { width: colW, lineGap: 3 })
  const scriptH = doc.heightOfString(reel.script ?? '', { width: colW, lineGap: 3 })

  const col2X = MARGIN + colW + 14
  let c2Y = scriptStartY

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

  y = Math.max(scriptStartY + scriptH, c2Y) + 10

  horizontaleLijn(doc, y)
  y += 10

  // Opname volgorde
  if (reel.opname_volgorde?.length) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('OPNAME VOLGORDE', MARGIN, y)
    y += 14
    reel.opname_volgorde.forEach((shot, i) => {
      doc.roundedRect(MARGIN, y, 18, 14, 3).fill(GROEN)
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7).text(String(i + 1), MARGIN + 6, y + 4)
      doc.fillColor(ZWART).font('Helvetica').fontSize(8)
         .text(shot, MARGIN + 24, y + 3, { width: contentBreedte() - 24 })
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
      doc.roundedRect(bx, y, brollKolW, 16, 3).fill(GRIJS_LICHT)
      doc.fillColor(GRIJS_DARK).font('Helvetica').fontSize(7)
         .text(br, bx + 6, y + 5, { width: brollKolW - 12 })
    })
    y += Math.ceil(reel.broll.length / 3) * 20 + 8
  }

  horizontaleLijn(doc, y)
  y += 10

  // CTA + Caption + Hashtags
  if (reel.cta) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('CTA', MARGIN, y)
    y += 12
    doc.fillColor(GROEN).font('Helvetica-Bold').fontSize(10).text(reel.cta, MARGIN, y)
    y = doc.y + 10
  }

  if (reel.caption) {
    doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('CAPTION', MARGIN, y)
    y += 12
    doc.fillColor(ZWART).font('Helvetica').fontSize(9)
       .text(reel.caption, MARGIN, y, { width: contentBreedte(), lineGap: 2 })
    y = doc.y + 8
  }

  if (reel.hashtags?.length) {
    doc.fillColor('#3B82F6').font('Helvetica').fontSize(8)
       .text(reel.hashtags.join(' '), MARGIN, y, { width: contentBreedte() })
    y = doc.y + 10
  }

  if (reel.productie_tip) {
    doc.rect(MARGIN, y, contentBreedte(), 1).fill(ORANJE)
    y += 6
    doc.fillColor(ORANJE).font('Helvetica-Bold').fontSize(8).text('💡 TIP: ', MARGIN, y, { continued: true })
    doc.fillColor(ZWART).font('Helvetica').fontSize(8).text(reel.productie_tip, { width: contentBreedte() - 60 })
    y = doc.y + 10
  }

  // Stories alleen op de laatste reel van de dag
  if (stories?.length) {
    maakStoriesSectie(doc, stories, y)
  }
}

// ── Stories sectie ────────────────────────────────────────────────────────

function maakStoriesSectie(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  stories: StoryFrame[],
  y: number,
): void {
  if (!stories?.length) return

  if (y > A4_H - 160) {
    doc.addPage()
    y = MARGIN
  }

  doc.rect(MARGIN, y, contentBreedte(), 24).fill(PAARS)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(10).text('📱  INSTAGRAM STORIES', MARGIN + 10, y + 8)
  y += 30

  const storyKolW = (contentBreedte() - 10) / Math.min(stories.length, 3)

  for (const s of stories.slice(0, 3)) {
    const sx = MARGIN + (s.frame - 1) * (storyKolW + 5)
    const frameH = 110

    doc.roundedRect(sx, y, storyKolW, frameH, 5).stroke(PAARS)

    doc.roundedRect(sx + 6, y + 6, 20, 14, 3).fill(PAARS)
    doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7).text(String(s.frame), sx + 11, y + 10)

    const typKleur = s.type === 'poll' ? ORANJE : s.type === 'cta' ? GROEN : '#3B82F6'
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
         .text(`bg: ${s.achtergrond}`, sx + 6, y + frameH - 10, { width: storyKolW - 12 })
    }
  }
}

// ── Rustdag pagina ────────────────────────────────────────────────────────

function maakRustdagPagina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  dagNaam: string,
  datum: string,
  paginaNummer: number,
  totaalPaginas: number,
): void {
  doc.addPage()

  doc.rect(0, 0, A4_W, 52).fill(GRIJS_DARK)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(9).text('MENTAFORCE WEEKPLANNING', MARGIN, 12)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(16)
     .text(`${dagNaam.toUpperCase()} ${datum} — RUSTDAG`, MARGIN, 26)
  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(8)
     .text(`${paginaNummer} / ${totaalPaginas}`, A4_W - MARGIN - 40, 38)

  doc.fillColor(GRIJS_MID).font('Helvetica').fontSize(14)
     .text('Geen content gepland vandaag. Herstel, laden, voorbereiden.', MARGIN, 110, {
       width: contentBreedte(), align: 'center',
     })
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
      Subject: 'Instagram Reels Weekplanning',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  // Totaal: 1 kaft + 3 reel-pagina's per actieve dag + 1 rustdag (zondag)
  const actieveDagen = weekplanning.dagen.filter(d => d.reels.length > 0)
  const totaalPaginas = 1 + actieveDagen.length * 3 + 1

  maakKaft(doc, weekplanning)

  let paginaNummer = 2

  for (const dagPlanning of weekplanning.dagen as DagPlanning[]) {
    if (dagPlanning.reels.length === 0) {
      // Rustdag
      maakRustdagPagina(doc, dagPlanning.dag_naam, dagPlanning.datum, paginaNummer, totaalPaginas)
      paginaNummer++
      continue
    }

    const reels: ReelPlanning[] = dagPlanning.reels
    for (let i = 0; i < reels.length; i++) {
      const { strategie, content } = reels[i]
      const isLaatsteReel = i === reels.length - 1
      maakReelPagina(
        doc,
        strategie,
        content,
        i + 1,
        isLaatsteReel ? dagPlanning.stories : [],
        paginaNummer,
        totaalPaginas,
      )
      paginaNummer++
    }
  }

  doc.end()

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}
