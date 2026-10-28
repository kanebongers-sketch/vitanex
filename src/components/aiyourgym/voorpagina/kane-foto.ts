// ─── AI Your Gym: de foto van Kane op de voorpagina (PUUR) ──────────────────
// Zolang hier null staat, toont het blok "Gebouwd vanaf de vloer" een citaat in
// plaats van een portret (geen initialen of lege plek). Levert Kane een foto aan:
// zet het bestand in public/aiyourgym/ (staand, minstens 1200 px hoog, WebP of
// AVIF) en vul hieronder het pad en de echte maten in. Meer is niet nodig.

export interface KaneFoto {
  /** Pad vanaf public/, bijvoorbeeld '/aiyourgym/kane.webp'. */
  src: string
  breedte: number
  hoogte: number
}

export const KANE_FOTO: KaneFoto | null = null
