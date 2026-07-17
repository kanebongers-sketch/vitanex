// ─── LifeOS — het gesprek met Vita: de gedeelde vorm ────────────────────────
// Het contract tussen `/api/lifeos/vita/vraag` (server) en `VitaGesprek` (client).
//
// Beide kanten lazen hier hun eigen waarheid: de route had zijn eigen `Bericht`,
// zijn eigen `MAX_VRAAG_TEKENS`. Zolang er geen client wás, kon dat niet opvallen.
// Nu die er is, is één bron van waarheid het verschil tussen een nette 400 en een
// invoerveld dat je 5000 tekens laat typen om ze daarna te laten weigeren.
//
// PUUR. Geen React, geen fetch, geen Anthropic-SDK. Dit bestand wordt zowel op de
// server als in de browser geïmporteerd, dus er mag hier niets in dat maar aan één
// van beide kanten bestaat.

export type Rol = 'gebruiker' | 'vita'

export interface Bericht {
  rol: Rol
  tekst: string
}

/**
 * Grenzen op de invoer. Ze staan hier omdat de client ze moet KENNEN (om het
 * veld te begrenzen en te tellen) en de server ze moet AFDWINGEN. Dat is geen
 * duplicatie maar diepteverdediging: de client is een gemak, de server is het slot.
 */
export const MAX_VRAAG_TEKENS = 4000
export const MAX_GESCHIEDENIS = 20

export function isBericht(v: unknown): v is Bericht {
  if (typeof v !== 'object' || v === null) return false
  const b = v as Record<string, unknown>
  return (
    (b.rol === 'gebruiker' || b.rol === 'vita') &&
    typeof b.tekst === 'string' &&
    b.tekst.length > 0 &&
    b.tekst.length <= MAX_VRAAG_TEKENS
  )
}

/**
 * De laatste `max` berichten. De client stuurt niet zijn hele gesprek mee: elk
 * bericht is invoertokens die je per vraag opnieuw betaalt, en de server weigert
 * een te lange geschiedenis toch.
 *
 * Snijdt aan de VOORKANT weg (het oudste eerst): het antwoord hangt aan wat er net
 * gezegd is.
 */
export function laatsteBerichten(
  berichten: readonly Bericht[],
  max: number = MAX_GESCHIEDENIS,
): Bericht[] {
  return berichten.slice(Math.max(0, berichten.length - max))
}

/**
 * Voegt een stukje stroom toe aan het laatste Vita-bericht.
 *
 * Puur en immutable: geeft een nieuwe lijst terug, muteert niets. Staat er nog
 * geen Vita-bericht aan het eind, dan komt er één bij. Zo hoeft het component
 * geen index bij te houden van "welk bericht ben ik aan het vullen" — dat soort
 * boekhouding is waar streamende UI's stukgaan.
 */
export function metDelta(berichten: readonly Bericht[], delta: string): Bericht[] {
  const laatste = berichten[berichten.length - 1]
  if (laatste?.rol !== 'vita') {
    return [...berichten, { rol: 'vita', tekst: delta }]
  }
  return [
    ...berichten.slice(0, -1),
    { rol: 'vita', tekst: laatste.tekst + delta },
  ]
}

// ─── Fouten ─────────────────────────────────────────────────────────────────

/**
 * Eén status → één Nederlandse zin. Nooit een ruwe status of een SDK-melding aan
 * de gebruiker tonen: die kan de request-body of het endpoint bevatten.
 */
export function foutBijStatus(status: number): string {
  if (status === 401) return 'Je sessie is verlopen. Log opnieuw in.'
  if (status === 403) return 'Je hebt hier geen toegang.'
  if (status === 429) return 'Even te snel achter elkaar. Wacht een momentje.'
  if (status === 503) return 'Vita kan er even niet bij.'
  return 'Vita kon niet antwoorden.'
}

/**
 * De foutzin bij een mislukt antwoord.
 *
 * Neemt de melding van de server over als die er is — die is specifieker en al in
 * het Nederlands (zie de `fout`-body van de vraag-route). Lukt het lezen niet, dan
 * de zin bij de status. Nooit stil een lege string: een fout zonder tekst is een
 * scherm waar je zelf mag raden wat er misging.
 */
export async function leesFout(respons: Response): Promise<string> {
  try {
    const body: unknown = await respons.json()
    if (typeof body === 'object' && body !== null) {
      const melding = (body as { fout?: unknown }).fout
      if (typeof melding === 'string' && melding.length > 0) return melding
    }
  } catch {
    // Geen JSON-body (proxy-fout, HTML-foutpagina). Val terug op de status.
  }
  return foutBijStatus(respons.status)
}
