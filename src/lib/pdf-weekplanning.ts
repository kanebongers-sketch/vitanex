// pdfkit is loaded via webpackIgnore dynamic import — prevents Turbopack from bundling it
type PDFDoc = PDFKit.PDFDocument
type PDFDocumentConstructor = new (options?: PDFKit.PDFDocumentOptions) => PDFDoc

import type {
  WeekPlanning,
  WeekStrategieItem,
  ReelContent,
  StoryFrame,
  TrendData,
  DagPlanning,
  ReelPlanning,
} from '@/app/api/content/weekplanning/route'

// ── Kleuren ───────────────────────────────────────────────────────────────
// PDFKit kent geen CSS-variabelen, dus hier staan letterlijke hexwaarden die
// theme.ts spiegelen. Twee-tonig systeem: NAVY (COLORS.navy) voor vlakken en
// kleine tekst op wit; CYAAN (COLORS.cyan) alléén als groot accent op donkere
// vlakken — op wit haalt cyaan geen AA-contrast. Hiërarchie via grijstinten,
// niet via extra kleuren.
const ZWART   = '#0A0A0A'
const WIT     = '#FFFFFF'
const CYAAN   = '#00E5FF'
const NAVY    = '#0B1B3A'
const NAVY_BG = '#EDF2FB'
const GRIJS_L  = '#F4F4F5'
const GRIJS_M  = '#A1A1AA'
const GRIJS_D  = '#3F3F46'

const A4_W  = 595.28
const A4_H  = 841.89
const MAR   = 40
const CON_W = A4_W - MAR * 2   // 515.28

// Tekst afkappen zodat PDFKit nooit een auto-pagina-break maakt
function kap(str: string | undefined, max: number): string {
  const s = (str ?? '').replace(/\n/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

// ── Chip ──────────────────────────────────────────────────────────────────
function chip(doc: PDFDoc, label: string, x: number, y: number, bg: string, fg = WIT): number {
  const w = Math.min(doc.widthOfString(label) + 14, 160)
  doc.roundedRect(x, y, w, 16, 3).fill(bg)
  doc.fillColor(fg).font('Helvetica-Bold').fontSize(7).text(label, x + 7, y + 5, { width: w - 10, lineBreak: false })
  return w + 4
}

function lijn(doc: PDFDoc, y: number, kleur = GRIJS_L): void {
  doc.moveTo(MAR, y).lineTo(A4_W - MAR, y).strokeColor(kleur).lineWidth(0.5).stroke()
}

function label(doc: PDFDoc, tekst: string, x: number, y: number, kleur = NAVY): void {
  doc.fillColor(kleur).font('Helvetica-Bold').fontSize(7).text(tekst, x, y, { lineBreak: false })
}

// ── Kaft ──────────────────────────────────────────────────────────────────
function maakKaft(doc: PDFDoc, wp: WeekPlanning): void {
  doc.addPage()
  doc.rect(0, 0, A4_W, A4_H).fill(ZWART)
  doc.rect(0, 0, 6, A4_H).fill(CYAAN)

  // Titel
  doc.fillColor(CYAAN).font('Helvetica-Bold').fontSize(10).text('MENTAFORCE', MAR, 55, { lineBreak: false })
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(36).text('WEEK', MAR, 78, { lineBreak: false })
  doc.fillColor(CYAAN).font('Helvetica-Bold').fontSize(36).text('PLANNING', MAR, 114, { lineBreak: false })

  const s = new Date(wp.week_start)
  const e = new Date(wp.week_start); e.setDate(e.getDate() + 6)
  doc.fillColor(GRIJS_M).font('Helvetica').fontSize(11)
     .text(`${s.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} – ${e.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`, MAR, 158, { lineBreak: false })

  // Badge
  doc.roundedRect(MAR, 180, 148, 20, 4).fill(CYAAN)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10).text('🎬  18 REELS DEZE WEEK', MAR + 8, 186, { lineBreak: false })

  doc.moveTo(MAR, 212).lineTo(A4_W - MAR, 212).strokeColor(GRIJS_D).lineWidth(0.5).stroke()

  // Trends
  const trends: TrendData = wp.trends
  doc.fillColor(CYAAN).font('Helvetica-Bold').fontSize(13).text('TRENDING DEZE WEEK', MAR, 224, { lineBreak: false })
  doc.fillColor(GRIJS_M).font('Helvetica').fontSize(8).text('Live opgehaald via web search', MAR, 241, { lineBreak: false })

  if (trends.samenvatting) {
    doc.fillColor(WIT).font('Helvetica').fontSize(9)
       .text(kap(trends.samenvatting, 280), MAR, 256, { width: CON_W, lineBreak: false })
  }

  // Topic chips
  let tY = 278
  if (trends.trending_topics?.length) {
    doc.fillColor(GRIJS_M).font('Helvetica-Bold').fontSize(8).text('TRENDING TOPICS', MAR, tY, { lineBreak: false })
    tY += 12
    let cX = MAR
    for (const t of trends.trending_topics.slice(0, 7)) {
      const w = doc.widthOfString(t) + 14
      if (cX + w > A4_W - MAR) { cX = MAR; tY += 20 }
      doc.roundedRect(cX, tY, w, 16, 3).fill(GRIJS_D)
      doc.fillColor(WIT).font('Helvetica').fontSize(7).text(t, cX + 7, tY + 5, { lineBreak: false })
      cX += w + 4
    }
    tY += 24
  }

  if (trends.viral_formats?.length) {
    doc.fillColor(GRIJS_M).font('Helvetica-Bold').fontSize(8).text('VIRAL FORMATS', MAR, tY, { lineBreak: false })
    tY += 12
    for (const f of trends.viral_formats.slice(0, 3)) {
      doc.fillColor(CYAAN).font('Helvetica').fontSize(8).text('▸', MAR, tY, { lineBreak: false })
      doc.fillColor(WIT).font('Helvetica').fontSize(8).text(kap(f, 90), MAR + 12, tY, { lineBreak: false })
      tY += 14
    }
    tY += 4
  }

  // Weekoverzicht tabel
  const tabelY = Math.max(tY + 20, 560)
  doc.fillColor(CYAAN).font('Helvetica-Bold').fontSize(13).text('WEEKOVERZICHT', MAR, tabelY, { lineBreak: false })

  const kol = CON_W / 7
  const rijH = 56
  const dagNamen = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']

  for (let i = 0; i < 7; i++) {
    const x = MAR + i * kol
    const y = tabelY + 20
    const dag = wp.dagen[i]
    const actief = dag?.reels?.length > 0

    doc.rect(x, y, kol - 2, rijH).fill(actief ? NAVY : GRIJS_D)
    doc.fillColor(actief ? CYAAN : GRIJS_L).font('Helvetica-Bold').fontSize(8)
       .text(dagNamen[i], x + 4, y + 5, { lineBreak: false })

    if (actief && dag) {
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7).text('3 REELS', x + 4, y + 18, { lineBreak: false })
      const topic = kap(dag.reels[0]?.strategie?.topic, 22)
      doc.fillColor(GRIJS_M).font('Helvetica').fontSize(5.5).text(topic, x + 4, y + 30, { width: kol - 8, lineBreak: false })
      const tijden = dag.reels.map(r => r.strategie?.posttijd ?? '').filter(Boolean).join('·')
      doc.fillColor(CYAAN).font('Helvetica').fontSize(5).text(tijden, x + 4, y + 43, { lineBreak: false })
    } else {
      doc.fillColor(GRIJS_L).font('Helvetica').fontSize(7).text('Rust', x + 4, y + 24, { lineBreak: false })
    }
  }

  // Footer — GRIJS_M: donkerder grijs haalt op zwart geen AA-contrast
  doc.fillColor(GRIJS_M).font('Helvetica').fontSize(7)
     .text('MentaForce Content Engine', MAR, A4_H - 36, { lineBreak: false })
  doc.fillColor(GRIJS_M).font('Helvetica').fontSize(7)
     .text(new Date(wp.gegenereerd_op).toLocaleDateString('nl-NL'), A4_W - MAR - 80, A4_H - 36, { lineBreak: false })
}

// ── Reel pagina (compact, overflow-safe) ─────────────────────────────────
function maakReelPagina(
  doc: PDFDoc,
  strategie: WeekStrategieItem,
  reel: ReelContent,
  reelNr: number,
  verhaalVoegToe: boolean,
  stories: StoryFrame[],
  pagNr: number,
  totaal: number,
): void {
  doc.addPage()

  // Header balk
  doc.rect(0, 0, A4_W, 50).fill(NAVY)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(8)
     .text('MENTAFORCE WEEKPLANNING', MAR, 10, { lineBreak: false })
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(15)
     .text(`${kap(strategie.dag_naam, 20).toUpperCase()} ${strategie.datum} — REEL ${reelNr}/3`, MAR, 24, { lineBreak: false })
  doc.fillColor(GRIJS_M).font('Helvetica').fontSize(8)
     .text(`${pagNr}/${totaal}`, A4_W - MAR - 30, 38, { lineBreak: false })

  let y = 60

  // Reel badge + chips
  doc.roundedRect(MAR, y, 56, 22, 3).fill(CYAAN)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(12)
     .text(`REEL ${reelNr}`, MAR + 6, y + 6, { lineBreak: false })

  let cX = MAR + 62
  if (strategie.posttijd) cX += chip(doc, `🕐 ${strategie.posttijd}`, cX, y + 3, GRIJS_D)
  if (strategie.locatie)  chip(doc, strategie.locatie, cX, y + 3, GRIJS_D)

  y += 30

  // Titel
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(16)
     .text(kap(reel.titel ?? strategie.topic, 60), MAR, y, { width: CON_W, lineBreak: false })
  y += 22

  // Hook blok
  doc.rect(MAR, y, CON_W, 38).fill(NAVY_BG)
  label(doc, 'OPENING HOOK', MAR + 8, y + 5)
  doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(10)
     .text(`"${kap(reel.hook, 100)}"`, MAR + 8, y + 16, { width: CON_W - 16, lineBreak: false })
  y += 46

  // DM share
  if (strategie.dm_share_reden) {
    doc.fillColor(GRIJS_D).font('Helvetica-Oblique').fontSize(8)
       .text(`📤 ${kap(strategie.dm_share_reden, 120)}`, MAR, y, { width: CON_W, lineBreak: false })
    y += 14
  }

  lijn(doc, y); y += 8

  // Script (links) + Productie (rechts) — vaste hoogte
  const colW = (CON_W - 12) / 2
  const col2 = MAR + colW + 12

  label(doc, 'SCRIPT', MAR, y)
  doc.fillColor(GRIJS_D).font('Helvetica').fontSize(7).text(reel.duur_doel ?? '20s', MAR + 42, y + 1, { lineBreak: false })
  label(doc, 'PRODUCTIE', col2, y)
  y += 12

  // Script: max 5 regels van ~80 chars elk = ~400 tekens, fontSize 8.5 ≈ 12px per lijn = 60px
  const scriptTekst = kap(reel.script, 380)
  doc.fillColor(ZWART).font('Helvetica').fontSize(8.5)
     .text(scriptTekst, MAR, y, { width: colW, lineBreak: false })

  // Productie rechts
  let pY = y
  const prodItems = [
    { lbl: 'CAMERA', val: reel.camera_opstelling },
    { lbl: 'KLEDING', val: reel.kleding },
    { lbl: 'LICHT', val: reel.licht },
  ]
  for (const p of prodItems) {
    if (!p.val) continue
    label(doc, p.lbl, col2, pY)
    pY += 10
    doc.fillColor(ZWART).font('Helvetica').fontSize(7.5)
       .text(kap(p.val, 90), col2, pY, { width: colW, lineBreak: false })
    pY += 14
  }

  y += 62   // vaste hoogte voor script + productie kolom
  lijn(doc, y); y += 8

  // Opname volgorde — max 4 shots, vaste hoogte per shot
  if (reel.opname_volgorde?.length) {
    label(doc, 'OPNAME VOLGORDE', MAR, y)
    y += 11
    for (const [i, shot] of reel.opname_volgorde.slice(0, 4).entries()) {
      doc.roundedRect(MAR, y, 16, 13, 2).fill(NAVY)
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(7).text(String(i + 1), MAR + 5, y + 4, { lineBreak: false })
      doc.fillColor(ZWART).font('Helvetica').fontSize(8)
         .text(kap(shot, 90), MAR + 20, y + 3, { width: CON_W - 20, lineBreak: false })
      y += 16
    }
    y += 4
  }

  // B-roll — chips in 1 rij
  if (reel.broll?.length) {
    label(doc, 'B-ROLL', MAR, y)
    y += 11
    const bKol = (CON_W - 8) / 3
    for (const [i, br] of reel.broll.slice(0, 3).entries()) {
      const bx = MAR + i * (bKol + 4)
      doc.roundedRect(bx, y, bKol, 15, 2).fill(GRIJS_L)
      doc.fillColor(GRIJS_D).font('Helvetica').fontSize(6.5)
         .text(kap(br, 45), bx + 5, y + 5, { width: bKol - 10, lineBreak: false })
    }
    y += 22
  }

  lijn(doc, y); y += 8

  // CTA + Hashtags naast elkaar
  if (reel.cta) {
    label(doc, 'CTA', MAR, y)
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
       .text(kap(reel.cta, 80), MAR + 24, y - 1, { lineBreak: false })
    y += 16
  }

  if (reel.caption) {
    label(doc, 'CAPTION', MAR, y)
    y += 10
    doc.fillColor(ZWART).font('Helvetica').fontSize(8.5)
       .text(kap(reel.caption, 200), MAR, y, { width: CON_W, lineBreak: false })
    y += 24
  }

  if (reel.hashtags?.length) {
    doc.fillColor(NAVY).font('Helvetica').fontSize(7.5)
       .text(reel.hashtags.slice(0, 6).join(' '), MAR, y, { width: CON_W, lineBreak: false })
    y += 14
  }

  if (reel.productie_tip) {
    doc.rect(MAR, y, CON_W, 1).fill(NAVY)
    y += 5
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(7.5)
       .text('💡 TIP  ', MAR, y, { continued: false, lineBreak: false })
    doc.fillColor(ZWART).font('Helvetica').fontSize(7.5)
       .text(kap(reel.productie_tip, 120), MAR + 32, y, { width: CON_W - 32, lineBreak: false })
    y += 16
  }

  // Stories — alleen op reel 3, en alleen als er ruimte is
  if (verhaalVoegToe && stories?.length && y < A4_H - 155) {
    lijn(doc, y, NAVY); y += 8
    doc.rect(MAR, y, CON_W, 22).fill(NAVY)
    doc.fillColor(WIT).font('Helvetica-Bold').fontSize(9)
       .text('📱  INSTAGRAM STORIES', MAR + 8, y + 7, { lineBreak: false })
    y += 28

    const sKol = (CON_W - 8) / 3
    for (const s of stories.slice(0, 3)) {
      const sx = MAR + (s.frame - 1) * (sKol + 4)
      doc.roundedRect(sx, y, sKol, 90, 4).strokeColor(NAVY).lineWidth(1).stroke()

      doc.roundedRect(sx + 5, y + 5, 18, 13, 2).fill(NAVY)
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(6.5)
         .text(String(s.frame), sx + 10, y + 9, { lineBreak: false })

      const tKleur = s.type === 'cta' ? NAVY : GRIJS_D
      doc.roundedRect(sx + 26, y + 5, 40, 13, 2).fill(tKleur)
      doc.fillColor(WIT).font('Helvetica-Bold').fontSize(6)
         .text(s.type.toUpperCase(), sx + 30, y + 9, { lineBreak: false })

      doc.fillColor(ZWART).font('Helvetica-Bold').fontSize(7.5)
         .text(kap(s.tekst, 50), sx + 5, y + 24, { width: sKol - 10, lineBreak: false })

      if (s.interactie) {
        doc.fillColor(GRIJS_D).font('Helvetica').fontSize(6.5)
           .text(kap(s.interactie, 45), sx + 5, y + 40, { width: sKol - 10, lineBreak: false })
      }

      if (s.optie_a && s.optie_b) {
        const ob = (sKol - 14) / 2
        doc.roundedRect(sx + 5, y + 60, ob, 12, 2).fill(NAVY)
        doc.fillColor(WIT).font('Helvetica').fontSize(6)
           .text(kap(s.optie_a, 10), sx + 7, y + 64, { lineBreak: false })
        doc.roundedRect(sx + 7 + ob, y + 60, ob, 12, 2).fill(GRIJS_D)
        doc.fillColor(WIT).font('Helvetica').fontSize(6)
           .text(kap(s.optie_b, 10), sx + 9 + ob, y + 64, { lineBreak: false })
      }
    }
  }
}

// ── Rustdag ───────────────────────────────────────────────────────────────
function maakRustdag(doc: PDFDoc, dagNaam: string, datum: string, pagNr: number, totaal: number): void {
  doc.addPage()
  doc.rect(0, 0, A4_W, 50).fill(GRIJS_D)
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(8).text('MENTAFORCE WEEKPLANNING', MAR, 10, { lineBreak: false })
  doc.fillColor(WIT).font('Helvetica-Bold').fontSize(15)
     .text(`${dagNaam.toUpperCase()} ${datum} — RUSTDAG`, MAR, 25, { lineBreak: false })
  doc.fillColor(WIT).font('Helvetica').fontSize(7)
     .text(`${pagNr}/${totaal}`, A4_W - MAR - 30, 38, { lineBreak: false })
  doc.fillColor(GRIJS_D).font('Helvetica').fontSize(13)
     .text('Geen content vandaag. Herstel, laden, voorbereiden.', MAR, 110, { width: CON_W, align: 'center', lineBreak: false })
}

// ── Export ────────────────────────────────────────────────────────────────
export async function generateWeekplanningPDF(weekplanning: WeekPlanning): Promise<Buffer> {
  const { default: PDFDocumentClass } = await import(
    /* webpackIgnore: true */
    'pdfkit'
  ) as { default: PDFDocumentConstructor }

  const doc = new PDFDocumentClass({
    size: 'A4',
    margins: { top: MAR, bottom: MAR, left: MAR, right: MAR },
    autoFirstPage: false,
    info: {
      Title: `MentaForce Weekplanning ${weekplanning.week_start}`,
      Author: 'MentaForce Content Engine',
      Subject: 'Instagram Reels Weekplanning',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  // Bereken totaal: kaft + 18 reel-pagina's + 1 rustdag (zondag) = 20
  const actieveDagen = weekplanning.dagen.filter(d => d.reels.length > 0)
  const totaal = 1 + actieveDagen.length * 3 + 1

  maakKaft(doc, weekplanning)

  let pagNr = 2
  for (const dag of weekplanning.dagen as DagPlanning[]) {
    if (!dag.reels.length) {
      maakRustdag(doc, dag.dag_naam, dag.datum, pagNr, totaal)
      pagNr++
      continue
    }

    const reels: ReelPlanning[] = dag.reels
    for (let i = 0; i < reels.length; i++) {
      maakReelPagina(
        doc,
        reels[i].strategie,
        reels[i].content,
        i + 1,
        i === reels.length - 1,   // stories alleen op laatste reel
        dag.stories,
        pagNr,
        totaal,
      )
      pagNr++
    }
  }

  doc.end()

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}
