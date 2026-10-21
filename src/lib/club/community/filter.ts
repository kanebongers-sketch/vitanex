// ─── Club, community: eenvoudige woordfilter (PUUR) ─────────────────────────
// Een bericht met een scheldwoord wordt niet geweigerd maar vastgehouden: de
// sportschool beoordeelt het in Club (/club/community). Bewust eenvoudig
// en aan de voorzichtige kant: liever een keer te veel vasthouden dan een
// grof bericht in de groep. Geen woorden uitschrijven in meldingen aan leden.
//
// Normaliseren: kleine letters, accenten weg, cijfers en tekens die letters
// nabootsen (k4nker, kl00tzak) terug naar letters, herhaalde letters ingekort
// (kuuuut). Daarna per woord vergelijken:
//   * GEHEEL: alleen het hele woord ("lul", niet "lulletje");
//   * BEGIN: het woord begint ermee ("kutweer", "teringzooi");
//   * DEEL: overal in het woord ("klootzakken", "kankerlijer").
// "catering", "hoera" en "lullig" blijven zo vrij. Een bericht over de ziekte
// kanker wordt ook vastgehouden; de sportschool plaatst het dan met een tik.

const GEHEEL: readonly string[] = ['kut', 'lul', 'slet', 'hoer', 'gvd', 'kkr', 'tyf', 'kanker', 'tering', 'tyfus', 'mongool', 'mongol', 'flikker', 'nikker', 'neger', 'debiel', 'teef', 'fuck', 'bitch']

const BEGIN: readonly string[] = ['kut', 'tering', 'tyfus', 'klere', 'hoeren', 'godver', 'neuk', 'fuck', 'mongool', 'kanker', 'kkr', 'flikker', 'nikker', 'debiel', 'bitch', 'slettenbak', 'teef']

const DEEL: readonly string[] = ['klootzak', 'kloothommel', 'kankerlijer', 'teringlijer', 'tyfuslijer', 'godverdomme', 'hoerenjong', 'hoerenzoon', 'kutwijf', 'mongolen', 'motherfucker', 'klerelijer', 'pleurislijer']

const NABOOTSERS: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', $: 's', '!': 'i', '|': 'l' }

/**
 * Kleine letters, geen accenten, nagebootste letters terug, herhalingen ingekort.
 * `!` en `|` zijn ook gewone leestekens: alleen midden in een woord (sl!t, f|ikker)
 * tellen ze als letter, anders blijft "lul!" geen "luli" maar een scheiding.
 */
export function normaliseer(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(?<=[a-z0-9@$])[!|](?=[a-z0-9@$])/g, (t) => NABOOTSERS[t] ?? t)
    .replace(/[0134578@$]/g, (t) => NABOOTSERS[t] ?? t)
    .replace(/([a-z])\1{2,}/g, '$1')
}

/** De woorden van een tekst; een punt, streepje of sterretje midden in een woord (k.u.t) telt niet als scheiding. */
export function woorden(tekst: string): string[] {
  const samen = normaliseer(tekst).replace(/(?<=[a-z])[*._-](?=[a-z])/g, '')
  return samen.split(/[^a-z]+/).filter(Boolean)
}

function raakt(woord: string): boolean {
  if (GEHEEL.includes(woord)) return true
  if (BEGIN.some((b) => woord.startsWith(b) && woord.length > b.length)) return true
  return DEEL.some((d) => woord.includes(d))
}

export interface FilterUitslag {
  /** true = vasthouden ter beoordeling. */
  vasthouden: boolean
  /** Reden voor de sportschool, zonder het woord zelf. */
  reden: string | null
}

/** Moet dit bericht eerst beoordeeld worden? */
export function filterBericht(tekst: string): FilterUitslag {
  const raak = woorden(tekst).some(raakt)
  return raak ? { vasthouden: true, reden: 'Bevat een woord uit de woordfilter' } : { vasthouden: false, reden: null }
}
