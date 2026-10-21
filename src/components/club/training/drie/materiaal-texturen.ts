// ─── Fit Factory Club, 3D-oefenbeelden: kleine getekende texturen ───────────
// Alle texturen van het materiaal worden in de browser op een klein canvas
// getekend (geen bestanden, geen downloads): knurling op de stang, opdruk op
// de schijven, de nerf van bekleding, gevlochten touw en de gatenrij van een
// rek. Klein gehouden (64 tot 512 pixels) zodat het soepel blijft op een telefoon.

import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

type Tekenaar = (ctx: CanvasRenderingContext2D, maat: number) => void

function canvas(maat: number, teken: Tekenaar, kleur = false): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = maat
  c.height = maat
  const ctx = c.getContext('2d')
  if (ctx) teken(ctx, maat)
  const t = new CanvasTexture(c)
  if (kleur) t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

function herhaal(t: Texture, u: number, v: number): Texture {
  t.wrapS = RepeatWrapping
  t.wrapT = RepeatWrapping
  t.repeat.set(u, v)
  return t
}

/** Vaste ruis (zelfde beeld bij elke render), zodat beelden niet flikkeren. */
function ruis(zaad: number): () => number {
  let s = zaad
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

/** Ruitpatroon van knurling: hoogte (licht = hoog) voor bump en ruwheid. */
export function knurlTextuur(): Texture {
  return herhaal(
    canvas(64, (ctx, n) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, n, n)
      ctx.lineWidth = 3
      ctx.strokeStyle = '#2a2a2a'
      for (let i = -n; i < 2 * n; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + n, n)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(i + n, 0)
        ctx.lineTo(i, n)
        ctx.stroke()
      }
    }),
    3,
    14,
  )
}

/** Fijne nerf met een biesje langs de rand: bekleding van banken en machines. */
export function bekledingTextuur(): Texture {
  const r = ruis(7)
  return canvas(256, (ctx, n) => {
    ctx.fillStyle = '#7a7a7a'
    ctx.fillRect(0, 0, n, n)
    for (let i = 0; i < 2600; i++) {
      const g = 100 + Math.floor(r() * 50)
      ctx.fillStyle = `rgb(${g},${g},${g})`
      ctx.fillRect(r() * n, r() * n, 1 + r() * 1.5, 1 + r() * 1.5)
    }
    // Naad: verdiepte lijn op 7 procent van de rand, met stiksels erlangs.
    const b = n * 0.07
    ctx.strokeStyle = '#3a3a3a'
    ctx.lineWidth = 3
    ctx.strokeRect(b, b, n - 2 * b, n - 2 * b)
    ctx.strokeStyle = '#5c5c5c'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.strokeRect(b + 4, b + 4, n - 2 * b - 8, n - 2 * b - 8)
  })
}

/**
 * Opdruk op de voorkant van een bumperschijf: gewicht in reliefletters, een
 * fijne ring en een dunne lijn in de accentkleur van de sportschool. Het
 * canvas loopt van midden tot buitenrand (RingGeometry gebruikt vlakke uv's).
 */
export function schijfOpdruk(accent: string, tekst: string): Texture {
  return canvas(
    512,
    (ctx, n) => {
      const m = n / 2
      ctx.translate(m, m)
      ctx.strokeStyle = 'rgba(210,212,216,0.22)'
      ctx.lineWidth = 2
      for (const s of [0.6, 0.94]) {
        ctx.beginPath()
        ctx.arc(0, 0, m * s, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.strokeStyle = accent
      ctx.globalAlpha = 0.9
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(0, 0, m * 0.4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(226,228,232,0.85)'
      ctx.font = `700 ${Math.round(n * 0.075)}px Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const hoek of [0, Math.PI]) {
        ctx.save()
        ctx.rotate(hoek)
        ctx.fillText(tekst, 0, -m * 0.77)
        ctx.restore()
      }
      // Korte ribbels op de rubberrand (grip bij het oppakken).
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 3
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2
        if (Math.abs(Math.sin(a)) < 0.3) continue
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * m * 0.88, Math.sin(a) * m * 0.88)
        ctx.lineTo(Math.cos(a) * m * 0.93, Math.sin(a) * m * 0.93)
        ctx.stroke()
      }
    },
    true,
  )
}

/** Gevlochten touw: schuine strengen, om te herhalen langs de lengte. */
export function touwTextuur(): Texture {
  return herhaal(
    canvas(
      64,
      (ctx, n) => {
        ctx.fillStyle = '#1d1e22'
        ctx.fillRect(0, 0, n, n)
        ctx.lineWidth = 7
        for (let i = -n; i < 2 * n; i += 16) {
          ctx.strokeStyle = '#4b4e56'
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i + n * 0.6, n)
          ctx.stroke()
          ctx.strokeStyle = '#101113'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(i + 6, 0)
          ctx.lineTo(i + 6 + n * 0.6, n)
          ctx.stroke()
          ctx.lineWidth = 7
        }
      },
      true,
    ),
    2,
    6,
  )
}

/** Gatenrij van een rek of staander (kleurkaart), herhaald langs de hoogte. */
export function gatenTextuur(): Texture {
  return herhaal(
    canvas(
      64,
      (ctx, n) => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, n, n)
        ctx.fillStyle = '#1a1b1e'
        ctx.beginPath()
        ctx.arc(n / 2, n / 2, n * 0.16, 0, Math.PI * 2)
        ctx.fill()
      },
      true,
    ),
    1,
    20,
  )
}

/** Fijne korrel voor een rubberen mat of vloertegel. */
export function korrelTextuur(): Texture {
  const r = ruis(3)
  return herhaal(
    canvas(128, (ctx, n) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, n, n)
      for (let i = 0; i < 1800; i++) {
        const g = 90 + Math.floor(r() * 80)
        ctx.fillStyle = `rgb(${g},${g},${g})`
        ctx.fillRect(r() * n, r() * n, 1.5, 1.5)
      }
    }),
    4,
    10,
  )
}
