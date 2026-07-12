// ─── Coaching-pijlers (overlay-laag) ────────────────────────────────────────
// Bron-van-waarheid voor de 3 pijlers van Kane's coachingmethode. Deze laag
// ligt BOVENOP de 6 welzijnspijlers van de app (Energie, Slaap, Stress,
// Stemming, Beweging, Voeding) en vervangt die NIET — het is een lens waarmee
// een coach een klanttraject in fases indeelt.
//
// Client-veilig: pure data, géén server-imports en géén component-imports, zodat
// zowel pagina's, API-routes als server-helpers hem kunnen delen.
//
// ── Verhouding tot de 6 welzijnsdomeinen (indicatief, niet 1-op-1) ──
//   body        ≈ Beweging + Voeding + Energie   (het fysieke fundament)
//   mind        ≈ Stress   + Stemming + focus    (mentale helderheid & rust)
//   performance ≈ structuur + doelen + consistentie (gedrag dat resultaat levert)
// De welzijnsdomeinen worden anoniem/AVG-conform gemeten; de pijlers zijn de
// coachingtaal daarbovenop. Houd de sleutels 'body' | 'mind' | 'performance'
// stabiel: de database (coaching_traject_fases.pijler) hangt eraan vast.

export type Pijler = 'body' | 'mind' | 'performance'

/** Vaste weergavevolgorde — gebruik dit i.p.v. Object.keys voor determinisme. */
export const PIJLER_VOLGORDE: readonly Pijler[] = ['body', 'mind', 'performance']

export interface PijlerInfo {
  /** Menselijk label (NL) voor in de UI. */
  label: string
  /** Eén-regel omschrijving van waar de pijler over gaat. */
  omschrijving: string
  /** De deelgebieden binnen deze pijler. */
  deelgebieden: readonly string[]
  /** Accentkleur — bestaand design-token, nooit hardcoded hex. */
  kleurToken: string
  /** Zachte achtergrond-token voor badges/vlakken van deze pijler. */
  accentBgToken: string
}

export const PIJLERS: Record<Pijler, PijlerInfo> = {
  body: {
    label: 'Lichaam',
    omschrijving: 'Kracht, voeding, energie en uitstraling — het fysieke fundament.',
    deelgebieden: ['Kracht', 'Voeding', 'Energie', 'Uitstraling'],
    kleurToken: 'var(--mf-green)',
    accentBgToken: 'var(--mf-green-light)',
  },
  mind: {
    label: 'Geest',
    omschrijving: 'Focus, discipline, stressmanagement en zelfontwikkeling.',
    deelgebieden: ['Focus', 'Discipline', 'Stressmanagement', 'Zelfontwikkeling'],
    kleurToken: 'var(--mf-purple)',
    accentBgToken: 'var(--mf-purple-light)',
  },
  performance: {
    label: 'Performance',
    omschrijving: 'Structuur, doelen, leiderschap en consistentie.',
    deelgebieden: ['Structuur', 'Doelen', 'Leiderschap', 'Consistentie'],
    kleurToken: 'var(--mf-amber)',
    accentBgToken: 'var(--mf-amber-light)',
  },
}

/** True als een willekeurige waarde een geldige pijler-sleutel is. */
export function isPijler(waarde: unknown): waarde is Pijler {
  return waarde === 'body' || waarde === 'mind' || waarde === 'performance'
}
