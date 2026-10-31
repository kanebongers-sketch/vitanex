// ─── AI Your Gym: wachtwoorden opslaan en controleren (SERVER-ONLY) ─────────
// Besluit Kane (23-10-2026): op aiyourgym.com logt een sportschool in met
// e-mailadres en een sterk wachtwoord, niet met een link plus code. Het
// wachtwoord staat nooit leesbaar opgeslagen: scrypt met hoge kosten en een
// eigen salt per wachtwoord, vergeleken in constante tijd. Opslagvorm:
// "s2:N:r:p:salt:hash" zodat de kosten later omhoog kunnen zonder dat
// bestaande wachtwoorden stoppen. De regels voor een sterk wachtwoord staan in
// wachtwoord-regels.ts (ook voor de browser).
// scrypt draait async (op de threadpool van Node), zodat een inlogpoging de
// server niet ongeveer 100 ms blokkeert voor alle andere verzoeken.

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import { MAX_LENGTE } from './wachtwoord-regels'

export { MIN_LENGTE, MAX_LENGTE, normaalEmail, wachtwoordFout } from './wachtwoord-regels'

const KOSTEN = { N: 2 ** 15, r: 8, p: 1 } as const
const SLEUTEL_LENGTE = 32
/** scrypt heeft 128 * N * r bytes nodig; ruim daarboven. */
const MAX_GEHEUGEN = 64 * 1024 * 1024

function scryptAsync(w: string, salt: Buffer, lengte: number, opties: ScryptOptions): Promise<Buffer> {
  return new Promise((ok, fout) => {
    scrypt(w, salt, lengte, opties, (err, sleutel) => (err ? fout(err) : ok(sleutel)))
  })
}

export async function hashWachtwoord(w: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(w, salt, SLEUTEL_LENGTE, { ...KOSTEN, maxmem: MAX_GEHEUGEN })
  return ['s2', KOSTEN.N, KOSTEN.r, KOSTEN.p, salt.toString('hex'), hash.toString('hex')].join(':')
}

export async function wachtwoordKlopt(w: string, opgeslagen: string | null): Promise<boolean> {
  if (!opgeslagen || w.length === 0 || w.length > MAX_LENGTE) return false
  const [soort, n, r, p, saltHex, hashHex] = opgeslagen.split(':')
  const N = Number(n)
  const R = Number(r)
  const P = Number(p)
  if (soort !== 's2' || !saltHex || !hashHex || ![N, R, P].every((x) => Number.isInteger(x) && x > 0) || N > 2 ** 20) return false
  const verwacht = Buffer.from(hashHex, 'hex')
  const echt = await scryptAsync(w, Buffer.from(saltHex, 'hex'), verwacht.length || SLEUTEL_LENGTE, { N, r: R, p: P, maxmem: Math.max(MAX_GEHEUGEN, 256 * N * R) })
  return verwacht.length === echt.length && timingSafeEqual(verwacht, echt)
}
