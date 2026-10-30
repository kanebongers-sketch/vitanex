// ─── Club: tellers in het menu (PUUR) ───────────────────────────────────────
// Idee geleend van HubFit (besluit Kane 30-10-2026), op onze manier: een klein
// echt aantal bij een onderdeel en zijn groep, alleen waar het iets zegt.
// - taken: verplichte taken van vandaag die nog open staan, in de vestiging.
// - opvolgen: open opvolging van leden plus leads die vandaag (of eerder) gebeld
//   moeten worden. Opvolgen is een sectie op Vandaag, dus de teller staat bij Vandaag.
// - leads: nieuwe leads (status nieuw) in de vestiging.
// Berichten heeft geen teller: berichten in Club gaan van de sportschool naar de
// leden; er bestaat geen inbox met ongelezen berichten voor het team (eerlijk:
// geen getal zonder bron). Bij 0 staat er niets.
// Wie een teller ziet volgt dezelfde zichtbaarheid als het menu (isZichtbaar:
// pakket afgenomen, onderdeel aan en het recht via de rol, ook met rollen v2).

export const TELLER_SOORTEN = ['taken', 'opvolgen', 'leads'] as const
export type TellerSoort = (typeof TELLER_SOORTEN)[number]

export type Tellers = Readonly<Partial<Record<TellerSoort, number>>>

/** Boven dit getal staat "99+": een teller is een seintje, geen rapport. */
export const TELLER_MAX = 99

/** Bij welk onderdeel van het menu staat welke teller? Opvolgen is een sectie op Vandaag. */
export const ONDERDEEL_TELLER: Readonly<Record<string, TellerSoort>> = {
  taken: 'taken',
  vandaag: 'opvolgen',
  opvolgen: 'opvolgen',
  leads: 'leads',
}

/** Wat deze persoon per teller moet mogen zien (de onderdelen erachter). */
export interface TellerRechten {
  taken: boolean
  /** Opvolging van leden (onderdeel Opvolgen). */
  opvolgenLeden: boolean
  /** Leads opvolgen en nieuwe leads (onderdeel Leads). */
  leads: boolean
  /** Vandaag, waar Opvolgen staat. */
  vandaag: boolean
}

/** De rechten voor de tellers uit de zichtbaarheid van het menu. */
export function tellerRechten(zie: (sleutel: string) => boolean): TellerRechten {
  return { taken: zie('taken'), opvolgenLeden: zie('opvolgen'), leads: zie('leads'), vandaag: zie('vandaag') }
}

/** Welke tellers deze persoon krijgt; leeg = de balk vraagt niets op. */
export function welkeTellers(r: TellerRechten): TellerSoort[] {
  const uit: TellerSoort[] = []
  if (r.taken) uit.push('taken')
  if (r.vandaag && (r.opvolgenLeden || r.leads)) uit.push('opvolgen')
  if (r.leads) uit.push('leads')
  return uit
}

/** Een aantal van buiten: een geheel getal van 0 of meer, anders 0. */
export function schoonAantal(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/** Tellers met alleen de soorten die mogen en een getal boven 0. */
export function tellersVoor(ruw: Partial<Record<TellerSoort, unknown>>, mag: readonly TellerSoort[]): Tellers {
  const uit: Partial<Record<TellerSoort, number>> = {}
  for (const s of mag) {
    const n = schoonAantal(ruw[s])
    if (n > 0) uit[s] = n
  }
  return uit
}

/** Systeemgrens in de browser: het antwoord van GET /api/club/menu/tellers. */
export function leesTellers(data: unknown): Tellers {
  const t = (data as { tellers?: unknown } | null)?.tellers
  if (typeof t !== 'object' || t === null || Array.isArray(t)) return {}
  return tellersVoor(t as Record<string, unknown>, TELLER_SOORTEN)
}

export interface Teller {
  soort: TellerSoort
  aantal: number
}

/** De teller bij een onderdeel, of null (geen teller of 0). */
export function onderdeelTeller(sleutel: string | undefined, tellers: Tellers): Teller | null {
  const soort = sleutel ? ONDERDEEL_TELLER[sleutel] : undefined
  const aantal = soort ? (tellers[soort] ?? 0) : 0
  return soort && aantal > 0 ? { soort, aantal } : null
}

/** De tellers van een groep: van de onderdelen die je daar ziet, elke soort een keer. */
export function groepTellers(onderdelen: readonly string[], tellers: Tellers): Teller[] {
  const gezien = new Set<TellerSoort>()
  const uit: Teller[] = []
  for (const s of onderdelen) {
    const t = onderdeelTeller(s, tellers)
    if (t && !gezien.has(t.soort)) {
      gezien.add(t.soort)
      uit.push(t)
    }
  }
  return uit
}

/** Samen, voor het getal op de groep. */
export function somVan(tellers: readonly Teller[]): number {
  return tellers.reduce((som, t) => som + t.aantal, 0)
}

/** Het getal in beeld: "3", of "99+" boven het maximum; leeg bij 0. */
export function tellerTekst(aantal: number): string {
  const n = schoonAantal(aantal)
  if (n === 0) return ''
  return n > TELLER_MAX ? `${TELLER_MAX}+` : String(n)
}

// ── Ophalen in de browser: kort onthouden ────────────────────────────────────
// De balk vraagt de tellers op bij openen, bij wisselen van vestiging, bij
// terugkomen naar het tabblad en bij een andere pagina, maar nooit vaker dan
// eens per VERS_MS: zo blijft het menu snel en de database rustig.

export const VERS_MS = 15_000

/** Moet de balk opnieuw vragen? Een andere vestiging altijd, anders pas na VERS_MS. */
export function moetVerversen(vorige: { vestiging: string; op: number } | null, vestiging: string, nu: number, dwingend = false): boolean {
  if (!vorige || vorige.vestiging !== vestiging || dwingend) return true
  return nu - vorige.op >= VERS_MS
}
