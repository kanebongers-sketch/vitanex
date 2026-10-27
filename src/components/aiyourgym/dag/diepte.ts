// ─── AI Your Gym: diepte in de held (PUUR) ──────────────────────────────────
// De held bestaat uit losse vlakken (lichtval, venster, telefoon, check-in) die
// bij muis en scroll elk op een eigen afstand meebewegen. Hier de rekenregels; de
// vlakken zelf lezen --px, --py en --hs in dag.css.

/** Hoe ver de held al uit beeld is geschoven: 0 bovenaan, 1 als hij helemaal weg is. */
export function heldVoortgang(top: number, hoogte: number): number {
  if (hoogte <= 0) return top < 0 ? 1 : 0
  return Math.min(1, Math.max(0, -top / hoogte))
}

/** Een positie binnen een breedte als waarde van -1 (links) tot 1 (rechts). */
export function pointerAs(positie: number, breedte: number): number {
  if (breedte <= 0) return 0
  return Math.min(1, Math.max(-1, (positie / breedte) * 2 - 1))
}

/** Snelheid waarmee de vlakken de muis volgen (per seconde). */
export const VOLG = 7

/** Een stap richting het doel, even snel bij elk aantal beelden per seconde. */
export function demp(huidig: number, doel: number, dtSec: number, snelheid = VOLG): number {
  const k = 1 - Math.exp(-Math.max(0, dtSec) * snelheid)
  return huidig + (doel - huidig) * k
}
