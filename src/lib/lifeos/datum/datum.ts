// ─── LifeOS — dag- en tijdweergave ──────────────────────────────────────────
// Klein, puur, gedeeld. Zowel de agenda als de taken hebben een begrip van "de
// dag van vandaag" nodig, en beide moeten het over dezelfde dag hebben.
//
// Neutraal gedeeld. Iedereen die over "vandaag" praat moet dezelfde dag
// bedoelen — vandaar één bron, en niet onder `agenda/` waar hij ooit begon.

/**
 * De dagsleutel (YYYY-MM-DD) in LOKALE tijd.
 *
 * Niet `toISOString().slice(0, 10)`: dat is UTC. Om 01:00 Nederlandse zomertijd
 * geeft die de dag van gisteren terug, en dan zet je je top-3 klaar voor een dag
 * die al voorbij is.
 */
export function datumSleutel(d: Date): string {
  const jaar = d.getFullYear()
  const maand = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${jaar}-${maand}-${dag}`
}

/**
 * Leest een dagsleutel (YYYY-MM-DD) als lokale middernacht, of `null` als het
 * geen geldige datum is. Faalt op onzin in plaats van een Invalid Date door te
 * geven — dat is de systeemgrens.
 */
export function leesDatumSleutel(sleutel: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sleutel)
  if (!match) return null

  const jaar = Number(match[1])
  const maand = Number(match[2])
  const dag = Number(match[3])
  if (maand < 1 || maand > 12 || dag < 1 || dag > 31) return null

  const d = new Date(jaar, maand - 1, dag)
  // Vangt 31 februari: JS rolt die stilletjes door naar 3 maart.
  if (d.getFullYear() !== jaar || d.getMonth() !== maand - 1 || d.getDate() !== dag) {
    return null
  }
  return d
}

/** '14:30'. Altijd 24-uurs — dit is een Nederlandse app. */
export function tijdLabel(d: Date): string {
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

/** '45m', '1u', '1u 30m'. Kort, want dit staat naast een tijd, niet in een zin. */
export function duurLabel(minuten: number): string {
  const heel = Math.max(0, Math.round(minuten))
  const uren = Math.floor(heel / 60)
  const rest = heel % 60
  if (uren === 0) return `${rest}m`
  if (rest === 0) return `${uren}u`
  return `${uren}u ${rest}m`
}
