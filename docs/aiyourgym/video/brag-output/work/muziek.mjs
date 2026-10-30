// Soundtrack voor de lanceervideo, zelf gesynthetiseerd. 96 BPM, D groot, 32 tellen = 20 s.
// Gebruik: node muziek.mjs uit.wav
import { writeFileSync } from 'node:fs'

const SR = 48000, BPM = 96, B = 60 / BPM, DUUR = 20.0
const N = Math.round(SR * DUUR)
const L = new Float32Array(N), R = new Float32Array(N)
const galL = new Float32Array(N), galR = new Float32Array(N) // zend naar galm
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)
const tel = (b) => b * B

function voeg(buf, i, v) { if (i >= 0 && i < N) buf[i] += v }

// Pad: per maat een akkoord, zachte aanzet, harmonischen die snel afnemen.
const AKK = [
  [50, 57, 61, 64, 66, 69], // Dmaj9: D A C# E F# A
  [47, 54, 57, 61, 62, 66], // Bm9
  [43, 50, 54, 57, 62, 66], // Gmaj7 (add9)
  [45, 52, 57, 59, 62, 64], // Asus
]
function pad() {
  for (let maat = 0; maat < 8; maat++) {
    const akk = AKK[maat % 4]
    const s = tel(maat * 4), e = maat === 7 ? DUUR : tel(maat * 4 + 4) + 0.35
    for (const [k, m] of akk.entries()) {
      const f = hz(m), pan = (k / (akk.length - 1)) * 0.8 - 0.4
      for (const det of [-0.06, 0.06]) {
        const ff = f * Math.pow(2, det / 12)
        for (let i = Math.floor(s * SR); i < Math.min(N, e * SR); i++) {
          const t = i / SR - s, d = e - i / SR
          const env = Math.min(1, t / 0.5) * Math.min(1, d / 0.45)
          let v = 0
          for (let h = 1; h <= 4; h++) v += Math.sin(2 * Math.PI * ff * h * t + h * k) / Math.pow(h, 1.8)
          const lfo = 1 + 0.12 * Math.sin(2 * Math.PI * 0.2 * (i / SR) + k)
          v *= env * lfo * 0.024
          L[i] += v * (1 - pan); R[i] += v * (1 + pan)
          galL[i] += v * 0.5; galR[i] += v * 0.5
        }
      }
    }
  }
}

// Subbas op tel 1 en 3 van elke maat vanaf tel 6, grondtoon van het akkoord.
function bas() {
  const GROND = [38, 35, 31, 33]
  for (let b = 6; b < 32; b += 2) {
    const f = hz(GROND[Math.floor(b / 4) % 4]), s = tel(b)
    for (let i = Math.floor(s * SR); i < Math.min(N, (s + B * 1.9) * SR); i++) {
      const t = i / SR - s
      const env = Math.min(1, t / 0.02) * Math.exp(-t * 1.6)
      const v = (Math.sin(2 * Math.PI * f * t) + 0.15 * Math.sin(4 * Math.PI * f * t)) * env * 0.16
      L[i] += v; R[i] += v
    }
  }
}

// Zachte kick (tel 1 en 3) vanaf tel 6, op het slot stil.
function kick() {
  for (let b = 6; b < 28; b += 2) {
    const s = tel(b)
    let fase = 0
    for (let i = Math.floor(s * SR); i < Math.min(N, (s + 0.4) * SR); i++) {
      const t = i / SR - s
      const f = 45 + 75 * Math.exp(-t * 28)
      fase += 2 * Math.PI * f / SR
      const v = Math.sin(fase) * Math.exp(-t * 9) * 0.2
      L[i] += v; R[i] += v
    }
  }
}

// Gedempte hihat op de achtsten tussen de tellen, vanaf tel 12.
let ruis = 12345
const rnd = () => { ruis = (ruis * 1103515245 + 12345) & 0x7fffffff; return ruis / 0x3fffffff - 1 }
function hat() {
  for (let b = 12; b < 28; b += 1) {
    const s = tel(b + 0.5)
    let vorige = 0
    for (let i = Math.floor(s * SR); i < Math.min(N, (s + 0.06) * SR); i++) {
      const t = i / SR - s, n = rnd()
      const hp = n - vorige; vorige = n
      const v = hp * Math.exp(-t * 70) * 0.014
      L[i] += v * 0.8; R[i] += v * 1.2
      galL[i] += v * 0.2; galR[i] += v * 0.2
    }
  }
}

// Bel (FM), op scenewissels en de drie kernpunten. Allemaal akkoordtonen.
function bel(b, m, sterkte = 1, pan = 0) {
  const s = tel(b), f = hz(m)
  for (let i = Math.floor(s * SR); i < Math.min(N, (s + 2.4) * SR); i++) {
    const t = i / SR - s
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 2.2)
    const mod = Math.sin(2 * Math.PI * f * 2 * t) * 1.4 * Math.exp(-t * 5)
    const v = Math.sin(2 * Math.PI * f * t + mod) * env * 0.085 * sterkte
    L[i] += v * (1 - pan); R[i] += v * (1 + pan)
    galL[i] += v * 0.9; galR[i] += v * 0.9
  }
}

// Klik van de cursor: korte zachte tik plus een kleine toon in D.
function klik(b) {
  const s = tel(b)
  for (let i = Math.floor(s * SR); i < Math.min(N, (s + 0.12) * SR); i++) {
    const t = i / SR - s
    const v = (rnd() * Math.exp(-t * 300) * 0.05) + Math.sin(2 * Math.PI * hz(86) * t) * Math.exp(-t * 40) * 0.03
    L[i] += v; R[i] += v; galL[i] += v * 0.4; galR[i] += v * 0.4
  }
}

// Zachte swell naar een wissel: ruis met een open gaand laagdoorlaatfilter.
function swell(totB, lengteB) {
  const e = tel(totB), s = e - tel(lengteB)
  let lp = 0
  for (let i = Math.floor(s * SR); i < Math.min(N, e * SR); i++) {
    const x = (i / SR - s) / (e - s)
    const a = 0.01 + 0.25 * x * x
    lp += a * (rnd() - lp)
    const v = lp * x * x * 0.05
    L[i] += v; R[i] += v; galL[i] += v * 0.6; galR[i] += v * 0.6
  }
}

pad(); bas(); kick(); hat()
bel(0, 74, 1, -0.2); bel(0.02, 81, 0.5, 0.2)
bel(6, 78, 0.9, 0.2); bel(12, 76, 0.8, -0.2); bel(16, 74, 1, 0); bel(16.02, 81, 0.6, 0.3)
bel(18, 81, 0.55, -0.3); bel(19, 83, 0.55, 0); bel(20, 86, 0.55, 0.3)
bel(24, 78, 0.9, -0.2); bel(28, 74, 1, 0); bel(28.02, 78, 0.6, 0.25); bel(28.04, 81, 0.5, -0.25)
klik(10); klik(15)
swell(16, 2); swell(28, 2)

// Galm: vier kamfilters plus twee allpass per kant.
function galm(inp, uit, d) {
  const combs = [1557, 1617, 1491, 1422].map((n) => ({ buf: new Float32Array(n + d), i: 0, lp: 0 }))
  const aps = [225, 556].map((n) => ({ buf: new Float32Array(n + Math.floor(d / 3)), i: 0 }))
  for (let k = 0; k < N; k++) {
    let s = 0
    for (const c of combs) {
      const y = c.buf[c.i]
      c.lp = y * 0.7 + c.lp * 0.3
      c.buf[c.i] = inp[k] + c.lp * 0.84
      c.i = (c.i + 1) % c.buf.length
      s += y
    }
    s *= 0.25
    for (const a of aps) {
      const y = a.buf[a.i]
      const v = s + y * -0.5
      a.buf[a.i] = s + y * 0.5
      a.i = (a.i + 1) % a.buf.length
      s = v
    }
    uit[k] += s * 0.55
  }
}
galm(galL, L, 0); galm(galR, R, 23)

// Master: zachte begrenzer, uitfaden op het eind, normaliseren.
let piek = 0
for (let i = 0; i < N; i++) {
  const t = i / SR
  const f = Math.min(1, t / 0.03) * Math.min(1, (DUUR - t) / 0.9)
  L[i] = Math.tanh(L[i] * 1.3) * f; R[i] = Math.tanh(R[i] * 1.3) * f
  piek = Math.max(piek, Math.abs(L[i]), Math.abs(R[i]))
}
const g = 0.82 / piek
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
