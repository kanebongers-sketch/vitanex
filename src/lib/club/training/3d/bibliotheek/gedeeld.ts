// ─── Fit Factory Club, 3D-oefenbeelden: gedeelde richtingen (PUUR) ─────────
// Kleine bouwstukken die meerdere oefeningen in de bibliotheek delen.

export const VOOR = { x: 0, y: 0, z: 1 } as const

export const ACHTER = { x: 0, y: 0, z: -1 } as const

/**
 * Neutrale greep (duim naar voren) voor de linkerhand: het handvat van voor naar
 * achter, van de duim naar de pink. Rechts wordt vanzelf gespiegeld.
 */
export const NEUTRAAL = { x: 0, y: 0, z: -1 } as const

/** Liggend op de rug (fly): duim naar het hoofd, dat bij kantel -90 op -z ligt. */
export const NEUTRAAL_LIGGEND = { x: 0, y: 0, z: 1 } as const

export const CURL_ARM = { heffen: 4, opzij: 7, buig: VOOR } as const
