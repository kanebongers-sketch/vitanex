// ─── Club, push: een melding naar de toestellen van een lid (SERVER-ONLY) ───
// Per toestel een versleuteld verzoek aan de push-dienst. Alleen naar
// endpoints die bij een bekende dienst horen (nog eens gecontroleerd), zonder
// redirects te volgen en met een korte time-out. 404/410: het abonnement
// bestaat niet meer en gaat weg.

import { isToegestaneDienst } from './abonnement'
import { beoordeelAntwoord, bouwVerzoek, type DienstUitslag, type PushInhoud, type PushVerzoek } from './bericht'
import type { OpgeslagenAbonnement } from './opslag'
import { leesVapidSleutels, pushActief } from './sleutels'
import type { PushOmgeving } from './beleid'
import type { VapidSleutels } from './vapid'

const TIME_OUT_MS = 10_000

export interface PushDeps {
  omgeving: PushOmgeving
  sleutels: VapidSleutels | null
  /** Stuur een verzoek; geeft de HTTP-status, of null als het niet aankwam. */
  post: (v: PushVerzoek) => Promise<number | null>
}

export function standaardPushDeps(env: Record<string, string | undefined> = process.env): PushDeps {
  const sleutels = leesVapidSleutels(env)
  return {
    omgeving: { actief: pushActief(env), ingesteld: sleutels !== null },
    sleutels,
    post: async (v) => {
      try {
        const res = await fetch(v.url, { method: 'POST', headers: v.headers, body: new Uint8Array(v.body), redirect: 'manual', signal: AbortSignal.timeout(TIME_OUT_MS), cache: 'no-store' })
        return res.status
      } catch (err) {
        console.error('[club-push] versturen mislukt', err instanceof Error ? err.name : 'onbekend')
        return null
      }
    },
  }
}

export interface PushUitslag {
  /** Minstens een toestel kreeg hem. */
  verstuurd: boolean
  /** Moet het later nog eens (alleen als geen enkel toestel hem kreeg). */
  opnieuw: boolean
  /** Toestellen die niet meer bestaan (404/410). */
  weg: string[]
  /** Toestellen die hem kregen. */
  gelukt: string[]
}

/** Stuur naar alle toestellen van een lid. */
export async function stuurNaarToestellen(abonnementen: readonly OpgeslagenAbonnement[], inhoud: PushInhoud, deps: PushDeps, nu: Date): Promise<PushUitslag> {
  const uitslagen = await Promise.all(
    abonnementen.map(async (ab): Promise<[string, DienstUitslag]> => {
      if (!deps.sleutels || !isToegestaneDienst(ab.endpoint)) return [ab.id, 'fout']
      let verzoek: PushVerzoek
      try {
        verzoek = bouwVerzoek(ab, inhoud, deps.sleutels, nu)
      } catch {
        return [ab.id, 'weg']
      }
      const status = await deps.post(verzoek)
      return [ab.id, status === null ? 'opnieuw' : beoordeelAntwoord(status)]
    }),
  )
  const gelukt = uitslagen.filter(([, u]) => u === 'ok').map(([id]) => id)
  return {
    verstuurd: gelukt.length > 0,
    opnieuw: gelukt.length === 0 && uitslagen.some(([, u]) => u === 'opnieuw'),
    weg: uitslagen.filter(([, u]) => u === 'weg').map(([id]) => id),
    gelukt,
  }
}
