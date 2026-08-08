// ─── Slaap — pure berekeningen ──────────────────────────────────────────────
// Slaapduur uit bed/wektijd, slaapschuld t.o.v. je doel, en regelmaat (hoe
// consistent je bedtijd is). PUUR + getest zodat de cijfers die je slaap duiden
// kloppen — geen verzonnen data.

/** "HH:MM" → minuten sinds middernacht, of null bij een ongeldige tijd. */
export function tijdNaarMinuten(tijd: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(tijd.trim())
  if (!m) return null
  const u = Number(m[1])
  const min = Number(m[2])
  if (u < 0 || u > 23 || min < 0 || min > 59) return null
  return u * 60 + min
}

/**
 * Slaapduur in uren uit bedtijd + wektijd, overnacht afgehandeld (wek ≤ bed → de
 * volgende ochtend). Null als een van de tijden ontbreekt/onleesbaar is.
 */
export function urenUitTijden(bedtijd: string, wektijd: string): number | null {
  const bed = tijdNaarMinuten(bedtijd)
  const wek = tijdNaarMinuten(wektijd)
  if (bed === null || wek === null) return null
  const duur = wek <= bed ? wek + 1440 - bed : wek - bed
  return Math.round((duur / 60) * 10) / 10
}

/** Gemiddelde van een lijst getallen, of null als leeg. */
export function gemiddelde(getallen: readonly number[]): number | null {
  if (getallen.length === 0) return null
  return Math.round((getallen.reduce((a, b) => a + b, 0) / getallen.length) * 10) / 10
}

/**
 * Slaapschuld: de opgetelde tekorten t.o.v. je doel over de nachten (alleen
 * tekorten tellen; een nacht dat je méér sliep dwingt de schuld niet omlaag —
 * uitslapen betaalt slaapschuld niet één-op-één terug). In uren, op 1 decimaal.
 */
export function slaapschuld(uren: readonly number[], doelUren: number): number {
  if (!(doelUren > 0)) return 0
  const schuld = uren.reduce((som, u) => som + Math.max(0, doelUren - u), 0)
  return Math.round(schuld * 10) / 10
}

/** Populatie-standaarddeviatie van een lijst minuten. 0 bij < 2 waarden. */
function stdev(waarden: readonly number[]): number {
  if (waarden.length < 2) return 0
  const gem = waarden.reduce((a, b) => a + b, 0) / waarden.length
  const variantie = waarden.reduce((s, w) => s + (w - gem) ** 2, 0) / waarden.length
  return Math.sqrt(variantie)
}

/**
 * Regelmaat van je bedtijd als score 0-100 (100 = elke nacht dezelfde tijd). Uit de
 * spreiding van de bedtijden; nachten vóór het middaguur gelden als "na middernacht"
 * (01:00 hoort bij 23:00, niet 11 uur ervandaan). < 2 nachten → null (te weinig data).
 */
export function regelmaat(bedtijden: readonly string[]): number | null {
  const minuten = bedtijden
    .map(tijdNaarMinuten)
    .filter((m): m is number => m !== null)
    .map((m) => (m < 720 ? m + 1440 : m)) // vóór 12:00 = na middernacht
  if (minuten.length < 2) return null
  // Elke ~1.2 min spreiding kost ~1 punt; 120 min spreiding → 0.
  return Math.max(0, Math.min(100, Math.round(100 - stdev(minuten) / 1.2)))
}
