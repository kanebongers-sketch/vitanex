// ─── LifeOS — sync ─────────────────────────────────────────────────────────
// Haalt bij elke gekoppelde dienst de laatste dagen op, normaliseert via de
// bestaande `vanWhoop`/`vanOura` en upsert het resultaat.
//
// Twee regels sturen dit bestand:
//
//   1. Eén stukke bron sleept de rest niet mee. Whoop plat betekent niet dat je
//      Oura-slaap vandaag niet bestaat.
//   2. Een fout mag NOOIT als "geen data" landen. Dat is de verleidelijke bug:
//      je vangt de exception, gaat door, en de gebruiker ziet een lege kaart die
//      zegt dat hij niets gemeten heeft — terwijl zijn token gewoon verlopen is.
//      Daarom draagt elk bronresultaat expliciet zijn eigen status, en geeft de
//      route die door aan de UI.

import type { SupabaseClient } from '@supabase/supabase-js'
import { vanOura, vanWhoop } from './herstel'
import { dienstConfig, type KoppelbareDienst } from './diensten'
import { geldigToegangstoken, leesKoppelingen, type Koppeling } from './koppelingen'
import { bewaarMetingen, type TeBewaren } from './opslag'
import { bouwOuraPayloads, haalOura } from './oura'
import { bouwWhoopPayloads, haalWhoop } from './whoop'
import { dagenTerug, type IsoDatum } from './tijd'

/** Hoeveel dagen we per sync ophalen. */
export const SYNC_DAGEN = 7

export interface BronResultaat {
  dienst: KoppelbareDienst
  status: 'ok' | 'fout'
  /** Aantal dagen dat is opgeslagen. Bij een fout: 0 — en niet "dus niets gemeten". */
  bewaard: number
  /** Bij status 'fout': wat er misging, in gewone taal. Anders null. */
  fout: string | null
}

export interface SyncResultaat {
  bronnen: BronResultaat[]
  /** Geen enkele dienst gekoppeld? Dan valt er niets te synchroniseren. */
  gekoppeld: boolean
}

/**
 * Synchroniseert alle gekoppelde diensten. `vandaag` geef je expliciet mee
 * (lokale kalenderdag van de gebruiker) — de server heeft zijn eigen tijdzone
 * en die is niet die van Kane.
 */
export async function syncHerstel(
  admin: SupabaseClient,
  userId: string,
  vandaag: IsoDatum,
): Promise<SyncResultaat> {
  const koppelingen = await leesKoppelingen(admin, userId)
  if (koppelingen.length === 0) return { bronnen: [], gekoppeld: false }

  // Parallel: de diensten weten niets van elkaar. `allSettled` zodat een
  // klapper in de ene tak de andere niet afbreekt.
  const resultaten = await Promise.allSettled(
    koppelingen.map((k) => syncEen(admin, userId, k, vandaag)),
  )

  const bronnen = resultaten.map((r, i): BronResultaat => {
    const koppeling = koppelingen[i]
    const dienst: KoppelbareDienst = koppeling?.dienst ?? 'whoop'

    if (r.status === 'fulfilled') return r.value

    // Een onverwachte fout: log 'm server-side met detail, geef de gebruiker een
    // begrijpelijke melding. Nooit stil inslikken.
    console.error(`[herstel] sync ${dienst} mislukt`, r.reason)
    return { dienst, status: 'fout', bewaard: 0, fout: leesbareFout(r.reason) }
  })

  return { bronnen, gekoppeld: true }
}

async function syncEen(
  admin: SupabaseClient,
  userId: string,
  koppeling: Koppeling,
  vandaag: IsoDatum,
): Promise<BronResultaat> {
  const dienst = koppeling.dienst

  if (dienstConfig(dienst) === null) {
    return { dienst, status: 'fout', bewaard: 0, fout: 'deze koppeling is niet geconfigureerd' }
  }

  try {
    const token = await geldigToegangstoken(admin, userId, koppeling)
    const rijen = dienst === 'whoop'
      ? await haalWhoopMetingen(token, vandaag)
      : await haalOuraMetingen(token, vandaag)

    const bewaard = await bewaarMetingen(admin, userId, rijen)
    return { dienst, status: 'ok', bewaard, fout: null }
  } catch (fout) {
    console.error(`[herstel] sync ${dienst} mislukt`, fout)
    return { dienst, status: 'fout', bewaard: 0, fout: leesbareFout(fout) }
  }
}

async function haalWhoopMetingen(token: string, vandaag: IsoDatum): Promise<TeBewaren[]> {
  const start = new Date(`${dagenTerug(vandaag, SYNC_DAGEN - 1)}T00:00:00Z`)
  // Tot het eind van vandaag: een recovery van vanochtend valt anders buiten
  // het venster.
  const eind = new Date(`${vandaag}T23:59:59Z`)

  const { recoveries, slapen } = await haalWhoop(token, start, eind)

  return bouwWhoopPayloads(recoveries, slapen).map(({ datum, ruw, bron }) => ({
    meting: vanWhoop(datum, ruw),
    ruw: bron,
  }))
}

async function haalOuraMetingen(token: string, vandaag: IsoDatum): Promise<TeBewaren[]> {
  const start = dagenTerug(vandaag, SYNC_DAGEN - 1)

  const { readiness, slapen } = await haalOura(token, start, vandaag)

  return bouwOuraPayloads(readiness, slapen).map(({ datum, ruw, bron }) => ({
    meting: vanOura(datum, ruw),
    ruw: bron,
  }))
}

/** Een foutmelding die de gebruiker iets zegt, zonder interne details te lekken. */
function leesbareFout(fout: unknown): string {
  if (fout instanceof Error && fout.message.length > 0 && fout.message.length < 160) {
    return fout.message
  }
  return 'onbekende fout bij het ophalen'
}
