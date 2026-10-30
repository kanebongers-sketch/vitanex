// ─── Club: profielfoto's van leden en medewerkers (PUUR) ────────────────────
// Opdracht Kane (30-10-2026): "Profielfoto op de pagina." Migratie 473.
//
// Wie mag wat (AVG):
//   * Een lid zet, vervangt en haalt de eigen foto weg in de ledenapp (Profiel).
//   * Een medewerker doet dat bij het eigen profiel in Club (Personeel > Mijn).
//   * De sportschool (bijvoorbeeld aan de balie) zet een foto bij een lid alleen
//     met toestemming van het lid op dat moment. Die toestemming leggen we vast
//     (moment, versie van de tekst, wie hem zette); zonder vinkje weigert de
//     server. Het lid ziet in de ledenapp dat de sportschool hem zette en kan
//     hem altijd zelf weghalen (= toestemming intrekken).
//   * Weghalen kan altijd: het lid, de medewerker zelf, en wie Leden mag.
// Een profielfoto is geen bijzonder persoonsgegeven zolang we er niets mee
// herkennen (geen gezichtsherkenning, geen check-in op gezicht): alleen tonen.
//
// Opslag: private bucket club-profielfoto, per sportschool en per persoon:
//   <sportschool>/<lid|mw>-<id>/<versie>-256.webp en -512.webp.
// De browser snijdt vierkant bij en maakt WebP zonder metadata (canvas). De
// server controleert de bytes (echte WebP van precies 256 en 512 pixels).
// Tonen gaat via een eigen route die de toegang controleert en doorstuurt naar
// een kort geldige getekende URL van Supabase.

export const PROFIELFOTO_BUCKET = 'club-profielfoto'

/** De twee maten: 256 voor lijsten en kaarten, 512 voor de grote kop (scherp op retina). */
export const FOTO_MATEN = [256, 512] as const
export type FotoMaat = (typeof FOTO_MATEN)[number]

/** Hoogstens per bestand; de bucket staat op 300 kB (migratie 473). */
export const MAX_BYTES: Readonly<Record<FotoMaat, number>> = { 256: 80_000, 512: 250_000 }

/** Hoe lang een getekende URL geldig is, en hoe lang de browser de doorverwijzing bewaart. */
export const GETEKEND_SECONDEN = 600
export const DOORVERWIJZING_SECONDEN = 300

/** De versie van de toestemmingstekst aan de balie; verandert de tekst, dan omhoog. */
export const TOESTEMMING_VERSIE = 'balie-1'

export type FotoSoort = 'lid' | 'mw'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VERSIE = /^[a-z0-9]{4,20}$/
const PAD = /^[0-9a-f-]{36}\/(lid|mw)-[0-9a-f-]{36}\/[a-z0-9]{4,20}$/

export function isUuid(x: unknown): x is string {
  return typeof x === 'string' && UUID.test(x)
}

export function isFotoSoort(x: unknown): x is FotoSoort {
  return x === 'lid' || x === 'mw'
}

export function isVersie(x: unknown): x is string {
  return typeof x === 'string' && VERSIE.test(x)
}

export function isFotoMaat(x: unknown): x is FotoMaat {
  return x === 256 || x === 512
}

/** "256" of "512" uit een URL, anders null. */
export function maatUitTekst(x: string | null | undefined): FotoMaat | null {
  const n = Number(x)
  return isFotoMaat(n) ? n : null
}

/** Een nieuwe versie: tijd in base36 plus wat toeval, zodat de URL bij elke nieuwe foto anders is. */
export function nieuweVersie(nu: number, toeval: number): string {
  const rest = Math.floor(Math.abs(toeval) * 1_679_616).toString(36).padStart(4, '0')
  return `${Math.floor(nu).toString(36)}${rest}`.slice(0, 20)
}

/** Het pad zonder maat: <sportschool>/<soort>-<id>/<versie>. Null bij ongeldige delen. */
export function fotoPad(userId: string, soort: FotoSoort, id: string, versie: string): string | null {
  if (!isUuid(userId) || !isUuid(id) || !isVersie(versie)) return null
  return `${userId.toLowerCase()}/${soort}-${id.toLowerCase()}/${versie}`
}

export function isFotoPad(x: unknown): x is string {
  return typeof x === 'string' && PAD.test(x)
}

/** Het bestand van een maat. */
export function fotoBestand(pad: string, maat: FotoMaat): string {
  return `${pad}-${maat}.webp`
}

/** Hoort dit pad bij deze sportschool en deze persoon? (Tweede slot naast de database.) */
export function padHoortBij(pad: string, userId: string, soort: FotoSoort, id: string): boolean {
  return isFotoPad(pad) && pad.startsWith(`${userId.toLowerCase()}/${soort}-${id.toLowerCase()}/`)
}

/** Initialen uit een volledige naam, voor de terugval: "Sanne de Vries" wordt "SV". */
export function initialenVanNaam(naam: string): string {
  const delen = naam.trim().split(/\s+/).filter(Boolean)
  if (delen.length === 0) return '?'
  const eerste = delen[0].charAt(0)
  const laatste = delen.length > 1 ? delen[delen.length - 1].charAt(0) : ''
  return `${eerste}${laatste}`.toUpperCase()
}

// ── Adressen van de foto ────────────────────────────────────────────────────

/** In Club (medewerkers): /api/club/profielfoto/<soort>/<id>/<maat>?v=<versie>. */
export function clubFotoUrl(soort: FotoSoort, id: string, versie: string, maat: FotoMaat): string {
  return `/api/club/profielfoto/${soort}/${encodeURIComponent(id)}/${maat}?v=${encodeURIComponent(versie)}`
}

/**
 * In de ledenapp (met ledensessie): /api/club/lid/profielfoto/<soort>/<id>/<maat>?v=<versie>.
 * In de voorvertoning van Kane gaat het lid-id mee als ?voor= (zoals de rest van de leden-API).
 */
export function lidFotoUrl(soort: FotoSoort, id: string, versie: string, maat: FotoMaat, voor?: string | null): string {
  const extra = voor ? `&voor=${encodeURIComponent(voor)}` : ''
  return `/api/club/lid/profielfoto/${soort}/${encodeURIComponent(id)}/${maat}?v=${encodeURIComponent(versie)}${extra}`
}

/** De maat die past bij een weergave van zoveel CSS-pixels (retina: twee keer). */
export function maatVoor(cssPixels: number): FotoMaat {
  return cssPixels * 2 > 256 ? 512 : 256
}

// ── Toestemming aan de balie ────────────────────────────────────────────────

export type BalieToestemming = { ok: true } | { ok: false; code: 'toestemming' }

/** De sportschool zet een foto bij een lid: alleen met een uitdrukkelijk vinkje (true, geen "ja" of 1). */
export function leesBalieToestemming(waarde: unknown): BalieToestemming {
  return waarde === true || waarde === 'true' ? { ok: true } : { ok: false, code: 'toestemming' }
}

// ── Bijsnijden (gedeeld door browser en tests) ──────────────────────────────

export interface Uitsnede {
  /** Linksboven en zijde van het vierkant in de pixels van het origineel. */
  x: number
  y: number
  zijde: number
}

/**
 * Het vierkant uit een foto van breedte x hoogte. zoom 1 = het grootste vierkant
 * dat past, groter = verder ingezoomd (hoogstens 4). verschuifX en verschuifY
 * lopen van -1 (helemaal links of boven) tot 1 (rechts of onder); 0 = midden.
 */
export function uitsnede(breedte: number, hoogte: number, zoom = 1, verschuifX = 0, verschuifY = 0): Uitsnede | null {
  if (!(breedte > 0) || !(hoogte > 0)) return null
  const z = Math.min(4, Math.max(1, Number.isFinite(zoom) ? zoom : 1))
  const zijde = Math.max(1, Math.floor(Math.min(breedte, hoogte) / z))
  const klem = (v: number) => Math.min(1, Math.max(-1, Number.isFinite(v) ? v : 0))
  const ruimteX = breedte - zijde
  const ruimteY = hoogte - zijde
  const x = Math.round((ruimteX / 2) * (1 + klem(verschuifX)))
  const y = Math.round((ruimteY / 2) * (1 + klem(verschuifY)))
  return { x: Math.min(ruimteX, Math.max(0, x)), y: Math.min(ruimteY, Math.max(0, y)), zijde }
}

// ── WebP controleren (server) ───────────────────────────────────────────────

/**
 * Breedte en hoogte van een WebP-bestand, of null als het geen geldige WebP is.
 * Leest de kop van de drie soorten: VP8 (lossy), VP8L (lossless) en VP8X (uitgebreid).
 */
export function webpMaat(bytes: Uint8Array): { breedte: number; hoogte: number } | null {
  if (bytes.length < 30) return null
  const ascii = (van: number, n: number) => String.fromCharCode(...bytes.subarray(van, van + n))
  if (ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') return null
  const soort = ascii(12, 4)
  if (soort === 'VP8 ') {
    // Frame-kop: 3 bytes, dan de startcode 9d 01 2a, dan 14 bits breedte en hoogte.
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null
    return { breedte: (bytes[26] | (bytes[27] << 8)) & 0x3fff, hoogte: (bytes[28] | (bytes[29] << 8)) & 0x3fff }
  }
  if (soort === 'VP8L') {
    if (bytes[20] !== 0x2f) return null
    const b = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
    return { breedte: (b & 0x3fff) + 1, hoogte: ((b >>> 14) & 0x3fff) + 1 }
  }
  if (soort === 'VP8X') {
    const breedte = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16))
    const hoogte = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16))
    return { breedte, hoogte }
  }
  return null
}

export type FotoKeuring = { ok: true } | { ok: false; code: 'geenWebp' | 'maat' | 'teGroot' }

/** Is dit een vierkante WebP van precies deze maat en niet te groot? */
export function keurFoto(bytes: Uint8Array, maat: FotoMaat): FotoKeuring {
  if (bytes.length > MAX_BYTES[maat]) return { ok: false, code: 'teGroot' }
  const m = webpMaat(bytes)
  if (!m) return { ok: false, code: 'geenWebp' }
  if (m.breedte !== maat || m.hoogte !== maat) return { ok: false, code: 'maat' }
  return { ok: true }
}
