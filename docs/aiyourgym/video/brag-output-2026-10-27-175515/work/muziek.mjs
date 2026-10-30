// Soundtrack voor de productfilm, zelf gesynthetiseerd: zachte piano, warme pad, heel lichte percussie.
// 90 BPM (tel 0,667 s), D groot, 30 tellen = 20 s. Scenewissels op tel 5, 9, 13, 20 en 25.
// Gebruik: node muziek.mjs uit.wav
import { writeFileSync } from 'node:fs'

const SR = 48000, BPM = 90, B = 60 / BPM, DUUR = 20.0
const N = Math.round(SR * DUUR)
const L = new Float32Array(N), R = new Float32Array(N)
const galL = new Float32Array(N), galR = new Float32Array(N)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)
const tel = (b) => b * B
let ruis = 4242
const rnd = () => { ruis = (ruis * 1103515245 + 12345) & 0x7fffffff; return ruis / 0x3fffffff - 1 }

// Akkoorden per scene: [begin, eind, noten]
const AKK = [
  [0, 5, [50, 57, 61, 64, 66]],    // Dmaj9
  [5, 9, [47, 54, 57, 61, 62]],    // Bm9
  [9, 13, [43, 50, 54, 59, 62]],   // Gmaj7
  [13, 17, [40, 47, 54, 55, 59]],  // Em9
  [17, 20, [45, 52, 57, 59, 64]],  // Asus2
  [20, 25, [43, 50, 54, 57, 62]],  // Gmaj9
  [25, 30, [50, 57, 61, 62, 66]],  // D(add maj7)
]

function pad() {
  for (const [b0, b1, noten] of AKK) {
    const s = tel(b0), e = Math.min(DUUR, tel(b1) + 0.6)
    noten.forEach((m, k) => {
      const pan = (k / (noten.length - 1)) * 0.7 - 0.35
      for (const det of [-0.05, 0.05]) {
        const f = hz(m + 12) * Math.pow(2, det / 12)
        for (let i = Math.floor(s * SR); i < Math.min(N, e * SR); i++) {
          const t = i / SR - s, d = e - i / SR
          const env = Math.min(1, t / 0.9) * Math.min(1, d / 0.6)
          let v = 0
          for (let h = 1; h <= 3; h++) v += Math.sin(2 * Math.PI * f * h * t + h * k) / Math.pow(h, 2.2)
          const groei = 0.75 + 0.35 * Math.min(1, Math.max(0, (i / SR - tel(13)) / 2)) // iets voller vanaf de schema-scene
          v *= env * 0.011 * groei
          L[i] += v * (1 - pan); R[i] += v * (1 + pan)
          galL[i] += v * 0.6; galR[i] += v * 0.6
        }
      }
    })
  }
}

// Piano: partials met lichte inharmoniciteit, hogere partials sterven sneller uit, zachte hamer.
function piano(b, m, kracht = 1, pan = 0, lengte = 3.2) {
  const s = tel(b), f0 = hz(m)
  const eind = Math.min(N, Math.floor((s + lengte) * SR))
  let lp = 0
  for (let i = Math.floor(s * SR); i < eind; i++) {
    const t = i / SR - s
    let v = 0
    for (let h = 1; h <= 7; h++) {
      const f = f0 * h * Math.sqrt(1 + 0.0004 * h * h)
      if (f > 9000) break
      const a = Math.exp(-t * (0.9 + h * 0.75)) / Math.pow(h, 1.15)
      v += Math.sin(2 * Math.PI * f * t) * a
    }
    const aanzet = Math.min(1, t / 0.003)
    const uit = Math.min(1, (lengte - t) / 0.4)
    lp += 0.08 * (rnd() - lp)
    const hamer = lp * Math.exp(-t * 250) * 0.12
    v = (v * aanzet * uit + hamer) * 0.07 * kracht
    L[i] += v * (1 - pan); R[i] += v * (1 + pan)
    galL[i] += v * 0.7; galR[i] += v * 0.7
  }
}
const akkoordPiano = (b, noten, kracht) => noten.forEach((m, k) => piano(b + k * 0.03, m, kracht * (k === 0 ? 1 : 0.6), (k - 2) * 0.12, 4.5))

// Heel lichte kick en shaker, alleen in het midden (tel 13 tot 25).
function kick(b) {
  const s = tel(b); let fase = 0
  for (let i = Math.floor(s * SR); i < Math.min(N, (s + 0.35) * SR); i++) {
    const t = i / SR - s
    fase += 2 * Math.PI * (48 + 50 * Math.exp(-t * 30)) / SR
    const v = Math.sin(fase) * Math.exp(-t * 11) * 0.11
    L[i] += v; R[i] += v
  }
}
function shaker(b, kracht) {
  const s = tel(b); let vorige = 0
  for (let i = Math.floor(s * SR); i < Math.min(N, (s + 0.08) * SR); i++) {
    const t = i / SR - s, n = rnd(), hp = n - vorige; vorige = n
    const env = Math.min(1, t / 0.012) * Math.exp(-t * 55)
    const v = hp * env * 0.008 * kracht
    L[i] += v * 0.7; R[i] += v * 1.3
    galL[i] += v * 0.3; galR[i] += v * 0.3
  }
}
// Zachte bel (FM) als glans op de grote wissels.
function bel(b, m, kracht = 1, pan = 0) {
  const s = tel(b), f = hz(m)
  for (let i = Math.floor(s * SR); i < Math.min(N, (s + 2.6) * SR); i++) {
    const t = i / SR - s
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 2.0)
    const mod = Math.sin(2 * Math.PI * f * 3.5 * t) * 0.9 * Math.exp(-t * 6)
    const v = Math.sin(2 * Math.PI * f * t + mod) * env * 0.03 * kracht
    L[i] += v * (1 - pan); R[i] += v * (1 + pan)
    galL[i] += v; galR[i] += v
  }
}

pad()
// Haak: een noot per woord, op de halve tel (A, B, D, E, F#).
;[69, 71, 74, 76, 78].forEach((m, k) => piano(k / 2, m, 0.8, -0.2 + k * 0.1))
piano(0, 50, 0.7, 0, 4.5)
// Wissels: een zacht akkoord in de nieuwe harmonie.
akkoordPiano(5, [47, 59, 62, 66], 0.75)
piano(7, 73, 0.5, 0.2)
akkoordPiano(9, [43, 55, 59, 62], 0.75)
piano(11, 71, 0.5, -0.2)
akkoordPiano(13, [40, 52, 59, 62, 66], 0.85)
bel(13, 78, 0.8, 0.2)
// Kernpunten op tel 15, 16 en 17.
piano(15, 71, 0.65, -0.15); piano(16, 74, 0.65, 0); piano(17, 76, 0.7, 0.15)
akkoordPiano(17, [45, 57, 59, 64], 0.55)
akkoordPiano(20, [43, 55, 59, 62, 66], 0.75)
piano(22, 74, 0.5, 0.2); piano(23, 78, 0.45, -0.1)
// Slot: grondakkoord in D, bel erboven, daarna alleen nagalm.
akkoordPiano(25, [38, 50, 57, 61, 66], 0.9)
bel(25, 81, 0.7, -0.15); bel(25.02, 86, 0.35, 0.25)
piano(27, 78, 0.45, 0.1); piano(27.5, 81, 0.35, -0.1)
for (let b = 13; b < 25; b += 2) kick(b)
for (let b = 13; b < 25; b += 0.5) shaker(b, b % 1 === 0.5 ? 1 : 0.55)

// Galm: kamfilters met demping plus allpass, iets langere staart dan de vorige film.
function galm(inp, uit, d) {
  const combs = [1687, 1601, 2053, 2251].map((n) => ({ buf: new Float32Array(n + d), i: 0, lp: 0 }))
  const aps = [347, 113].map((n) => ({ buf: new Float32Array(n + Math.floor(d / 3)), i: 0 }))
  for (let k = 0; k < N; k++) {
    let s = 0
    for (const c of combs) {
      const y = c.buf[c.i]
      c.lp = y * 0.55 + c.lp * 0.45
      c.buf[c.i] = inp[k] + c.lp * 0.86
      c.i = (c.i + 1) % c.buf.length
      s += y
    }
    s *= 0.25
    for (const a of aps) {
      const y = a.buf[a.i], v = s + y * -0.6
      a.buf[a.i] = s + y * 0.6
      a.i = (a.i + 1) % a.buf.length
      s = v
    }
    uit[k] += s * 0.5
  }
}
galm(galL, L, 0); galm(galR, R, 29)

let piek = 0
for (let i = 0; i < N; i++) {
  const t = i / SR
  const f = Math.min(1, t / 0.02) * Math.min(1, (DUUR - t) / 1.4)
  L[i] = Math.tanh(L[i] * 1.2) * f; R[i] = Math.tanh(R[i] * 1.2) * f
  piek = Math.max(piek, Math.abs(L[i]), Math.abs(R[i]))
}
const g = 0.8 / piek
const data = Buffer.alloc(44 + N * 4)
data.write('RIFF', 0); data.writeUInt32LE(36 + N * 4, 4); data.write('WAVEfmt ', 8)
data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22)
data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34)
data.write('data', 36); data.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4)
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4)
}
writeFileSync(process.argv[2] || 'muziek.wav', data)
console.log('klaar, piek voor normalisatie', piek.toFixed(3))
