// ─── Push-timing (puur) ──────────────────────────────────────────────────────
// Slimme verzendmomenten en stiltetijd-controle voor push-notificaties.
// "Slim" = afgeleid uit wanneer de gebruiker meestal actief is — geen vaste
// standaardtijd voor iedereen. Alles puur en deterministisch (klok wordt als
// argument doorgegeven), zodat het los te testen is.

/** Zet "HH:MM" om naar minuten sinds middernacht, of null bij ongeldige invoer. */
export function minutenVanTijd(tijd: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(tijd.trim())
  if (!m) return null
  const uur = Number(m[1])
  const min = Number(m[2])
  if (uur < 0 || uur > 23 || min < 0 || min > 59) return null
  return uur * 60 + min
}

/** Zet minuten sinds middernacht om naar "HH:MM" (00:00–23:59). */
export function tijdVanMinuten(minuten: number): string {
  const genormaliseerd = ((Math.round(minuten) % 1440) + 1440) % 1440
  const uur = Math.floor(genormaliseerd / 60)
  const min = genormaliseerd % 60
  return `${String(uur).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/**
 * Zit een moment binnen de stiltetijd? Ondersteunt vensters die over
 * middernacht lopen (bv. 22:00–08:00). Grenzen zijn inclusief begin,
 * exclusief eind. Ongeldige tijden → false (geen stiltetijd, fail-open naar
 * "mag versturen" wordt elders juist afgevangen — hier alleen de venster-logica).
 */
export function binnenStiltetijd(nuMinuten: number, start: string, eind: string): boolean {
  const s = minutenVanTijd(start)
  const e = minutenVanTijd(eind)
  if (s === null || e === null || s === e) return false
  // Venster over middernacht (bv. 22:00–08:00): buiten [eind, start).
  if (s > e) return nuMinuten >= s || nuMinuten < e
  // Normaal venster binnen dezelfde dag.
  return nuMinuten >= s && nuMinuten < e
}

export interface SlimMomentOpties {
  /** Terugval als er (te) weinig data is. */
  standaard: string
  /** Vroegst toegestane moment (klem-ondergrens). */
  vroegste?: string
  /** Laatst toegestane moment (klem-bovengrens). */
  laatste?: string
  /** Minimaal aantal datapunten voordat we "slim" durven te zijn. */
  minPunten?: number
  /** Afrond-interval in minuten (default 30). */
  afrondMin?: number
}

function mediaan(waarden: number[]): number {
  const s = [...waarden].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

/**
 * Kies een slim verzendmoment uit de tijden waarop de gebruiker meestal actief
 * is (HH:MM-strings). We nemen de mediaan van die momenten, ronden af op een
 * net interval en klemmen binnen een toegestaan venster. Te weinig data →
 * de standaardtijd. Zo voelt een herinnering voorspelbaar én persoonlijk.
 */
export function slimVerzendMoment(activiteitTijden: readonly string[], opties: SlimMomentOpties): string {
  const { standaard, vroegste = '08:00', laatste = '21:30', minPunten = 3, afrondMin = 30 } = opties
  const minuten = activiteitTijden
    .map(minutenVanTijd)
    .filter((m): m is number => m !== null)

  if (minuten.length < minPunten) return standaard

  const med = mediaan(minuten)
  const afgerond = Math.round(med / afrondMin) * afrondMin

  const onder = minutenVanTijd(vroegste) ?? 0
  const boven = minutenVanTijd(laatste) ?? 1439
  const geklemd = Math.min(boven, Math.max(onder, afgerond))
  return tijdVanMinuten(geklemd)
}
