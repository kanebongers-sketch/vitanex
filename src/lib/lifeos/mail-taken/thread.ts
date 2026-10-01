// ─── LifeOS — heb je al op deze mail gereageerd? (SERVER-ONLY) ──────────────
// Eén threads.get met `format=MINIMAL`: per bericht alleen labels en ontvangst-
// moment — geen headers, geen inhoud. Staat er ná de mail een bericht van jou
// (label SENT) in de thread, dan is de "Reageren op …"-taak gedaan.
//
// Docs (geverifieerd): https://developers.google.com/gmail/api/reference/rest/v1/users.threads/get

const THREADS = 'https://gmail.googleapis.com/gmail/v1/users/me/threads'
const TIMEOUT_MS = 10_000

/** Leest het threads.get-antwoord: het eerste SENT-moment ná `na`, of null. Puur. */
export function eersteAntwoordNa(ruw: unknown, na: Date): Date | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const berichten = (ruw as { messages?: unknown }).messages
  if (!Array.isArray(berichten)) return null
  let eerste: number | null = null
  for (const b of berichten) {
    if (typeof b !== 'object' || b === null) continue
    const { labelIds, internalDate } = b as { labelIds?: unknown; internalDate?: unknown }
    if (!Array.isArray(labelIds) || !labelIds.includes('SENT')) continue
    const ms = Number(internalDate)
    if (!Number.isFinite(ms) || ms <= na.getTime()) continue
    if (eerste === null || ms < eerste) eerste = ms
  }
  return eerste === null ? null : new Date(eerste)
}

/** Het moment van je antwoord, `null` = (nog) niet gereageerd, `undefined` = kon het niet nagaan. */
export async function antwoordInThread(token: string, threadId: string, na: Date): Promise<Date | null | undefined> {
  if (!threadId) return undefined
  try {
    const antwoord = await fetch(`${THREADS}/${encodeURIComponent(threadId)}?format=MINIMAL`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!antwoord.ok) return undefined
    return eersteAntwoordNa(await antwoord.json(), na)
  } catch {
    return undefined
  }
}
