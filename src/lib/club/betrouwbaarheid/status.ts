// ─── Gezondheidscontrole: het antwoord (PUUR) ───────────────────────────────
// Voor GET /api/status: een uptime-dienst (bijv. cron-job.org) kijkt alleen of
// de app draait en of de database antwoordt. Er gaan geen gegevens mee.

export type DbStand = 'ok' | 'fout' | 'traag'

export interface StatusAntwoord {
  body: { ok: boolean; db: DbStand }
  status: 200 | 503
}

/** Langer dan dit wachten we niet op de database. */
export const DB_TIMEOUT_MS = 3000

export function statusAntwoord(db: DbStand): StatusAntwoord {
  const ok = db === 'ok'
  return { body: { ok, db }, status: ok ? 200 : 503 }
}

/** Hoe de database ervoor staat na een proefvraag (of het verstrijken van de tijd). */
export function dbStandUit(uitslag: { fout: boolean; verlopen: boolean }): DbStand {
  if (uitslag.verlopen) return 'traag'
  return uitslag.fout ? 'fout' : 'ok'
}
