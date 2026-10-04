// ─── LifeOS — aandachtspunten opvolgen (PUUR, ook client) ───────────────────
// Een aandachtspunt uit een coachgesprek blijft open tot je bij een volgend
// gesprek zegt dat het opgelost is. Per gesprek één oordeel: opgelost, loopt nog,
// of erger. Geen oordeel = het blijft gewoon open (en telt als nog een gesprek).

export type Oordeel = 'opgelost' | 'loopt' | 'erger'
export const OORDELEN: readonly Oordeel[] = ['opgelost', 'loopt', 'erger']
export const OORDEEL_LABEL: Record<Oordeel, string> = { opgelost: 'Opgelost', loopt: 'Loopt nog', erger: 'Erger' }

export interface OpenPunt {
  id: string
  tekst: string
  /** ISO-moment waarop het punt ontstond. */
  sinds: string
  /** In hoeveel gesprekken het punt al open bleef. */
  keerOpen: number
  laatsteOordeel: Oordeel | null
}

export interface PuntOordeel {
  id: string
  oordeel: Oordeel
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function isOordeel(v: unknown): v is Oordeel {
  return typeof v === 'string' && (OORDELEN as readonly string[]).includes(v)
}

/** De oordelen uit het afrond-verzoek. Onbekend/kapot wordt overgeslagen, nooit gegokt. */
export function leesOordelen(ruw: unknown): PuntOordeel[] {
  if (!Array.isArray(ruw)) return []
  const gezien = new Set<string>()
  const uit: PuntOordeel[] = []
  for (const o of ruw.slice(0, 50)) {
    if (!isObject(o) || typeof o.id !== 'string' || !isOordeel(o.oordeel) || gezien.has(o.id)) continue
    gezien.add(o.id)
    uit.push({ id: o.id, oordeel: o.oordeel })
  }
  return uit
}

/** Open punten uit JSON (de pt-gesprekken-API). */
export function leesOpenPunten(ruw: unknown): OpenPunt[] {
  if (!Array.isArray(ruw)) return []
  return ruw.flatMap((p): OpenPunt[] => {
    if (!isObject(p) || typeof p.id !== 'string' || typeof p.tekst !== 'string' || typeof p.sinds !== 'string') return []
    return [{
      id: p.id,
      tekst: p.tekst,
      sinds: p.sinds,
      keerOpen: typeof p.keerOpen === 'number' && Number.isFinite(p.keerOpen) ? p.keerOpen : 0,
      laatsteOordeel: isOordeel(p.laatsteOordeel) ? p.laatsteOordeel : null,
    }]
  })
}

/** Na een gesprek: wat er met een open punt gebeurt. Puur. */
export function naOordeel(punt: OpenPunt, oordeel: Oordeel | null): { opgelost: boolean; keerOpen: number; laatsteOordeel: Oordeel | null } {
  if (oordeel === 'opgelost') return { opgelost: true, keerOpen: punt.keerOpen, laatsteOordeel: 'opgelost' }
  return { opgelost: false, keerOpen: punt.keerOpen + 1, laatsteOordeel: oordeel ?? punt.laatsteOordeel }
}

/** Vanaf zoveel gesprekken open meldt de ochtendmail het. */
export const SIGNAAL_NA = 2

/** Signalen voor de ochtendmail: lang open, of erger geworden. */
export function puntSignalen(
  team: readonly { id: string; naam: string }[],
  punten: ReadonlyMap<string, readonly OpenPunt[]>,
): { naam: string; tekst: string }[] {
  const uit: { naam: string; tekst: string }[] = []
  for (const p of team) {
    for (const punt of punten.get(p.id) ?? []) {
      if (punt.laatsteOordeel === 'erger') {
        uit.push({ naam: p.naam, tekst: `Aandachtspunt van ${p.naam} is erger geworden: “${punt.tekst}”` })
      } else if (punt.keerOpen >= SIGNAAL_NA) {
        uit.push({ naam: p.naam, tekst: `Aandachtspunt van ${p.naam} staat al ${punt.keerOpen} gesprekken open: “${punt.tekst}”` })
      }
    }
  }
  return uit
}
