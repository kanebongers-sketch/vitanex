// ─── Fit Factory Club, ledenapp: wanneer een training gedaan is (PUUR) ──────
// Een training uit de wachtrij kan dagen later binnenkomen. De datum is dan
// het moment van afronden op de telefoon, niet het moment van ontvangen. Een
// klok die voorloopt of een tijdstip van meer dan 7 dagen terug vertrouwen we
// niet: dan geldt de servertijd. De kalenderdag is altijd in Nederlandse tijd.

import { dagSleutel } from '@/lib/club/cijfers/tijd'

/** Zelfde grens als de wachtrij op het toestel (WACHTRIJ_MAX_MS). */
export const AFGEROND_MAX_MS = 7 * 86_400_000

function alsMs(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.length <= 40) return Date.parse(v)
  return Number.NaN
}

/** Het tijdstip voor de trainingslog: dat van de telefoon als het klopt, anders `nu`. */
export function trainingTijdstip(afgerondOp: unknown, nu: Date): Date {
  const ms = alsMs(afgerondOp)
  if (!Number.isFinite(ms) || ms > nu.getTime() || nu.getTime() - ms > AFGEROND_MAX_MS) return nu
  return new Date(ms)
}

/** De kalenderdag (YYYY-MM-DD) van de training in Nederland. */
export function trainingDag(op: Date): string {
  return dagSleutel(op)
}
