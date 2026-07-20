// ─── LifeOS — CRM: agenda-invoer voor "plan gesprek" ────────────────────────
// Puur, geen React. Bouwt de body voor `POST /api/lifeos/agenda/events` uit een
// naam + een moment: een afspraak (blok met duur) of een korte herinnering. Zo
// zet je vanuit een profiel met één klik een gesprek in je Google-agenda.
//
// De titel is bewust herkenbaar ("Gesprek met …" / "Bel …") zodat je 'm in je
// agenda én in de week-strip terugvindt.

/** Precies wat het events-endpoint verwacht (zie `leesNieuwEvent` in schrijven.ts). */
export interface AgendaInvoer {
  titel: string
  /** ISO-moment (UTC na serialisatie). */
  startOp: string
  eindOp: string
}

/** Standaardduur van een ingepland gesprek, in minuten. */
export const STANDAARD_DUUR_MIN = 30
/** Een herinnering is een kort blok — genoeg om in je agenda op te vallen. */
export const HERINNERING_DUUR_MIN = 15

/** Een afspraak "Gesprek met [naam]" vanaf `start`, `duurMin` lang. */
export function bouwAfspraak(naam: string, start: Date, duurMin: number = STANDAARD_DUUR_MIN): AgendaInvoer {
  const eind = new Date(start.getTime() + Math.max(1, duurMin) * 60_000)
  return {
    titel: `Gesprek met ${naam.trim()}`,
    startOp: start.toISOString(),
    eindOp: eind.toISOString(),
  }
}

/** Een korte herinnering "Bel [naam]" op `moment`. */
export function bouwHerinnering(naam: string, moment: Date): AgendaInvoer {
  const eind = new Date(moment.getTime() + HERINNERING_DUUR_MIN * 60_000)
  return {
    titel: `Bel ${naam.trim()}`,
    startOp: moment.toISOString(),
    eindOp: eind.toISOString(),
  }
}

/**
 * Een moment `dagen` dagen na `vandaag`, op `uur` (lokale tijd). Voor de
 * snelknoppen ("vandaag", "over 3 dagen", "volgende week"). Lokale tijd, zodat
 * 09:00 ook echt 's ochtends is en niet in UTC verschuift.
 */
export function momentOverDagen(vandaag: Date, dagen: number, uur: number = 9): Date {
  return new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + dagen, uur, 0, 0, 0)
}

/**
 * Combineert een dag-sleutel (YYYY-MM-DD) met een tijd (HH:MM) tot een lokaal
 * moment, of `null` als de invoer niet klopt. Voor de handmatige afspraak-invoer.
 */
export function momentVanInvoer(dag: string, tijd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dag) || !/^\d{2}:\d{2}$/.test(tijd)) return null
  const [jaar, maand, dagNr] = dag.split('-').map(Number)
  const [uur, minuut] = tijd.split(':').map(Number)
  if (uur > 23 || minuut > 59) return null
  const d = new Date(jaar, maand - 1, dagNr, uur, minuut, 0, 0)
  return Number.isNaN(d.getTime()) ? null : d
}
