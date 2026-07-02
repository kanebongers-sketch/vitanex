// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Best-effort, per server-instance (reset bij cold start op serverless). Goed
// genoeg als rem op misbruik/dubbelklikken; voor harde garanties is een
// persistente store nodig.

const logboek = new Map<string, number[]>()

/**
 * True als `sleutel` binnen het venster al `max` keer is gebruikt.
 * Registreert de aanroep meteen wanneer die nog is toegestaan.
 */
export function isRateLimited(
  sleutel: string,
  max: number,
  vensterMs: number,
  nu: number = Date.now(),
): boolean {
  const recent = (logboek.get(sleutel) ?? []).filter((t) => nu - t < vensterMs)
  if (recent.length >= max) {
    logboek.set(sleutel, recent)
    return true
  }
  logboek.set(sleutel, [...recent, nu])
  if (logboek.size > 10_000) logboek.clear()
  return false
}
