// ─── AI Your Gym: de dagklok van de voorpagina (PUUR) ───────────────────────
// De voorpagina is een werkdag in een sportschool (docs/aiyourgym/scroll-craft/
// BRIEF.md). Elke sectie heeft een kloktijd; de scroll is de wijzer. Tussen twee
// momenten blijft de klok eerst op de tijd van de sectie staan (die is dan in
// beeld) en loopt daarna door naar het volgende moment.

/** Een moment op de pagina: waar de sectie begint (px in het document) en haar tijd in minuten na middernacht. */
export interface Anker {
  top: number
  minuten: number
}

/** Hoe lang (deel van de afstand tot de volgende sectie) de klok op de eigen tijd blijft staan. */
export const HOUD = 0.55

const DAG_MINUTEN = 24 * 60

/** 375 wordt "06:15". Buiten een dag wordt de tijd teruggerekend binnen 00:00 tot 23:59. */
export function formatKlok(minuten: number): string {
  const m = ((Math.round(minuten) % DAG_MINUTEN) + DAG_MINUTEN) % DAG_MINUTEN
  const uur = Math.floor(m / 60)
  return `${String(uur).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** De index van het moment waar de kijklijn nu in zit (-1 boven het eerste moment). */
export function actiefAnker(ankers: readonly Anker[], kijklijn: number): number {
  let actief = -1
  ankers.forEach((a, i) => {
    if (kijklijn >= a.top) actief = i
  })
  return actief
}

/** De tijd op de klok bij een kijklijn (px in het document). Ankers op volgorde van boven naar onder. */
export function klokMinuten(ankers: readonly Anker[], kijklijn: number): number {
  const eerste = ankers[0]
  if (!eerste) return 0
  const i = actiefAnker(ankers, kijklijn)
  if (i < 0) return eerste.minuten
  const hier = ankers[i]
  const volgende = ankers[i + 1]
  if (!volgende || volgende.top <= hier.top) return hier.minuten
  const deel = (kijklijn - hier.top) / (volgende.top - hier.top)
  if (deel <= HOUD) return hier.minuten
  const loop = (deel - HOUD) / (1 - HOUD)
  return Math.floor(hier.minuten + (volgende.minuten - hier.minuten) * Math.min(1, loop))
}
